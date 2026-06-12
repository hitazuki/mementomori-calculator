const fs = require('fs');
const path = require('path');

const locales = ['en.js', 'ja.js', 'ko.js', 'zh-CN.js', 'zh-TW.js'];
const dir = path.join(__dirname, '../src/locales');

const keysToRemove = [
  'planBudget',
  'planSumTrigger',
  'planSumBatch',
  'planSumRemaining',
  'planOptSmall',
  'planOptSmallDesc',
  'planOptMax',
  'planOptMaxDesc'
];

const newKeysCN = {
  planExpectedRatio: '"预期性价比"',
  planPreferenceDiscount: '"机会偏好"',
  planPrefActive: '"积极使用 (0.8)"',
  planPrefBalanced: '"均衡分配 (0.9)"',
  planPrefCherish: '"珍惜机会 (1.0)"',
  planOptionalSafeLimit: '"安全花费上限"',
  planTopUpMode: '"补累充模式"',
  planTopUpAuto: '"自动价值判断"',
  planTopUpOff: '"关闭"',
  planSumRecommendation: '"推荐结论"',
  planSumExpectedRatio: '"预期性价比"',
  planSumActualCE: '"路径实际性价比"',
  planSumSurplus: '"金钱净收益"',
  planSumDecision: '"决策价值"',
  planSumTriggerCount: '"已触发机会数"',
  planSumRetained: '"保留机会数"',
  planSumResets: '"跨日重置次数"',
  planOptConservative: '"保守方案"',
  planOptConservativeDesc: '"仅保留确定能达到预期性价比的稳妥选项。"',
  planOptPaving: '"升档铺路"',
  planOptPavingDesc: '"购买当前略亏的礼包强行推高档位，为后续大包做铺垫。"',
  planOptWaiting: '"降档等待"',
  planOptWaitingDesc: '"主动让本批次降档并跨日等待，适合机会充足时使用。"',
  planOptRetaining: '"保留机会"',
  planOptRetainingDesc: '"暂未找到符合预期的组合，建议保留触发机会。"'
};

const newKeysTW = {
  planExpectedRatio: '"預期性價比"',
  planPreferenceDiscount: '"機會偏好"',
  planPrefActive: '"積極使用 (0.8)"',
  planPrefBalanced: '"均衡分配 (0.9)"',
  planPrefCherish: '"珍惜機會 (1.0)"',
  planOptionalSafeLimit: '"安全花費上限"',
  planTopUpMode: '"補累充模式"',
  planTopUpAuto: '"自動價值判斷"',
  planTopUpOff: '"關閉"',
  planSumRecommendation: '"推薦結論"',
  planSumExpectedRatio: '"預期性價比"',
  planSumActualCE: '"路徑實際性價比"',
  planSumSurplus: '"金錢淨收益"',
  planSumDecision: '"決策價值"',
  planSumTriggerCount: '"已觸發機會數"',
  planSumRetained: '"保留機會数"',
  planSumResets: '"跨日重置次數"',
  planOptConservative: '"保守方案"',
  planOptConservativeDesc: '"僅保留確定能達到預期性價比的穩妥選項。"',
  planOptPaving: '"升檔鋪路"',
  planOptPavingDesc: '"購買當前略虧的禮包強行推高檔位，為後續大包做鋪墊。"',
  planOptWaiting: '"降檔等待"',
  planOptWaitingDesc: '"主動讓本批次降檔並跨日等待，適合機會充足時使用。"',
  planOptRetaining: '"保留機會"',
  planOptRetainingDesc: '"暫未找到符合預期的組合，建議保留觸發機會。"'
};

const newKeysEN = {
  planExpectedRatio: '"Expected CE"',
  planPreferenceDiscount: '"Opportunity Pref"',
  planPrefActive: '"Active (0.8)"',
  planPrefBalanced: '"Balanced (0.9)"',
  planPrefCherish: '"Cherish (1.0)"',
  planOptionalSafeLimit: '"Safe Spending Limit"',
  planTopUpMode: '"Top-up Mode"',
  planTopUpAuto: '"Auto Value"',
  planTopUpOff: '"Off"',
  planSumRecommendation: '"Recommendation"',
  planSumExpectedRatio: '"Expected CE"',
  planSumActualCE: '"Actual CE"',
  planSumSurplus: '"Money Surplus"',
  planSumDecision: '"Decision Value"',
  planSumTriggerCount: '"Triggered Opps"',
  planSumRetained: '"Retained Opps"',
  planSumResets: '"Recharge Resets"',
  planOptConservative: '"Conservative"',
  planOptConservativeDesc: '"Keeps only safe options that meet the expected CE."',
  planOptPaving: '"Tier Paving"',
  planOptPavingDesc: '"Invest in lower tier packs to push the tier higher for future valuable packs."',
  planOptWaiting: '"Tier Drop Wait"',
  planOptWaitingDesc: '"Skip current packs to intentionally drop the tier and wait across days."',
  planOptRetaining: '"Retain Opps"',
  planOptRetainingDesc: '"No paths meet the expected CE. It is recommended to retain the opportunities."'
};

const mapKeys = {
  'en.js': newKeysEN,
  'ja.js': newKeysEN,
  'ko.js': newKeysEN,
  'zh-CN.js': newKeysCN,
  'zh-TW.js': newKeysTW
};

for (const file of locales) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  for (const k of keysToRemove) {
    const reg = new RegExp('^\\s*' + k + '\\s*:.*\\r?\\n', 'gm');
    content = content.replace(reg, '');
  }

  const keysStr = Object.entries(mapKeys[file]).map(([k, v]) => `  ${k}: ${v},`).join('\n');
  content = content.replace(/(};\s*)$/m, keysStr + '\n$1');

  fs.writeFileSync(p, content);
}
console.log('done');
