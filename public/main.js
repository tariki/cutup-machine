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
  loadingEl.hidden = false;
  clearError();
  resultTextEl.textContent = '';
  copyBtn.disabled = true;

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

    if (!response.ok) {
      showError(data.message ?? '生成中にエラーが発生しました');
      return;
    }

    resultTextEl.textContent = data.text;
    copyBtn.disabled = false;
    regenerateBtn.disabled = false;
    lastRequestBody = body;
  } catch {
    showError('通信エラーが発生しました');
  } finally {
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
