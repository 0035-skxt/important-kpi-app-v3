import { kyoritsuKpiCatalog } from '../kpi-catalog';
import { formatBedUsageRatio } from './format';
import type { KpiValue, WideRowDataSource, WideRowKpiMapping } from './types';

/**
 * 表示整形は板側に対応概念が無いためカタログに持たせず、ここでローカルに対応付ける。
 * 対象外の KPI では format キー自体を作らない（undefined を値として持たせない）。
 */
const FORMAT_OVERRIDES: Record<string, (value: KpiValue) => string> = {
	'kyoritsu-bed-usage': formatBedUsageRatio,
};

/**
 * 共立API: 1日分が1行、KPIは列として横に並ぶ。
 * kpis[].field は API 応答の列名であり画面の見出しではない
 * （例: '病床利用率 (%)'）。id・見出し・列名の出所は kpi-catalog.ts。
 */
export const kyoritsuDataSource: WideRowDataSource = {
	id: 'kyoritsu',
	layout: 'wide',
	apiUrl:
		'https://script.google.com/macros/s/AKfycbwor8y2k5p2zXUcIj7rBnyn3Z_V4cTyEgcyGzGnvy_VgAjam2ymmMFJNy0xUvnTuzjt/exec',
	fields: { date: '日付' },
	kpis: kyoritsuKpiCatalog.map((entry) => {
		const kpi: WideRowKpiMapping = { id: entry.id, field: entry.field };
		const format = FORMAT_OVERRIDES[entry.id];

		if (format) {
			kpi.format = format;
		}

		return kpi;
	}),
};
