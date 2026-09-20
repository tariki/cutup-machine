import { describe, it, expect } from 'vitest';
import { MarkovChainBuilder } from '../../../../src/domain/markov/MarkovChainBuilder.js';
import { NONWORD } from '../../../../src/domain/markov/constants.js';

describe('MarkovChainBuilder', () => {
  describe('build', () => {
    it('2つのテキストのトークン列から連鎖を構築できる', () => {
      const builder = new MarkovChainBuilder(2);

      builder.addTokens(['吾輩', 'は', '猫', 'で', 'ある']);
      builder.addTokens(['名前', 'は', 'まだ', 'ない']);
      const chain = builder.build();

      expect(chain.size).toBeGreaterThan(0);
    });

    it('先頭にchainLength個、末尾に1個の終端記号でパディングされる', () => {
      const builder = new MarkovChainBuilder(2);

      builder.addTokens(['猫']);
      const chain = builder.build();

      // 状態(NONWORD, NONWORD) -> ["猫"]
      const initialKey = [NONWORD, NONWORD].join(' ');
      expect(chain.get(initialKey)).toEqual(['猫']);

      // 状態(NONWORD, "猫") -> [NONWORD]
      const secondKey = [NONWORD, '猫'].join(' ');
      expect(chain.get(secondKey)).toEqual([NONWORD]);
    });

    it('同じ状態キーへの候補は追記される(上書きされない)', () => {
      const builder = new MarkovChainBuilder(1);

      builder.addTokens(['猫']);
      builder.addTokens(['猫']);
      const chain = builder.build();

      const key = NONWORD;
      expect(chain.get(key)).toEqual(['猫', '猫']);
    });

    it('複数テキストをまたいだ単語のつながりが生まれる', () => {
      const builder = new MarkovChainBuilder(1);

      builder.addTokens(['吾輩', 'は']);
      builder.addTokens(['名前', 'は']);
      const chain = builder.build();

      expect(chain.get('は')).toEqual([NONWORD, NONWORD]);
    });
  });
});
