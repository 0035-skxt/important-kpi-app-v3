export type KpiBoardItem = {
	/** datasources 側の KPI id と一致させる */
	id: string;
	label: string;
	isPrimary?: boolean;
	chart?: { id: string; ariaLabel: string };
};

/** 日付・状態のidは施設idから導く。FacilityKpiBoard と FacilityKpiDataLoader で共有する */
export function boardDateId(sourceId: string): string {
	return `${sourceId}-target-date`;
}

export function boardStatusId(sourceId: string): string {
	return `${sourceId}-status`;
}

export const kyoritsuBoardItems: KpiBoardItem[] = [
	{
		id: 'kyoritsu-bed-usage',
		label: '病床利用率',
		isPrimary: true,
		chart: { id: 'kyoritsu-bed-usage-chart', ariaLabel: '病床利用率の14日間推移グラフ' },
	},
	{ id: 'kyoritsu-ambulance-transport', label: '救急車搬入数' },
	{ id: 'kyoritsu-excepted-impatient', label: '入院患者数' },
	{ id: 'kyoritsu-excepted-discharges', label: '退院予定数' },
	{ id: 'kyoritsu-general-inpatient', label: '一般病棟在院数' },
	{ id: 'kyoritsu-icu-impatient', label: '集中治療室在院数' },
	{ id: 'kyoritsu-average-stay', label: '平均在院日数' },
	{ id: 'kyoritsu-surgeries', label: '手術件数' },
	{ id: 'kyoritsu-long-term-inpatients', label: '長期入院者数（30日）' },
];

export const rehaBoardItems: KpiBoardItem[] = [
	{
		id: 'reha-bed-usage',
		label: '病床利用率',
		isPrimary: true,
		chart: { id: 'reha-bed-usage-chart', ariaLabel: '病床利用率の14日間推移グラフ' },
	},
	{ id: 'reha-inpatient', label: '在院数' },
	{ id: 'reha-excepted-impatient', label: '入院患者数' },
	{ id: 'reha-excepted-discharges', label: '退院予定数' },
	{ id: 'reha-average-stay', label: '平均在院日数' },
	{ id: 'reha-community-inpatient', label: '地域包括ケア在院数' },
	{ id: 'reha-community-average-stay', label: '地域包括ケア平均在院日数' },
	{ id: 'reha-rehabilitation-inpatient', label: '回復期在院数' },
	{ id: 'reha-rehabilitation-average-stay', label: '回復期平均在院日数' },
	{ id: 'reha-palliative-inpatient', label: '緩和ケア在院数' },
	{ id: 'reha-palliative-average-stay', label: '緩和ケア平均在院日数' },
	{ id: 'reha-floor-2-north-inpatient', label: '2階北在院数' },
	{ id: 'reha-floor-2-north-average-stay', label: '2階北平均在院日数' },
	{ id: 'reha-floor-2-south-inpatient', label: '2階南在院数' },
	{ id: 'reha-floor-2-south-average-stay', label: '2階南平均在院日数' },
	{ id: 'reha-floor-3-inpatient', label: '3階在院数' },
	{ id: 'reha-floor-3-average-stay', label: '3階平均在院日数' },
	{ id: 'reha-floor-4-inpatient', label: '4階在院数' },
	{ id: 'reha-floor-4-north-average-stay', label: '4階北平均在院日数' },
	{ id: 'reha-floor-5-inpatient', label: '5階在院数' },
	{ id: 'reha-floor-5-average-stay', label: '5階平均在院日数' },
];
