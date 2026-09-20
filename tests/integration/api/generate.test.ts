import { describe, it, expect, beforeAll } from 'vitest';
import type { Hono } from 'hono';
import { createApp } from '../../../src/api/app.js';
import { Tokenizer } from '../../../src/domain/tokenizer/Tokenizer.js';

describe('POST /api/generate', () => {
  let app: Hono;

  beforeAll(async () => {
    const tokenizer = await Tokenizer.initialize();
    app = createApp(tokenizer);
  }, 30_000);

  it('正常なリクエストに対して200と生成結果を返す', async () => {
    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: ['吾輩は猫である。名前はまだ無い。'],
        maxWords: 50,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { text: string; wordCount: number };
    expect(typeof body.text).toBe('string');
    expect(body.wordCount).toBeGreaterThanOrEqual(0);
  });

  it('複数テキストを渡しても200を返す', async () => {
    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: ['吾輩は猫である。', '親譲りの無鉄砲で小供の時から損ばかりしている。'],
      }),
    });

    expect(res.status).toBe(200);
  });

  it('textsが0件の場合400 validation_errorを返す', async () => {
    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [] }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('validation_error');
  });

  it('maxWordsが範囲外の場合400 validation_errorを返す', async () => {
    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: ['テスト'], maxWords: 10000 }),
    });

    expect(res.status).toBe(400);
  });

  it('レート制限を超えると429 rate_limitedを返す', async () => {
    const requestPayload = {
      method: 'POST' as const,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: ['テスト'] }),
    };

    // 閾値(1分間10リクエスト)を超えるまで送信する
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await app.request('/api/generate', requestPayload);
    }

    expect(lastRes?.status).toBe(429);
    const body = (await lastRes?.json()) as { error: string };
    expect(body.error).toBe('rate_limited');
  });

  it('リクエストボディが大きすぎる場合413を返す', async () => {
    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(3 * 1024 * 1024), // 上限(2MB)を超える値
      },
      body: JSON.stringify({ texts: ['テスト'] }),
    });

    expect(res.status).toBe(413);
  });
});

describe('POST /api/generate (予期しないエラー)', () => {
  it('ドメインロジックが予期せず例外をスローした場合500 internal_errorを返す', async () => {
    const brokenTokenizer = {
      tokenize: () => {
        throw new Error('想定外の内部エラー');
      },
    } as unknown as Tokenizer;
    const appWithBrokenTokenizer = createApp(brokenTokenizer);

    const res = await appWithBrokenTokenizer.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: ['テスト'] }),
    });

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('internal_error');
  });
});
