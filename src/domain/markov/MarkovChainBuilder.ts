/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { NONWORD } from './constants.js';

// 状態キー(直前chainLength個の単語を連結したもの) -> 続く単語の候補リスト
export type MarkovChain = Map<string, string[]>;

export class MarkovChainBuilder {
  private readonly chain: MarkovChain = new Map();

  constructor(private readonly chainLength: number) {}

  // 1テキスト分のトークン列を追加学習する。複数回呼び出すことで複数テキストを1つの連鎖に統合できる。
  addTokens(tokens: string[]): void {
    const padded = [
      ...(Array(this.chainLength).fill(NONWORD) as string[]),
      ...tokens,
      NONWORD,
    ];

    for (let i = 0; i <= padded.length - this.chainLength - 1; i++) {
      const key = padded.slice(i, i + this.chainLength).join(' ');
      const next = padded[i + this.chainLength];
      const candidates = this.chain.get(key) ?? [];
      candidates.push(next);
      this.chain.set(key, candidates);
    }
  }

  build(): MarkovChain {
    return this.chain;
  }
}
