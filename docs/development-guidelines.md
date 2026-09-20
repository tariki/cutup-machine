# 開発ガイドライン (Development Guidelines)

## コーディング規約

### 命名規則

**変数・関数(TypeScript)**:
```typescript
// ✅ 良い例
const sourceTexts = readSourceTexts();
function buildMarkovChain(tokenLists: string[][], chainLength: number): MarkovChain { }

// ❌ 悪い例
const data = read();
function build(arr: any[], n: number) { }
```

**原則**:
- 変数: camelCase、名詞または名詞句(例: `sourceTexts`, `chainLength`)
- 関数: camelCase、動詞で始める(例: `tokenize`, `buildChain`, `validateRequest`)
- 定数: UPPER_SNAKE_CASE(例: `MAX_TEXT_LENGTH`, `DEFAULT_CHAIN_LENGTH`)
- Boolean: `is`, `has`, `should`で始める(例: `isValid`, `hasReachedLimit`)

**クラス・インターフェース・型エイリアス**:
```typescript
// クラス: PascalCase、名詞
class MarkovChainBuilder { }
class RequestValidator { }

// インターフェース: PascalCase(I接頭辞は付けない)
interface GenerationRequest {
  texts: string[];
  maxWords?: number;
  chainLength?: number;
}

// 型エイリアス: PascalCase
type MarkovChain = Map<string, string[]>;
type ValidationResult = { valid: true } | { valid: false; message: string };
```

**ファイル名**(`docs/repository-structure.md`のファイル配置規則に準拠):
- クラスファイル: PascalCase(例: `MarkovChainBuilder.ts`)
- 関数・設定ファイル: camelCase(例: `rateLimiter.ts`, `limits.ts`)

### コードフォーマット

既存の`.prettierrc`設定に従う(新規ルールは追加しない):

| 項目 | 設定値 |
|------|--------|
| セミコロン | あり |
| クォート | シングルクォート |
| 末尾カンマ | ES5準拠 |
| 行の最大幅 | 80文字 |
| インデント | スペース2つ |
| アロー関数の括弧 | 常に付ける |

フォーマットは`npm run format`(Prettier)で自動化し、手動での整形は行わない。

### コメント規約

**関数・クラスのTSDoc**:
```typescript
/**
 * 複数テキストのトークン列からマーコフ連鎖を構築する
 *
 * @param tokenLists - テキストごとのトークン配列
 * @param chainLength - 連鎖の長さ(直前何単語を考慮するか)
 * @returns 状態キーから次単語候補への連鎖マップ
 */
function buildChain(tokenLists: string[][], chainLength: number): MarkovChain {
  // 実装
}
```

**インラインコメント**:
```typescript
// ✅ 良い例: なぜそうするかを説明
// kuromojiの辞書読み込みは数秒かかるため、サーバー起動時に一度だけ行う
const tokenizer = await Tokenizer.initialize();

// ❌ 悪い例: コードを見れば分かることの説明
// テキストをトークンに分割する
const tokens = tokenizer.tokenize(text);
```

### エラーハンドリング

**原則**:
- 予期されるエラー(入力バリデーション失敗、レート制限超過)は専用のエラークラスを定義し、APIレイヤーで適切なHTTPステータスに変換する
- 予期しないエラー(形態素解析・連鎖生成中の内部エラー)は上位に伝播させ、500として返す。詳細はログにのみ出力し、レスポンスには含めない
- エラーを握りつぶさない(catchしてもみ消さない)

**例**:
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class RateLimitError extends Error {
  constructor() {
    super('リクエストが多すぎます');
    this.name = 'RateLimitError';
  }
}

