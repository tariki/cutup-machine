/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { serve } from '@hono/node-server';
import { Tokenizer } from './domain/tokenizer/Tokenizer.js';
import { createApp } from './api/app.js';
import { Launcher } from './launcher.js';

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  const isPackaged = Launcher.isPackaged();

  // SEA実行ファイルの場合のみ、埋め込み辞書を展開してそのパスを使う
  // (通常実行時はTokenizer.initialize()の既定値であるnode_modules/kuromoji/dictを使う)
  let dicPath: string | undefined;
  if (isPackaged) {
    try {
      dicPath = await Launcher.extractBundledDictionary();
    } catch (error) {
      console.error('辞書データの展開に失敗しました:', error);
      process.exit(1);
    }
  }

  // kuromoji辞書の読み込みはサーバー起動時に一度だけ行う(docs/functional-design.mdのパフォーマンス最適化を参照)
  const tokenizer = dicPath ? await Tokenizer.initialize(dicPath) : await Tokenizer.initialize();
  const app = createApp(tokenizer);

  const port = await Launcher.findAvailablePort(PORT);

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`カットアップメーカーがポート${info.port}で起動しました`);
    if (isPackaged) {
      Launcher.openBrowser(`http://localhost:${info.port}`);
    }
  });
}

main().catch((error: unknown) => {
  console.error('サーバーの起動に失敗しました:', error);
  process.exit(1);
});

// PRDの信頼性要件「アプリ全体がクラッシュしない」に対応する(docs/architecture.mdのエラーハンドリングを参照)。
// リクエスト単位のtry-catchで捕捉しきれない例外はログのみ出力し、プロセスを維持する。
process.on('uncaughtException', (error) => {
  console.error('uncaughtException:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
