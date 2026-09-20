import { describe, it, expect } from 'vitest';
import { MarkovChainBuilder } from '../../../../src/domain/markov/MarkovChainBuilder.js';
import { MarkovGenerator } from '../../../../src/domain/markov/MarkovGenerator.js';

describe('MarkovGenerator', () => {
  describe('generate', () => {
    it('学習したトークンのみから文章を生成する', () => {
      const builder = new MarkovChainBuilder(1);
      builder.addTokens(['吾輩', 'は', '猫', 'で', 'ある']);
      const generator = new MarkovGenerator(builder.build(), 1);

      const result = generator.generate(1000);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('吾輩は猫である');
    });

    it('maxWordsを超える文章は生成しない', () => {
      const builder = new MarkovChainBuilder(1);
      // 単純な巡回連鎖(常に次の候補がある)を作り、maxWordsで打ち切られることを確認する
      builder.addTokens(['あ', 'い', 'あ', 'い', 'あ', 'い']);
      const generator = new MarkovGenerator(builder.build(), 1);

      const result = generator.generate(3);

      expect([...result].length).toBeLessThanOrEqual(3);
    });

    it('連鎖に存在しない状態から開始すると空文字列を返す', () => {
      const emptyChain = new Map<string, string[]>();
      const generator = new MarkovGenerator(emptyChain, 1);

      const result = generator.generate(1000);

      expect(result).toBe('');
    });
  });

  describe('generateTokens', () => {
    it('生成した単語をトークン配列として返す', () => {
      const builder = new MarkovChainBuilder(1);
      builder.addTokens(['吾輩', 'は', '猫', 'で', 'ある']);
      const generator = new MarkovGenerator(builder.build(), 1);

      const tokens = generator.generateTokens(1000);

      expect(tokens).toEqual(['吾輩', 'は', '猫', 'で', 'ある']);
      expect(generator.generate(1000)).toBe(tokens.join(''));
    });
  });
});