// APIレイヤーでのハンドリング例
try {
  const result = await handleGenerate(request);
  return c.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return c.json({ error: 'validation_error', message: error.message }, 400);
  }
  if (error instanceof RateLimitError) {
    return c.json({ error: 'rate_limited', message: error.message }, 429);
  }
  logger.error({ event: 'generate_failed', errorType: 'internal_error' }, '予期しないエラー');
  return c.json({ error: 'internal_error', message: '生成中にエラーが発生しました' }, 500);
}
```

### ロギング規約

`docs/architecture.md`のデータ永続化戦略で定義した運用メトリクス(リクエスト数・成否・エラー種別ごとの内訳・処理時間分布・セッションID単位のリクエスト回数)をPRDのKPI測定に使えるようにするため、`console.log`/`console.error`ではなく構造化ログ(JSON)で出力する。

**原則**:
- ログはオブジェクトとして渡し、キーを固定する(自由記述の文字列連結にしない)
- 必須フィールド: `event`(処理の種類、例: `generate_succeeded`/`generate_failed`/`rate_limited`)、`sessionId`(該当する場合)、`durationMs`(処理時間)、エラー時は`errorType`
- 元テキストや生成結果の内容、利用者を特定できる情報(IPアドレス等)はログに含めない(`docs/architecture.md`のセキュリティアーキテクチャに準拠)
- ログレベル: 予期されるエラー(バリデーション・レート制限)は`warn`、予期しない内部エラーは`error`、正常な生成完了は`info`

**例**:
```typescript
// ✅ 良い例: 構造化ログ、集計可能
logger.info({ event: 'generate_succeeded', sessionId, durationMs, wordCount }, '生成完了');
logger.error({ event: 'generate_failed', errorType: 'internal_error', sessionId, durationMs }, '予期しないエラー');

