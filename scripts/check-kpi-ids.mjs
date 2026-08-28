#!/usr/bin/env node
/**
 * facility-board.ts（board側）と datasources/{kyoritsu,reha}.ts（ds側）の
 * KPI id が一致することを検査する。
 *
 * 表示定義（board）とデータ取得定義（ds）の id は文字列で二重管理されており、
 * 型では紐付いていない。片方だけ直すと画面は落ちずに `--` や `取得中...` が
 * 残ったまま静かに壊れるため、ビルド時に機械検査する。
 *
 * 実行時 import はしない。datasources/kyoritsu.ts は拡張子なしの相対 import
 * （`from './format'`）を使っており、Node の type stripping では解決できず
 * ERR_MODULE_NOT_FOUND になる。加えて engines は node>=22.12 だが、type
 * stripping が既定で有効なのは 22.18 以降で、22.12〜22.17 ではそもそも
 * 起動しない。そのためソースをテキストとして読み、正規表現で id 文字列
 * だけを抽出する。
 *
 * 依存は Node 標準のみ。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

// .pathname だと空白や日本語が未デコードのまま渡り、Windows では先頭に /C:/ が付く
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BOARD_PATH = join(ROOT, 'src/lib/facility-board.ts');

const FACILITIES = [
	{ name: 'kyoritsu', dsPath: join(ROOT, 'src/lib/datasources/kyoritsu.ts') },
	{ name: 'reha', dsPath: join(ROOT, 'src/lib/datasources/reha.ts') },
];

const ID_PATTERN = /\bid:\s*'([^']+)'/g;

/**
 * ファイルから対象施設の KPI id 一覧を抽出する。
 * 施設レベルの id（例: `id: 'kyoritsu'`）はハイフンが続かないため自然に落ちる。
 * チャート id（`-chart` で終わる）は別途除外する。
 * @param {string} path
 * @param {string} prefix
 * @returns {string[]}
 */
function extractIds(path, prefix) {
	const text = readFileSync(path, 'utf8');
	const ids = [...text.matchAll(ID_PATTERN)].map((match) => match[1]);
	return ids.filter((id) => id.startsWith(`${prefix}-`) && !id.endsWith('-chart'));
}

/** @param {string[]} ids @returns {string[]} 重複している id（一意化して返す） */
function findDuplicates(ids) {
	const seen = new Set();
	const duplicates = new Set();
	for (const id of ids) {
		if (seen.has(id)) duplicates.add(id);
		seen.add(id);
	}
	return [...duplicates];
}

const problems = [];

for (const { name, dsPath } of FACILITIES) {
	const boardIds = extractIds(BOARD_PATH, name);
	const dsIds = extractIds(dsPath, name);

	// 偽の合格を塞ぐ: ファイル改名や記法変更で抽出が0件になると、比較対象が
	// 空同士で一致してしまい「差分なし＝合格」で緑になる。0件はそれ自体を
	// 失敗として報告する。
	if (boardIds.length === 0) {
		problems.push(`[${name}] ${relative(ROOT, BOARD_PATH)} から id を抽出できませんでした（0件）`);
	}
	if (dsIds.length === 0) {
		problems.push(`[${name}] ${relative(ROOT, dsPath)} から id を抽出できませんでした（0件）`);
	}

	const boardSet = new Set(boardIds);
	const dsSet = new Set(dsIds);

	const boardOnly = boardIds.filter((id) => !dsSet.has(id));
	const dsOnly = dsIds.filter((id) => !boardSet.has(id));
	const boardDuplicates = findDuplicates(boardIds);
	const dsDuplicates = findDuplicates(dsIds);

	for (const id of boardOnly) problems.push(`[${name}] board にあって ds に無い id: ${id}`);
	for (const id of dsOnly) problems.push(`[${name}] ds にあって board に無い id: ${id}`);
	for (const id of boardDuplicates) problems.push(`[${name}] board 内で id が重複: ${id}`);
	for (const id of dsDuplicates) problems.push(`[${name}] ds 内で id が重複: ${id}`);
}

if (problems.length > 0) {
	console.error('KPI id の不一致を検出しました。\n');
	for (const problem of problems) console.error(`  ${problem}`);
	process.exit(1);
}

console.log('KPI id の一致を確認 (kyoritsu / reha)');
