/**
 * KPI id の単一の出所（SSoT）。
 *
 * 画面の表示定義（facility-board.ts）とデータ取得定義（datasources/{kyoritsu,reha}.ts）は
 * もともと同じ id を別々にベタ書きしており、片方だけ直すと画面は落ちずに `--` や
 * `取得中...` が残ったまま静かに壊れた。両者をこのカタログからの導出に変え、
 * 二重管理そのものを無くす。
 *
 * このファイルは**何も import しない**。理由は2つある。
 * - ブラウザへ配信されるモジュール（facility-board.ts / datasources）から辿られるため、
 *   zod 等のライブラリを持ち込まない。
 * - ビルド時検査 scripts/check-kpi-catalog.mjs が Node の型ストリップで直接 import する。
 *   拡張子なしの相対 import が1つでもあると ERR_MODULE_NOT_FOUND で落ちる。
 *
 * KPI id の綴り（excepted / impatient）は誤りだが、正しい綴りが確定できないため据え置く。
 */

/** トレンドグラフの目盛り・ツールチップの数値整形と、y軸クランプの要否を決める。
 *  省略時は 'count' 扱い（そのままの数値、上限クランプなし） */
export type KpiCatalogChartValueKind = 'ratio' | 'count' | 'days';

/** チャートを持つ指標にだけ付く。id は kpiChartId() で導けるので持たない */
export type KpiCatalogChart = { ariaLabel: string; valueKind?: KpiCatalogChartValueKind };

export type KpiCatalogEntryBase = {
	/** 画面の <dd id="..."> と datasources 側の KPI id を兼ねる */
	id: string;
	/** 画面の見出し。API 応答の列名（field / matchLabel）とは別物 */
	label: string;
	isPrimary?: boolean;
	chart?: KpiCatalogChart;
};

/** 共立API: 1日分が1行、KPIは列として横に並ぶ。field は API 応答の列名 */
export type KyoritsuKpiCatalogEntry = KpiCatalogEntryBase & { field: string };

export type KpiBreakdownGroupKind = 'care' | 'ward';

/** 内訳カードとして表示する時だけ付ける。一覧5件には付けない。
 *  3つはセットで揃えるか、3つとも外すかのどちらか（check-kpi-catalog.mjs で強制する） */
export type KpiCatalogBreakdown = {
	/** どの主指標（一覧5件のid）を選んだときにこの内訳を出すか */
	breakdownOf: string;
	/** 内訳グリッドの種類。ケア区分別 or 病棟別 */
	breakdownGroup: KpiBreakdownGroupKind;
	/** 内訳カードの見出し。label は「地域包括ケア在院数」のように指標名を含むが、
	 *  カード見出しは「地域包括ケア」のように区分名だけにしたいので別に持つ */
	breakdownLabel: string;
};

/** リハAPI: 1KPIが1行。path と matchLabel(display_name) の組で対象行を特定する */
export type RehaKpiCatalogEntry = KpiCatalogEntryBase &
	{ path: string; matchLabel: string } &
	Partial<KpiCatalogBreakdown>;

/** チャート要素の id は KPI id から導く。板側とデータローダー側で綴りを二重管理しない */
export function kpiChartId(id: string): string {
	return `${id}-chart`;
}

export const kyoritsuKpiCatalog: readonly KyoritsuKpiCatalogEntry[] = [
	{
		id: 'kyoritsu-bed-usage',
		label: '病床利用率',
		field: '病床利用率 (%)',
		isPrimary: true,
		chart: { ariaLabel: '病床利用率の14日間推移グラフ', valueKind: 'ratio' },
	},
	{ id: 'kyoritsu-ambulance-transport', label: '救急車搬入数', field: '救急車搬入数' },
	{ id: 'kyoritsu-excepted-impatient', label: '入院患者数', field: '入院患者数' },
	{ id: 'kyoritsu-excepted-discharges', label: '退院予定数', field: '退院予定数' },
	{ id: 'kyoritsu-general-inpatient', label: '一般病棟在院数', field: '一般病棟在院数' },
	{ id: 'kyoritsu-icu-impatient', label: '集中治療室在院数', field: '集中治療室在院数' },
	{ id: 'kyoritsu-average-stay', label: '平均在院日数', field: '平均在院日数' },
	{ id: 'kyoritsu-surgeries', label: '手術件数', field: '手術件数' },
	{ id: 'kyoritsu-long-term-inpatients', label: '長期入院者数（30日）', field: '長期入院者数（30日）' },
];

