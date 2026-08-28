export type DataSourceId = 'kyoritsu' | 'reha';

export type KpiValue = string | number | boolean | null | undefined;

export type DataRow = Record<string, KpiValue>;

type BaseKpiMapping = {
	/** FacilityKpiTile / FacilityKpiBoard が描画する <dd id="..."> と一致させる */
	id: string;
	format?: (value: KpiValue) => string;
};

/** 1行に複数KPIが列として並ぶAPI用 */
export type WideRowKpiMapping = BaseKpiMapping & {
	field: string;
};

/**
 * 1KPIが1行として返るAPI用。path と matchLabel の組で対象行を探す。
 * matchLabel は画面の見出しではなく、API応答の列名 / display_name と突き合わせる検索キー
 * （例: 共立の WideRowKpiMapping.field '病床利用率 (%)' のような API 側の生の文字列）。
 * 画面の見出しは facility-board.ts が持つ別物であり、一致するとは限らない。
 */
export type LongRowKpiMapping = BaseKpiMapping & {
	path: string;
	matchLabel: string;
};

export type WideRowDataSource = {
	id: DataSourceId;
	layout: 'wide';
	apiUrl: string;
	fields: { date: string };
	kpis: WideRowKpiMapping[];
};

export type LongRowDataSource = {
	id: DataSourceId;
	layout: 'long';
	apiUrl: string;
	responseFields: { date: string; path: string; label: string; value: string };
	kpis: LongRowKpiMapping[];
};

export type FacilityDataSource = WideRowDataSource | LongRowDataSource;
