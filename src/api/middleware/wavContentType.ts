/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import type { Context, Next } from 'hono';

// @hono/node-serverのserveStaticは.wav拡張子をMIMEタイプ一覧に持たず
// application/octet-streamを返してしまい、ブラウザのHTMLAudioElementが
// 再生できない場合があるため、/sounds/*配下のみ明示的に補正する
export function wavContentType() {
  return async (c: Context, next: Next) => {
    await next();
    if (c.req.path.endsWith('.wav')) {
      c.res.headers.set('Content-Type', 'audio/wav');
    }
  };
}
