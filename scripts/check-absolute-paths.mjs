#!/usr/bin/env node
/**
 * ソース中の絶対パス直書き（href="/..." / src="/..." および href={'/...'} 等の式記法）を検出して失敗させる。
 *
 * base 付きで配信するため、ルートからの絶対パスは公開先に存在しない。
 * リンクは必ず `src/lib/base-url.ts` の withBase() を経由して組み立てる。
 * プロトコル相対（href="//example.com" 等）は外部URLなので対象外とする。
 *
 * 対象は .astro / .css。href・src 属性と CSS の url() のみを見る
 * （content= 等は現状 meta viewport と Astro.generator の2件だけで、当たらない条件を増やすだけなので対象外）。
 *
 * CI 専用にはせず build スクリプトに繋いである。手元でも同じ検査が働くようにするため。
 * 依存は Node 標準のみ。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_DIR = join(ROOT, 'src');
const EXTENSIONS = ['.astro', '.css'];

// 属性の出現位置を拾う（引用符の種類・式記法は問わない）
const ATTR = /(?:href|src)\s*=\s*/g;
// 属性値の直後に現れうる開き記号。ここを読み飛ばした先の文字を見る
const OPENING_SYMBOLS = new Set(['{', '"', "'", '`']);
// CSS の url(/... も同じ考え方で見る（引用符ありなし両方）
const CSS_URL = /url\(\s*["'`]?\//;

/** @param {string} dir @returns {string[]} */
function collect(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return collect(path);
		return entry.isFile() && EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
	});
}

/**
 * href / src 属性の値が絶対パス直書きになっていないかを見る。
 * 「属性の出現位置を拾う → 直後の開き記号（{, ", ', `）を読み飛ばした先の文字を見る」の2段で判定する。
 * プロトコル相対（先頭が // ）は除外する。
 * @param {string} line
 * @returns {boolean}
 */
function hasAbsoluteAttr(line) {
	ATTR.lastIndex = 0;
	let match;
	while ((match = ATTR.exec(line))) {
		let index = match.index + match[0].length;
		while (index < line.length && OPENING_SYMBOLS.has(line[index])) index++;
		if (line[index] === '/' && line[index + 1] !== '/') return true;
	}
	return false;
}

/** @param {string} line @returns {boolean} */
function hasAbsoluteCssUrl(line) {
	const match = CSS_URL.exec(line);
	if (!match) return false;
	return line[match.index + match[0].length] !== '/';
}

const violations = collect(TARGET_DIR).flatMap((path) =>
	readFileSync(path, 'utf8')
		.split('\n')
		.flatMap((line, index) =>
			hasAbsoluteAttr(line) || hasAbsoluteCssUrl(line)
				? [`${relative(ROOT, path)}:${index + 1}: ${line.trim()}`]
				: [],
		),
);

if (violations.length > 0) {
	console.error('絶対パスの直書きを検出しました。withBase() を経由してください。\n');
	for (const violation of violations) console.error(`  ${violation}`);
	console.error('\n  例: <link rel="icon" href={withBase(\'favicon.svg\')} />');
	process.exit(1);
}

console.log(`絶対パスの直書きなし (${EXTENSIONS.join(', ')} を検査)`);