// ❌ 悪い例: 自由記述の文字列、集計不能
console.error('生成中にエラーが発生しました: ' + error.message);
```

ロギングライブラリの選定(例: `pino`)は実装着手時に決定し、本節を更新する。MVPでは`console.log`/`console.error`の代わりに上記の形をとる薄いラッパー関数から始めてもよい。

## Git運用ルール

### ブランチ戦略

シンプルな構成のプロジェクトのため、`develop`は設けず`main`ベースのフローとする:

```
main (常にデプロイ可能な状態)
├── feature/[機能名]   # 新機能開発
├── fix/[修正内容]     # バグ修正
└── refactor/[対象]    # リファクタリング
```

- `main`への直接コミットは禁止し、PRレビューを必須とする
- `feature/*`・`fix/*`は`main`から分岐し、作業完了後にPRで`main`へマージする(squash merge推奨)

### コミットメッセージ規約(Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore`

**例**:
```
feat(markov): 複数テキストからのマーコフ連鎖構築に対応

MarkovChainBuilderが複数テキストのトークン列を1つの連鎖に統合できるようにした。
- テキストごとに終端記号でパディングし、境界を明示
- addTokens()で逐次追加できるインターフェースに変更

Closes #12
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] `npm run lint`が通る
- [ ] `npm run typecheck`が通る
- [ ] `npm run test`が通る
- [ ] `npm run build`が通る

**PRテンプレート**:
```markdown
## 変更内容
[何を変更したか]

## 変更理由
[なぜこの変更が必要か]

## テスト
- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] 手動確認実施

## 関連Issue
Closes #[番号]
```

**レビュー時の優先度表記**:
- `[必須]`: 修正必須 / `[推奨]`: 修正推奨 / `[提案]`: 検討してほしい / `[質問]`: 理解のための質問

## テスト戦略

`docs/functional-design.md`・`docs/architecture.md`で定義したテスト対象に対し、以下の方針で実施する。

### カバレッジ目標

`docs/architecture.md`のテスト戦略に準拠し、全体で80%を目標とする(`@vitest/coverage-v8`で計測)。

### テストの書き方(Given-When-Then)

```typescript
describe('MarkovChainBuilder', () => {
  describe('build', () => {
    it('2つのテキストのトークン列から連鎖を構築できる', () => {
      // Given: 準備
      const builder = new MarkovChainBuilder(2);

      // When: 実行
      builder.addTokens(['吾輩', 'は', '猫', 'で', 'ある']);
      builder.addTokens(['名前', 'は', 'まだ', 'ない']);
      const chain = builder.build();

      // Then: 検証
      expect(chain.size).toBeGreaterThan(0);
    });
  });
});

describe('RequestValidator', () => {
  it('textsが0件の場合ValidationErrorをスローする', () => {
    const validator = new RequestValidator();

    expect(() => validator.validate({ texts: [] })).toThrow(ValidationError);
  });
});
```

### モックの使用

- `Tokenizer`は辞書読み込みが重いため、`MarkovChainBuilder`/`RequestValidator`単体のテストではモック化せず、実際のトークン配列(固定値)を直接渡してテストする(ドメインレイヤーはHTTP等の外部依存を持たない設計のため、モックが必要になる箇所は少ない想定)
- `Tokenizer`自体のテストでは、テストケースごとに`Tokenizer.initialize()`を呼び直さず、`describe`ブロックの`beforeAll`で一度だけ初期化してテスト間で使い回し、テストスイート全体の実行時間を抑える
- APIレイヤーの統合テストでは、Honoのテストユーティリティ(`app.request()`)を使い、実際のドメインロジックを通す

## コードレビュー基準

**運用ルール**:
- マージには最低1名の承認を必須とする(セルフマージ禁止)
- レビュアーが不在で承認を得られない場合は、レビューが可能になるまでマージを待つ。プロジェクト規模上レビュアーが1名しかいない期間が生じる場合は、セルフレビュー(「作成前のチェック」のセルフレビュー実施)の記録をPRに残した上でマージしてよいと合意できたときのみ例外とする

**レビューポイント**:
- 機能性: PRDの受け入れ条件を満たしているか、エッジケース(空入力、上限値ちょうど)が考慮されているか
- 可読性: 命名が明確か、複雑なロジック(連鎖構築・生成)に説明があるか
- 保守性: レイヤー間の依存ルール(`docs/repository-structure.md`)に違反していないか
- セキュリティ: 入力検証・レート制限が適切か、機密情報のハードコードがないか

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24系 | 各自の環境に応じてインストール(nvm推奨) |
| npm | 11.x | Node.jsに同梱 |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd cutup-machine

# 2. 依存関係のインストール
npm install

# 3. 開発サーバーの起動(実装後)
npm run dev
```

**環境変数**: 現時点では設定不要(`.env`ファイルは不要)。将来的にレート制限用の外部ストア(Redis等)を導入する際、接続情報を環境変数として追加する予定(`docs/architecture.md`の機密情報管理を参照)。

### 品質チェックの自動化

既存の`package.json`スクリプトを使用する:

| コマンド | 内容 |
|---------|------|
| `npm run lint` | ESLintによる静的解析 |
| `npm run format` | Prettierによる自動フォーマット |
| `npm run typecheck` | `tsc --noEmit`による型チェック |
| `npm run test` | Vitestによるテスト実行 |
| `npm run test:coverage` | カバレッジ計測 |
| `npm run build` | `tsc`によるビルド |

**ESLint設定とフロントエンド(`public/`)対応**: 現在の`eslint.config.js`はTypeScript(`src/`配下)向けの設定のみで、ブラウザ環境のグローバル変数(`document`/`fetch`等)が未定義のため`no-undef`エラーとなる。`repository-structure.md`が定義する`public/main.js`(素のJavaScriptフロントエンド)を実装する際は、`globals`パッケージ等を使い`public/**/*.js`に`languageOptions.globals.browser`を設定するオーバーライドを`eslint.config.js`に追加してから着手する(追加しないまま実装すると`npm run lint`がPR必須チェックとして通らなくなる)。

**Pre-commitフック**: Husky + lint-staged が導入済み(`package.json`の`lint-staged`設定)。コミット時にステージされたファイルへ自動でESLint/Prettierが適用される。`.husky/pre-commit`はまだ作成されていないため、実装着手時に以下を追加する:

```bash
# .husky/pre-commit
npx lint-staged
npm run typecheck
```

**CI/CD**: 現時点で`.github/workflows/`は未作成。実装着手時に以下の内容でCIを追加することを推奨する:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```
