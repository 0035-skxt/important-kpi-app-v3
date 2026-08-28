import { createFetcher } from '../http/client';
import { dataRowsEnvelopeSchema } from './schemas';
import type { DataRow } from './types';

/**
 * 共立API・リハAPIとも payload.data に行配列が入る。
 *
 * 取得は http/client.ts の createFetcher に委ねる。素の fetch から替えたことで、
 * タイムアウト30秒・408/429/5xx の自動リトライ・連続失敗時のサーキットブレーカー・
 * Zod による境界検証が効くようになる。
 *
 * circuitKey には sourceLabel（datasource の id）を渡す。共立の GAS が落ちても
 * リハ側の回路は独立して生きる。
 *
 * 行の中身は schemas.ts では検証しない（列名は kpi-catalog / datasources が持つ）ため、
 * 呼び出し元が期待する Row 型への絞り込みはここでのキャストに委ねる。この関数の
 * シグネチャは従来のままで、呼び出し元（kpi-values.ts）は変更していない。
 */
export async function fetchRows<Row extends DataRow>(apiUrl: string, sourceLabel: string): Promise<Row[]> {
	const fetchEnvelope = createFetcher(apiUrl, dataRowsEnvelopeSchema, (parsed) => parsed.data, sourceLabel);

	return (await fetchEnvelope()) as Row[];
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
