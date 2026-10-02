/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAX_PORT_ATTEMPTS = 20;

// `node:sea`を通常のimport文で読み込むと、Vite/VitestのモジュールリゾルバがNode組み込み
// モジュールとして認識できず解決に失敗する(Node自体では`import`/`require`どちらでも動作する)。
// `process.getBuiltinModule()`はモジュール解決を経由せず直接ビルトインを取得するため、
// Vitest環境でも問題なく動作する(`@types/node`がオーバーロードで型を提供するためキャスト不要)
const sea = process.getBuiltinModule('node:sea');

export class Launcher {
  // SEA(Single Executable Applications)実行ファイルとして起動されているかを判定する
  static isPackaged(): boolean {
    return sea.isSea();
  }

  // 指定ポートが使用中の場合、空いているポートを順に探して返す
  static findAvailablePort(preferred: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const tryPort = (port: number, attemptsLeft: number): void => {
        if (attemptsLeft <= 0) {
          reject(
            new Error(
              `空きポートが見つかりませんでした(${preferred}から${MAX_PORT_ATTEMPTS}回試行)`
            )
          );
          return;
        }

        const server = createServer();
        server.once('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            tryPort(port + 1, attemptsLeft - 1);
          } else {
            reject(error);
          }
        });
        server.listen(port, () => {
          server.close(() => resolve(port));
        });
      };

      tryPort(preferred, MAX_PORT_ATTEMPTS);
    });
  }

  // SEA実行時のみ呼び出す。埋め込み辞書アセット(sea-config.jsonのassets)を
  // OSの一時ディレクトリに展開し、そのディレクトリパスを返す
  static async extractBundledDictionary(): Promise<string> {
    const dir = mkdtempSync(join(tmpdir(), 'cutup-machine-'));

    for (const key of sea.getAssetKeys()) {
      const asset = sea.getRawAsset(key);
      const fileName = key.split('/').pop() ?? key;
      writeFileSync(join(dir, fileName), Buffer.from(asset));
    }

    // プロセス終了時に展開した辞書を削除する(必須ではないが、/tmp配下への蓄積を防ぐ)
    process.once('exit', () => {
      rmSync(dir, { recursive: true, force: true });
    });

    return dir;
  }

  // 既定のブラウザでURLを開く。失敗しても例外は投げず、コンソールにURLを表示するのみに留める
  // (xdg-openが存在しない環境でもサーバー起動自体は継続させるため)
  static openBrowser(url: string): void {
    try {
      const child = spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
      child.on('error', () => {
        console.log(`ブラウザを自動的に開けませんでした。手動で以下のURLを開いてください: ${url}`);
      });
      child.unref();
    } catch {
      console.log(`ブラウザを自動的に開けませんでした。手動で以下のURLを開いてください: ${url}`);
    }
  }
}
