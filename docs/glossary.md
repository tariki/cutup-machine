# プロジェクト用語集 (Glossary)

## 概要

このドキュメントは、カットアップメーカー(Cutup Machine)プロジェクト内で使用される用語の定義を管理します。

**更新日**: 2026-08-14

## ドメイン用語

### カットアップ技法 (Cutup Technique)

**定義**: 既存の文章を切り貼り・再構成することで、書き手の意図を離れた偶然性のある新しい文章を生み出す文学的手法

**説明**: 本プロダクトでは、物理的な切り貼りの代わりにマーコフ連鎖による単語単位の再構成でこれを実現する。複数の元テキストを1つのモデルに統合することで、単一テキストのカットアップより意外性のある文章生成を狙う。

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)、[元テキスト](#元テキスト-source-text)

**使用例**:
- 「複数の元テキストをカットアップして新しい文章を生成する」

**英語表記**: Cutup Technique

### マーコフ連鎖 (Markov Chain)

**定義**: 直前の状態(本プロダクトでは直前n単語)から次に起こりうる事象(次の単語)を確率的に決定するモデル

**説明**: `chainLength`個の直前の単語を「状態」とし、元テキスト中でその状態の次に出現した単語を候補として蓄積する。生成時は現在の状態に対応する候補からランダムに1つ選び、状態を更新しながら繰り返すことで文章を生成する。参考実装は`docs/ideas/reference/markov.rb`。

**関連用語**: [連鎖の長さ](#連鎖の長さ-chainlength)、[状態キー](#状態キー-state-key)、[終端記号](#終端記号-nonword)

**使用例**:
- 「複数テキストのトークン列を1つのマーコフ連鎖モデルに統合する」

**実装箇所**: `src/domain/markov/MarkovChainBuilder.ts`, `src/domain/markov/MarkovGenerator.ts`

**英語表記**: Markov Chain

### 元テキスト (Source Text)

**定義**: 利用者がテキストエリアへの貼り付け、または`.txt`ファイルのアップロードによって入力する、生成のもとになる文章

**説明**: 1件から入力可能で、複数件を追加すると1つのマーコフ連鎖モデルに統合して学習される。1件あたり10万字、合計30万字までという上限を持つ(`docs/product-requirements.md`)。

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)

**データモデル**: `src/types/generation.ts`の`GenerationRequest.texts`

**英語表記**: Source Text

### 連鎖の長さ (chainLength)

**定義**: マーコフ連鎖において、次の単語を決定する際に考慮する直前の単語数を表すパラメータ

**説明**: デフォルト値は2。値を大きくすると元テキストに近い(予測しやすい)文章になりやすく、小さくすると元テキストから離れた(ランダム性の高い)文章になりやすい。許容範囲は1〜5(仮の値)。

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)、[生成語数上限](#生成語数上限-maxwords)

**使用例**:
```typescript
const request: GenerationRequest = { texts: ['...'], chainLength: 2 };
```

### 生成語数上限 (maxWords)

**定義**: 1回の生成で出力される文章の最大単語数を指定するパラメータ

**説明**: デフォルト値は1000。参考実装(`docs/ideas/reference/main.rb`)のハードコードされた上限(1000)を踏襲しつつ、リクエストごとに変更可能にした値。許容範囲は1〜5000(仮の値)。

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)

### 状態キー (State Key)

**定義**: マーコフ連鎖において、直前`chainLength`個の単語を連結して作られる、連鎖マップのキー

