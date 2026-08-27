#!/usr/bin/env node
/**
 * ソース中の絶対パス直書き（href="/..." / src="/...”）を検出して失敗させる。
 *
 * base 付きで配信するため、ルートからの絶対パスは公開先に存在しない。
 * リンクは必ず `src/lib/base-url.ts` の withBase() を経由して組み立てる。
 *
 * CI 専用にはせず build スクリプトに繋いである。手元でも同じ検査が働くようにするため。
 * 依存は Node 標準のみ。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGET_DIR = join(ROOT, 'src');
const EXTENSION = '.astro';
const PATTERN = /(?:href|src)="\//;

/** @param {string} dir @returns {string[]} */
function collect(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return collect(path);
		return entry.isFile() && entry.name.endsWith(EXTENSION) ? [path] : [];
	});
}

const violations = collect(TARGET_DIR).flatMap((path) =>
	readFileSync(path, 'utf8')
		.split('\n')
		.flatMap((line, index) =>
			PATTERN.test(line) ? [`${relative(ROOT, path)}:${index + 1}: ${line.trim()}`] : [],
		),
);

if (violations.length > 0) {
	console.error('絶対パスの直書きを検出しました。withBase() を経由してください。\n');
	for (const violation of violations) console.error(`  ${violation}`);
	console.error('\n  例: <link rel="icon" href={withBase(\'favicon.svg\')} />');
	process.exit(1);
}

console.log(`絶対パスの直書きなし (${EXTENSION} を検査)`);
