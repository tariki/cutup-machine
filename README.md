# カットアップメーカー (Cutup Machine)

複数の文章からカットアップ技法(マーコフ連鎖による単語単位の再構成)で新しい文章を生成するWebアプリです。詳細は `docs/` 配下のドキュメントを参照してください。

- `docs/product-requirements.md` - プロダクト要求定義書
- `docs/functional-design.md` - 機能設計書
- `docs/architecture.md` - アーキテクチャ設計書
- `docs/repository-structure.md` - リポジトリ構造定義書
- `docs/development-guidelines.md` - 開発ガイドライン
- `docs/glossary.md` - 用語集
- `CHANGELOG.md` - 変更履歴

## セットアップ

```bash
npm install
npm run dev
```

サーバー起動後、ブラウザで `http://localhost:3000` を開くとWeb UIが使えます。

## スタンドアロン実行ファイル(Linux)

Node.js/npmのインストールなしに試せる単一の実行ファイルとしてビルドすることもできます(対応OS: Linux、glibc系のx86_64・aarch64のみ)。

```bash
# 1. 単一のCJSバンドルを生成する
npm run build:sea:bundle

# 2. SEA用のblobを生成する(kuromoji辞書を埋め込む)
npm run build:sea:config

# 3. Nodeバイナリをコピーしてblobを注入する
cp $(command -v node) cutup-machine
npx postject cutup-machine NODE_SEA_BLOB dist-sea/sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# 4. 実行権限を付与して起動する
chmod +x cutup-machine
./cutup-machine
```

起動するとローカルでサーバーが立ち上がり、既定のブラウザが自動的に開きます(`xdg-open`が無い環境では、開くべきURLがコンソールに表示されます)。ポート3000が使用中の場合は自動的に別の空きポートが選ばれます。別アーキテクチャ向けのビルドなど詳細は `docs/development-guidelines.md` の「ローカル実行ファイル化(SEA)のビルド」を参照してください。

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
