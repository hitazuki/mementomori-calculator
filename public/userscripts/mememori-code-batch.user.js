// ==UserScript==
// @name         MementoMori 序列码批量兑换
// @namespace    https://github.com/hitazuki/mementomori-calculator
// @version      0.1.0
// @description  在 MementoMori 官方兑换页同步并串行填写公开序列码
// @author       hitazuki
// @match        https://mememori-game.com/code*
// @match        https://mememori-game.com/*/code*
// @homepageURL  https://hitazuki.github.io/mementomori-calculator/
// @supportURL   https://github.com/hitazuki/mementomori-calculator/issues
// @updateURL    https://hitazuki.github.io/mementomori-calculator/userscripts/mememori-code-batch.user.js
// @downloadURL  https://hitazuki.github.io/mementomori-calculator/userscripts/mememori-code-batch.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      hitazuki.github.io
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const API_BASE = 'https://code-input.mememori-boi.com/SerialCode';
  const REGISTRY_URL = 'https://hitazuki.github.io/mementomori-calculator/data/serial-codes.json';
  const CACHE_KEY = 'mmt-serial-code-registry';
  const CACHE_TIME_KEY = 'mmt-serial-code-registry-time';
  const HISTORY_KEY = 'mmt-serial-code-success-history';
  const SYNC_INTERVAL = 60 * 60 * 1000;
  const REQUEST_INTERVAL = 4000;
  const MAX_CONSECUTIVE_ERRORS = 2;

  const state = {
    running: false,
    paused: false,
    verified: null,
    registry: null,
    rows: new Map(),
  };

  const officialForm = document.querySelector('.cdkey-form');
  const serverSelect = document.querySelector('#cdkey_select_server');
  const playerInput = document.querySelector('#cdkey_character');

  if (!officialForm || !serverSelect || !playerInput) return;

  GM_addStyleSafe(`
    #mmt-batch-tool { box-sizing: border-box; width: min(920px, calc(100% - 32px)); margin: 0 auto 36px; padding: 20px; border: 1px solid rgba(255,255,255,.24); border-radius: 10px; background: rgba(15,15,18,.94); color: #f5f1e8; font-family: sans-serif; line-height: 1.5; }
    #mmt-batch-tool * { box-sizing: border-box; }
    #mmt-batch-tool h2 { margin: 0 0 8px; font-size: 22px; }
    #mmt-batch-tool p { margin: 6px 0 12px; color: #c8c3bb; font-size: 14px; }
    #mmt-batch-tool textarea { width: 100%; min-height: 116px; resize: vertical; padding: 10px; border: 1px solid #777; border-radius: 6px; background: #fff; color: #222; font: 15px/1.6 monospace; }
    .mmt-batch-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .mmt-batch-actions button { min-height: 38px; padding: 7px 14px; border: 1px solid #a99a78; border-radius: 6px; background: #eee8d9; color: #201d18; cursor: pointer; font-weight: 700; }
    .mmt-batch-actions button:hover:not(:disabled) { background: #fff8e8; }
    .mmt-batch-actions button:disabled { cursor: not-allowed; opacity: .45; }
    .mmt-batch-actions .mmt-primary { background: #aa8534; border-color: #d2ad55; color: #fff; }
    .mmt-batch-actions .mmt-danger { background: #522; border-color: #a66; color: #fff; }
    #mmt-batch-status { margin-top: 12px; padding: 10px 12px; border-radius: 6px; background: rgba(255,255,255,.08); color: #e8e0cf; white-space: pre-wrap; }
    #mmt-batch-status[data-kind="success"] { background: rgba(56,133,88,.24); color: #b9efca; }
    #mmt-batch-status[data-kind="error"] { background: rgba(166,68,68,.25); color: #ffc2c2; }
    #mmt-batch-results { width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 13px; }
    #mmt-batch-results th, #mmt-batch-results td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,.14); text-align: left; overflow-wrap: anywhere; }
    #mmt-batch-results .success { color: #8ee0a8; }
    #mmt-batch-results .error { color: #ffaaa5; }
    #mmt-batch-results .pending { color: #d7c99f; }
    .mmt-batch-note { color: #ffcf79 !important; }
    @media (max-width: 600px) { #mmt-batch-tool { width: calc(100% - 20px); padding: 14px; } #mmt-batch-results th:nth-child(3), #mmt-batch-results td:nth-child(3) { display: none; } }
  `);

  const panel = document.createElement('section');
  panel.id = 'mmt-batch-tool';
  panel.innerHTML = `
    <h2>序列码批量兑换</h2>
    <p>每行填写一个序列码。脚本会先核对玩家，再按顺序逐个确认和提交。</p>
    <p class="mmt-batch-note">请先在下方官方表单选择 Server 并填写玩家 ID。错误代码过多可能触发官方临时限制。</p>
    <textarea id="mmt-batch-codes" spellcheck="false" placeholder="每行一个序列码"></textarea>
    <div class="mmt-batch-actions">
      <button id="mmt-sync-codes" type="button">同步公开码</button>
      <button id="mmt-verify-player" type="button">核对玩家</button>
      <button id="mmt-start-batch" class="mmt-primary" type="button" disabled>开始兑换</button>
      <button id="mmt-pause-batch" class="mmt-danger" type="button" disabled>暂停</button>
      <button id="mmt-clear-results" type="button">清空结果</button>
    </div>
    <div id="mmt-batch-status" role="status">尚未核对玩家。</div>
    <table id="mmt-batch-results" hidden>
      <thead><tr><th>序列码</th><th>状态</th><th>详情</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  officialForm.parentNode.insertBefore(panel, officialForm);

  const codeInput = panel.querySelector('#mmt-batch-codes');
  const syncButton = panel.querySelector('#mmt-sync-codes');
  const verifyButton = panel.querySelector('#mmt-verify-player');
  const startButton = panel.querySelector('#mmt-start-batch');
  const pauseButton = panel.querySelector('#mmt-pause-batch');
  const clearButton = panel.querySelector('#mmt-clear-results');
  const statusBox = panel.querySelector('#mmt-batch-status');
  const resultTable = panel.querySelector('#mmt-batch-results');
  const resultBody = resultTable.querySelector('tbody');

  function GM_addStyleSafe(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function setStatus(message, kind = '') {
    statusBox.textContent = message;
    statusBox.dataset.kind = kind;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getConfig() {
    const serverId = serverSelect.value;
    const serverName = serverSelect.selectedOptions[0]?.textContent?.trim() || '';
    const playerId = playerInput.value.trim();
    if (!serverId || serverSelect.selectedIndex <= 0) throw new Error('请先选择 Server。');
    if (!/^\d{1,12}$/.test(playerId)) throw new Error('玩家 ID 应为 1～12 位数字。');
    return { serverId, serverName, playerId };
  }

  function parseCodes() {
    const codes = [...new Set(codeInput.value.split(/\r?\n|,|，/).map(code => code.trim()).filter(Boolean))];
    if (!codes.length) throw new Error('请至少填写一个序列码。');
    const invalid = codes.find(code => !/^[0-9a-zA-Z]{1,50}$/.test(code));
    if (invalid) throw new Error(`序列码“${invalid}”包含无效字符。`);
    return codes;
  }

  async function requestApi(path, values) {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({
        ServerId: values.serverId,
        PlayerId: values.playerId,
        SerialCode: values.serialCode,
      }),
    });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = raw; }
    if (!response.ok) {
      const language = document.documentElement.lang || 'en';
      const message = data && typeof data === 'object'
        ? data[language] || data.en || `HTTP ${response.status}`
        : String(data || `HTTP ${response.status}`);
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data || {};
  }

  function registryRequest() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${REGISTRY_URL}?t=${Date.now()}`,
        timeout: 15000,
        onload(response) {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error(`HTTP ${response.status}`));
            return;
          }
          try { resolve(JSON.parse(response.responseText)); }
          catch { reject(new Error('公开码数据格式错误。')); }
        },
        onerror: () => reject(new Error('无法连接公开码数据源。')),
        ontimeout: () => reject(new Error('同步公开码超时。')),
      });
    });
  }

  async function syncRegistry(force = false) {
    const cached = GM_getValue(CACHE_KEY, null);
    const cachedAt = Number(GM_getValue(CACHE_TIME_KEY, 0));
    if (!force && cached && Date.now() - cachedAt < SYNC_INTERVAL) return cached;
    try {
      const registry = await registryRequest();
      if (!registry || !Array.isArray(registry.codes)) throw new Error('公开码数据缺少 codes 列表。');
      GM_setValue(CACHE_KEY, registry);
      GM_setValue(CACHE_TIME_KEY, Date.now());
      return registry;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  }

  function isActive(item) {
    const now = Date.now();
    if (!item.enabled) return false;
    if (item.validFrom && now < Date.parse(item.validFrom)) return false;
    if (item.expiresAt && now > Date.parse(item.expiresAt)) return false;
    return true;
  }

  function mergeRegistryCodes(registry) {
    const existing = codeInput.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const active = registry.codes.filter(isActive).map(item => item.code);
    codeInput.value = [...new Set([...existing, ...active])].join('\n');
    return active.length;
  }

  function ensureRow(code) {
    if (state.rows.has(code)) return state.rows.get(code);
    const row = document.createElement('tr');
    const codeCell = document.createElement('td');
    const stateCell = document.createElement('td');
    const detailCell = document.createElement('td');
    codeCell.textContent = code;
    row.append(codeCell, stateCell, detailCell);
    resultBody.appendChild(row);
    resultTable.hidden = false;
    const value = { row, stateCell, detailCell };
    state.rows.set(code, value);
    return value;
  }

  function updateRow(code, status, detail, kind = 'pending') {
    const row = ensureRow(code);
    row.stateCell.textContent = status;
    row.stateCell.className = kind;
    row.detailCell.textContent = detail || '';
  }

  function samePlayer(data, verified) {
    return String(data.playerId) === String(verified.playerId)
      && String(data.userName) === String(verified.userName)
      && String(data.world) === String(verified.world);
  }

  function currentConfigMatchesVerification() {
    if (!state.verified) return false;
    try {
      const current = getConfig();
      return current.serverId === state.verified.serverId && current.playerId === state.verified.playerId;
    } catch {
      return false;
    }
  }

  function invalidateVerification() {
    if (state.running) return;
    state.verified = null;
    startButton.disabled = true;
    setStatus('Server 或玩家 ID 已变化，请重新核对玩家。');
  }

  async function verifyPlayer() {
    verifyButton.disabled = true;
    startButton.disabled = true;
    try {
      const config = getConfig();
      const serialCode = parseCodes()[0];
      setStatus('正在核对玩家信息…');
      const data = await requestApi('Confirm', { ...config, serialCode });
      state.verified = {
        ...config,
        playerId: String(data.playerId),
        userName: String(data.userName || ''),
        world: String(data.world || ''),
      };
      startButton.disabled = false;
      setStatus(`已核对：${state.verified.userName} / ${state.verified.world}\nServer：${config.serverName}　玩家 ID：${state.verified.playerId}\n请确认无误后点击“开始兑换”。`, 'success');
    } catch (error) {
      state.verified = null;
      setStatus(`核对失败：${error.message}`, 'error');
    } finally {
      verifyButton.disabled = false;
    }
  }

  async function runBatch() {
    if (state.running) return;
    if (!currentConfigMatchesVerification()) {
      invalidateVerification();
      return;
    }

    let codes;
    try { codes = parseCodes(); }
    catch (error) { setStatus(error.message, 'error'); return; }

    state.running = true;
    state.paused = false;
    startButton.disabled = true;
    verifyButton.disabled = true;
    syncButton.disabled = true;
    pauseButton.disabled = false;
    codeInput.disabled = true;
    let consecutiveErrors = 0;
    let successCount = 0;
    const successHistory = GM_getValue(HISTORY_KEY, {});

    try {
      for (let index = 0; index < codes.length; index += 1) {
        const code = codes[index];
        if (state.paused) break;
        const historyKey = `${state.verified.serverId}:${state.verified.playerId}:${code.toUpperCase()}`;
        if (successHistory[historyKey]) {
          updateRow(code, '跳过', `本机记录已于 ${new Date(successHistory[historyKey]).toLocaleString()} 兑换成功。`, 'success');
          continue;
        }
        updateRow(code, '处理中', '正在确认玩家与序列码…');
        setStatus(`正在处理 ${index + 1}/${codes.length}：${code}`);
        try {
          const confirmed = await requestApi('Confirm', {
            serverId: state.verified.serverId,
            playerId: state.verified.playerId,
            serialCode: code,
          });
          if (!samePlayer(confirmed, state.verified)) {
            throw new Error('返回的玩家信息与已核对玩家不一致，已停止。');
          }
          await requestApi('Register', {
            serverId: state.verified.serverId,
            playerId: state.verified.playerId,
            serialCode: code,
          });
          consecutiveErrors = 0;
          successCount += 1;
          updateRow(code, '成功', '奖励将在稍后发送至礼物箱。', 'success');
          successHistory[historyKey] = new Date().toISOString();
          GM_setValue(HISTORY_KEY, successHistory);
        } catch (error) {
          consecutiveErrors += 1;
          updateRow(code, '失败', error.message, 'error');
          const fatalStatus = error.status === 403 || error.status === 429 || error.status >= 500;
          if (fatalStatus || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS || /不一致/.test(error.message)) {
            state.paused = true;
            setStatus(`已自动暂停：${error.message}\n请检查结果，不要连续重试错误代码。`, 'error');
            break;
          }
        }
        if (!state.paused && index < codes.length - 1) await sleep(REQUEST_INTERVAL);
      }
      if (!state.paused) setStatus(`处理完成：成功 ${successCount} 个，共 ${codes.length} 个。`, 'success');
    } finally {
      state.running = false;
      startButton.disabled = !currentConfigMatchesVerification();
      verifyButton.disabled = false;
      syncButton.disabled = false;
      pauseButton.disabled = true;
      codeInput.disabled = false;
    }
  }

  syncButton.addEventListener('click', async () => {
    syncButton.disabled = true;
    try {
      setStatus('正在同步公开序列码…');
      state.registry = await syncRegistry(true);
      const count = mergeRegistryCodes(state.registry);
      state.verified = null;
      startButton.disabled = true;
      setStatus(`同步完成：当前有 ${count} 个有效或未公布期限的公开码。请核对玩家。`, 'success');
    } catch (error) {
      setStatus(`同步失败：${error.message}`, 'error');
    } finally {
      syncButton.disabled = false;
    }
  });

  verifyButton.addEventListener('click', verifyPlayer);
  startButton.addEventListener('click', runBatch);
  pauseButton.addEventListener('click', () => {
    state.paused = true;
    pauseButton.disabled = true;
    setStatus('将在当前请求结束后暂停。');
  });
  clearButton.addEventListener('click', () => {
    if (state.running) return;
    state.rows.clear();
    resultBody.replaceChildren();
    resultTable.hidden = true;
  });
  serverSelect.addEventListener('change', invalidateVerification);
  playerInput.addEventListener('input', invalidateVerification);
  codeInput.addEventListener('input', () => {
    if (!state.running) {
      state.verified = null;
      startButton.disabled = true;
    }
  });

  syncRegistry(false)
    .then(registry => {
      state.registry = registry;
      const count = mergeRegistryCodes(registry);
      setStatus(`已载入 ${count} 个公开码。请选择 Server、填写玩家 ID，然后核对玩家。`);
    })
    .catch(error => setStatus(`公开码自动同步失败：${error.message}\n仍可手动输入序列码。`, 'error'));
})();
