/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// テキストの先頭・末尾(境界)を表す終端記号。参考実装(docs/ideas/reference/markov.rb)を踏襲する。
// kuromojiのトークンには生の改行文字は含まれないため、通常の単語と衝突しない。
export const NONWORD = '\n';
