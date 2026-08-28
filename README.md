# important-kpi-app-v3

4施設の重要KPIを1画面で見る、院内掲示用のダッシュボード。

## 何のアプリか

トップページは2x2のタイルで4施設を並べる。施設ページ（`kyoritsu` / `reha`）はKPI盤を2列（主指標＋指標一覧）で表示し、モバイル幅ではタブ切替で片方ずつ表示する。ページはトップ＋施設4つ（`kyoritsu` / `reha` / `ayame` / `meijimachi`）の計5つ。`ayame` / `meijimachi` はまだデータ連携前のため `FacilityKpiPreparationBoard`（準備中表示）を使っている。

## データの出どころ

施設ごとにGoogle Apps Script（GAS）のWebアプリから取得する。共立は1日1行にKPIが列として並ぶ横持ち形式、リハは1KPI1行の縦持ち形式で、形式が異なる。データソースの定義（フィールド名・KPI一覧・取得先URLなど）は `src/lib/datasources/` に集約している。取得先のexec URLは認証の無い医療データ取得口のため、ここには転記しない。実際のURLは各データソースファイルを参照すること。

## ローカルでの動かし方

```sh
pnpm install
pnpm dev
```

dev サーバはバックグラウンドで動かす運用にしている。起動・停止・ログの見方は `AGENTS.md` の Development 節を参照。

## 公開の仕組み

GitHub Pages はリポジトリ名を含むサブパスで配信されるため、`astro.config.mjs` で `site` と `base: '/important-kpi-app-v3'` の両方を指定している。この構成では静的アセットへのリンクを `/favicon.svg` のように絶対パスで直書きすると公開先で壊れるため、必ず `src/lib/base-url.ts` の `withBase()` を経由して組み立てる。`pnpm build` はこの直書きが無いことを機械的に検査してからビルドする。

## ブランチ運用

`main` / `develop` / `feature/*` などの運用ルールは `AGENTS.md` の Branch Rules を参照。ここには二重管理しない。
