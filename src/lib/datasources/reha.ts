import { formatBedUsageRatio } from './format';
import type { LongRowDataSource } from './types';

/** リハAPI: 1KPIが1行。path と display_name の組で対象行を特定する */
export const rehaDataSource: LongRowDataSource = {
	id: 'reha',
	layout: 'long',
	apiUrl:
		'https://script.google.com/macros/s/AKfycbyEBYJ6M-RXFpsFQPagf1mF1kR5ldRxT3eYi78QisCFx96hsNnPWa3rULAY7naiZq0/exec',
	responseFields: { date: 'date', path: 'path', label: 'display_name', value: 'value' },
	kpis: [
		{ id: 'reha-bed-usage', path: '/reha', matchLabel: '病床利用率', format: formatBedUsageRatio },
		{ id: 'reha-inpatient', path: '/reha', matchLabel: '在院数' },
		{ id: 'reha-excepted-impatient', path: '/reha', matchLabel: '入院患者数' },
		{ id: 'reha-excepted-discharges', path: '/reha', matchLabel: '退院予定数' },
		{ id: 'reha-average-stay', path: '/reha', matchLabel: '平均在院日数' },
		{ id: 'reha-community-inpatient', path: '/reha/community', matchLabel: '地域包括ケア在院数' },
		{ id: 'reha-community-average-stay', path: '/reha/community', matchLabel: '地域包括ケア平均在院日数' },
		{ id: 'reha-rehabilitation-inpatient', path: '/reha/rehabilitation', matchLabel: '回復期在院数' },
		{ id: 'reha-rehabilitation-average-stay', path: '/reha/rehabilitation', matchLabel: '回復期平均在院日数' },
		{ id: 'reha-palliative-inpatient', path: '/reha/palliative', matchLabel: '緩和ケア在院数' },
		{ id: 'reha-palliative-average-stay', path: '/reha/palliative', matchLabel: '緩和ケア平均在院日数' },
		{ id: 'reha-floor-2-north-inpatient', path: '/reha/f2n', matchLabel: '2階北在院数' },
		{ id: 'reha-floor-2-north-average-stay', path: '/reha/f2n', matchLabel: '2階北平均在院日数' },
		{ id: 'reha-floor-2-south-inpatient', path: '/reha/f2s', matchLabel: '2階南在院数' },
		{ id: 'reha-floor-2-south-average-stay', path: '/reha/f2s', matchLabel: '2階南平均在院日数' },
		{ id: 'reha-floor-3-inpatient', path: '/reha/f3', matchLabel: '3階在院数' },
		{ id: 'reha-floor-3-average-stay', path: '/reha/f3', matchLabel: '3階平均在院日数' },
		// 4階は在院数がフロア全体、平均在院日数が北病棟のみ。APIのdisplay_nameがそうなっているため合わせている（2026-08-28の実データで確認）
		{ id: 'reha-floor-4-inpatient', path: '/reha/f4', matchLabel: '4階在院数' },
		{ id: 'reha-floor-4-north-average-stay', path: '/reha/f4', matchLabel: '4階北平均在院日数' },
		{ id: 'reha-floor-5-inpatient', path: '/reha/f5', matchLabel: '5階在院数' },
		{ id: 'reha-floor-5-average-stay', path: '/reha/f5', matchLabel: '5階平均在院日数' },
	],
};
