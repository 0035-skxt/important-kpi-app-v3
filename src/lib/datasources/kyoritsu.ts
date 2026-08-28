import type { KpiValue, WideRowDataSource, WideRowKpiMapping } from './types';

/**
 * 共立APIは「1日分の行に複数KPI列が入る」横持ち形式。
 */

export const KYORITSU_API_URL = 'https://script.google.com/macros/s/AKfycbwor8y2k5p2zXUcIj7rBnyn3Z_V4cTyEgcyGzGnvy_VgAjam2ymmMFJNy0xUvnTuzjt/exec';

export const KYORITSU_FIELDS = {
	DATE: '日付',
	BED_USAGE: '病床利用率 (%)',
	AMBULANCE_TRANSPORT: '救急車搬入数',
	EXCEPTED_IMPATIENT: '入院患者数',
	EXCEPTED_DISCHARGES: '退院予定数',
	GENERAL_INPATIENT: '一般病棟在院数',
	ICU_IMPATIENT: '集中治療室在院数',
	AVERAGE_STAY: '平均在院日数',
	SURGERIES: '手術件数',
	LONG_TERM_INPATIENTS: '長期入院者数（30日）',
} as const;

export const KYORITSU_KPI_MAPPINGS: WideRowKpiMapping[] = [
	{ id: 'kyoritsu-bed-usage', field: KYORITSU_FIELDS.BED_USAGE, format: formatBedUsageRatio },
	{ id: 'kyoritsu-ambulance-transport', field: KYORITSU_FIELDS.AMBULANCE_TRANSPORT },
	{ id: 'kyoritsu-excepted-impatient', field: KYORITSU_FIELDS.EXCEPTED_IMPATIENT },
	{ id: 'kyoritsu-excepted-discharges', field: KYORITSU_FIELDS.EXCEPTED_DISCHARGES },
	{ id: 'kyoritsu-general-inpatient', field: KYORITSU_FIELDS.GENERAL_INPATIENT },
	{ id: 'kyoritsu-icu-impatient', field: KYORITSU_FIELDS.ICU_IMPATIENT },
	{ id: 'kyoritsu-average-stay', field: KYORITSU_FIELDS.AVERAGE_STAY },
	{ id: 'kyoritsu-surgeries', field: KYORITSU_FIELDS.SURGERIES },
	{ id: 'kyoritsu-long-term-inpatients', field: KYORITSU_FIELDS.LONG_TERM_INPATIENTS },
];

export const kyoritsuDataSource: WideRowDataSource = {
	id: 'kyoritsu',
	apiUrl: KYORITSU_API_URL,
	fields: {
		date: KYORITSU_FIELDS.DATE,
	},
	kpis: KYORITSU_KPI_MAPPINGS,
};

export function formatBedUsageRatio(value: KpiValue): string {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) ? `${(numericValue * 100).toFixed(1)}%` : '--';
}
