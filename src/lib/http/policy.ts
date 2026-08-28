/**
 * KPI 取得の HTTP ポリシー（タイムアウト / リトライ / サーキットブレーカー）の単一の出所。
 *
 * 設定を呼び出し側に散らすと暗黙化して守られなくなるため、ky インスタンスの生成口を
 * createKpiClient() 1つに絞る。**ky の default import はこのファイル以外で行わない**
 * （v3 には ESLint が無く機械強制できないため、約束としてここに書く）。
 *
 * isAbortError はロギングとは無関係だが、withCircuitBreaker が「意図的キャンセルを
 * 失敗に数えない」ために必要とするのでここに置く。client.ts はこのファイルから
 * 一方向に import する（policy.ts が client.ts を import してはいけない＝循環になる）。
 */
import ky from 'ky';
import type { KyInstance, Options } from 'ky';

/**
 * GAS 共通プリセット。
 *
 * GAS は応答が遅く・コールドスタートや同時実行制限で断続的に 302/503 を返す。
 *
 * - timeout: 30000 — 全 API 呼び出しに 30 秒のタイムアウトを設ける
 * - retry.limit: 2 — 初回 + 2 回まで（GAS のコールドスタート1回ぶんを吸収する最小値）
 * - 指数バックオフは ky の既定実装（0.3 * 2^(試行回数-1) 秒）。上限は backoffLimit
 * - backoffLimit: 3000 — 待ち時間の上限 3s（timeout 30s 内に3試行が収まる）
 * - statusCodes: 408/429 と 5xx のみ。4xx（404 等の恒久的失敗）はリトライしない。
 *   ネットワークエラー（fetch の reject）は ky が statusCodes と無関係に再試行する
 * - methods: ['get'] — KPI 取得は GET のみ。冪等でないメソッドは再送しない
 */
export const KPI_HTTP_POLICY: Options = {
	timeout: 30000,
	retry: {
		limit: 2,
		methods: ['get'],
		statusCodes: [408, 429, 500, 502, 503, 504],
		backoffLimit: 3000,
	},
};

/**
 * サーキットブレーカーの設定。連続 failureThreshold 回失敗したキーは openDurationMs の間
 * open になり、その間の呼び出しはネットワークを叩かず即座に CircuitOpenError で失敗する。
 *
 * 値は「GAS が落ちている間、ページを開くたびに30秒待たされる」体験を避ける目安。
 * 3回連続失敗＝実際には retry 込みで9回叩いた後であり、一時的なゆらぎとは区別できる。
 */
export const CIRCUIT_BREAKER_POLICY = {
	failureThreshold: 3,
	openDurationMs: 60000,
} as const;

/**
 * fetch キャンセル時の AbortError を型安全に判定する。
 * DOMException と Error の両方を包括する（ブラウザは DOMException、一部ランタイムは
 * plain Error に name='AbortError' を付けて投げる）。
 * 意図的キャンセルと API エラーを区別するために使う。
 */
export function isAbortError(e: unknown): boolean {
	return (e instanceof DOMException || e instanceof Error) && e.name === 'AbortError';
}

/**
 * サーキットブレーカーが open のため、実際のリクエストを送らずに失敗したことを表すエラー。
 *
 * message は UI がそのまま出せる短文にする。API の URL はトークン相当値を含むため
 * 決して含めない — 識別子は施設×データソースのキーのみ。
 */
export class CircuitOpenError extends Error {
	override readonly name = 'CircuitOpenError';
	/** 施設×データソース単位の回路キー（例: 'kyoritsu'）。 */
	readonly circuitKey: string;
	/** 回路が close 可能になるまでの残り時間（ms）。 */
	readonly retryAfterMs: number;

	constructor(circuitKey: string, retryAfterMs: number) {
		super(`接続を一時停止中です（約${Math.ceil(retryAfterMs / 1000)}秒後に再試行します）`);
		this.circuitKey = circuitKey;
		this.retryAfterMs = retryAfterMs;
	}
}

/**
 * 回路の状態。close（正常）はエントリ自体を持たないことで表す。
 * openUntil が過去なら half-open（次の1回だけ通し、失敗したら即 open へ戻る）。
 */
interface CircuitState {
	failures: number;
	openUntil: number;
}

const circuits = new Map<string, CircuitState>();

/**
 * KPI 取得用の ky インスタンスを作る唯一の入口。KPI_HTTP_POLICY を土台に、
 * 呼び出し側の options を浅く上書きする（timeout/retry を明示的に渡さない限り既定が効く）。
 */
export function createKpiClient(options?: Options): KyInstance {
	return ky.create({ ...KPI_HTTP_POLICY, ...options });
}

/**
 * run をサーキットブレーカー配下で実行する。回路が open の間は run を呼ばず即座に
 * CircuitOpenError を投げる。
 *
 * circuitKey は施設×データソース単位（datasource の id）で渡す。共立の GAS が落ちても
 * リハ側の回路は独立して生きる。
 *
 * AbortError（意図的キャンセル）は失敗に数えない。数えると、素早い操作を繰り返しただけで
 * 回路が open になってしまう。
 */
export async function withCircuitBreaker<T>(circuitKey: string, run: () => Promise<T>): Promise<T> {
	const now = Date.now();
	const state = circuits.get(circuitKey);

	if (state && state.openUntil > now) {
		throw new CircuitOpenError(circuitKey, state.openUntil - now);
	}

	try {
		const result = await run();
		circuits.delete(circuitKey);
		return result;
	} catch (e) {
		if (isAbortError(e)) throw e;

		const failures = (state?.failures ?? 0) + 1;
		// half-open（failures が既に閾値以上）での失敗もこの条件に入るため、即座に open へ戻る。
		const shouldOpen = failures >= CIRCUIT_BREAKER_POLICY.failureThreshold;
		circuits.set(circuitKey, {
			failures,
			openUntil: shouldOpen ? now + CIRCUIT_BREAKER_POLICY.openDurationMs : 0,
		});
		throw e;
	}
}
