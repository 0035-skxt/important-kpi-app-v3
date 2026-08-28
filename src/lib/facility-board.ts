import { kpiChartId, kyoritsuKpiCatalog, rehaKpiCatalog, type KpiCatalogEntryBase } from './kpi-catalog';

export type KpiBoardItem = {
	/** datasources 側の KPI id と一致させる */
	id: string;
	label: string;
	isPrimary?: boolean;
	chart?: { id: string; ariaLabel: string };
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
		}

		return item;
	});
}

export const kyoritsuBoardItems: KpiBoardItem[] = toBoardItems(kyoritsuKpiCatalog);

export const rehaBoardItems: KpiBoardItem[] = toBoardItems(rehaKpiCatalog);
