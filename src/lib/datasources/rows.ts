import type { DataRow } from './types';

/**
 * APIレスポンスの最小契約。
 *
 * 今の共立API・リハAPIはどちらも payload.data に配列が入る前提。
 * ここでは施設名やKPI名ではなく、「rowsを取り出せるか」だけを見る。
 */
type RowsPayload<Row extends DataRow> = {
	data?: Row[];
};

export type FetchRowsOptions = {
	apiUrl: string;

	/**
	 * エラー文に入れるデータソース名。
	 * 例: "Kyoritsu", "Reha"
	 */
	sourceLabel: string;
};

/**
 * payload.data に入った行配列を取得する。
 */
export async function fetchRows<Row extends DataRow>({ apiUrl, sourceLabel }: FetchRowsOptions): Promise<Row[]> {
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`${sourceLabel} API request failed`);
	}

	const payload = (await response.json()) as RowsPayload<Row>;

	if (!Array.isArray(payload.data) || payload.data.length === 0) {
		throw new Error(`No ${sourceLabel} data rows`);
	}

	return payload.data;
}

/**
 * 横持ちデータでは、rows の最後を最新行として扱う。
 */
export function getLatestWideRow<Row extends DataRow>(rows: Row[]): Row {
	const latest = rows.at(-1);
	if (!latest) {
		throw new Error('No wide rows');
	}
	return latest;
}

export type LatestLongRows<Row extends DataRow> = {
	date: string;
	rows: Row[];
};

/**
 * 縦持ちデータでは、最新日付の行だけを集める。
 */
export function getLatestLongRows<Row extends DataRow>(rows: Row[], dateFieldName: string): LatestLongRows<Row> {
	const latestDate = rows.reduce((latest, row) => {
		const date = row[dateFieldName];
		return typeof date === 'string' && date > latest ? date : latest;
	}, '');

	if (!latestDate) {
		throw new Error(`No latest long-row date: ${dateFieldName}`);
	}

	return {
		date: latestDate,
		rows: rows.filter((row) => row[dateFieldName] === latestDate),
	};
}
