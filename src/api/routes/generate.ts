/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Hono } from 'hono';
import type { Tokenizer } from '../../domain/tokenizer/Tokenizer.js';
import { RequestValidator } from '../../domain/validation/RequestValidator.js';
import { ValidationError } from '../../domain/validation/ValidationError.js';
import { MarkovChainBuilder } from '../../domain/markov/MarkovChainBuilder.js';
import { MarkovGenerator } from '../../domain/markov/MarkovGenerator.js';
import type { GenerationResult, GenerationError } from '../../types/generation.js';

export function createGenerateRoute(tokenizer: Tokenizer): Hono {
  const app = new Hono();
  const validator = new RequestValidator();

  app.post('/', async (c) => {
    try {
      const body: unknown = await c.req.json().catch(() => {
        throw new ValidationError('リクエストボディがJSON形式ではありません', 'body');
      });
      const request = validator.validate(body);

      const builder = new MarkovChainBuilder(request.chainLength);
      for (const text of request.texts) {
        builder.addTokens(tokenizer.tokenize(text));
      }

      const generator = new MarkovGenerator(builder.build(), request.chainLength);
      const tokens = generator.generateTokens(request.maxWords);

      const result: GenerationResult = {
        text: tokens.join(''),
        wordCount: tokens.length,
      };
      return c.json(result);
    } catch (error) {
      // RateLimitErrorはrateLimiterミドルウェア(このルートハンドラより前段)でスローされ、
      // src/api/app.tsのonErrorで捕捉されるため、ここでは扱わない(エラー変換の責務を一箇所に集約する)
      if (error instanceof ValidationError) {
        const errorBody: GenerationError = { error: 'validation_error', message: error.message };
        return c.json(errorBody, 400);
      }
      console.error('予期しないエラー:', error);
      const errorBody: GenerationError = {
        error: 'internal_error',
        message: '生成中にエラーが発生しました',
      };
      return c.json(errorBody, 500);
    }
  });

  return app;
}
