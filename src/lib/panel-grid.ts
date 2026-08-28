/**
 * パネルを敷き詰めるグリッドの分割定義。
 * 4分割なら 2×2、9分割なら 3×3。行と列が異なる分割も表現できる。
 */
export type PanelGridSplit = {
	columns: number;
	rows: number;
};

/**
 * 画面幅の段階ごとの列数。
 *
 * 視距離は CSS からは検出できない（55型を6mから見る場合と13インチを0.6mから
 * 見る場合で、どちらも同じ幅を報告する）。ここで扱うのは画面幅だけであり、
 * 掲示用の巨大タイポグラフィが必要になったら別軸として宣言的に足すこと。
 */
export type PanelGridColumns = {
	/** 1024px以上。指定どおりの分割を敷く */
	wide: number;
	/** 601〜1023px。2列を上限に減らす */
	medium: number;
	/** 600px以下。分割をやめて縦に積む */
	narrow: number;
};

/**
 * 分割数から行列を導く。4→2×2、9→3×3、16→4×4。
 * 平方数でない場合は列を先に増やして横長に寄せる（6→3×2）。
 */
export function resolvePanelGridSplit(count: number): PanelGridSplit {
	const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
	const rows = Math.max(1, Math.ceil(count / columns));

	return { columns, rows };
}

/**
 * 列数を画面幅の段階ごとに落とす。
 *
 * 狭い画面では「分割を縮小する」のではなく「分割をやめて積む」。
 * 9分割を縮小表示しても読めないため、モードごと切り替える。
 */
export function resolvePanelGridColumns(columns: number): PanelGridColumns {
	return {
		wide: columns,
		medium: Math.min(columns, 2),
		narrow: 1,
	};
}
