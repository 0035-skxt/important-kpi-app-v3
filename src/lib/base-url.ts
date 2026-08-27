/**
 * base 付きの公開先でもリンクが切れないよう、パスを常にベースURL経由で組み立てる。
 *
 * サブパス配信では `/favicon.svg` のような絶対パス直書きは存在しないURLになる。
 * 静的アセットへのリンクは必ずこの関数を通すこと（`scripts/check-absolute-paths.mjs` で機械的に検査する）。
 */
const BASE = import.meta.env.BASE_URL;

export function withBase(path: string): string {
	return `${BASE.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
