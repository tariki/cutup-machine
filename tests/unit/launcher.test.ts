/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { createServer, type Server } from 'node:net';
import { describe, it, expect, afterEach } from 'vitest';
import { Launcher } from '../../src/launcher.js';

describe('Launcher', () => {
  describe('findAvailablePort', () => {
    let blocker: Server | undefined;

    afterEach(async () => {
      if (blocker) {
        await new Promise<void>((resolve) => blocker?.close(() => resolve()));
        blocker = undefined;
      }
    });

    it('指定ポートが空いている場合はそのポートをそのまま返す', async () => {
      // Given: 使用中のポートがない状態

      // When: 空いているはずの高番ポートを指定して探す
      const port = await Launcher.findAvailablePort(31567);

      // Then: 指定したポートがそのまま返る
      expect(port).toBe(31567);
    });

    it('指定ポートが使用中の場合、次の空きポートを返す', async () => {
      // Given: 対象ポートを別のサーバーで塞いでおく
      const preferred = 31568;
      blocker = createServer();
      await new Promise<void>((resolve) => blocker?.listen(preferred, resolve));

      // When: 塞がれているポートを指定して探す
      const port = await Launcher.findAvailablePort(preferred);

      // Then: 次のポート(+1)が返る
      expect(port).toBe(preferred + 1);
    });
  });

  describe('isPackaged', () => {
    it('通常のnode実行時はfalseを返す', () => {
      // Given/When: Vitestはnode上で直接実行されるため、SEA実行ファイルではない

      // Then: isPackaged()はfalseを返す
      expect(Launcher.isPackaged()).toBe(false);
    });
  });
});
