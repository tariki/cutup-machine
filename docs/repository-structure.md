# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
cutup-machine/
├── src/                        # サーバーサイドのTypeScriptソースコード
│   ├── api/                    # APIレイヤー(Hono)
│   │   ├── app.ts
│   │   ├── routes/
│   │   └── middleware/
│   ├── domain/                 # ドメインレイヤー(ビジネスロジック、HTTP非依存)
│   │   ├── tokenizer/
│   │   ├── markov/
│   │   └── validation/
│   ├── config/                 # 定数・設定値
│   ├── types/                  # 型定義
│   └── index.ts                # エントリーポイント(サーバー起動)
├── public/                     # 静的フロントエンド(ビルド不要な素のHTML/CSS/JS)
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── tests/                      # テストコード
│   ├── unit/                   # ユニットテスト
│   ├── integration/            # 統合テスト
│   └── e2e/                    # E2Eテスト(現時点では未使用)
├── docs/                       # プロジェクトドキュメント
│   └── ideas/                  # 壁打ち・技術調査メモ
│       └── reference/          # 参考実装(main.rb, markov.rb)
├── .steering/                  # 作業単位のステアリングファイル
└── .claude/                    # Claude Code設定
```

テンプレートでは`config/`(環境設定用)・`scripts/`(ビルド・デプロイ用)をリポジトリルート直下に置くが、本プロジェクトでは`config/`はリクエストパラメータの上限値などアプリケーション内定数を一元管理する狭い用途のため、ルート直下ではなく実装レイヤーの一部として`src/config/`に配置する。`scripts/`はビルド・デプロイ用の独自スクリプトを持たない(`package.json`の`scripts`で完結する)ため作成しない。

## ディレクトリ詳細

### src/api/ (APIレイヤー)

**役割**: HTTPリクエストの受付、ルーティング、レート制限・バリデーションミドルウェアの適用。アーキテクチャ設計書のAPIレイヤーに対応

**配置ファイル**:
- `app.ts`: Honoアプリケーションの組み立て(ルート・ミドルウェアの登録)
- `routes/generate.ts`: `POST /api/generate`のハンドラ
- `routes/docs.ts`: `GET /api/docs`のハンドラ(API仕様のドキュメント公開。`docs/functional-design.md`のAPIドキュメントを参照)
- `middleware/rateLimiter.ts`: 送信元IP単位のレート制限
- `middleware/requestSizeLimit.ts`: リクエストボディサイズの上限チェック

**命名規則**:
- ルートファイル: 対応するリソース名(camelCase) + `.ts`(例: `generate.ts`)
- ミドルウェアファイル: 役割を表すcamelCase名 + `.ts`

**依存関係**:
- 依存可能: `domain/`, `types/`, `config/`
- 依存禁止: `public/`(フロントエンドの実装詳細に依存しない)

**例**:
```
api/
├── app.ts
├── routes/
│   └── generate.ts
└── middleware/
    ├── rateLimiter.ts
    └── requestSizeLimit.ts
