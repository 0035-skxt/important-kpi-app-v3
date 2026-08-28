import { fetchRows, getLatestLongRows, getLatestWideRow } from './datasources/rows';
import type {
	DataRow,
	FacilityDataSource,
	KpiValue,
	LongRowDataSource,
	WideRowDataSource,
} from './datasources/types';

export type TrendPoint = { date: string; value: number | null };

export type FacilityView = {
	/** 画面に出す最新日付 */
	date: string;
	/** KPI id → 表示文字列 */
	values: Map<string, string>;
	trend: TrendPoint[];
};

/** APIごとに日付表現が違うため、Asia/Tokyo の YYYY-MM-DD に揃えてから扱う */
function toDateKey(value: KpiValue): string | null {
	const date = new Date(String(value));

	return Number.isNaN(date.getTime())
		? null
		: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date);
}

function formatKpi(value: KpiValue, format?: (value: KpiValue) => string): string {
	if (value == null || value === '') {
		return '--';
	}

	return format ? format(value) : String(value);
}

/**
 * 最新値と、推移グラフ用の「日付 → 値」を取り出す。
 * 横持ち・縦持ちの違いを知っているのはこの2つの関数だけ。
 */
type ReadResult = {
	dateKey: string | null;
	values: Map<string, string>;
	valueByDate: Map<string, KpiValue>;
};

function readWide(source: WideRowDataSource, rows: DataRow[], trendKpiId?: string): ReadResult {
	const latest = getLatestWideRow(rows);
	const values = new Map<string, string>();

	for (const kpi of source.kpis) {
		values.set(kpi.id, formatKpi(latest[kpi.field], kpi.format));
	}

	const trendKpi = source.kpis.find((kpi) => kpi.id === trendKpiId);
	const valueByDate = new Map<string, KpiValue>();

	if (trendKpi) {
		for (const row of rows) {
			const key = toDateKey(row[source.fields.date]);
			if (key) {
				valueByDate.set(key, row[trendKpi.field]);
			}
		}
	}

	return { dateKey: toDateKey(latest[source.fields.date]), values, valueByDate };
}

function readLong(source: LongRowDataSource, rows: DataRow[], trendKpiId?: string): ReadResult {
	const { date, path, label: labelField, value } = source.responseFields;
	const latest = getLatestLongRows(rows, date);
	const values = new Map<string, string>();

	for (const kpi of source.kpis) {
		const row = latest.rows.find((candidate) => candidate[path] === kpi.path && candidate[labelField] === kpi.matchLabel);
		values.set(kpi.id, formatKpi(row?.[value], kpi.format));
	}

	const trendKpi = source.kpis.find((kpi) => kpi.id === trendKpiId);
	const valueByDate = new Map<string, KpiValue>();

	if (trendKpi) {
		for (const row of rows) {
			if (row[path] !== trendKpi.path || row[labelField] !== trendKpi.matchLabel) {
				continue;
			}

			const key = toDateKey(row[date]);
			if (key) {
				valueByDate.set(key, row[value]);
			}
		}
	}

	return { dateKey: toDateKey(latest.date), values, valueByDate };
}

/** 最新日から遡って days 日分を埋める。値がない日は null のまま残す */
function buildTrend(latestKey: string | null, days: number, valueByDate: Map<string, KpiValue>): TrendPoint[] {
	if (!latestKey) {
		return [];
	}

	const base = new Date(`${latestKey}T00:00:00Z`);
	const trend: TrendPoint[] = [];

	for (let i = days - 1; i >= 0; i -= 1) {
		const day = new Date(base);
		day.setUTCDate(day.getUTCDate() - i);

		const key = day.toISOString().slice(0, 10);
		const raw = valueByDate.get(key);
		// null や空文字は Number() が 0 になるため、欠測として先に弾く
		const numeric = raw == null || raw === '' ? Number.NaN : Number(raw);
		trend.push({ date: key, value: Number.isFinite(numeric) ? numeric : null });
	}

	return trend;
}

export async function loadFacilityView(
	source: FacilityDataSource,
	options: { trendKpiId?: string; trendDays?: number } = {},
): Promise<FacilityView> {
	const { trendKpiId, trendDays = 14 } = options;
	const rows = await fetchRows<DataRow>(source.apiUrl, source.id);
	const read = source.layout === 'wide' ? readWide(source, rows, trendKpiId) : readLong(source, rows, trendKpiId);

	return {
		date: read.dateKey
			? new Date(`${read.dateKey}T00:00:00Z`).toLocaleDateString('ja-JP', { timeZone: 'UTC' })
			: '--',
		values: read.values,
		trend: buildTrend(read.dateKey, trendDays, read.valueByDate),
	};
}
