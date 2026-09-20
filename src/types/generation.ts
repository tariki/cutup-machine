/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export interface GenerationRequest {
  texts: string[]; // 元テキスト(1件以上)。1件あたり10万字、合計30万字まで
  maxWords: number; // 生成する文章の語数上限。デフォルト: 1000
  chainLength: number; // マーコフ連鎖の長さ(直前何単語を考慮するか)。デフォルト: 2
}

export interface GenerationResult {
  text: string; // 生成された文章
  wordCount: number; // 実際に生成された語数
}

export interface GenerationError {
  error: string; // エラー種別(例: "validation_error", "rate_limited")
  message: string; // 利用者向けエラーメッセージ
}