```

### src/domain/ (ドメインレイヤー)

**役割**: 形態素解析・マーコフ連鎖の構築と生成・入力バリデーションといったビジネスロジック。HonoやHTTPに依存せず、単体でテスト可能な形で実装する

**配置ファイル**:
- `tokenizer/Tokenizer.ts`: kuromojiを用いた形態素解析ラッパー
- `markov/MarkovChainBuilder.ts`: マーコフ連鎖の構築
- `markov/MarkovGenerator.ts`: マーコフ連鎖からの文章生成
- `validation/RequestValidator.ts`: リクエスト内容のバリデーション

**命名規則**:
- クラスファイル: PascalCase(例: `MarkovChainBuilder.ts`)
- 1機能1ディレクトリ(`tokenizer/`, `markov/`, `validation/`)にまとめる

**依存関係**:
- 依存可能: `types/`, `config/`, 外部ライブラリ(kuromoji)
- 依存禁止: `api/`(HonoのRequest/Response等、HTTPプロトコルへの依存を持ち込まない)、`public/`

### src/config/ (定数・設定値)

**役割**: 元テキストの文字数上限、`maxWords`/`chainLength`の許容範囲など、複数レイヤーから参照される定数を一元管理する

**配置ファイル**:
- `limits.ts`: 文字数上限・パラメータ範囲などの定数

**命名規則**:
- 定数ファイル: camelCase(例: `limits.ts`)、エクスポートする定数名はUPPER_SNAKE_CASE

**依存関係**:
- 依存可能: なし
- 依存禁止: `api/`, `domain/`(設定値は末端の定義であり、上位レイヤーに依存しない)

### src/types/ (型定義)

**役割**: `GenerationRequest`/`GenerationResult`/`GenerationError`など、レイヤー間で共有する型定義

**配置ファイル**:
- `generation.ts`: 生成リクエスト・レスポンス関連の型

**依存関係**:
- 依存可能: なし
- 依存禁止: `api/`, `domain/`

### src/index.ts (エントリーポイント)

**役割**: サーバー起動シーケンスの実行。以下の順序で処理する:
1. `Tokenizer.initialize()`を呼び出し、kuromoji辞書の読み込みを完了させる(`docs/functional-design.md`のパフォーマンス最適化を参照。辞書読み込みはリクエストごとに行わない)
2. `RateLimiter`等のミドルウェアと`app.ts`で組み立てたHonoアプリケーションを結び付ける
3. Honoアプリケーションのlistenを開始する

**依存関係**:
- 依存可能: `api/`, `domain/`(`Tokenizer`の初期化呼び出しのため)
- 依存禁止: `public/`

### public/ (静的フロントエンド)

**役割**: テキスト入力・ファイルアップロード・生成結果表示を行うWeb UI。ビルドツールを増やさないため、TypeScriptではなく素のJavaScriptで実装する(バックエンドのみTypeScriptとする判断。フロントエンドをTypeScript化する場合はバンドラの追加検討が必要になるため、MVPでは見送る)

**配置ファイル**:
- `index.html`: 入力フォームと結果表示エリア
- `main.js`: `/api/generate`の呼び出しとDOM操作
- `styles.css`: スタイル

**依存関係**:
- 依存可能: `api/`の公開エンドポイント(HTTP経由のみ)
- 依存禁止: `src/`配下のモジュールを直接importすること(ブラウザとNode.jsのモジュール解決が異なるため)

### tests/ (テストディレクトリ)

#### unit/

**役割**: `src/domain/`配下のロジックを中心にユニットテストを配置

**構造**:
```
tests/unit/
└── domain/
    ├── tokenizer/Tokenizer.test.ts
    ├── markov/MarkovChainBuilder.test.ts
    ├── markov/MarkovGenerator.test.ts
    └── validation/RequestValidator.test.ts
```

#### integration/

**役割**: APIエンドポイント単位の統合テストを配置

**構造**:
```
tests/integration/
└── api/
    └── generate.test.ts
```

#### e2e/

**役割**: ブラウザ操作を伴うシナリオテスト。アーキテクチャ設計書の方針により、MVPでは未導入(手動確認で代替)のためディレクトリのみ用意し空の状態とする

### docs/ (ドキュメントディレクトリ)

**配置ドキュメント**:
- `ideas/`: 壁打ち・技術調査メモ
- `ideas/reference/`: 参考実装(`main.rb`/`markov.rb`)
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書(本ドキュメント)
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| APIルート | `src/api/routes/` | リソース名.ts | `generate.ts` |
| ミドルウェア | `src/api/middleware/` | 役割名.ts(camelCase) | `rateLimiter.ts` |
| ドメインロジック(クラス) | `src/domain/<機能>/` | PascalCase.ts | `MarkovChainBuilder.ts` |
| 型定義 | `src/types/` | 対象名.ts(camelCase) | `generation.ts` |
| 定数 | `src/config/` | 対象名.ts(camelCase) | `limits.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | `tests/unit/` | src配下と同じ構造 + `[対象].test.ts` | `tests/unit/domain/markov/MarkovGenerator.test.ts` |
| 統合テスト | `tests/integration/` | `[機能].test.ts` | `tests/integration/api/generate.test.ts` |
| E2Eテスト | `tests/e2e/` | `[シナリオ].test.ts`(MVPでは未使用) | - |

