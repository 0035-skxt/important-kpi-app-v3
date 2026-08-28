/**
 * データソース設定の共通型。
 *
 * ここでは「画面にどう表示するか」ではなく、
 * 「APIから返るデータを、どのKPI DOM idへ流し込むか」を表す。
 */

export type DataSourceId = 'kyoritsu' | 'reha';

export type KpiValue = string | number | boolean | null | undefined;

export type KpiValueFormatter = (value: KpiValue) => string;

export type DataRow = Record<string, KpiValue>;

export type BaseKpiMapping = {
	/**
	 * FacilityKpiBoard 側で描画される <dd id="..."> と一致させる。
	 * 例: "kyoritsu-bed-usage"
	 */
	id: string;

	/**
	 * 値を画面表示用に整形する関数。
	 * 未指定なら String(value) で表示する想定。
	 */
	format?: KpiValueFormatter;
};

export type WideRowKpiMapping = BaseKpiMapping & {
	/**
	 * 1行に複数KPIが横持ちで入っているAPI用。
	 * 例: 共立APIの "病床利用率 (%)"
	 */
	field: string;
};

export type LongRowKpiMapping = BaseKpiMapping & {
	/**
	 * 1KPIが1行として縦持ちで返るAPI用。
	 * path と label の組み合わせで対象行を探す。
	 */
	path: string;
	label: string;
};

export type WideRowDataSource = {
	id: DataSourceId;
	apiUrl: string;
	fields: {
		date: string;
	};
	kpis: WideRowKpiMapping[];
};

export type LongRowDataSource = {
	id: DataSourceId;
	apiUrl: string;
	responseFields: {
		date: string;
		path: string;
		label: string;
		value: string;
	};
	kpis: LongRowKpiMapping[];
};
