/**
 * Copyright (c) 2026 Tomohiko Ariki
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

const textInputList = document.getElementById('text-input-list');
const addTextBtn = document.getElementById('add-text-btn');
const fileInput = document.getElementById('file-input');
const filePreviewList = document.getElementById('file-preview-list');
const maxWordsInput = document.getElementById('max-words-input');
const chainLengthInput = document.getElementById('chain-length-input');
const generateBtn = document.getElementById('generate-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('error-message');
const resultTextEl = document.getElementById('result-text');
const copyBtn = document.getElementById('copy-btn');

// ページ読み込み時にセッションIDを1つ発行し、以降このページ内の/api/generate呼び出しに付与する
// (docs/functional-design.mdのセッション設計を参照。KPI集計目的のみで、サーバー側に永続化はされない)
const sessionId = crypto.randomUUID();

// 「生成中」状態を維持する最短時間(ms)。効果音の再生が一瞬で終わらないようにする
// (docs/functional-design.mdの「効果音」セクションを参照)
const MIN_GENERATING_DURATION_MS = 800;

// docs/functional-design.mdのSoundEffectPlayer(HTMLAudioElementベース)の実装。
// コンストラクタ相当の処理も含めて例外を外に漏らさず、失敗時はno-opとして振る舞う
// (音声非対応環境・自動再生制限下でも生成処理自体は継続させるため)
function createSoundEffectPlayer(src) {
  let audio;
  try {
    audio = new Audio(src);
    audio.loop = true;
  } catch {
    return { start() {}, stop() {} };
  }

  return {
    start() {
      try {
        audio.currentTime = 0;
        audio.play()?.catch(() => {});
      } catch {
        // play()が同期的に例外を投げる非標準環境でも生成処理には影響させない
      }
    },
    stop() {
      audio.pause();
      audio.currentTime = 0;
    },
  };
}

const soundEffectPlayer = createSoundEffectPlayer('/sounds/cut.wav');

// 処理開始時刻(startedAt)からの経過時間がminimumMs未満であれば、残り時間分待機する
function waitForMinimumDuration(startedAt, minimumMs) {
  const remaining = minimumMs - (performance.now() - startedAt);
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, remaining));
}

// ファイルアップロードで読み込んだテキストを保持する(テキストエリアとは別に管理する)
const uploadedFiles = [];

let lastRequestBody = null;

function addTextArea() {
  const textarea = document.createElement('textarea');
  textarea.className = 'source-text';
  textarea.rows = 6;
  textarea.placeholder = '元テキストを貼り付けてください';
  textInputList.appendChild(textarea);
}

function renderFilePreviews() {
  filePreviewList.innerHTML = '';
  uploadedFiles.forEach((file, index) => {
    const preview = document.createElement('div');
    preview.className = 'file-preview';

    const title = document.createElement('strong');
    title.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '削除';
    removeBtn.addEventListener('click', () => {
      uploadedFiles.splice(index, 1);
      renderFilePreviews();
    });

    const content = document.createElement('pre');
    content.textContent = file.content;

    preview.append(title, removeBtn, content);
    filePreviewList.appendChild(preview);
  });
}

async function handleFileInputChange(event) {
  const files = Array.from(event.target.files ?? []);
  for (const file of files) {
    const content = await file.text();
    uploadedFiles.push({ name: file.name, content });
  }
  renderFilePreviews();
  fileInput.value = '';
}

function collectTexts() {
  const textareaValues = Array.from(document.querySelectorAll('.source-text'))
    .map((el) => el.value)
    .filter((value) => value.trim().length > 0);
  const fileValues = uploadedFiles.map((file) => file.content);
  return [...textareaValues, ...fileValues];
}

function showError(message) {
  errorMessageEl.textContent = message;
  errorMessageEl.hidden = false;
}

function clearError() {
  errorMessageEl.hidden = true;
  errorMessageEl.textContent = '';
}

async function requestGeneration(body) {
  const startedAt = performance.now();
  loadingEl.hidden = false;
  clearError();
  resultTextEl.textContent = '';
  copyBtn.disabled = true;
  soundEffectPlayer.start();

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    await waitForMinimumDuration(startedAt, MIN_GENERATING_DURATION_MS);

    if (!response.ok) {
      showError(data.message ?? '生成中にエラーが発生しました');
      return;
    }

    resultTextEl.textContent = data.text;
    copyBtn.disabled = false;
    regenerateBtn.disabled = false;
    lastRequestBody = body;
  } catch {
    await waitForMinimumDuration(startedAt, MIN_GENERATING_DURATION_MS);
    showError('通信エラーが発生しました');
  } finally {
    soundEffectPlayer.stop();
    loadingEl.hidden = true;
  }
}

function buildRequestBody() {
  const texts = collectTexts();
  const body = { texts };

  const maxWords = Number(maxWordsInput.value);
  if (maxWordsInput.value && !Number.isNaN(maxWords)) {
    body.maxWords = maxWords;
  }

  const chainLength = Number(chainLengthInput.value);
  if (chainLengthInput.value && !Number.isNaN(chainLength)) {
    body.chainLength = chainLength;
  }

  return body;
}

addTextBtn.addEventListener('click', addTextArea);
fileInput.addEventListener('change', handleFileInputChange);

generateBtn.addEventListener('click', () => {
  const body = buildRequestBody();
  if (body.texts.length === 0) {
    resultTextEl.textContent = '';
    copyBtn.disabled = true;
    showError('元テキストを1件以上入力してください');
    return;
  }
  requestGeneration(body);
});

regenerateBtn.addEventListener('click', () => {
  if (lastRequestBody) {
    requestGeneration(lastRequestBody);
  }
});

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(resultTextEl.textContent ?? '');
  const originalLabel = copyBtn.textContent;
  copyBtn.textContent = 'コピーしました';
  setTimeout(() => {
    copyBtn.textContent = originalLabel;
  }, 1500);
});

// 初期状態でテキスト入力欄を1つ表示しておく
addTextArea();
