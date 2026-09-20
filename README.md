# カットアップメーカー (Cutup Machine)

複数の文章からカットアップ技法(マーコフ連鎖による単語単位の再構成)で新しい文章を生成するWebアプリです。詳細は `docs/` 配下のドキュメントを参照してください。

- `docs/product-requirements.md` - プロダクト要求定義書
- `docs/functional-design.md` - 機能設計書
- `docs/architecture.md` - アーキテクチャ設計書
- `docs/repository-structure.md` - リポジトリ構造定義書
- `docs/development-guidelines.md` - 開発ガイドライン
- `docs/glossary.md` - 用語集

## セットアップ

```bash
npm install
npm run dev
```

サーバー起動後、ブラウザで `http://localhost:3000` を開くとWeb UIが使えます。

## API

`POST /api/generate` で複数の元テキストから文章を生成できます。仕様は起動中のサーバーで `GET /api/docs` から確認できます。

## 開発コマンド

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバーの起動(ファイル変更を監視) |
| `npm run build` | TypeScriptのビルド |
| `npm start` | ビルド済みのサーバーを起動 |
| `npm run lint` | ESLintによる静的解析 |
| `npm run typecheck` | 型チェック |
| `npm test` | テスト実行 |
| `npm run test:coverage` | カバレッジ計測 |
