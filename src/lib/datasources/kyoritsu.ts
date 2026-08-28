import { formatBedUsageRatio } from './format';
import type { WideRowDataSource } from './types';

/** 共立API: 1日分が1行、KPIは列として横に並ぶ */
export const kyoritsuDataSource: WideRowDataSource = {
	id: 'kyoritsu',
	layout: 'wide',
	apiUrl:
		'https://script.google.com/macros/s/AKfycbwor8y2k5p2zXUcIj7rBnyn3Z_V4cTyEgcyGzGnvy_VgAjam2ymmMFJNy0xUvnTuzjt/exec',
	fields: { date: '日付' },
	kpis: [
		{ id: 'kyoritsu-bed-usage', field: '病床利用率 (%)', format: formatBedUsageRatio },
		{ id: 'kyoritsu-ambulance-transport', field: '救急車搬入数' },
		{ id: 'kyoritsu-excepted-impatient', field: '入院患者数' },
		{ id: 'kyoritsu-excepted-discharges', field: '退院予定数' },
		{ id: 'kyoritsu-general-inpatient', field: '一般病棟在院数' },
		{ id: 'kyoritsu-icu-impatient', field: '集中治療室在院数' },
		{ id: 'kyoritsu-average-stay', field: '平均在院日数' },
		{ id: 'kyoritsu-surgeries', field: '手術件数' },
		{ id: 'kyoritsu-long-term-inpatients', field: '長期入院者数（30日）' },
	],
};
