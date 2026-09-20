/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { z } from 'zod';
import {
  MAX_TEXT_LENGTH,
  MAX_TOTAL_TEXT_LENGTH,
  MIN_MAX_WORDS,
  MAX_MAX_WORDS,
  DEFAULT_MAX_WORDS,
  MIN_CHAIN_LENGTH,
  MAX_CHAIN_LENGTH,
  DEFAULT_CHAIN_LENGTH,
} from '../../config/limits.js';
import type { GenerationRequest } from '../../types/generation.js';
import { ValidationError } from './ValidationError.js';

const generationRequestSchema = z.object({
  texts: z
    .array(
      z
        .string()
        .min(1, '元テキストは1文字以上入力してください')
        .max(MAX_TEXT_LENGTH, `元テキストは1件あたり${MAX_TEXT_LENGTH}字以内にしてください`)
    )
    .min(1, '元テキストを1件以上入力してください'),
  maxWords: z
    .number()
    .int('maxWordsは整数で指定してください')
    .min(MIN_MAX_WORDS, `maxWordsは${MIN_MAX_WORDS}以上で指定してください`)
    .max(MAX_MAX_WORDS, `maxWordsは${MAX_MAX_WORDS}以下で指定してください`)
    .default(DEFAULT_MAX_WORDS),
  chainLength: z
    .number()
    .int('chainLengthは整数で指定してください')
    .min(MIN_CHAIN_LENGTH, `chainLengthは${MIN_CHAIN_LENGTH}以上で指定してください`)
    .max(MAX_CHAIN_LENGTH, `chainLengthは${MAX_CHAIN_LENGTH}以下で指定してください`)
    .default(DEFAULT_CHAIN_LENGTH),
});

export class RequestValidator {
  validate(body: unknown): GenerationRequest {
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new ValidationError(firstIssue.message, firstIssue.path.join('.'));
    }

    const totalLength = parsed.data.texts.reduce((sum, text) => sum + text.length, 0);
    if (totalLength > MAX_TOTAL_TEXT_LENGTH) {
      throw new ValidationError(
        `元テキストの合計文字数は${MAX_TOTAL_TEXT_LENGTH}字以内にしてください`,
        'texts'
      );
    }

    return parsed.data;
  }
}
