import { describe, it, expect } from 'vitest';
import { RequestValidator } from '../../../../src/domain/validation/RequestValidator.js';
import { ValidationError } from '../../../../src/domain/validation/ValidationError.js';
import { MAX_TEXT_LENGTH, MAX_TOTAL_TEXT_LENGTH } from '../../../../src/config/limits.js';

describe('RequestValidator', () => {
  describe('validate', () => {
    it('textsが0件の場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();

      expect(() => validator.validate({ texts: [] })).toThrow(ValidationError);
    });

    it('texts未指定の場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();

      expect(() => validator.validate({})).toThrow(ValidationError);
    });

    it('1件のテキストでも有効なリクエストとして扱う', () => {
      const validator = new RequestValidator();

      const result = validator.validate({ texts: ['吾輩は猫である'] });

      expect(result.texts).toEqual(['吾輩は猫である']);
    });

    it('maxWords/chainLength未指定の場合デフォルト値を適用する', () => {
      const validator = new RequestValidator();

      const result = validator.validate({ texts: ['テスト'] });

      expect(result.maxWords).toBe(1000);
      expect(result.chainLength).toBe(2);
    });

    it('各要素がMAX_TEXT_LENGTHちょうどの場合は有効とする', () => {
      const validator = new RequestValidator();
      const text = 'あ'.repeat(MAX_TEXT_LENGTH);

      expect(() => validator.validate({ texts: [text] })).not.toThrow();
    });

    it('各要素がMAX_TEXT_LENGTHを超える場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();
      const text = 'あ'.repeat(MAX_TEXT_LENGTH + 1);

      expect(() => validator.validate({ texts: [text] })).toThrow(ValidationError);
    });

    it('合計文字数がMAX_TOTAL_TEXT_LENGTHを超える場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();
      const text = 'あ'.repeat(MAX_TEXT_LENGTH);
      const texts = Array(4).fill(text); // 4 * 100,000 > 300,000

      expect(() => validator.validate({ texts })).toThrow(ValidationError);
      expect(texts.reduce((s, t) => s + t.length, 0)).toBeGreaterThan(MAX_TOTAL_TEXT_LENGTH);
    });

    it('maxWordsが範囲外の場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();

      expect(() => validator.validate({ texts: ['テスト'], maxWords: 0 })).toThrow(
        ValidationError
      );
      expect(() => validator.validate({ texts: ['テスト'], maxWords: 5001 })).toThrow(
        ValidationError
      );
    });

    it('chainLengthが範囲外の場合ValidationErrorをスローする', () => {
      const validator = new RequestValidator();

      expect(() => validator.validate({ texts: ['テスト'], chainLength: 0 })).toThrow(
        ValidationError
      );
      expect(() => validator.validate({ texts: ['テスト'], chainLength: 6 })).toThrow(
        ValidationError
      );
    });
  });
});
