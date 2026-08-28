import { line, scaleLinear, scalePoint, select } from 'd3';
import type { TrendPoint } from './kpi-values';

const WIDTH = 320;
const HEIGHT = 120;
const MARGIN = { top: 10, right: 10, bottom: 20, left: 34 };
const Y_MIN = 0.6;

function formatTick(dateKey: string): string {
	const date = new Date(`${dateKey}T00:00:00Z`);
	return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function clearBedUsageTrend(svgId: string): void {
	select(`#${svgId}`).selectAll('*').remove();
}

export function renderBedUsageTrend(svgId: string, trend: TrendPoint[]): void {
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
	const yMax = Math.min(1, Math.max(Math.max(...values) + 0.02, Y_MIN + 0.02));

	const x = scalePoint<string>()
		.domain(trend.map((point) => point.date))
		.range([0, innerWidth]);
	const y = scaleLinear().domain([Y_MIN, yMax]).range([innerHeight, 0]);

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
		.text((tick) => `${(tick * 100).toFixed(0)}%`);

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
		.attr('r', 3);

	points.append('title').text((point) => `${formatTick(point.date)}: ${((point.value ?? 0) * 100).toFixed(1)}%`);

	const missing = g
		.selectAll('.trend-missing')
		.data(trend.filter((point) => point.value == null))
		.join('g')
		.attr('class', 'trend-missing')
		.attr('transform', (point) => `translate(${x(point.date) ?? 0},${innerHeight / 2})`);

	missing.append('title').text((point) => `${formatTick(point.date)}: データなし`);
	missing.append('line').attr('x1', -4).attr('y1', -4).attr('x2', 4).attr('y2', 4);
	missing.append('line').attr('x1', -4).attr('y1', 4).attr('x2', 4).attr('y2', -4);
}
