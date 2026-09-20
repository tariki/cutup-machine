/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import type { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../../config/limits.js';
import { RateLimitError } from './RateLimitError.js';

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

// 送信元IPをキーとしたレート制限カウンタ。プロセス内メモリで保持する(docs/architecture.mdのデータ永続化戦略を参照)。
// 期限切れエントリはリクエストのたびに掃除し、際限のないメモリ増加を防ぐ。
export class RateLimiter {
  private readonly counters = new Map<string, RateLimitEntry>();

  middleware() {
    return async (c: Context, next: Next) => {
      const clientIp = this.resolveClientIp(c);
      this.assertWithinLimit(clientIp);
      await next();
    };
  }

  private assertWithinLimit(clientIp: string): void {
    const now = Date.now();
    this.evictExpiredEntries(now);

    const entry = this.counters.get(clientIp);
    if (!entry || now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      this.counters.set(clientIp, { count: 1, windowStartedAt: now });
      return;
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      throw new RateLimitError();
    }

    entry.count += 1;
  }

  private evictExpiredEntries(now: number): void {
    for (const [ip, entry] of this.counters) {
      if (now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
        this.counters.delete(ip);
      }
    }
  }

  // デプロイ環境のリバースプロキシが付与するX-Forwarded-Forの最も信頼できる区間から取得する。
  // 開発環境等でヘッダーがない場合は、TCP接続元のアドレスにフォールバックする(docs/architecture.mdを参照)。
  private resolveClientIp(c: Context): string {
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((ip) => ip.trim());
      return ips[ips.length - 1];
    }

    try {
      const info = getConnInfo(c);
      return info.remote.address ?? 'unknown';
    } catch {
      // @hono/node-serverの実サーバーを介さない呼び出し(テスト等)では接続情報が取得できないため、
      // 送信元不明として扱う(この場合、レート制限は全リクエストで共有される)
      return 'unknown';
    }
  }
}