## 命名規則

### ディレクトリ名
- トップレベルレイヤー: ドメイン名・役割名を表す単数形、camelCase(例: `api/`, `domain/`, `config/`, `types/`)
- レイヤー内のサブディレクトリ: 役割が複数ファイルにまたがる場合は複数形、camelCase(例: `routes/`, `middleware/`)。1機能を1ディレクトリにまとめる場合は単数形(例: `tokenizer/`, `markov/`, `validation/`)

### ファイル名
- クラスファイル: PascalCase(例: `MarkovChainBuilder.ts`, `RequestValidator.ts`)
- 関数・設定ファイル: camelCase(例: `rateLimiter.ts`, `limits.ts`)
- テストファイル: `[テスト対象].test.ts`

## 依存関係のルール

### レイヤー間の依存

```
api/ (APIレイヤー) ───────┬──→ domain/ (ドメインレイヤー) ──┬──→ types/
                          └───────────────────────────────┴──→ config/
```

`api/`は`domain/`を経由せず`types/`・`config/`に直接依存してもよい(例: `types/generation.ts`の型をAPIハンドラの引数・戻り値に使う)。

**禁止される依存**:
- `domain/` → `api/` (❌ HTTPプロトコルへの依存を持ち込まない)
- `types/`, `config/` → `api/`, `domain/` (❌ 末端の定義が上位レイヤーに依存しない)
- `public/` → `src/`配下の直接import (❌ ブラウザ/Node.jsのモジュール解決が異なるため、HTTP経由でのみ連携する)

### モジュール間の依存

`domain/tokenizer/`・`domain/markov/`・`domain/validation/`は互いに独立して実装し、循環依存が生じないようにする(`MarkovChainBuilder`/`MarkovGenerator`は`Tokenizer`が生成したトークン配列のみを受け取り、`Tokenizer`に依存しない)。

### 依存方向の検証

上記の依存関係ルールは`eslint-plugin-import`の`no-restricted-imports`(または`dependency-cruiser`)によりESLintのルールとして機械的に検証し、`npm run lint`(既存のPre-commitフック・CIで実行される)で違反を検知できるようにする。導入時は`docs/development-guidelines.md`のツール構成に追記する。

## スケーリング戦略

### 機能の追加

- **小規模機能**(例: 生成パラメータの追加): 既存ファイルに追記
- **中規模機能**(例: 多言語対応でTokenizer実装を追加): `domain/tokenizer/`にロケール別の実装を追加し、共通インターフェースで切り替える
- **大規模機能**(例: 生成履歴の保存機能を将来追加する場合): PRDのスコープ外だが、追加する場合は`domain/history/`と永続化用の新しいレイヤー(`src/storage/`)を新設する

### ファイルサイズの管理

- 1ファイル300行以下を推奨。特に`MarkovChainBuilder`/`MarkovGenerator`はロジックが複雑になりやすいため、300行を超える場合は責務ごとに分割を検討する

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md
    ├── design.md
    └── tasklist.md
```

### .claude/ (Claude Code設定)

**役割**: Claude Code設定とカスタマイズ

**構造**(既存):
```
.claude/
├── commands/
├── skills/
└── agents/
```

## 除外設定

既存の設定ファイルをそのまま踏襲する(新規追加なし)。

### .gitignore(既存)
`node_modules/`, `dist/`, `build/`, `.env*`, `logs/`, `coverage/`, `.steering/*`(`.gitkeep`を除く)など

### .prettierignore(既存)
`.claude/`, `.steering/`, `docs/`, `node_modules/`, `dist/`
