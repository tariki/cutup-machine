/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// リクエストボディの上限(バイト)。合計30万字の元テキスト+JSONオーバーヘッドを見込んだ仮の値。
const MAX_BODY_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function requestSizeLimit() {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE_BYTES) {
      throw new HTTPException(413, { message: 'リクエストボディが大きすぎます' });
    }
    await next();
  };
}
