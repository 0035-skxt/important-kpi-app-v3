import {
	kpiChartId,
	kyoritsuKpiCatalog,
	rehaKpiCatalog,
	type KpiCatalogChartValueKind,
	type KpiCatalogEntryBase,
	type RehaKpiCatalogEntry,
} from './kpi-catalog';

export type KpiBoardItem = {
	/** datasources 側の KPI id と一致させる */
	id: string;
	label: string;
	isPrimary?: boolean;
	/*
	 * valueKind はカタログの KpiCatalogChart から素通しする。
	 * クリックで主指標が入れ替わったとき、FacilityKpiDataLoader が
	 * renderTrend() へどの目盛りフォーマットを使うか渡すのに必要
	 * （設計ではこの型は「そのまま」としていたが、7章の再描画が
	 * chart.valueKind を読む以上ここに乗せるほかなく、実装時に追加した）。
	 */
	chart?: { id: string; ariaLabel: string; valueKind?: KpiCatalogChartValueKind };
};

/** 日付・状態のidは施設idから導く。FacilityKpiTile / FacilityKpiBoard と FacilityKpiDataLoader で共有する */
export function boardDateId(sourceId: string): string {
	return `${sourceId}-target-date`;
}

export function boardStatusId(sourceId: string): string {
	return `${sourceId}-status`;
}

/**
 * カタログから板の表示定義を作る。
 * 省略可能な項目は「値が無いなら key ごと作らない」。undefined を値として持たせると
 * ベタ書きだった頃と key 構成が変わり、Object.keys() を見る比較や truthy 判定の
 * 前提が静かにずれる。
 */
function toBoardItems(catalog: readonly KpiCatalogEntryBase[]): KpiBoardItem[] {
	return catalog.map((entry) => {
		const item: KpiBoardItem = { id: entry.id, label: entry.label };

		if (entry.isPrimary !== undefined) {
			item.isPrimary = entry.isPrimary;
		}

		if (entry.chart) {
			item.chart = { id: kpiChartId(entry.id), ariaLabel: entry.chart.ariaLabel };

			if (entry.chart.valueKind !== undefined) {
				item.chart.valueKind = entry.chart.valueKind;
			}
		}

		return item;
	});
}

export const kyoritsuBoardItems: KpiBoardItem[] = toBoardItems(kyoritsuKpiCatalog);

export const rehaBoardItems: KpiBoardItem[] = toBoardItems(rehaKpiCatalog);

export type KpiBreakdownItem = { id: string; label: string };

export type KpiBreakdownGroup = {
	kind: 'care' | 'ward';
	items: KpiBreakdownItem[];
};

/** 一覧5件のid → { care?: 3カード分, ward?: 5カード分 } */
export type KpiBreakdownMap = Map<string, { care?: KpiBreakdownGroup; ward?: KpiBreakdownGroup }>;

function hasBreakdownMeta(
	entry: RehaKpiCatalogEntry,
): entry is RehaKpiCatalogEntry &
	Required<Pick<RehaKpiCatalogEntry, 'breakdownOf' | 'breakdownGroup' | 'breakdownLabel'>> {
	return entry.breakdownOf !== undefined;
}

/** 一覧カードに出す項目だけを抜く（内訳専用メタデータを持つ項目を除外） */
export const rehaCardItems: KpiBoardItem[] = toBoardItems(rehaKpiCatalog.filter((entry) => !hasBreakdownMeta(entry)));

function buildBreakdownMap(catalog: readonly RehaKpiCatalogEntry[]): KpiBreakdownMap {
	const map: KpiBreakdownMap = new Map();

	for (const entry of catalog) {
		if (!hasBreakdownMeta(entry)) continue;

		const forItem = map.get(entry.breakdownOf) ?? {};
		const group = forItem[entry.breakdownGroup] ?? { kind: entry.breakdownGroup, items: [] };
		group.items.push({ id: entry.id, label: entry.breakdownLabel });
		forItem[entry.breakdownGroup] = group;
		map.set(entry.breakdownOf, forItem);
	}

	return map;
}

/** reha専用。kyoritsu には内訳が無いので、この関数もexportも作らない（要件6を型で担保） */
export const rehaBreakdownMap: KpiBreakdownMap = buildBreakdownMap(rehaKpiCatalog);
