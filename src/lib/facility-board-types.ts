export type TrendChart = {
	id: string;
	ariaLabel: string;
};

export type KpiBoardItem = {
	id: string;
	label: string;
	isPrimary?: boolean;
	chart?: TrendChart;
};
