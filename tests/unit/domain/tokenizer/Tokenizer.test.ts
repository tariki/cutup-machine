import { describe, it, expect, beforeAll } from 'vitest';
import { Tokenizer } from '../../../../src/domain/tokenizer/Tokenizer.js';

describe('Tokenizer', () => {
  let tokenizer: Tokenizer;

  beforeAll(async () => {
    tokenizer = await Tokenizer.initialize();
  }, 30_000);

  it('日本語テキストを単語単位に分割する', () => {
    const tokens = tokenizer.tokenize('吾輩は猫である');

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toBe('吾輩は猫である');
  });

  it('空文字列を渡すと空配列を返す', () => {
    const tokens = tokenizer.tokenize('');

    expect(tokens).toEqual([]);
  });
});
