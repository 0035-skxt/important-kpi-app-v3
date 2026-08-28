import type { KpiValue, LongRowDataSource, LongRowKpiMapping } from './types';

/**
 * リハAPIは「1KPIが1行として返る」縦持ち形式。
 */

export const REHA_API_URL = 'https://script.google.com/macros/s/AKfycbyEBYJ6M-RXFpsFQPagf1mF1kR5ldRxT3eYi78QisCFx96hsNnPWa3rULAY7naiZq0/exec';

export const REHA_RESPONSE_FIELDS = {
	DATE: 'date',
	PATH: 'path',
	LABEL: 'display_name',
	VALUE: 'value',
} as const;

export const REHA_LABELS = {
	BED_USAGE: '病床利用率',
	INPATIENT: '在院数',
	EXCEPTED_IMPATIENT: '入院患者数',
	EXCEPTED_DISCHARGES: '退院予定数',
	AVERAGE_STAY: '平均在院日数',
	COMMUNITY_INPATIENT: '地域包括ケア在院数',
	COMMUNITY_AVERAGE_STAY: '地域包括ケア平均在院日数',
	REHABILITATION_INPATIENT: '回復期在院数',
	REHABILITATION_AVERAGE_STAY: '回復期平均在院日数',
	PALLIATIVE_INPATIENT: '緩和ケア在院数',
	PALLIATIVE_AVERAGE_STAY: '緩和ケア平均在院日数',
	FLOOR_2_NORTH_INPATIENT: '2階北在院数',
	FLOOR_2_NORTH_AVERAGE_STAY: '2階北平均在院日数',
	FLOOR_2_SOUTH_INPATIENT: '2階南在院数',
	FLOOR_2_SOUTH_AVERAGE_STAY: '2階南平均在院日数',
	FLOOR_3_INPATIENT: '3階在院数',
	FLOOR_3_AVERAGE_STAY: '3階平均在院日数',
	FLOOR_4_INPATIENT: '4階在院数',
	FLOOR_4_NORTH_AVERAGE_STAY: '4階北平均在院日数',
	FLOOR_5_INPATIENT: '5階在院数',
	FLOOR_5_AVERAGE_STAY: '5階平均在院日数',
} as const;

export const REHA_KPI_MAPPINGS: LongRowKpiMapping[] = [
	{ id: 'reha-bed-usage', path: '/reha', label: REHA_LABELS.BED_USAGE, format: formatBedUsageRatio },
	{ id: 'reha-inpatient', path: '/reha', label: REHA_LABELS.INPATIENT },
	{ id: 'reha-excepted-impatient', path: '/reha', label: REHA_LABELS.EXCEPTED_IMPATIENT },
	{ id: 'reha-excepted-discharges', path: '/reha', label: REHA_LABELS.EXCEPTED_DISCHARGES },
	{ id: 'reha-average-stay', path: '/reha', label: REHA_LABELS.AVERAGE_STAY },
	{ id: 'reha-community-inpatient', path: '/reha/community', label: REHA_LABELS.COMMUNITY_INPATIENT },
	{ id: 'reha-community-average-stay', path: '/reha/community', label: REHA_LABELS.COMMUNITY_AVERAGE_STAY },
	{ id: 'reha-rehabilitation-inpatient', path: '/reha/rehabilitation', label: REHA_LABELS.REHABILITATION_INPATIENT },
	{
		id: 'reha-rehabilitation-average-stay',
		path: '/reha/rehabilitation',
		label: REHA_LABELS.REHABILITATION_AVERAGE_STAY,
	},
	{ id: 'reha-palliative-inpatient', path: '/reha/palliative', label: REHA_LABELS.PALLIATIVE_INPATIENT },
	{ id: 'reha-palliative-average-stay', path: '/reha/palliative', label: REHA_LABELS.PALLIATIVE_AVERAGE_STAY },
	{ id: 'reha-floor-2-north-inpatient', path: '/reha/f2n', label: REHA_LABELS.FLOOR_2_NORTH_INPATIENT },
	{ id: 'reha-floor-2-north-average-stay', path: '/reha/f2n', label: REHA_LABELS.FLOOR_2_NORTH_AVERAGE_STAY },
	{ id: 'reha-floor-2-south-inpatient', path: '/reha/f2s', label: REHA_LABELS.FLOOR_2_SOUTH_INPATIENT },
	{ id: 'reha-floor-2-south-average-stay', path: '/reha/f2s', label: REHA_LABELS.FLOOR_2_SOUTH_AVERAGE_STAY },
	{ id: 'reha-floor-3-inpatient', path: '/reha/f3', label: REHA_LABELS.FLOOR_3_INPATIENT },
	{ id: 'reha-floor-3-average-stay', path: '/reha/f3', label: REHA_LABELS.FLOOR_3_AVERAGE_STAY },
	{ id: 'reha-floor-4-inpatient', path: '/reha/f4', label: REHA_LABELS.FLOOR_4_INPATIENT },
	{ id: 'reha-floor-4-north-average-stay', path: '/reha/f4', label: REHA_LABELS.FLOOR_4_NORTH_AVERAGE_STAY },
	{ id: 'reha-floor-5-inpatient', path: '/reha/f5', label: REHA_LABELS.FLOOR_5_INPATIENT },
	{ id: 'reha-floor-5-average-stay', path: '/reha/f5', label: REHA_LABELS.FLOOR_5_AVERAGE_STAY },
];

export const rehaDataSource: LongRowDataSource = {
	id: 'reha',
	apiUrl: REHA_API_URL,
	responseFields: {
		date: REHA_RESPONSE_FIELDS.DATE,
		path: REHA_RESPONSE_FIELDS.PATH,
		label: REHA_RESPONSE_FIELDS.LABEL,
		value: REHA_RESPONSE_FIELDS.VALUE,
	},
	kpis: REHA_KPI_MAPPINGS,
};

export function formatBedUsageRatio(value: KpiValue): string {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) ? `${(numericValue * 100).toFixed(1)}%` : '--';
}
