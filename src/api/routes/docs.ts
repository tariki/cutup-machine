/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Hono } from 'hono';

const API_DOCS = {
  endpoint: 'POST /api/generate',
  request: {
    texts: 'string[] (1件以上、1件あたり10万字、合計30万字まで)',
    maxWords: 'number (任意、1〜5000、デフォルト1000)',
    chainLength: 'number (任意、1〜5、デフォルト2)',
  },
  response: {
    text: 'string (生成された文章)',
    wordCount: 'number (実際に生成された語数)',
  },
  errors: {
    400: 'validation_error - リクエスト内容が不正',
    413: 'リクエストボディが大きすぎる',
    429: 'rate_limited - レート制限超過',
    500: 'internal_error - 予期しないエラー',
  },
};

export function createDocsRoute(): Hono {
  const app = new Hono();

  app.get('/', (c) => c.json(API_DOCS));

  return app;
}
