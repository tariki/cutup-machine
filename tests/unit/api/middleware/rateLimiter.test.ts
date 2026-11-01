/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RateLimiter } from '../../../../src/api/middleware/rateLimiter.js';
import { RateLimitError } from '../../../../src/api/middleware/RateLimitError.js';
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from '../../../../src/config/limits.js';

function createTestApp(): Hono {
  const app = new Hono();
  app.use('/*', new RateLimiter().middleware());
  app.get('/', (c) => c.text('ok'));
  app.onError((error, c) => {
    if (error instanceof RateLimitError) {
      return c.text('rate_limited', 429);
    }
    throw error;
  });
  return app;
}

function requestFrom(app: Hono, forwardedFor: string): Promise<Response> {
  return Promise.resolve(app.request('/', { headers: { 'x-forwarded-for': forwardedFor } }));
}

describe('RateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('X-Forwarded-Forの末尾のIPごとに別々に数える', async () => {
    // Given: 末尾が192.0.2.1の送信元が上限まで送信済み
    const app = createTestApp();
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await requestFrom(app, '198.51.100.1, 192.0.2.1');
    }

    // When: 同じ送信元と、末尾が異なる送信元からもう1件ずつ送る
    const sameIp = await requestFrom(app, '198.51.100.1, 192.0.2.1');
    const otherIp = await requestFrom(app, '198.51.100.1, 192.0.2.2');

    // Then: 同じ送信元だけが制限される
    expect(sameIp.status).toBe(429);
    expect(otherIp.status).toBe(200);
  });

  it('ウィンドウの期間が過ぎるとカウンタがリセットされる', async () => {
    // Given: ある送信元が上限まで送信済み
    vi.useFakeTimers();
    const app = createTestApp();
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await requestFrom(app, '192.0.2.10');
    }
    expect((await requestFrom(app, '192.0.2.10')).status).toBe(429);

    // When: ウィンドウの期間が過ぎてから送る
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS);
    const response = await requestFrom(app, '192.0.2.10');

    // Then: 再び受け付けられる
    expect(response.status).toBe(200);
  });
});
