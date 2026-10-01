/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { Hono } from 'hono';
import { createApp } from '../../../src/api/app.js';
import { Tokenizer } from '../../../src/domain/tokenizer/Tokenizer.js';

describe('GET /sounds/cut.wav', () => {
  let app: Hono;

  beforeAll(async () => {
    const tokenizer = await Tokenizer.initialize();
    app = createApp(tokenizer);
  }, 30_000);

  it('Content-Typeがaudio/wavで200を返す', async () => {
    const res = await app.request('/sounds/cut.wav');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/wav');
  });

  it('.wav以外のパスにはContent-Typeの補正を適用しない', async () => {
    const res = await app.request('/styles.css');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).not.toBe('audio/wav');
  });
});
