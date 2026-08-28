// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// GitHub Pages はリポジトリ名を含むサブパスで配信される。
	// site と base の両方を指定しないと、生成されるリンクが公開先と食い違う。
	site: 'https://0035-skxt.github.io',
	base: '/important-kpi-app-v3',
	vite: {
		plugins: [tailwindcss()],
	},
});
