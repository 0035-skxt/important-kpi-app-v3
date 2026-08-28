#!/usr/bin/env node
/**
 * KPI カタログ（src/lib/kpi-catalog.ts）の形をビルド時に検査する。
 *
 * 板の表示定義とデータ取得定義は kpi-catalog.ts からの導出になったため、
 * 「2箇所の id が一致するか」という旧 check-kpi-ids.mjs の検査は不要になった。
 * 代わりに単一の出所そのものが壊れていないかを見る:
 * 施設別の必須項目・余剰キー・空カタログ・id 重複・施設プレフィックス。
 *
 * 正規表現ではなく実 import で読む。kpi-catalog.ts が何も import しない設計なので、
 * Node の型ストリップだけで解決できる（拡張子なし相対 import があると
 * ERR_MODULE_NOT_FOUND になる。旧スクリプトが正規表現に頼っていた理由がこれ）。
 * export 名を変えたり消したりすれば link 時に落ちるため、「抽出0件で偽の合格」も起きない。
 *
 * engines は node>=22.12 で型ストリップが既定 ON なのは 22.18 以降のため、
 * package.json 側で --experimental-strip-types を明示して起動する。
 */
import { z } from 'zod';

import { kyoritsuKpiCatalog, rehaKpiCatalog } from '../src/lib/kpi-catalog.ts';

const chartSchema = z.strictObject({ ariaLabel: z.string().min(1) });

const baseShape = {
	id: z.string().min(1),
	label: z.string().min(1),
	isPrimary: z.boolean().optional(),
	chart: chartSchema.optional(),
};

const kyoritsuEntrySchema = z.strictObject({ ...baseShape, field: z.string().min(1) });
const rehaEntrySchema = z.strictObject({
	...baseShape,
	path: z.string().min(1),
	matchLabel: z.string().min(1),
});

const CATALOGS = [
	{ name: 'kyoritsu', entries: kyoritsuKpiCatalog, schema: kyoritsuEntrySchema },
	{ name: 'reha', entries: rehaKpiCatalog, schema: rehaEntrySchema },
];

/** @type {string[]} */
const problems = [];
/** @type {Set<string>} 施設をまたいで一意であることを見る（DOM の id として使うため） */
const seenIds = new Set();

for (const { name, entries, schema } of CATALOGS) {
	const result = z.array(schema).min(1).safeParse(entries);

	if (!result.success) {
		for (const line of z.prettifyError(result.error).split('\n')) {
			problems.push(`[${name}] ${line}`);
		}
		continue;
	}

	for (const entry of result.data) {
		if (!entry.id.startsWith(`${name}-`)) {
			problems.push(`[${name}] id が施設プレフィックス '${name}-' で始まっていません: ${entry.id}`);
		}
		if (seenIds.has(entry.id)) {
			problems.push(`[${name}] id が重複しています: ${entry.id}`);
		}
		seenIds.add(entry.id);
	}
}

if (problems.length > 0) {
	console.error('KPI カタログの不備を検出しました。\n');
	for (const problem of problems) console.error(`  ${problem}`);
	process.exit(1);
}

console.log(`KPI カタログを確認 (kyoritsu ${kyoritsuKpiCatalog.length}件 / reha ${rehaKpiCatalog.length}件)`);
