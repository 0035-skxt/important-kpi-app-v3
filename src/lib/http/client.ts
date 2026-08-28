/**
 * KPI 取得の HTTP クライアント。
 *
 * KPI 値はブラウザから実行時に取得する（SSG だがデータは焼かない）。共立／リハの取得元は
 * それぞれ独立した GAS デプロイ（別ホスト・別 URL）のため共通 prefixUrl では表せない。
 * よって各 datasource が完全 URL を持ち、prefixUrl を持たない httpAbsolute で直接叩く。
 *
 * import は policy.ts への一方向のみ（policy.ts はこのファイルを import しない）。
 */
import { isHTTPError } from 'ky';
import type { z } from 'zod';

import { createKpiClient, isAbortError, withCircuitBreaker } from './policy';

/**
 * prefixUrl を持たない ky。各 datasource が保持する完全 URL を直接 GET するために使う。
 * timeout / retry は policy.ts の KPI_HTTP_POLICY に従う。
 */
export const httpAbsolute = createKpiClient();

/** 呼び出し元が意図的キャンセルと API エラーを区別できるよう、policy.ts の判定を再輸出する */
export { isAbortError };

/**
 * HTTP エラー応答の正規化情報。ky の HTTPError が握る response（ヘッダー含む）/
 * data（本文）を、.message へ縮退させずに呼び出し元へ引き渡すための形。
 */
export interface HttpErrorInfo {
	/** リクエスト先の完全 URL。 */
	url: string;
	/** レスポンスの HTTP ステータスコード。 */
	status: number;
	/** レスポンス本文（Content-Type に応じて ky が JSON/text にパース済み。空/失敗時は undefined）。 */
	body: unknown;
}

/**
 * 正規化された HTTP エラー。message は人間可読な要約のみとし、ステータス・本文・URL は
 * 専用プロパティで保持する（e.message への縮退で失われないようにする）。
 */
export class HttpError extends Error {
	override readonly name = 'HttpError';
	readonly status: number;
	readonly body: unknown;
	readonly url: string;

	constructor(info: HttpErrorInfo) {
		super(`HTTP ${info.status}: ${info.url}`);
		this.status = info.status;
		this.body = info.body;
		this.url = info.url;
	}
}

/** ky の HTTPError を HttpError へ変換する。HTTPError 以外はそのまま返す（透過）。 */
export function normalizeHttpError(e: unknown): unknown {
	if (!isHTTPError(e)) return e;
	return new HttpError({ url: e.request.url, status: e.response.status, body: e.data });
}

/**
 * 単発取得のフロー「完全 URL を GET → Zod parse（境界検証）→ transform で整形」を組む。
 * schema.parse が unknown を素通りさせない境界となり、transform は検証済みの型で受け取る。
 *
 * ky の HTTPError はレスポンス本文・ヘッダーを保持するが、素通しすると呼び出し元は
 * .message のみに縮退しがちなので、HttpError へ正規化してから throw する。
 * isAbortError（意図的キャンセル）は正規化対象外でそのまま透過する。
 *
 * circuitKey は施設×データソース単位の回路キー（datasource の id をそのまま渡す）。
 * 取得失敗が連続すると回路が open になり、以降しばらくはネットワークを叩かず即座に
 * CircuitOpenError で失敗する。Zod parse 失敗も「不正応答」として失敗に数える —
 * 応答が壊れている間、叩き続けても回復しないため。
 */
export function createFetcher<S extends z.ZodType, T>(
	url: string,
	schema: S,
	transform: (parsed: z.infer<S>) => T,
	circuitKey: string,
): (signal?: AbortSignal) => Promise<T> {
	return async (signal?: AbortSignal) =>
		withCircuitBreaker(circuitKey, async () => {
			try {
				const raw = await httpAbsolute.get(url, signal ? { signal } : undefined).json();
				return transform(schema.parse(raw));
			} catch (e) {
				if (isAbortError(e)) throw e;
				throw normalizeHttpError(e);
			}
		});
}
