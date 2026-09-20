/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Tokenizer } from '../domain/tokenizer/Tokenizer.js';
import { createGenerateRoute } from './routes/generate.js';
import { createDocsRoute } from './routes/docs.js';
import { RateLimiter } from './middleware/rateLimiter.js';
import { RateLimitError } from './middleware/RateLimitError.js';
import { requestSizeLimit } from './middleware/requestSizeLimit.js';
import type { GenerationError } from '../types/generation.js';

export function createApp(tokenizer: Tokenizer): Hono {
  const app = new Hono();
  const rateLimiter = new RateLimiter();

  app.use('/api/generate', requestSizeLimit());
  app.use('/api/generate', rateLimiter.middleware());
  app.route('/api/generate', createGenerateRoute(tokenizer));
  app.route('/api/docs', createDocsRoute());

  app.use('/*', serveStatic({ root: './public' }));

  // ルートハンドラの外(ミドルウェア)でスローされたエラーはここで一括してHTTPレスポンスに変換する
  // (docs/development-guidelines.mdのエラーハンドリング方針を参照)
  app.onError((error, c) => {
    if (error instanceof RateLimitError) {
      const body: GenerationError = { error: 'rate_limited', message: error.message };
      return c.json(body, 429);
    }
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('予期しないエラー:', error);
    const body: GenerationError = {
      error: 'internal_error',
      message: '生成中にエラーが発生しました',
    };
    return c.json(body, 500);
  });

  return app;
}
