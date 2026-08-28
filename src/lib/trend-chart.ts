import { line, scaleLinear, scalePoint, select } from 'd3';
import type { KpiCatalogChartValueKind } from './kpi-catalog';
import type { TrendPoint } from './kpi-values';

const WIDTH = 320;
const HEIGHT = 120;
const MARGIN = { top: 10, right: 10, bottom: 20, left: 34 };

/** カタログの chart.valueKind と同じ語彙。省略時は 'count' 扱い */
export type TrendValueKind = KpiCatalogChartValueKind;

type ValueFormat = {
	tick: (value: number) => string;
	tooltip: (value: number) => string;
	/** 比率だけが物理的に 0〜1 という上限を持つ。人数・日数には固定クランプを付けない
	 *  （yMin/yMax 計算側の padding が自動的に余白を付けるため、それで十分） */
	clampMin?: number;
	clampMax?: number;
};

const FORMATS: Record<TrendValueKind, ValueFormat> = {
	ratio: {
		tick: (v) => `${(v * 100).toFixed(0)}%`,
		tooltip: (v) => `${(v * 100).toFixed(1)}%`,
		clampMin: 0,
		clampMax: 1,
	},
	count: {
		tick: (v) => `${Math.round(v)}`,
		tooltip: (v) => `${Math.round(v)}`,
	},
	days: {
		tick: (v) => v.toFixed(1),
		tooltip: (v) => `${v.toFixed(1)}日`,
	},
};