**説明**: 例えば`chainLength`が2の場合、直前2単語を連結したものが状態キーとなり、その状態キーに対して次に出現しうる単語のリストが対応付けられる。

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)、[終端記号](#終端記号-nonword)

**実装箇所**: `src/domain/markov/MarkovChainBuilder.ts`

### 終端記号 (NONWORD)

**定義**: テキストの先頭・末尾(境界)を表すためにマーコフ連鎖上で使われる特別な記号

**説明**: 各元テキストのトークン列の前後に終端記号を付与することで、複数テキストを1つの連鎖に統合してもテキストの境界を連鎖上で区別できるようにする。具体的には、トークン列の先頭に`chainLength`個、末尾に1個の終端記号を追加してからパディングする(`docs/functional-design.md`の`buildChain`を参照)。生成時に終端記号が選ばれると、その時点で生成を終了する。

**実装上のリテラル値**: `"\n"`(改行文字)。参考実装(`docs/ideas/reference/markov.rb`)の`NONWORD = "\n"`を踏襲する。kuromojiのトークンには生の改行文字は含まれないため、通常の単語と衝突しない

**関連用語**: [マーコフ連鎖](#マーコフ連鎖-markov-chain)、[状態キー](#状態キー-state-key)

### セッション (Session)

**定義**: 利用者のブラウザが1回の訪問中に発行する、KPI集計目的のみに使う一時的な識別子

**説明**: 本プロダクトはサーバー側でデータを永続化しないため、ログイン等の状態を持つ従来的な意味の「セッション」ではない。「同一セッション内での平均生成回数」等のKPI(`docs/product-requirements.md`)を算出するために、ブラウザ滞在中の一連の操作をまとめる計測上の単位としてのみ用いる。内容は集計目的でのみ短期間保持し、永続化しない。

**関連用語**: [運用メトリクス](#運用メトリクス-operational-metrics)

**関連ドキュメント**: [プロダクト要求定義書](./product-requirements.md#測定方法)

## 技術用語

### Hono

**定義**: モダンで軽量なWebフレームワーク。Node.jsに加え、Cloudflare Workers等の複数のランタイムで動作する

**公式サイト**: https://hono.dev/

**本プロジェクトでの用途**: `POST /api/generate`をはじめとするAPIエンドポイントのルーティング、レート制限・入力バリデーションミドルウェアの実装

**バージョン**: ^4.x

**関連コンポーネント**: `ApiServer`、`RateLimiter`(ミドルウェア)

**関連ドキュメント**: [アーキテクチャ設計書](./architecture.md#フレームワークライブラリ)

### kuromoji

**定義**: 純粋JavaScript実装の日本語形態素解析ライブラリ

**公式サイト**: https://github.com/takuyaa/kuromoji.js

**本プロジェクトでの用途**: 元テキストを単語単位に分割する(参考実装`docs/ideas/reference/markov.rb`におけるMeCab/nattoに相当する役割)。ネイティブバイナリのインストールが不要なため採用

**バージョン**: ^0.1.2

**関連コンポーネント**: `Tokenizer`

**関連ドキュメント**: [機能設計書](./functional-design.md#tokenizer)

### zod

**定義**: TypeScript向けのスキーマ宣言・検証ライブラリ

**公式サイト**: https://zod.dev/

**本プロジェクトでの用途**: `POST /api/generate`のリクエストボディのバリデーション

**バージョン**: ^3.x

**関連コンポーネント**: `RequestValidator`、[ValidationError](#validationerror)

### Vitest

**定義**: Viteベースの高速なテストフレームワーク

**公式サイト**: https://vitest.dev/

**本プロジェクトでの用途**: ユニットテスト・統合テストの実行、カバレッジ計測

**バージョン**: ^2.0.0(既存プロジェクトに導入済み)

**関連コンポーネント**: `RequestValidator`、`Tokenizer`、`MarkovChainBuilder`、`MarkovGenerator`(いずれもユニットテスト対象)

**関連ドキュメント**: [開発ガイドライン](./development-guidelines.md#テスト戦略)

## 略語・頭字語

### PRD

**正式名称**: Product Requirements Document(プロダクト要求定義書)

**意味**: プロダクトが解決すべき課題、ターゲットユーザー、機能要件・非機能要件を定義したドキュメント

**本プロジェクトでの使用**: `docs/product-requirements.md`

### KPI

**正式名称**: Key Performance Indicator(重要業績評価指標)

**意味**: プロダクトの成功度合いを測定するための定量的な指標

**本プロジェクトでの使用**: `docs/product-requirements.md`の「成功指標(KPI)」で、生成成功率・処理時間などを定義

### MVP

**正式名称**: Minimum Viable Product(実用最小限の製品)

**意味**: プロダクトとして成立するために必要最小限の機能セット

**本プロジェクトでの使用**: `docs/product-requirements.md`の「コア機能(MVP)」

### API

**正式名称**: Application Programming Interface

**意味**: 異なるソフトウェア同士が連携するためのインターフェース

**本プロジェクトでの使用**: `POST /api/generate`として、Web UIと外部クライアント双方が利用できる公開エンドポイントを指す

## アーキテクチャ用語

### レイヤードアーキテクチャ (Layered Architecture)

**定義**: システムを役割ごとに複数の層に分割し、上位層から下位層への一方向の依存関係を持たせる設計パターン

**本プロジェクトでの適用**:
```
UI/クライアントレイヤー(public/、静的フロントエンド)
    ↓
APIレイヤー(src/api/、Honoルーティング・ミドルウェア)
    ↓
ドメインレイヤー(src/domain/、形態素解析・マーコフ連鎖・バリデーション)
```
データレイヤーは持たない(生成結果を永続化しない要件のため)。

**メリット**: 関心の分離による保守性向上、ドメインレイヤーをHTTPから独立させることでのテスト容易性

**関連コンポーネント**: `ApiServer`, `RequestValidator`, `Tokenizer`, `MarkovChainBuilder`, `MarkovGenerator`

**参考資料**: [アーキテクチャ設計書](./architecture.md)、[リポジトリ構造定義書](./repository-structure.md)

### レート制限 (Rate Limiting)

**定義**: 一定時間内に同一の送信元から受け付けるリクエスト数に上限を設ける仕組み

**本プロジェクトでの適用**: 認証を持たない公開APIの濫用を防ぐため、送信元IPアドレス単位でリクエスト数を計測し、上限を超えた場合は429を返す。MVPではプロセス内メモリでカウントする(`docs/architecture.md`)

**関連コンポーネント**: `RateLimiter`ミドルウェア

### 運用メトリクス (Operational Metrics)

**定義**: PRDのKPI(成功率・処理時間・平均生成回数など)を算出するために記録する、匿名化された集計指標

**本プロジェクトでの適用**: リクエスト数・成否・処理時間分布などをアプリケーションログとして記録する。元テキストや生成結果の内容、利用者を特定できる情報(IPアドレス等)は記録しない。データを永続化しない方針(`docs/architecture.md`のデータ永続化戦略)とは別枠の、集計専用のログである

**関連用語**: [セッション](#セッション-session)

**参考資料**: [プロダクト要求定義書](./product-requirements.md#測定方法)、[アーキテクチャ設計書](./architecture.md#データ永続化戦略)

## データモデル用語

### GenerationRequest

**定義**: 文章生成APIへのリクエストを表す型

**主要フィールド**:
- `texts`: 元テキストの配列(1件以上)
- `maxWords`: 生成する文章の語数上限(任意、デフォルト1000)
- `chainLength`: マーコフ連鎖の長さ(任意、デフォルト2)

**関連エンティティ**: [GenerationResult](#generationresult)、[GenerationError](#generationerror)

**使用例**:
```json
{
  "texts": ["元テキスト1...", "元テキスト2..."],
  "maxWords": 1000,
  "chainLength": 2
}
```

**実装箇所**: `src/types/generation.ts`

### GenerationResult

**定義**: 文章生成APIのレスポンスを表す型

**主要フィールド**:
- `text`: 生成された文章
- `wordCount`: 実際に生成された語数

**関連エンティティ**: [GenerationRequest](#generationrequest)

**使用例**:
```json
{
  "text": "生成された文章...",
  "wordCount": 842
}
```

**実装箇所**: `src/types/generation.ts`

### GenerationError

**定義**: 文章生成APIがエラー時に返すレスポンスを表す型

**主要フィールド**:
- `error`: エラー種別(例: `"validation_error"`, `"rate_limited"`)
- `message`: 利用者向けエラーメッセージ

**説明**: `ValidationError`は`error: "validation_error"`、`RateLimitError`は`error: "rate_limited"`としてこの型に変換され、それぞれ400/429のHTTPステータスとともに返される(`docs/functional-design.md`のエラーレスポンスを参照)

**関連エンティティ**: [GenerationRequest](#generationrequest)、[ValidationError](#validationerror)、[RateLimitError](#ratelimiterror)

**実装箇所**: `src/types/generation.ts`

## エラー・例外

### ValidationError

**クラス名**: `ValidationError`

**発生条件**: `GenerationRequest`の内容がバリデーションルール(件数・文字数・パラメータ範囲)に違反した場合

**対処方法**: 利用者はエラーメッセージに従って入力内容を修正する。APIレスポンスとしては400を返す

**実装箇所**: `src/domain/validation/RequestValidator.ts`

**使用例**:
```typescript
throw new ValidationError('元テキストを1件以上入力してください', 'texts');
```

### RateLimitError

**クラス名**: `RateLimitError`

**発生条件**: 同一送信元からのリクエストがレート制限の上限を超えた場合

**対処方法**: 利用者はしばらく待ってから再度リクエストする。APIレスポンスとしては429を返す

**実装箇所**: `src/api/middleware/rateLimiter.ts`

**使用例**:
```typescript
throw new RateLimitError();
```

## 計算・アルゴリズム

### マーコフ連鎖の構築

**定義**: 複数テキストのトークン列から、状態キーごとに次単語候補を蓄積した連鎖マップを作る処理

**実装箇所**: `src/domain/markov/MarkovChainBuilder.ts`

**例**:
```
入力: [["吾輩","は","猫","で","ある"], ["名前","は","まだ","ない"]]
出力(chainLength=2の一部): "吾輩 は" -> ["猫"], "名前 は" -> ["まだ"]
```

**関連ドキュメント**: [機能設計書のアルゴリズム設計](./functional-design.md#アルゴリズム設計)

### マーコフ連鎖からの生成

**定義**: 構築済みの連鎖マップを状態キーでたどり、終端記号に到達するか`maxWords`に達するまで単語をランダムに選び続けて文章を生成する処理

**実装箇所**: `src/domain/markov/MarkovGenerator.ts`

**関連ドキュメント**: [機能設計書のアルゴリズム設計](./functional-design.md#アルゴリズム設計)

## 索引

分類基準: 日本語での読みが定着している用語(和語・カタカナ語)は五十音順、英語のクラス名・型名・略語(日本語の読みを持たないもの)はA-Z順に分類する。

### あ行
- [運用メトリクス](#運用メトリクス-operational-metrics) - アーキテクチャ用語

### か行
- [カットアップ技法](#カットアップ技法-cutup-technique) - ドメイン用語
- [元テキスト](#元テキスト-source-text) - ドメイン用語

### さ行
- [状態キー](#状態キー-state-key) - ドメイン用語
- [生成語数上限(maxWords)](#生成語数上限-maxwords) - ドメイン用語
- [セッション](#セッション-session) - ドメイン用語
- [終端記号(NONWORD)](#終端記号-nonword) - ドメイン用語

### ま行
- [マーコフ連鎖](#マーコフ連鎖-markov-chain) - ドメイン用語
- [マーコフ連鎖の構築](#マーコフ連鎖の構築) - 計算・アルゴリズム
- [マーコフ連鎖からの生成](#マーコフ連鎖からの生成) - 計算・アルゴリズム

### ら行
- [レイヤードアーキテクチャ](#レイヤードアーキテクチャ-layered-architecture) - アーキテクチャ用語
- [レート制限](#レート制限-rate-limiting) - アーキテクチャ用語
- [連鎖の長さ(chainLength)](#連鎖の長さ-chainlength) - ドメイン用語

### A-Z
- [API](#api) - 略語
- [GenerationError](#generationerror) - データモデル用語
- [GenerationRequest](#generationrequest) - データモデル用語
- [GenerationResult](#generationresult) - データモデル用語
- [Hono](#hono) - 技術用語
- [KPI](#kpi) - 略語
- [kuromoji](#kuromoji) - 技術用語
- [MVP](#mvp) - 略語
- [PRD](#prd) - 略語
- [RateLimitError](#ratelimiterror) - エラー
- [ValidationError](#validationerror) - エラー
- [Vitest](#vitest) - 技術用語
- [zod](#zod) - 技術用語
