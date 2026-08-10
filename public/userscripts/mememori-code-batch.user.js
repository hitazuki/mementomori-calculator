// ==UserScript==
// @name         MementoMori 序列码批量兑换
// @name:zh-CN   MementoMori 序列码批量兑换
// @name:zh-TW   MementoMori 序號批次兌換
// @name:en      MementoMori Serial Code Batch Redeemer
// @name:ja      メメントモリ シリアルコード一括入力
// @name:ko      메멘토모리 시리얼 코드 일괄 입력
// @namespace    https://github.com/hitazuki/mementomori-calculator
// @version      0.3.0
// @description  在 MementoMori 官方兑换页为多个账号串行填写公开序列码
// @description:zh-CN 在 MementoMori 官方兑换页为多个账号串行填写公开序列码
// @description:zh-TW 在 MementoMori 官方兌換頁為多個帳號依序填寫公開序號
// @description:en Redeem public serial codes sequentially for multiple accounts on the official MementoMori page
// @description:ja メメントモリ公式ページで複数アカウントの公開シリアルコードを順番に入力します
// @description:ko 메멘토모리 공식 페이지에서 여러 계정의 공개 시리얼 코드를 순차 입력합니다
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
// @grant        GM_deleteValue
// @connect      hitazuki.github.io
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const Core = (() => {
    const LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'];
    const MESSAGE_ROWS = [
      ['title', '序列码批量兑换', '序號批次兌換', 'Serial Code Batch Redeemer', 'シリアルコード一括入力', '시리얼 코드 일괄 입력'],
      ['description', '选择批次和账号，核对玩家后按账号顺序逐个提交。', '選擇批次與帳號，核對玩家後依帳號順序逐一送出。', 'Choose a batch and accounts, verify players, then submit sequentially.', 'グループとアカウントを選択し、プレイヤー確認後に順番に送信します。', '코드 묶음과 계정을 선택하고 플레이어 확인 후 순차 제출합니다.'],
      ['safetyNote', '错误代码过多可能触发官方临时限制；脚本不会并发请求。', '錯誤序號過多可能觸發官方暫時限制；腳本不會並行請求。', 'Too many invalid codes may trigger an official lockout. Requests are never concurrent.', '誤ったコードが多いと公式の一時制限が発生する場合があります。同時送信は行いません。', '잘못된 코드가 많으면 공식 일시 제한이 발생할 수 있습니다. 동시 요청은 하지 않습니다.'],
      ['batch', '兑换码批次', '序號批次', 'Code batch', 'コードグループ', '코드 묶음'],
      ['accounts', '账号', '帳號', 'Accounts', 'アカウント', '계정'],
      ['sync', '同步公开码', '同步公開序號', 'Sync public codes', '公開コードを同期', '공개 코드 동기화'],
      ['manageAccounts', '管理账号', '管理帳號', 'Manage accounts', 'アカウント管理', '계정 관리'],
      ['verifyAccounts', '核对所选账号', '核對所選帳號', 'Verify selected accounts', '選択アカウントを確認', '선택 계정 확인'],
      ['start', '开始兑换', '開始兌換', 'Start redemption', '入力開始', '입력 시작'],
      ['continueRun', '继续兑换', '繼續兌換', 'Continue redemption', '入力を再開', '입력 계속'],
      ['pause', '暂停', '暫停', 'Pause', '一時停止', '일시 정지'],
      ['clearResults', '清空结果', '清除結果', 'Clear results', '結果を消去', '결과 지우기'],
      ['resume', '恢复未完成任务', '恢復未完成工作', 'Restore unfinished queue', '未完了キューを復元', '미완료 작업 복원'],
      ['discardQueue', '放弃旧任务', '放棄舊工作', 'Discard old queue', '古いキューを破棄', '이전 작업 삭제'],
      ['noAccounts', '尚未保存账号，请先管理账号。', '尚未儲存帳號，請先管理帳號。', 'No saved accounts. Open account management first.', '保存済みアカウントがありません。管理画面で追加してください。', '저장된 계정이 없습니다. 계정 관리에서 추가하세요.'],
      ['noExpiry', '期限未公布', '期限未公布', 'No announced expiry', '期限未発表', '만료일 미공개'],
      ['expires', '截止 {date}', '截止 {date}', 'Expires {date}', '{date}まで', '{date}까지'],
      ['codeCount', '{count} 个', '{count} 個', '{count} codes', '{count}件', '{count}개'],
      ['taskSummary', '{accounts} 个账号，待兑换 {tasks} 项', '{accounts} 個帳號，待兌換 {tasks} 項', '{accounts} accounts, {tasks} pending tasks', '{accounts}アカウント、未入力{tasks}件', '{accounts}개 계정, 대기 작업 {tasks}개'],
      ['accountProgress', '{done}/{total} 已完成', '{done}/{total} 已完成', '{done}/{total} completed', '{done}/{total} 完了', '{done}/{total} 완료'],
      ['statusReady', '请选择批次和账号，然后核对玩家。', '請選擇批次與帳號，然後核對玩家。', 'Choose a batch and accounts, then verify players.', 'グループとアカウントを選択し、プレイヤーを確認してください。', '코드 묶음과 계정을 선택한 뒤 플레이어를 확인하세요.'],
      ['statusSyncing', '正在同步公开序列码…', '正在同步公開序號…', 'Syncing public codes…', '公開コードを同期中…', '공개 코드 동기화 중…'],
      ['statusLoaded', '已载入 {batches} 个批次，当前批次 {codes} 个代码。', '已載入 {batches} 個批次，目前批次有 {codes} 個序號。', 'Loaded {batches} batches; the current batch has {codes} codes.', '{batches}グループを読み込みました。現在は{codes}件です。', '{batches}개 묶음을 불러왔습니다. 현재 묶음은 {codes}개입니다.'],
      ['statusBatchChanged', '已切换批次，请重新核对账号。', '已切換批次，請重新核對帳號。', 'Batch changed. Verify the accounts again.', 'グループを変更しました。アカウントを再確認してください。', '코드 묶음이 변경되었습니다. 계정을 다시 확인하세요.'],
      ['statusNeedVerify', '账号或代码发生变化，请重新核对。', '帳號或序號已變更，請重新核對。', 'Accounts or codes changed. Verify again.', 'アカウントまたはコードが変更されました。再確認してください。', '계정 또는 코드가 변경되었습니다. 다시 확인하세요.'],
      ['statusVerifying', '正在核对 {current}/{total}：{account}', '正在核對 {current}/{total}：{account}', 'Verifying {current}/{total}: {account}', '確認中 {current}/{total}：{account}', '확인 중 {current}/{total}: {account}'],
      ['statusVerified', '已核对 {accounts} 个账号，待兑换 {tasks} 项。请确认玩家信息后开始。', '已核對 {accounts} 個帳號，待兌換 {tasks} 項。請確認玩家資訊後開始。', 'Verified {accounts} accounts with {tasks} pending tasks. Review players before starting.', '{accounts}アカウントを確認しました。未入力は{tasks}件です。内容を確認して開始してください。', '{accounts}개 계정을 확인했습니다. 대기 작업은 {tasks}개입니다. 플레이어 정보를 확인하고 시작하세요.'],
      ['statusRunning', '正在处理 {current}/{total}：{account} / {code}', '正在處理 {current}/{total}：{account} / {code}', 'Processing {current}/{total}: {account} / {code}', '処理中 {current}/{total}：{account} / {code}', '처리 중 {current}/{total}: {account} / {code}'],
      ['statusPausePending', '将在当前请求结束后暂停。', '將在目前請求結束後暫停。', 'Pausing after the current request.', '現在のリクエスト完了後に停止します。', '현재 요청이 끝난 뒤 일시 정지합니다.'],
      ['statusPaused', '任务已暂停，可稍后恢复。', '工作已暫停，可稍後恢復。', 'Queue paused. It can be restored later.', 'キューを一時停止しました。後で復元できます。', '작업이 일시 정지되었습니다. 나중에 복원할 수 있습니다.'],
      ['statusCompleted', '处理完成：成功 {success} 项，失败 {failed} 项，跳过 {skipped} 项。', '處理完成：成功 {success} 項，失敗 {failed} 項，略過 {skipped} 項。', 'Completed: {success} succeeded, {failed} failed, {skipped} skipped.', '完了：成功{success}件、失敗{failed}件、スキップ{skipped}件。', '완료: 성공 {success}개, 실패 {failed}개, 건너뜀 {skipped}개.'],
      ['statusResumeFound', '检测到未完成任务，需重新核对账号后才能继续。', '偵測到未完成工作，需重新核對帳號後才能繼續。', 'An unfinished queue was found. Accounts must be verified before continuing.', '未完了のキューがあります。再開前にアカウント確認が必要です。', '미완료 작업이 있습니다. 계속하려면 계정을 다시 확인해야 합니다.'],
      ['statusResumeReady', '旧任务已恢复并完成核对，请确认后继续。', '舊工作已恢復並完成核對，請確認後繼續。', 'The old queue is restored and verified. Review it, then continue.', '古いキューを復元して確認しました。内容を確認して再開してください。', '이전 작업을 복원하고 확인했습니다. 검토 후 계속하세요.'],
      ['statusQueueInvalid', '旧任务与当前账号或批次不兼容，请放弃后重新创建。', '舊工作與目前帳號或批次不相容，請放棄後重新建立。', 'The old queue no longer matches the accounts or active batch. Discard it and create a new one.', '古いキューは現在のアカウントまたはグループと一致しません。破棄して作り直してください。', '이전 작업이 현재 계정 또는 묶음과 맞지 않습니다. 삭제 후 다시 만드세요.'],
      ['statusSyncFailed', '公开码同步失败：{message}。仍可手动填写。', '公開序號同步失敗：{message}。仍可手動填寫。', 'Public-code sync failed: {message}. Codes can still be entered manually.', '公開コードの同期に失敗しました：{message}。手動入力は可能です。', '공개 코드 동기화 실패: {message}. 직접 입력할 수 있습니다.'],
      ['tableAccount', '账号', '帳號', 'Account', 'アカウント', '계정'],
      ['tableCode', '序列码', '序號', 'Code', 'コード', '코드'],
      ['tableStatus', '状态', '狀態', 'Status', '状態', '상태'],
      ['tableDetail', '详情', '詳細', 'Details', '詳細', '상세'],
      ['pending', '等待', '等待', 'Pending', '待機', '대기'],
      ['verifying', '核对中', '核對中', 'Verifying', '確認中', '확인 중'],
      ['verified', '已核对', '已核對', 'Verified', '確認済み', '확인됨'],
      ['success', '成功', '成功', 'Success', '成功', '성공'],
      ['failed', '失败', '失敗', 'Failed', '失敗', '실패'],
      ['skipped', '跳过', '略過', 'Skipped', 'スキップ', '건너뜀'],
      ['completed', '已完成', '已完成', 'Completed', '完了', '완료'],
      ['rewardDetail', '奖励将在稍后发送至礼物箱。', '獎勵將稍後發送至禮物箱。', 'Rewards will be delivered to the Presents Box later.', '報酬は後ほどプレゼントボックスに届きます。', '보상은 잠시 후 선물함으로 지급됩니다.'],
      ['historySkipped', '本机记录于 {date} 兑换成功。', '本機記錄於 {date} 兌換成功。', 'Recorded as successful on this device at {date}.', 'この端末で{date}に成功済みです。', '이 기기에서 {date}에 성공으로 기록되었습니다.'],
      ['managerTitle', '账号管理', '帳號管理', 'Account management', 'アカウント管理', '계정 관리'],
      ['alias', '备注', '備註', 'Alias', 'メモ', '별칭'],
      ['server', 'Server', 'Server', 'Server', 'Server', 'Server'],
      ['playerId', '玩家 ID', '玩家 ID', 'Player ID', 'プレイヤーID', '플레이어 ID'],
      ['saveAccount', '保存账号', '儲存帳號', 'Save account', 'アカウントを保存', '계정 저장'],
      ['resetForm', '新建/重置', '新增/重設', 'New / reset', '新規／リセット', '새로 만들기 / 초기화'],
      ['exportBackup', '导出备份', '匯出備份', 'Export backup', 'バックアップを書き出す', '백업 내보내기'],
      ['importBackup', '导入备份', '匯入備份', 'Import backup', 'バックアップを読み込む', '백업 가져오기'],
      ['close', '关闭', '關閉', 'Close', '閉じる', '닫기'],
      ['edit', '编辑', '編輯', 'Edit', '編集', '편집'],
      ['delete', '删除', '刪除', 'Delete', '削除', '삭제'],
      ['clearHistory', '清除记录', '清除記錄', 'Clear history', '履歴を消去', '기록 삭제'],
      ['reverify', '重新核对', '重新核對', 'Verify again', '再確認', '다시 확인'],
      ['unverified', '未核对', '未核對', 'Not verified', '未確認', '미확인'],
      ['unavailableServer', 'Server 当前不可用', 'Server 目前不可用', 'Server is currently unavailable', 'Serverは現在利用できません', '현재 Server를 사용할 수 없음'],
      ['confirmDelete', '删除账号“{account}”？兑换成功记录会保留。', '刪除帳號「{account}」？兌換成功記錄會保留。', 'Delete account “{account}”? Successful redemption history will be kept.', 'アカウント「{account}」を削除しますか？成功履歴は保持されます。', '“{account}” 계정을 삭제할까요? 성공 기록은 유지됩니다.'],
      ['confirmClearHistory', '清除账号“{account}”的全部本地兑换记录？此操作无法撤销。', '清除帳號「{account}」的全部本機兌換記錄？此操作無法復原。', 'Clear all local redemption history for “{account}”? This cannot be undone.', '「{account}」のローカル入力履歴をすべて消去しますか？元に戻せません。', '“{account}”의 모든 로컬 입력 기록을 삭제할까요? 되돌릴 수 없습니다.'],
      ['confirmImport', '导入 {accounts} 个账号和 {records} 条成功记录？数据将与本机记录合并。', '匯入 {accounts} 個帳號與 {records} 筆成功記錄？資料將與本機記錄合併。', 'Import {accounts} accounts and {records} successful records? They will be merged with local data.', '{accounts}アカウントと成功履歴{records}件を読み込みますか？ローカルデータに統合されます。', '{accounts}개 계정과 성공 기록 {records}개를 가져올까요? 로컬 데이터와 병합됩니다.'],
      ['backupImported', '备份导入完成。', '備份匯入完成。', 'Backup imported.', 'バックアップを読み込みました。', '백업을 가져왔습니다.'],
      ['errorSelectServer', '请选择 Server。', '請選擇 Server。', 'Select a Server.', 'Serverを選択してください。', 'Server를 선택하세요.'],
      ['errorPlayerId', '玩家 ID 应为 1～12 位数字。', '玩家 ID 應為 1～12 位數字。', 'Player ID must contain 1–12 digits.', 'プレイヤーIDは1～12桁の数字で入力してください。', '플레이어 ID는 1~12자리 숫자여야 합니다.'],
      ['errorNoCodes', '当前批次没有可填写的序列码。', '目前批次沒有可填寫的序號。', 'The current batch has no codes to redeem.', '現在のグループに入力可能なコードがありません。', '현재 묶음에 입력할 코드가 없습니다.'],
      ['errorInvalidCode', '序列码“{code}”包含无效字符。', '序號「{code}」包含無效字元。', 'Code “{code}” contains invalid characters.', 'コード「{code}」に使用できない文字が含まれています。', '코드 “{code}”에 사용할 수 없는 문자가 있습니다.'],
      ['errorSelectAccounts', '请至少选择一个账号。', '請至少選擇一個帳號。', 'Select at least one account.', 'アカウントを1つ以上選択してください。', '계정을 하나 이상 선택하세요.'],
      ['errorDuplicateAccount', '相同 Server 和玩家 ID 的账号已经存在。', '相同 Server 與玩家 ID 的帳號已存在。', 'An account with the same Server and Player ID already exists.', '同じServerとプレイヤーIDのアカウントが既にあります。', '같은 Server와 플레이어 ID의 계정이 이미 있습니다.'],
      ['errorPlayerMismatch', '返回的玩家信息与核对结果不一致，已停止。', '回傳的玩家資訊與核對結果不一致，已停止。', 'Returned player data differs from the verified account. The queue was stopped.', '返されたプレイヤー情報が確認結果と一致しないため停止しました。', '반환된 플레이어 정보가 확인 결과와 달라 작업을 중지했습니다.'],
      ['errorRegistryFormat', '公开码数据格式错误。', '公開序號資料格式錯誤。', 'The public-code data format is invalid.', '公開コードのデータ形式が不正です。', '공개 코드 데이터 형식이 잘못되었습니다.'],
      ['errorImport', '备份文件无效：{message}', '備份檔案無效：{message}', 'Invalid backup: {message}', 'バックアップが無効です：{message}', '잘못된 백업 파일: {message}'],
      ['httpError', '请求失败（HTTP {status}）', '請求失敗（HTTP {status}）', 'Request failed (HTTP {status})', 'リクエスト失敗（HTTP {status}）', '요청 실패 (HTTP {status})'],
    ];
    const messages = Object.fromEntries(MESSAGE_ROWS.map(row => [
      row[0],
      Object.fromEntries(LOCALES.map((locale, index) => [locale, row[index + 1]])),
    ]));
    const htmlLanguageMap = {
      ja: 'ja',
      en: 'en',
      'zh-cmn-Hant': 'zh-TW',
      'zh-cmn-Hans': 'zh-CN',
      ko: 'ko',
    };
    const dateLocaleMap = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      en: 'en-US',
      ja: 'ja-JP',
      ko: 'ko-KR',
    };

    function localeFromHtml(htmlLang) {
      return htmlLanguageMap[htmlLang] || 'en';
    }

    function translate(locale, key, params = {}) {
      let value = messages[key]?.[locale] || messages[key]?.en || key;
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
      return value;
    }

    function accountKey(account) {
      return `${String(account.serverId)}:${String(account.playerId)}`;
    }

    function redemptionKey(serverId, playerId, code) {
      return `${String(serverId)}:${String(playerId)}:${String(code).toUpperCase()}`;
    }

    function normalizeAccount(account, fallbackId = '') {
      if (!account || !/^\d+$/.test(String(account.serverId || ''))) throw new Error('invalid serverId');
      if (!/^\d{1,12}$/.test(String(account.playerId || ''))) throw new Error('invalid playerId');
      return {
        id: String(account.id || fallbackId),
        alias: String(account.alias || account.playerId).slice(0, 40),
        serverId: String(account.serverId),
        serverName: String(account.serverName || '').slice(0, 80),
        playerId: String(account.playerId),
        userName: String(account.userName || '').slice(0, 80),
        world: String(account.world || '').slice(0, 80),
        lastVerifiedAt: account.lastVerifiedAt || null,
        createdAt: account.createdAt || new Date().toISOString(),
        updatedAt: account.updatedAt || new Date().toISOString(),
      };
    }

    function mergeAccounts(localAccounts, incomingAccounts) {
      const merged = localAccounts.map(account => normalizeAccount(account, account.id));
      const byKey = new Map(merged.map((account, index) => [accountKey(account), index]));
      for (const raw of incomingAccounts) {
        const incoming = normalizeAccount(raw, raw.id || `import-${accountKey(raw)}`);
        const index = byKey.get(accountKey(incoming));
        if (index === undefined) {
          if (merged.some(account => account.id === incoming.id)) incoming.id = `import-${accountKey(incoming)}`;
          byKey.set(accountKey(incoming), merged.length);
          merged.push(incoming);
        } else if (Date.parse(incoming.updatedAt || 0) > Date.parse(merged[index].updatedAt || 0)) {
          merged[index] = { ...incoming, id: merged[index].id || incoming.id };
        }
      }
      return merged;
    }

    function normalizeRedemptions(raw) {
      const normalized = {};
      if (!raw || typeof raw !== 'object') return normalized;
      for (const [key, value] of Object.entries(raw)) {
        const match = key.match(/^(\d+):(\d{1,12}):([0-9a-zA-Z]{1,50})$/);
        if (!match) continue;
        const normalizedKey = redemptionKey(match[1], match[2], match[3]);
        if (typeof value === 'string') {
          if (!Number.isNaN(Date.parse(value))) normalized[normalizedKey] = { status: 'success', redeemedAt: value, batchKey: null };
        } else if (value?.status === 'success' && value.redeemedAt && !Number.isNaN(Date.parse(value.redeemedAt))) {
          normalized[normalizedKey] = {
            status: 'success',
            redeemedAt: String(value.redeemedAt),
            batchKey: value.batchKey || null,
          };
        }
      }
      return normalized;
    }

    function mergeRedemptions(local, incoming) {
      return { ...normalizeRedemptions(incoming), ...normalizeRedemptions(local) };
    }

    function createBackup(accounts, redemptions, now = new Date().toISOString()) {
      return {
        type: 'mmt-serial-code-backup',
        schemaVersion: 1,
        exportedAt: now,
        accounts: accounts.map(account => normalizeAccount(account, account.id)),
        redemptions: normalizeRedemptions(redemptions),
      };
    }

    function parseBackup(text) {
      const parsed = typeof text === 'string' ? JSON.parse(text) : text;
      if (!parsed || parsed.type !== 'mmt-serial-code-backup' || parsed.schemaVersion !== 1) {
        throw new Error('unsupported type or schemaVersion');
      }
      if (!Array.isArray(parsed.accounts) || !parsed.redemptions || typeof parsed.redemptions !== 'object') {
        throw new Error('missing accounts or redemptions');
      }
      const normalized = createBackup(parsed.accounts, parsed.redemptions, parsed.exportedAt);
      if (Object.keys(normalized.redemptions).length !== Object.keys(parsed.redemptions).length) {
        throw new Error('invalid redemption records');
      }
      return normalized;
    }

    function buildTasks(accounts, codes, redemptions) {
      const history = normalizeRedemptions(redemptions);
      return accounts.flatMap(account => codes
        .filter(code => !history[redemptionKey(account.serverId, account.playerId, code)])
        .map(code => ({ accountId: account.id, accountKey: accountKey(account), code })));
    }

    function taskFingerprint(accountIds, batchKey, codes) {
      return JSON.stringify({ accountIds, batchKey, codes });
    }

    function delayFor(currentTask, nextTask) {
      if (!nextTask) return 0;
      return currentTask.accountId === nextTask.accountId ? 4000 : 10000;
    }

    return {
      LOCALES,
      messages,
      dateLocaleMap,
      localeFromHtml,
      translate,
      accountKey,
      redemptionKey,
      normalizeAccount,
      mergeAccounts,
      normalizeRedemptions,
      mergeRedemptions,
      createBackup,
      parseBackup,
      buildTasks,
      taskFingerprint,
      delayFor,
    };
  })();

  if (globalThis.__MMT_SERIAL_CODE_TEST_MODE__) {
    globalThis.__MMT_SERIAL_CODE_CORE__ = Core;
    return;
  }

  const API_BASE = 'https://code-input.mememori-boi.com/SerialCode';
  const REGISTRY_URL = 'https://hitazuki.github.io/mementomori-calculator/data/serial-codes.json';
  const CACHE_KEY = 'mmt-serial-code-registry';
  const CACHE_TIME_KEY = 'mmt-serial-code-registry-time';
  const LEGACY_HISTORY_KEY = 'mmt-serial-code-success-history';
  const ACCOUNTS_KEY = 'mmt-serial-code-accounts-v1';
  const REDEMPTIONS_KEY = 'mmt-serial-code-redemptions-v1';
  const QUEUE_KEY = 'mmt-serial-code-queue-v1';
  const PREFERENCES_KEY = 'mmt-serial-code-preferences-v1';
  const SYNC_INTERVAL = 60 * 60 * 1000;
  const MAX_CONSECUTIVE_ERRORS = 2;
  const locale = Core.localeFromHtml(document.documentElement.lang);
  const t = (key, params) => Core.translate(locale, key, params);
  const formatDate = value => new Intl.DateTimeFormat(Core.dateLocaleMap[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

  const officialForm = document.querySelector('.cdkey-form');
  const serverSelect = document.querySelector('#cdkey_select_server');
  const playerInput = document.querySelector('#cdkey_character');
  if (!officialForm || !serverSelect || !playerInput) return;

  const state = {
    running: false,
    paused: false,
    registry: null,
    batches: [],
    accounts: [],
    redemptions: {},
    preferences: { selectedAccountIds: [], lastAccountId: null },
    verifiedAccounts: new Map(),
    verifiedFingerprint: null,
    queue: null,
    resumeCandidate: null,
    rows: new Map(),
    editingAccountId: null,
  };

  function uuid() {
    return globalThis.crypto?.randomUUID?.() || `account-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadStores() {
    const accountStore = GM_getValue(ACCOUNTS_KEY, { schemaVersion: 1, accounts: [] });
    try {
      state.accounts = Core.mergeAccounts([], Array.isArray(accountStore) ? accountStore : accountStore.accounts || []);
    } catch {
      state.accounts = [];
    }
    const current = Core.normalizeRedemptions(GM_getValue(REDEMPTIONS_KEY, {}));
    const legacy = Core.normalizeRedemptions(GM_getValue(LEGACY_HISTORY_KEY, {}));
    state.redemptions = Core.mergeRedemptions(current, legacy);
    GM_setValue(REDEMPTIONS_KEY, state.redemptions);
    state.preferences = {
      selectedAccountIds: [],
      lastAccountId: null,
      ...GM_getValue(PREFERENCES_KEY, {}),
    };
    state.queue = GM_getValue(QUEUE_KEY, null);
  }

  function saveAccounts() {
    GM_setValue(ACCOUNTS_KEY, { schemaVersion: 1, accounts: state.accounts });
  }

  function saveRedemptions() {
    GM_setValue(REDEMPTIONS_KEY, state.redemptions);
  }

  function savePreferences() {
    GM_setValue(PREFERENCES_KEY, state.preferences);
  }

  loadStores();

  const style = document.createElement('style');
  style.textContent = `
    #mmt-batch-tool { box-sizing:border-box; flex:1 1 420px; width:min(980px,calc(100% - 24px)); min-width:320px; margin:0 auto 36px; padding:18px; border:1px solid rgba(255,255,255,.24); border-radius:10px; background:rgba(15,15,18,.95); color:#f5f1e8; font-family:sans-serif; line-height:1.5; }
    #mmt-batch-tool *,.mmt-modal * { box-sizing:border-box; }
    #mmt-batch-tool h2 { margin:0 0 8px; font-size:22px; }
    #mmt-batch-tool p { margin:6px 0 10px; color:#c8c3bb; font-size:14px; }
    #mmt-batch-tool .mmt-note { color:#ffcf79; }
    .mmt-field { display:grid; gap:6px; margin:12px 0; color:#e8e0cf; font-size:14px; font-weight:700; }
    .mmt-field select,.mmt-field input,#mmt-batch-codes,.mmt-modal input,.mmt-modal select { width:100%; min-height:40px; padding:7px 10px; border:1px solid #777; border-radius:6px; background:#fff; color:#222; font:14px sans-serif; }
    #mmt-batch-codes { min-height:105px; resize:vertical; font:15px/1.6 monospace; }
    .mmt-heading-row,.mmt-actions,.mmt-manager-actions,.mmt-account-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
    .mmt-heading-row { justify-content:space-between; margin-top:12px; }
    .mmt-heading-row h3 { margin:0; font-size:15px; }
    .mmt-account-list { display:grid; gap:6px; max-height:190px; margin:8px 0; overflow:auto; }
    .mmt-account-option { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:8px; padding:8px; border:1px solid rgba(255,255,255,.14); border-radius:6px; background:rgba(255,255,255,.04); cursor:pointer; }
    .mmt-account-option[data-unavailable="true"] { opacity:.55; }
    .mmt-account-main { min-width:0; }
    .mmt-account-name { display:block; overflow:hidden; color:#f4ead4; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
    .mmt-account-meta,.mmt-account-progress { display:block; color:#aaa49a; font-size:12px; }
    .mmt-account-progress { color:#d7c99f; text-align:right; }
    .mmt-task-summary { margin:8px 0; padding:8px 10px; border-radius:6px; background:rgba(255,255,255,.07); color:#e8e0cf; font-size:13px; }
    .mmt-actions { margin-top:10px; }
    .mmt-button { min-height:38px; padding:7px 12px; border:1px solid #a99a78; border-radius:6px; background:#eee8d9; color:#201d18; cursor:pointer; font-weight:700; }
    .mmt-button:hover:not(:disabled) { background:#fff8e8; }
    .mmt-button:disabled { cursor:not-allowed; opacity:.45; }
    .mmt-primary { background:#aa8534; border-color:#d2ad55; color:#fff; }
    .mmt-danger { background:#522; border-color:#a66; color:#fff; }
    .mmt-small { min-height:30px; padding:4px 8px; font-size:12px; }
    #mmt-batch-status { margin-top:12px; padding:10px 12px; border-radius:6px; background:rgba(255,255,255,.08); color:#e8e0cf; white-space:pre-wrap; }
    #mmt-batch-status[data-kind="success"] { background:rgba(56,133,88,.24); color:#b9efca; }
    #mmt-batch-status[data-kind="error"] { background:rgba(166,68,68,.25); color:#ffc2c2; }
    #mmt-batch-results { width:100%; margin-top:14px; border-collapse:collapse; font-size:12px; }
    #mmt-batch-results th,#mmt-batch-results td { padding:7px 6px; border-bottom:1px solid rgba(255,255,255,.14); text-align:left; overflow-wrap:anywhere; }
    #mmt-batch-results .success { color:#8ee0a8; } #mmt-batch-results .error { color:#ffaaa5; } #mmt-batch-results .pending { color:#d7c99f; }
    .mmt-queue-actions { display:none; gap:8px; margin-top:8px; }
    .mmt-modal-backdrop { position:fixed; inset:0; z-index:100000; display:none; place-items:center; padding:18px; background:rgba(0,0,0,.78); }
    .mmt-modal-backdrop[data-open="true"] { display:grid; }
    .mmt-modal { width:min(760px,100%); max-height:90vh; overflow:auto; padding:18px; border:1px solid #777; border-radius:10px; background:#171719; color:#f5f1e8; font-family:sans-serif; }
    .mmt-modal h2 { margin:0 0 14px; }
    .mmt-manager-form { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
    .mmt-manager-list { display:grid; gap:8px; margin:16px 0; }
    .mmt-manager-account { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; padding:10px; border:1px solid rgba(255,255,255,.16); border-radius:7px; }
    .mmt-manager-account strong,.mmt-manager-account span { display:block; }
    .mmt-manager-account span { color:#aaa49a; font-size:12px; }
    @media(max-width:700px){ #mmt-batch-tool{width:calc(100% - 16px);min-width:0;padding:13px}.mmt-manager-form{grid-template-columns:1fr}.mmt-manager-account{grid-template-columns:1fr}.mmt-actions .mmt-button{flex:1 1 auto}#mmt-batch-results th:nth-child(4),#mmt-batch-results td:nth-child(4){display:none} }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'mmt-batch-tool';
  panel.innerHTML = `
    <h2>${t('title')}</h2>
    <p>${t('description')}</p>
    <p class="mmt-note">${t('safetyNote')}</p>
    <label class="mmt-field">${t('batch')}<select id="mmt-code-batch" disabled><option>${t('statusSyncing')}</option></select></label>
    <textarea id="mmt-batch-codes" spellcheck="false"></textarea>
    <div class="mmt-heading-row"><h3>${t('accounts')}</h3><button id="mmt-manage-accounts" class="mmt-button mmt-small" type="button">${t('manageAccounts')}</button></div>
    <div id="mmt-account-list" class="mmt-account-list"></div>
    <div id="mmt-task-summary" class="mmt-task-summary"></div>
    <div class="mmt-actions">
      <button id="mmt-sync-codes" class="mmt-button" type="button">${t('sync')}</button>
      <button id="mmt-verify-accounts" class="mmt-button" type="button">${t('verifyAccounts')}</button>
      <button id="mmt-start-batch" class="mmt-button mmt-primary" type="button" disabled>${t('start')}</button>
      <button id="mmt-pause-batch" class="mmt-button mmt-danger" type="button" disabled>${t('pause')}</button>
      <button id="mmt-clear-results" class="mmt-button" type="button">${t('clearResults')}</button>
    </div>
    <div id="mmt-batch-status" role="status">${t('statusReady')}</div>
    <div id="mmt-queue-actions" class="mmt-queue-actions">
      <button id="mmt-resume-queue" class="mmt-button" type="button">${t('resume')}</button>
      <button id="mmt-discard-queue" class="mmt-button mmt-danger" type="button">${t('discardQueue')}</button>
    </div>
    <table id="mmt-batch-results" hidden><thead><tr><th>${t('tableAccount')}</th><th>${t('tableCode')}</th><th>${t('tableStatus')}</th><th>${t('tableDetail')}</th></tr></thead><tbody></tbody></table>
  `;
  officialForm.parentNode.insertBefore(panel, officialForm);

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'mmt-modal-backdrop';
  modalBackdrop.innerHTML = `
    <section class="mmt-modal" role="dialog" aria-modal="true">
      <h2>${t('managerTitle')}</h2>
      <div class="mmt-manager-form">
        <label class="mmt-field">${t('alias')}<input id="mmt-account-alias" maxlength="40"></label>
        <label class="mmt-field">${t('server')}<select id="mmt-account-server"></select></label>
        <label class="mmt-field">${t('playerId')}<input id="mmt-account-player" inputmode="numeric" maxlength="12"></label>
      </div>
      <div class="mmt-manager-actions">
        <button id="mmt-save-account" class="mmt-button mmt-primary" type="button">${t('saveAccount')}</button>
        <button id="mmt-reset-account" class="mmt-button" type="button">${t('resetForm')}</button>
        <button id="mmt-export-backup" class="mmt-button" type="button">${t('exportBackup')}</button>
        <button id="mmt-import-backup" class="mmt-button" type="button">${t('importBackup')}</button>
        <button id="mmt-close-manager" class="mmt-button" type="button">${t('close')}</button>
      </div>
      <input id="mmt-import-file" type="file" accept="application/json,.json" hidden>
      <div id="mmt-manager-list" class="mmt-manager-list"></div>
    </section>
  `;
  document.body.appendChild(modalBackdrop);

  const codeInput = panel.querySelector('#mmt-batch-codes');
  const batchSelect = panel.querySelector('#mmt-code-batch');
  const accountList = panel.querySelector('#mmt-account-list');
  const taskSummary = panel.querySelector('#mmt-task-summary');
  const syncButton = panel.querySelector('#mmt-sync-codes');
  const verifyButton = panel.querySelector('#mmt-verify-accounts');
  const startButton = panel.querySelector('#mmt-start-batch');
  const pauseButton = panel.querySelector('#mmt-pause-batch');
  const clearButton = panel.querySelector('#mmt-clear-results');
  const manageButton = panel.querySelector('#mmt-manage-accounts');
  const statusBox = panel.querySelector('#mmt-batch-status');
  const queueActions = panel.querySelector('#mmt-queue-actions');
  const resumeButton = panel.querySelector('#mmt-resume-queue');
  const discardButton = panel.querySelector('#mmt-discard-queue');
  const resultTable = panel.querySelector('#mmt-batch-results');
  const resultBody = resultTable.querySelector('tbody');
  const aliasInput = modalBackdrop.querySelector('#mmt-account-alias');
  const managerServer = modalBackdrop.querySelector('#mmt-account-server');
  const managerPlayer = modalBackdrop.querySelector('#mmt-account-player');
  const managerList = modalBackdrop.querySelector('#mmt-manager-list');
  const importFile = modalBackdrop.querySelector('#mmt-import-file');

  function setStatus(message, kind = '') {
    statusBox.textContent = message;
    statusBox.dataset.kind = kind;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitWithPause(ms) {
    const deadline = Date.now() + ms;
    while (!state.paused && Date.now() < deadline) {
      await sleep(Math.min(250, deadline - Date.now()));
    }
    return !state.paused;
  }

  function availableServerIds() {
    return new Set([...serverSelect.options].filter(option => option.value).map(option => option.value));
  }

  function selectedAccounts() {
    const selected = new Set(state.preferences.selectedAccountIds);
    return state.accounts.filter(account => selected.has(account.id));
  }

  function parseCodes() {
    const codes = [...new Set(codeInput.value.split(/\r?\n|,|，/).map(code => code.trim()).filter(Boolean))];
    if (!codes.length) throw new Error(t('errorNoCodes'));
    const invalid = codes.find(code => !/^[0-9a-zA-Z]{1,50}$/.test(code));
    if (invalid) throw new Error(t('errorInvalidCode', { code: invalid }));
    return codes;
  }

  function setOfficialAccount(account) {
    if (!availableServerIds().has(account.serverId)) throw new Error(t('unavailableServer'));
    serverSelect.value = account.serverId;
    playerInput.value = account.playerId;
    serverSelect.dispatchEvent(new Event('change', { bubbles: true }));
    playerInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function invalidateVerification(message = t('statusNeedVerify')) {
    if (state.running) return;
    state.verifiedAccounts.clear();
    state.verifiedFingerprint = null;
    startButton.disabled = true;
    startButton.textContent = t('start');
    setStatus(message);
  }

  function currentFingerprint() {
    return Core.taskFingerprint(selectedAccounts().map(account => account.id), batchSelect.value, parseCodes());
  }

  function completedCount(account, codes) {
    return codes.filter(code => state.redemptions[Core.redemptionKey(account.serverId, account.playerId, code)]).length;
  }

  function renderTaskSummary() {
    let codes = [];
    try { codes = parseCodes(); } catch { /* empty data is rendered as zero */ }
    const accounts = selectedAccounts();
    const pending = accounts.reduce((sum, account) => sum + codes.length - completedCount(account, codes), 0);
    taskSummary.textContent = t('taskSummary', { accounts: accounts.length, tasks: pending });
  }

  function renderAccounts() {
    accountList.replaceChildren();
    const validIds = new Set(state.accounts.map(account => account.id));
    state.preferences.selectedAccountIds = state.preferences.selectedAccountIds.filter(id => validIds.has(id));
    if (!state.preferences.selectedAccountIds.length && state.accounts.length) {
      const preferred = state.accounts.find(account => account.id === state.preferences.lastAccountId) || state.accounts[0];
      state.preferences.selectedAccountIds = [preferred.id];
    }
    savePreferences();
    let codes = [];
    try { codes = parseCodes(); } catch { /* no progress yet */ }
    if (!state.accounts.length) {
      const empty = document.createElement('p');
      empty.textContent = t('noAccounts');
      accountList.appendChild(empty);
      renderTaskSummary();
      return;
    }
    const servers = availableServerIds();
    for (const account of state.accounts) {
      const label = document.createElement('label');
      label.className = 'mmt-account-option';
      label.dataset.unavailable = String(!servers.has(account.serverId));
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.preferences.selectedAccountIds.includes(account.id);
      checkbox.disabled = !servers.has(account.serverId) || state.running;
      const main = document.createElement('span');
      main.className = 'mmt-account-main';
      const name = document.createElement('span');
      name.className = 'mmt-account-name';
      name.textContent = account.alias;
      const meta = document.createElement('span');
      meta.className = 'mmt-account-meta';
      meta.textContent = servers.has(account.serverId)
        ? `${account.serverName} / ${account.userName ? `${account.userName} · ${account.world}` : account.playerId}`
        : `${account.serverName} / ${t('unavailableServer')}`;
      main.append(name, meta);
      const progress = document.createElement('span');
      progress.className = 'mmt-account-progress';
      progress.textContent = t('accountProgress', { done: completedCount(account, codes), total: codes.length });
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          state.preferences.selectedAccountIds = [...new Set([...state.preferences.selectedAccountIds, account.id])];
          state.preferences.lastAccountId = account.id;
          try { setOfficialAccount(account); } catch { /* unavailable checkbox is disabled */ }
        } else {
          state.preferences.selectedAccountIds = state.preferences.selectedAccountIds.filter(id => id !== account.id);
        }
        savePreferences();
        renderTaskSummary();
        invalidateVerification();
      });
      label.append(checkbox, main, progress);
      accountList.appendChild(label);
    }
    renderTaskSummary();
  }

  function refreshManagerServers(selectedValue = '') {
    managerServer.replaceChildren();
    for (const option of [...serverSelect.options].filter(item => item.value)) {
      const clone = document.createElement('option');
      clone.value = option.value;
      clone.textContent = option.textContent;
      managerServer.appendChild(clone);
    }
    if (selectedValue) managerServer.value = selectedValue;
  }

  function resetAccountForm() {
    state.editingAccountId = null;
    aliasInput.value = '';
    managerPlayer.value = '';
    refreshManagerServers();
  }

  function renderManagerAccounts() {
    managerList.replaceChildren();
    for (const account of state.accounts) {
      const row = document.createElement('article');
      row.className = 'mmt-manager-account';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = account.alias;
      const meta = document.createElement('span');
      meta.textContent = `${account.serverName} / ${account.playerId} / ${account.userName || t('unverified')} ${account.world || ''}`;
      info.append(title, meta);
      const actions = document.createElement('div');
      actions.className = 'mmt-account-actions';
      const buttons = [
        [t('edit'), () => {
          state.editingAccountId = account.id;
          aliasInput.value = account.alias;
          managerPlayer.value = account.playerId;
          refreshManagerServers(account.serverId);
        }],
        [t('reverify'), () => {
          state.preferences.selectedAccountIds = [account.id];
          state.preferences.lastAccountId = account.id;
          savePreferences();
          modalBackdrop.dataset.open = 'false';
          renderAccounts();
          verifySelectedAccounts();
        }],
        [t('clearHistory'), () => {
          if (!window.confirm(t('confirmClearHistory', { account: account.alias }))) return;
          const prefix = `${account.serverId}:${account.playerId}:`;
          state.redemptions = Object.fromEntries(Object.entries(state.redemptions).filter(([key]) => !key.startsWith(prefix)));
          saveRedemptions();
          renderAccounts();
        }],
        [t('delete'), () => {
          if (!window.confirm(t('confirmDelete', { account: account.alias }))) return;
          state.accounts = state.accounts.filter(item => item.id !== account.id);
          state.preferences.selectedAccountIds = state.preferences.selectedAccountIds.filter(id => id !== account.id);
          saveAccounts();
          savePreferences();
          renderManagerAccounts();
          renderAccounts();
        }, true],
      ];
      for (const [text, handler, danger] of buttons) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `mmt-button mmt-small${danger ? ' mmt-danger' : ''}`;
        button.textContent = text;
        button.addEventListener('click', handler);
        actions.appendChild(button);
      }
      row.append(info, actions);
      managerList.appendChild(row);
    }
  }

  function saveAccountFromManager() {
    const serverId = managerServer.value;
    const playerId = managerPlayer.value.trim();
    if (!serverId) { setStatus(t('errorSelectServer'), 'error'); return; }
    if (!/^\d{1,12}$/.test(playerId)) { setStatus(t('errorPlayerId'), 'error'); return; }
    const duplicate = state.accounts.find(account => account.serverId === serverId && account.playerId === playerId && account.id !== state.editingAccountId);
    if (duplicate) { setStatus(t('errorDuplicateAccount'), 'error'); return; }
    const old = state.accounts.find(account => account.id === state.editingAccountId);
    const sameIdentity = old && old.serverId === serverId && old.playerId === playerId;
    const now = new Date().toISOString();
    const account = Core.normalizeAccount({
      id: old?.id || uuid(),
      alias: aliasInput.value.trim() || playerId,
      serverId,
      serverName: managerServer.selectedOptions[0]?.textContent?.trim() || '',
      playerId,
      userName: sameIdentity ? old.userName : '',
      world: sameIdentity ? old.world : '',
      lastVerifiedAt: sameIdentity ? old.lastVerifiedAt : null,
      createdAt: old?.createdAt || now,
      updatedAt: now,
    });
    state.accounts = old
      ? state.accounts.map(item => item.id === old.id ? account : item)
      : [...state.accounts, account];
    state.preferences.selectedAccountIds = [account.id];
    state.preferences.lastAccountId = account.id;
    saveAccounts();
    savePreferences();
    resetAccountForm();
    renderManagerAccounts();
    renderAccounts();
    invalidateVerification();
  }

  function exportBackup() {
    const backup = Core.createBackup(state.accounts, state.redemptions);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mmt-serial-code-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(file) {
    try {
      const backup = Core.parseBackup(await file.text());
      if (!window.confirm(t('confirmImport', {
        accounts: backup.accounts.length,
        records: Object.keys(backup.redemptions).length,
      }))) return;
      state.accounts = Core.mergeAccounts(state.accounts, backup.accounts);
      state.redemptions = Core.mergeRedemptions(state.redemptions, backup.redemptions);
      saveAccounts();
      saveRedemptions();
      renderManagerAccounts();
      renderAccounts();
      invalidateVerification();
      setStatus(t('backupImported'), 'success');
    } catch (error) {
      setStatus(t('errorImport', { message: error.message }), 'error');
    } finally {
      importFile.value = '';
    }
  }

  async function requestApi(path, account, serialCode) {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({
        ServerId: account.serverId,
        PlayerId: account.playerId,
        SerialCode: serialCode,
      }),
    });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = raw; }
    if (!response.ok) {
      const pageLanguage = document.documentElement.lang || 'en';
      const message = data && typeof data === 'object'
        ? data[pageLanguage] || data.en || t('httpError', { status: response.status })
        : String(data || t('httpError', { status: response.status }));
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
          if (response.status < 200 || response.status >= 300) { reject(new Error(`HTTP ${response.status}`)); return; }
          try { resolve(JSON.parse(response.responseText)); } catch { reject(new Error(t('errorRegistryFormat'))); }
        },
        onerror: () => reject(new Error(t('httpError', { status: 0 }))),
        ontimeout: () => reject(new Error(t('httpError', { status: 0 }))),
      });
    });
  }

  async function syncRegistry(force = false) {
    const cached = GM_getValue(CACHE_KEY, null);
    const cachedAt = Number(GM_getValue(CACHE_TIME_KEY, 0));
    if (!force && cached && Date.now() - cachedAt < SYNC_INTERVAL) return cached;
    try {
      const registry = await registryRequest();
      if (!registry || !Array.isArray(registry.codes)) throw new Error(t('errorRegistryFormat'));
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
    return Boolean(item.enabled)
      && (!item.validFrom || now >= Date.parse(item.validFrom))
      && (!item.expiresAt || now <= Date.parse(item.expiresAt));
  }

  function groupRegistryCodes(registry) {
    const batches = new Map();
    for (const item of registry.codes.filter(isActive)) {
      const key = item.expiresAt || 'no-expiry';
      if (!batches.has(key)) batches.set(key, { key, expiresAt: item.expiresAt, codes: [] });
      batches.get(key).codes.push(item);
    }
    return [...batches.values()].sort((left, right) => {
      if (!left.expiresAt && !right.expiresAt) return 0;
      if (!left.expiresAt) return 1;
      if (!right.expiresAt) return -1;
      return Date.parse(left.expiresAt) - Date.parse(right.expiresAt);
    });
  }

  function batchLabel(batch) {
    const titles = [...new Set(batch.codes.map(item => item.title).filter(Boolean))];
    const prefix = titles.length === 1 && titles[0] !== 'Public serial code' ? `${titles[0]} · ` : '';
    const expiry = batch.expiresAt ? t('expires', { date: formatDate(batch.expiresAt) }) : t('noExpiry');
    return `${prefix}${expiry} · ${t('codeCount', { count: batch.codes.length })}`;
  }

  function renderBatchOptions(registry, preferredKey = batchSelect.value) {
    state.batches = groupRegistryCodes(registry);
    batchSelect.replaceChildren();
    for (const batch of state.batches) {
      const option = document.createElement('option');
      option.value = batch.key;
      option.textContent = batchLabel(batch);
      batchSelect.appendChild(option);
    }
    if (state.batches.some(batch => batch.key === preferredKey)) batchSelect.value = preferredKey;
    batchSelect.disabled = state.batches.length === 0;
  }

  function fillSelectedBatch() {
    const batch = state.batches.find(item => item.key === batchSelect.value);
    codeInput.value = batch ? batch.codes.map(item => item.code).join('\n') : '';
    renderAccounts();
    invalidateVerification(t('statusBatchChanged'));
    return batch;
  }

  function ensureResultRow(account, code) {
    const key = `${account.id}:${code}`;
    if (state.rows.has(key)) return state.rows.get(key);
    const row = document.createElement('tr');
    const accountCell = document.createElement('td');
    const codeCell = document.createElement('td');
    const statusCell = document.createElement('td');
    const detailCell = document.createElement('td');
    accountCell.textContent = account.alias;
    codeCell.textContent = code;
    row.append(accountCell, codeCell, statusCell, detailCell);
    resultBody.appendChild(row);
    resultTable.hidden = false;
    const value = { statusCell, detailCell };
    state.rows.set(key, value);
    return value;
  }

  function updateResult(account, code, statusKey, detail, kind = 'pending') {
    const row = ensureResultRow(account, code);
    row.statusCell.textContent = t(statusKey);
    row.statusCell.className = kind;
    row.detailCell.textContent = detail || '';
  }

  function samePlayer(data, verified) {
    return String(data.playerId) === String(verified.playerId)
      && String(data.userName) === String(verified.userName)
      && String(data.world) === String(verified.world);
  }

  function setControlsRunning(running) {
    syncButton.disabled = running;
    verifyButton.disabled = running;
    manageButton.disabled = running;
    batchSelect.disabled = running || state.batches.length === 0;
    codeInput.disabled = running;
    pauseButton.disabled = !running;
    renderAccounts();
  }

  async function verifySelectedAccounts(options = {}) {
    if (state.running) return false;
    let accounts;
    let codes;
    try {
      accounts = selectedAccounts();
      codes = parseCodes();
      if (!accounts.length) throw new Error(t('errorSelectAccounts'));
    } catch (error) {
      setStatus(error.message, 'error');
      return false;
    }
    state.running = true;
    state.paused = false;
    state.verifiedAccounts.clear();
    state.verifiedFingerprint = null;
    setControlsRunning(true);
    pauseButton.disabled = true;
    let success = true;
    try {
      for (let index = 0; index < accounts.length; index += 1) {
        const account = accounts[index];
        const pending = codes.filter(code => !state.redemptions[Core.redemptionKey(account.serverId, account.playerId, code)]);
        if (!pending.length) {
          state.verifiedAccounts.set(account.id, { ...account });
          updateResult(account, '—', 'completed', t('accountProgress', { done: codes.length, total: codes.length }), 'success');
          continue;
        }
        setStatus(t('statusVerifying', { current: index + 1, total: accounts.length, account: account.alias }));
        updateResult(account, pending[0], 'verifying', '', 'pending');
        setOfficialAccount(account);
        const data = await requestApi('Confirm', account, pending[0]);
        const verified = {
          ...account,
          playerId: String(data.playerId),
          userName: String(data.userName || ''),
          world: String(data.world || ''),
          lastVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.accounts = state.accounts.map(item => item.id === account.id ? verified : item);
        state.verifiedAccounts.set(account.id, verified);
        updateResult(verified, pending[0], 'verified', `${verified.userName} / ${verified.world}`, 'success');
        saveAccounts();
        if (index < accounts.length - 1) await sleep(4000);
      }
      state.verifiedFingerprint = currentFingerprint();
      const tasks = Core.buildTasks(selectedAccounts(), codes, state.redemptions);
      startButton.disabled = tasks.length === 0;
      startButton.textContent = options.resume ? t('continueRun') : t('start');
      if (options.resume) {
        state.resumeCandidate = options.resume;
        setStatus(t('statusResumeReady'), 'success');
      } else {
        state.resumeCandidate = null;
        setStatus(t('statusVerified', { accounts: accounts.length, tasks: tasks.length }), 'success');
      }
      renderAccounts();
    } catch (error) {
      success = false;
      state.verifiedAccounts.clear();
      state.verifiedFingerprint = null;
      startButton.disabled = true;
      setStatus(error.message, 'error');
    } finally {
      state.running = false;
      setControlsRunning(false);
    }
    return success;
  }

  function createQueue() {
    const accounts = selectedAccounts();
    const codes = parseCodes();
    return {
      schemaVersion: 1,
      status: 'paused',
      batchKey: batchSelect.value,
      accountIds: accounts.map(account => account.id),
      codes,
      tasks: Core.buildTasks(accounts, codes, state.redemptions),
      nextTaskIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function queueIsCompatible(queue) {
    if (!queue || queue.schemaVersion !== 1 || !Array.isArray(queue.accountIds) || !Array.isArray(queue.codes) || !Array.isArray(queue.tasks)) return false;
    if (!queue.accountIds.every(id => state.accounts.some(account => account.id === id))) return false;
    if (!queue.tasks.every(task => {
      const account = state.accounts.find(item => item.id === task.accountId);
      return account && task.accountKey === Core.accountKey(account);
    })) return false;
    const batch = state.batches.find(item => item.key === queue.batchKey);
    if (!batch) return false;
    const activeCodes = new Set(batch.codes.map(item => item.code.toUpperCase()));
    return queue.codes.every(code => activeCodes.has(String(code).toUpperCase()));
  }

  function saveQueue(queue, status = queue.status) {
    queue.status = status;
    queue.updatedAt = new Date().toISOString();
    state.queue = queue;
    GM_setValue(QUEUE_KEY, queue);
  }

  function showQueuePrompt(show) {
    queueActions.style.display = show ? 'flex' : 'none';
  }

  async function runQueue() {
    if (state.running) return;
    let queue;
    try {
      if (currentFingerprint() !== state.verifiedFingerprint) throw new Error(t('statusNeedVerify'));
      queue = state.resumeCandidate || createQueue();
      if (state.resumeCandidate && !queueIsCompatible(queue)) throw new Error(t('statusQueueInvalid'));
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }
    state.resumeCandidate = null;
    state.running = true;
    state.paused = false;
    setControlsRunning(true);
    startButton.disabled = true;
    showQueuePrompt(false);
    saveQueue(queue, 'running');
    let consecutiveErrors = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    try {
      for (let index = queue.nextTaskIndex; index < queue.tasks.length; index += 1) {
        if (state.paused) break;
        const task = queue.tasks[index];
        const account = state.accounts.find(item => item.id === task.accountId);
        if (!account) {
          failed += 1;
          queue.nextTaskIndex = index + 1;
          saveQueue(queue, 'running');
          continue;
        }
        const historyKey = Core.redemptionKey(account.serverId, account.playerId, task.code);
        const existing = state.redemptions[historyKey];
        if (existing) {
          skipped += 1;
          updateResult(account, task.code, 'skipped', t('historySkipped', { date: formatDate(existing.redeemedAt) }), 'success');
          queue.nextTaskIndex = index + 1;
          saveQueue(queue, 'running');
          continue;
        }
        setStatus(t('statusRunning', { current: index + 1, total: queue.tasks.length, account: account.alias, code: task.code }));
        updateResult(account, task.code, 'pending', '', 'pending');
        try {
          setOfficialAccount(account);
          const confirmed = await requestApi('Confirm', account, task.code);
          const verified = state.verifiedAccounts.get(account.id);
          if (!verified || !samePlayer(confirmed, verified)) throw new Error(t('errorPlayerMismatch'));
          await requestApi('Register', account, task.code);
          const record = { status: 'success', redeemedAt: new Date().toISOString(), batchKey: queue.batchKey };
          state.redemptions[historyKey] = record;
          saveRedemptions();
          succeeded += 1;
          consecutiveErrors = 0;
          updateResult(account, task.code, 'success', t('rewardDetail'), 'success');
        } catch (error) {
          failed += 1;
          consecutiveErrors += 1;
          updateResult(account, task.code, 'failed', error.message, 'error');
          const fatal = error.status === 403 || error.status === 429 || error.status >= 500 || error.message === t('errorPlayerMismatch');
          if (fatal || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) state.paused = true;
        }
        queue.nextTaskIndex = index + 1;
        saveQueue(queue, state.paused ? 'paused' : 'running');
        renderAccounts();
        if (state.paused) break;
        const nextTask = queue.tasks[index + 1];
        const delay = Core.delayFor(task, nextTask);
        if (delay && !await waitWithPause(delay)) break;
      }
      if (state.paused || queue.nextTaskIndex < queue.tasks.length) {
        saveQueue(queue, 'paused');
        showQueuePrompt(true);
        setStatus(t('statusPaused'), 'error');
      } else {
        GM_deleteValue(QUEUE_KEY);
        state.queue = null;
        setStatus(t('statusCompleted', { success: succeeded, failed, skipped }), failed ? 'error' : 'success');
      }
    } finally {
      state.running = false;
      setControlsRunning(false);
      startButton.disabled = true;
      startButton.textContent = t('start');
    }
  }

  async function restoreQueue() {
    const queue = state.queue || GM_getValue(QUEUE_KEY, null);
    if (!queueIsCompatible(queue)) {
      setStatus(t('statusQueueInvalid'), 'error');
      return;
    }
    batchSelect.value = queue.batchKey;
    codeInput.value = queue.codes.join('\n');
    state.preferences.selectedAccountIds = [...queue.accountIds];
    state.preferences.lastAccountId = queue.accountIds[0] || null;
    savePreferences();
    renderAccounts();
    await verifySelectedAccounts({ resume: queue });
  }

  syncButton.addEventListener('click', async () => {
    syncButton.disabled = true;
    setStatus(t('statusSyncing'));
    try {
      state.registry = await syncRegistry(true);
      renderBatchOptions(state.registry);
      const batch = fillSelectedBatch();
      setStatus(t('statusLoaded', { batches: state.batches.length, codes: batch?.codes.length || 0 }), 'success');
    } catch (error) {
      setStatus(t('statusSyncFailed', { message: error.message }), 'error');
    } finally {
      syncButton.disabled = false;
    }
  });
  batchSelect.addEventListener('change', fillSelectedBatch);
  codeInput.addEventListener('input', () => { renderAccounts(); invalidateVerification(); });
  verifyButton.addEventListener('click', () => verifySelectedAccounts());
  startButton.addEventListener('click', runQueue);
  pauseButton.addEventListener('click', () => {
    state.paused = true;
    pauseButton.disabled = true;
    if (state.queue) saveQueue(state.queue, 'paused');
    setStatus(t('statusPausePending'));
  });
  clearButton.addEventListener('click', () => {
    if (state.running) return;
    state.rows.clear();
    resultBody.replaceChildren();
    resultTable.hidden = true;
  });
  manageButton.addEventListener('click', () => {
    resetAccountForm();
    renderManagerAccounts();
    modalBackdrop.dataset.open = 'true';
  });
  modalBackdrop.querySelector('#mmt-close-manager').addEventListener('click', () => { modalBackdrop.dataset.open = 'false'; });
  modalBackdrop.querySelector('#mmt-reset-account').addEventListener('click', resetAccountForm);
  modalBackdrop.querySelector('#mmt-save-account').addEventListener('click', saveAccountFromManager);
  modalBackdrop.querySelector('#mmt-export-backup').addEventListener('click', exportBackup);
  modalBackdrop.querySelector('#mmt-import-backup').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => { if (importFile.files[0]) importBackup(importFile.files[0]); });
  resumeButton.addEventListener('click', restoreQueue);
  discardButton.addEventListener('click', () => {
    GM_deleteValue(QUEUE_KEY);
    state.queue = null;
    state.resumeCandidate = null;
    showQueuePrompt(false);
    setStatus(t('statusReady'));
  });

  const serverOptionsObserver = new MutationObserver(() => {
    renderAccounts();
    if (modalBackdrop.dataset.open === 'true') {
      const editing = state.accounts.find(account => account.id === state.editingAccountId);
      refreshManagerServers(editing?.serverId || managerServer.value);
    }
  });
  serverOptionsObserver.observe(serverSelect, { childList: true });

  renderAccounts();
  if (state.queue) {
    showQueuePrompt(true);
    setStatus(t('statusResumeFound'));
  }
  syncRegistry(false)
    .then(registry => {
      state.registry = registry;
      renderBatchOptions(registry, state.queue?.batchKey);
      const batch = state.batches.find(item => item.key === batchSelect.value);
      codeInput.value = batch ? batch.codes.map(item => item.code).join('\n') : '';
      renderAccounts();
      if (!state.queue) setStatus(t('statusLoaded', { batches: state.batches.length, codes: batch?.codes.length || 0 }));
      else if (!queueIsCompatible(state.queue)) setStatus(t('statusQueueInvalid'), 'error');
    })
    .catch(error => setStatus(t('statusSyncFailed', { message: error.message }), 'error'));
})();
