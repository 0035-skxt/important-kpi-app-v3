/**
 * API 応答の境界スキーマ。
 *
 * **フィールド単位の厳密スキーマは意図的に作らない。** 行の中身（列名）は
 * kpi-catalog.ts と datasources が既に持っており、ここにも書くと三重管理になる。
 * ここで担保するのは「data が配列であること・空でないこと・各行がオブジェクトであること」
 * だけで、それ以上は各 datasource の読み取り（kpi-values.ts）に委ねる。
 */
import { z } from 'zod';

/**
 * 1行ぶんのスキーマ。列名は API（GAS）依存の日本語キー等で不定のため中身は見ない。
 * z.object({}) だと未知キーが削除されて全列が消えるので、必ず looseObject を使う。
 */
export const dataRowSchema = z.looseObject({});

/** 共立API・リハAPIとも payload.data に行配列が入る */
export const dataRowsEnvelopeSchema = z.object({
	data: z.array(dataRowSchema).min(1),
});

export type DataRowsEnvelope = z.infer<typeof dataRowsEnvelopeSchema>;
