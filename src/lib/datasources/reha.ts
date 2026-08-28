import { rehaKpiCatalog } from '../kpi-catalog';
import { formatBedUsageRatio } from './format';
import type { KpiValue, LongRowDataSource, LongRowKpiMapping } from './types';

/**
 * 表示整形は板側に対応概念が無いためカタログに持たせず、ここでローカルに対応付ける。
 * 対象外の KPI では format キー自体を作らない（undefined を値として持たせない）。
 */
const FORMAT_OVERRIDES: Record<string, (value: KpiValue) => string> = {
	'reha-bed-usage': formatBedUsageRatio,
};

/**
 * リハAPI: 1KPIが1行。path と display_name の組で対象行を特定する。
 * id・見出し・path・matchLabel の出所は kpi-catalog.ts。
 */
export const rehaDataSource: LongRowDataSource = {
	id: 'reha',
	layout: 'long',
	apiUrl:
		'https://script.google.com/macros/s/AKfycbyEBYJ6M-RXFpsFQPagf1mF1kR5ldRxT3eYi78QisCFx96hsNnPWa3rULAY7naiZq0/exec',
	responseFields: { date: 'date', path: 'path', label: 'display_name', value: 'value' },
	kpis: rehaKpiCatalog.map((entry) => {
		const kpi: LongRowKpiMapping = { id: entry.id, path: entry.path, matchLabel: entry.matchLabel };
		const format = FORMAT_OVERRIDES[entry.id];

		if (format) {
			kpi.format = format;
		}

		return kpi;
	}),
};