export const rehaKpiCatalog: readonly RehaKpiCatalogEntry[] = [
	{
		id: 'reha-bed-usage',
		label: '病床利用率',
		path: '/reha',
		matchLabel: '病床利用率',
		isPrimary: true,
		chart: { ariaLabel: '病床利用率の14日間推移グラフ', valueKind: 'ratio' },
	},
	{
		id: 'reha-inpatient',
		label: '在院数',
		path: '/reha',
		matchLabel: '在院数',
		chart: { ariaLabel: '在院数の14日間推移グラフ', valueKind: 'count' },
	},
	{
		id: 'reha-excepted-impatient',
		label: '入院患者数',
		path: '/reha',
		matchLabel: '入院患者数',
		chart: { ariaLabel: '入院患者数の14日間推移グラフ', valueKind: 'count' },
	},
	{
		id: 'reha-excepted-discharges',
		label: '退院予定数',
		path: '/reha',
		matchLabel: '退院予定数',
		chart: { ariaLabel: '退院予定数の14日間推移グラフ', valueKind: 'count' },
	},
	{
		id: 'reha-average-stay',
		label: '平均在院日数',
		path: '/reha',
		matchLabel: '平均在院日数',
		chart: { ariaLabel: '平均在院日数の14日間推移グラフ', valueKind: 'days' },
	},
	{
		id: 'reha-community-inpatient',
		label: '地域包括ケア在院数',
		path: '/reha/community',
		matchLabel: '地域包括ケア在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'care',
		breakdownLabel: '地域包括ケア',
	},
	{
		id: 'reha-community-average-stay',
		label: '地域包括ケア平均在院日数',
		path: '/reha/community',
		matchLabel: '地域包括ケア平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'care',
		breakdownLabel: '地域包括ケア',
	},
	{
		id: 'reha-rehabilitation-inpatient',
		label: '回復期在院数',
		path: '/reha/rehabilitation',
		matchLabel: '回復期在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'care',
		breakdownLabel: '回復期',
	},
	{
		id: 'reha-rehabilitation-average-stay',
		label: '回復期平均在院日数',
		path: '/reha/rehabilitation',
		matchLabel: '回復期平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'care',
		breakdownLabel: '回復期',
	},
	{
		id: 'reha-palliative-inpatient',
		label: '緩和ケア在院数',
		path: '/reha/palliative',
		matchLabel: '緩和ケア在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'care',
		breakdownLabel: '緩和ケア',
	},
	{
		id: 'reha-palliative-average-stay',
		label: '緩和ケア平均在院日数',
		path: '/reha/palliative',
		matchLabel: '緩和ケア平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'care',
		breakdownLabel: '緩和ケア',
	},
	{
		id: 'reha-floor-2-north-inpatient',
		label: '2階北在院数',
		path: '/reha/f2n',
		matchLabel: '2階北在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'ward',
		breakdownLabel: '2階北',
	},
	{
		id: 'reha-floor-2-north-average-stay',
		label: '2階北平均在院日数',
		path: '/reha/f2n',
		matchLabel: '2階北平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'ward',
		breakdownLabel: '2階北',
	},
	{
		id: 'reha-floor-2-south-inpatient',
		label: '2階南在院数',
		path: '/reha/f2s',
		matchLabel: '2階南在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'ward',
		breakdownLabel: '2階南',
	},
	{
		id: 'reha-floor-2-south-average-stay',
		label: '2階南平均在院日数',
		path: '/reha/f2s',
		matchLabel: '2階南平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'ward',
		breakdownLabel: '2階南',
	},
	{
		id: 'reha-floor-3-inpatient',
		label: '3階在院数',
		path: '/reha/f3',
		matchLabel: '3階在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'ward',
		breakdownLabel: '3階',
	},
	{
		id: 'reha-floor-3-average-stay',
		label: '3階平均在院日数',
		path: '/reha/f3',
		matchLabel: '3階平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'ward',
		breakdownLabel: '3階',
	},
	// 4階は在院数がフロア全体、平均在院日数が北病棟のみ。APIのdisplay_nameがそうなっているため合わせている（2026-08-28の実データで確認）。
	// 病棟別内訳カードは5枚固定で揃えるため、breakdownLabelは他4枚と同じく「4階」表記にする（値は4階北限定のまま）。
	{
		id: 'reha-floor-4-inpatient',
		label: '4階在院数',
		path: '/reha/f4',
		matchLabel: '4階在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'ward',
		breakdownLabel: '4階',
	},
	{
		id: 'reha-floor-4-north-average-stay',
		label: '4階北平均在院日数',
		path: '/reha/f4',
		matchLabel: '4階北平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'ward',
		breakdownLabel: '4階',
	},
	{
		id: 'reha-floor-5-inpatient',
		label: '5階在院数',
		path: '/reha/f5',
		matchLabel: '5階在院数',
		breakdownOf: 'reha-inpatient',
		breakdownGroup: 'ward',
		breakdownLabel: '5階',
	},
	{
		id: 'reha-floor-5-average-stay',
		label: '5階平均在院日数',
		path: '/reha/f5',
		matchLabel: '5階平均在院日数',
		breakdownOf: 'reha-average-stay',
		breakdownGroup: 'ward',
		breakdownLabel: '5階',
	},
];
