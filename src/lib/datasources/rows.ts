import type { DataRow } from './types';

/** 共立API・リハAPIとも payload.data に行配列が入る */
export async function fetchRows<Row extends DataRow>(apiUrl: string, sourceLabel: string): Promise<Row[]> {
	const response = await fetch(apiUrl);

	if (!response.ok) {
		throw new Error(`${sourceLabel} API request failed`);
	}

	const payload = (await response.json()) as { data?: Row[] };

	if (!Array.isArray(payload.data) || payload.data.length === 0) {
		throw new Error(`No ${sourceLabel} data rows`);
	}

	return payload.data;
}

/** 横持ちデータは末尾の行が最新 */
export function getLatestWideRow<Row extends DataRow>(rows: Row[]): Row {
	const latest = rows.at(-1);

	if (!latest) {
		throw new Error('No wide rows');
	}

	return latest;
}

/** 縦持ちデータは最新日付の行をまとめて返す */
export function getLatestLongRows<Row extends DataRow>(
	rows: Row[],
	dateField: string,
): { date: string; rows: Row[] } {
	const latestDate = rows.reduce((latest, row) => {
		const date = row[dateField];
		return typeof date === 'string' && date > latest ? date : latest;
	}, '');

	if (!latestDate) {
		throw new Error(`No latest long-row date: ${dateField}`);
	}

	return { date: latestDate, rows: rows.filter((row) => row[dateField] === latestDate) };
}
