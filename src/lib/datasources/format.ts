import type { KpiValue } from './types';

/** 両施設ともAPIは病床利用率を0〜1の比率で返す */
export function formatBedUsageRatio(value: KpiValue): string {
	const ratio = Number(value);
	return Number.isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : '--';
}
