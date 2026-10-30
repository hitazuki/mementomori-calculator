// Author translated numerical prefixes while preserving the reviewed mechanism
// sentence verbatim. Input is an explicit pre-change v6 review, never Master data.
import fs from 'node:fs'
const baseline=process.argv[2]
if(!baseline)throw Error('Pass the pre-change v6 review JSON path')
const before=new Map(JSON.parse(fs.readFileSync(baseline,'utf8')).records.map(r=>[r.id,r]))
const records=JSON.parse(fs.readFileSync('doc/character-ratings/v6/review.json','utf8')).records
const copy=JSON.parse(fs.readFileSync('doc/character-ratings/v6/output-calibration-copy.json','utf8'))
const language={
  'zh-TW':{hp:'等效生命',shield:'（完整護盾）',empty:'（護盾耗盡後）',physical:'物理',magic:'魔法',maximum:'S2生命條件倍率按每段1520%上限計算。',joint:'S1易傷按70%成功與30%失敗聯合計算S2強化，不重複折損。'},
  en:{hp:'Effective HP',shield:' (full shield)',empty:' (after shield depletion)',physical:'physical ',magic:'magic ',maximum:'S2 uses the maximum health-dependent coefficient of 1520% per hit.',joint:'S1 vulnerability uses joint 70% success and 30% failure states for S2 enhancement, without repeated discounts.'},
  ja:{hp:'等価生命値',shield:'（シールド全量）',empty:'（シールド消耗後）',physical:'物理',magic:'魔法',maximum:'S2の生命値条件による倍率は各攻撃1520%の上限で計算。',joint:'S1の被ダメージ増加は成功70%・失敗30%の状態ごとにS2強化と合わせて計算し、重複して減算しない。'},
  ko:{hp:'등가 생명력',shield:'(보호막 최대)',empty:'(보호막 소진 후)',physical:'물리 ',magic:'마법 ',maximum:'S2의 생명력 조건 배율은 타격당 최대 1520%로 계산.',joint:'S1 받는 피해 증가는 성공 70%와 실패 30% 상태별로 S2 강화를 함께 계산하며 중복 차감하지 않음.'},
}
for(const [locale,l]of Object.entries(language)){
  const path=`doc/character-ratings/i18n/${locale}.json`,translations=JSON.parse(fs.readFileSync(path,'utf8')),c=copy[locale]
  const end=['en','ko'].includes(locale)?'. ':'。'
  for(const r of records){
    const o=r.outputCalibration
    for(const i of [0,1]){
      const v=(i?o.lateActions:o.burstTotals.map(x=>x/2)).map(x=>Math.round(x*100))
      translations[r.axes[i].reason]=c[i]+v[0]+'%'+c[7]+v[1]+'%'+end+(o.events4?c[i?5:2]:'')+(o.rounds?c[i?6:3]:'')+(o.special?(r.id===130?l.maximum:r.id===155?l.joint:c[4]):'')
    }
    for(const i of [2,3]){
      const reason=r.axes[i].reason,old=before.get(r.id).axes[i].reason
      if(reason===old)continue
      const prefix=reason.match(/^等效生命(?:（[^）]+）)?：[^。]+。/),oldPrefix=old.match(/^等效生命(?:（[^）]+）)?：[^。]+。/)
      if(!prefix||!oldPrefix||reason.slice(prefix[0].length)!==old.slice(oldPrefix[0].length))throw Error('Mechanism translation needs review: '+r.id+'/'+i+'/'+locale)
      const translated=translations[old]
      if(!translated)throw Error('Missing reviewed baseline translation: '+r.id+'/'+i+'/'+locale)
      const boundary=['en','ko'].includes(locale)?/\.\s+/:/。/
      const match=boundary.exec(translated)
      if(!match)throw Error('Cannot isolate translated numerical prefix: '+r.id+'/'+locale)
      const tail=translated.slice(match.index+match[0].length)
      const range=prefix[0].split('：')[1].slice(0,-1).replaceAll('物理',l.physical).replaceAll('魔法',l.magic).replaceAll('／',' / ')
      const qualifier=prefix[0].includes('完整护盾')?l.shield:prefix[0].includes('护盾耗尽后')?l.empty:''
      translations[reason]=l.hp+qualifier+(['en','ko'].includes(locale)?': ':'：')+range+end+tail
    }
  }
  fs.writeFileSync(path,JSON.stringify(translations,null,2)+'\n')
}
console.log('Updated four authored rating dictionaries; mechanism sentences preserved.')
