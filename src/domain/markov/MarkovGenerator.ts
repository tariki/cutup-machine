/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { NONWORD } from './constants.js';
import type { MarkovChain } from './MarkovChainBuilder.js';

export class MarkovGenerator {
  constructor(
    private readonly chain: MarkovChain,
    private readonly chainLength: number
  ) {}

  generate(maxWords: number): string {
    return this.generateTokens(maxWords).join('');
  }

  // 生成された単語をトークン配列のまま返す(呼び出し側で語数を数えられるようにするため)
  generateTokens(maxWords: number): string[] {
    let state = Array(this.chainLength).fill(NONWORD) as string[];
    const result: string[] = [];

    for (let i = 0; i < maxWords; i++) {
      const key = state.join(' ');
      const candidates = this.chain.get(key);
      if (!candidates || candidates.length === 0) break;

      const next = candidates[Math.floor(Math.random() * candidates.length)];
      if (next === NONWORD) break;

      result.push(next);
      state = [...state.slice(1), next];
    }

    return result;
  }
}