function formatTick(dateKey: string): string {
	const date = new Date(`${dateKey}T00:00:00Z`);
	return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function clearTrend(svgId: string): void {
	select(`#${svgId}`).selectAll('*').remove();
}

export function renderTrend(svgId: string, trend: TrendPoint[], valueKind: TrendValueKind = 'count'): void {
	const format = FORMATS[valueKind];
	const svg = select(`#${svgId}`);
	svg.selectAll('*').remove();

	const values = trend.map((point) => point.value).filter((value): value is number => value != null);

	if (values.length === 0) {
		svg
			.append('text')
			.attr('class', 'trend-chart-empty')
			.attr('x', WIDTH / 2)
			.attr('y', HEIGHT / 2)
			.attr('text-anchor', 'middle')
			.text('データなし');
		return;
	}

	const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
	const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

	/*
	 * 固定の下限(旧: 60%)から始めると、実際の変動幅が数%しか無いときに
	 * 折れ線がほぼ水平につぶれて見える。実データの最小・最大を基準に
	 * 余白を付けるだけにして、変動している部分が画面いっぱいに見えるようにする。
	 */
	const rawMin = Math.min(...values);
	const rawMax = Math.max(...values);
	const padding = Math.max((rawMax - rawMin) * 0.2, 0.02);
	const yMin = format.clampMin !== undefined ? Math.max(format.clampMin, rawMin - padding) : rawMin - padding;
	const yMax = format.clampMax !== undefined ? Math.min(format.clampMax, rawMax + padding) : rawMax + padding;

	const x = scalePoint<string>()
		.domain(trend.map((point) => point.date))
		.range([0, innerWidth]);
	const y = scaleLinear().domain([yMin, yMax]).nice(3).range([innerHeight, 0]);

	const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
	const yTicks = y.ticks(3);

	g.selectAll('.trend-y-tick')
		.data(yTicks)
		.join('line')
		.attr('class', 'trend-y-tick')
		.attr('x1', -3)
		.attr('x2', 0)
		.attr('y1', (tick) => y(tick))
		.attr('y2', (tick) => y(tick));

	g.selectAll('.trend-y-label')
		.data(yTicks)
		.join('text')
		.attr('class', 'trend-y-label')
		.attr('x', -6)
		.attr('y', (tick) => y(tick))
		.attr('dominant-baseline', 'middle')
		.attr('text-anchor', 'end')
		.text((tick) => format.tick(tick));

	const tickDates = trend.filter((_, i) => i % 3 === 0 || i === trend.length - 1).map((point) => point.date);

	g.selectAll('.trend-x-label')
		.data(tickDates)
		.join('text')
		.attr('class', 'trend-x-label')
		.attr('x', (date) => x(date) ?? 0)
		.attr('y', innerHeight + 14)
		.attr('text-anchor', 'middle')
		.text(formatTick);

	const lineGenerator = line<TrendPoint>()
		.defined((point) => point.value != null)
		.x((point) => x(point.date) ?? 0)
		.y((point) => y(point.value ?? 0));

	g.append('path').datum(trend).attr('class', 'trend-line').attr('d', lineGenerator);

	const points = g
		.selectAll('.trend-point')
		.data(trend.filter((point) => point.value != null))
		.join('circle')
		.attr('class', 'trend-point')
		.attr('cx', (point) => x(point.date) ?? 0)
		.attr('cy', (point) => y(point.value ?? 0))
		.attr('r', 2.5)
		.attr('tabindex', 0);

	points.append('title').text((point) => `${formatTick(point.date)}: ${format.tooltip(point.value ?? 0)}`);

	const missing = g
		.selectAll('.trend-missing')
		.data(trend.filter((point) => point.value == null))
		.join('g')
		.attr('class', 'trend-missing')
		.attr('transform', (point) => `translate(${x(point.date) ?? 0},${innerHeight / 2})`)
		.attr('tabindex', 0);

	missing.append('title').text((point) => `${formatTick(point.date)}: データなし`);
	missing.append('line').attr('x1', -4).attr('y1', -4).attr('x2', 4).attr('y2', 4);
	missing.append('line').attr('x1', -4).attr('y1', 4).attr('x2', 4).attr('y2', -4);

	/*
	 * ブラウザ標準の<title>だけだと表示まで時間がかかり見た目も揃わないため、
	 * カーソル/フォーカスに追従する軽量なツールチップをSVG内に自前で持つ。
	 */
	const tooltip = g.append('g').attr('class', 'trend-tooltip').style('opacity', 0);
	const tooltipBg = tooltip.append('rect').attr('class', 'trend-tooltip-bg').attr('rx', 3).attr('ry', 3);
	const tooltipText = tooltip.append('text').attr('class', 'trend-tooltip-text').attr('text-anchor', 'middle');

	function showTooltip(point: TrendPoint, cx: number, cy: number): void {
		const label =
			point.value == null
				? `${formatTick(point.date)}: データなし`
				: `${formatTick(point.date)}: ${format.tooltip(point.value)}`;

		tooltipText.text(label);

		const textNode = tooltipText.node();
		const bbox = textNode ? textNode.getBBox() : { width: 0, height: 0 };
		const paddingX = 6;
		const paddingY = 4;

		tooltipBg
			.attr('x', -bbox.width / 2 - paddingX)
			.attr('y', -bbox.height - paddingY * 2)
			.attr('width', bbox.width + paddingX * 2)
			.attr('height', bbox.height + paddingY * 2);
		tooltipText.attr('y', -paddingY - bbox.height / 4);

		// 端で吹き出しが枠外にはみ出さないよう、水平位置だけ内側に収める
		const halfWidth = bbox.width / 2 + paddingX;
		const clampedX = Math.min(Math.max(cx, halfWidth), innerWidth - halfWidth);

		tooltip.attr('transform', `translate(${clampedX},${cy})`).style('opacity', 1);
	}

	function hideTooltip(): void {
		tooltip.style('opacity', 0);
	}

	points
		.on('pointerenter focus', function (_event, point) {
			showTooltip(point, x(point.date) ?? 0, y(point.value ?? 0));
		})
		.on('pointerleave blur', hideTooltip);

	missing
		.on('pointerenter focus', function (_event, point) {
			showTooltip(point, x(point.date) ?? 0, innerHeight / 2);
		})
		.on('pointerleave blur', hideTooltip);
}
