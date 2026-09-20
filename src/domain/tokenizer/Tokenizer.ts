/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import kuromoji from 'kuromoji';
import type { IpadicFeatures, Tokenizer as KuromojiTokenizer } from 'kuromoji';

const DEFAULT_DIC_PATH = 'node_modules/kuromoji/dict';

export class Tokenizer {
  private constructor(private readonly kuromojiTokenizer: KuromojiTokenizer<IpadicFeatures>) {}

  // サーバー起動時に一度だけ呼び出し、辞書を読み込む
  static initialize(dicPath: string = DEFAULT_DIC_PATH): Promise<Tokenizer> {
    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((error, kuromojiTokenizer) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(new Tokenizer(kuromojiTokenizer));
      });
    });
  }

  // テキストを単語配列に分割する
  tokenize(text: string): string[] {
    return this.kuromojiTokenizer.tokenize(text).map((token) => token.surface_form);
  }
}
