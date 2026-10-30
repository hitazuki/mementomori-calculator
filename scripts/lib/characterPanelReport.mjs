import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {CHARACTER_RATING_PANEL,PANEL_BASE_DAMAGE} from '../../src/utils/characterRatingPanel.js'
export const panelBaseline=JSON.parse(fs.readFileSync(new URL('../../doc/character-ratings/v6/panel-baseline.json',import.meta.url),'utf8'))
export function panelCalibrationReport(records) {
  for(const r of records){
    const b=panelBaseline.records[r.id]
    if(b.sourceHash!==r.sourceHash)throw Error('Panel baseline requires source review: '+r.id)
    if(createHash('sha256').update(JSON.stringify(r.axes.slice(4))).digest('hex')!==b.auxiliaryAxesHash)throw Error('Unreviewed auxiliary change: '+r.id)
  }
  const changed=records.filter(r=>r.axes.some((a,i)=>a.score!==panelBaseline.records[r.id].scores[i])).length
  const histogram=Array.from({length:11},(_,score)=>`|${score}|${[0,1,2,3].map(i=>records.filter(r=>r.axes[i].score===score).length).join('|')}|`).join('\n')
  const row=r=>{
    const b=panelBaseline.records[r.id],c=r.outputCalibration,s=r.survival.calibration
    return `|${r.id} ${r.name}|${b.scores.slice(0,4).join('/')}|${r.axes.slice(0,4).map(a=>a.score).join('/')}|${[b.output.burst,c.normalized.burst,b.output.late,c.normalized.late].map(x=>Math.round(x*100)+'%').join(' / ')}|${[b.burstCapacity,s.burstReference.capacity,b.sustainCapacity,s.sustainReference.capacity].map(x=>Math.round(x*100)+'%').join(' / ')}|`
  }
  return `# 公共面板重算与评分分档检查 · 2026-10-30

版本：${CHARACTER_RATING_PANEL.version}。138名角色已重算输出与有限生命容量，${changed}名角色至少一个分数改变。基线为panel-baseline.json记录的本次更新前本地结果，不混用9ef07af历史原分。所有源哈希保持，团队防护、进攻辅助、行动干扰三维哈希校验通过。

基准普攻最终伤害（归一攻击1）：${PANEL_BASE_DAMAGE}。完整规则见../reference-panel.md。历史阶段保留，当前输出为outputCalibration，当前有限生命为survival.states。

输出固定下界10/200/400/700/1100/1700/3000/5000/8500/14000%，两轴共用。当前爆发最高9分，成熟最高10分；成熟第一约20212%，第二约11804%，已有分档区分，不为爆发榜首另设满分。倍率单调映射，检查同倍率同分、成熟不低于早期则不降分；没有额外条件扣档。

有限容量下界105/115/130/150/180/220/300/400/600/800%暂保留，跨档角色逐项复核开启、次数、到期、补充及回复。首击/周期盾与常驻容量不是同一可用性，不以全阶段最大容量直接覆盖机制分。超过800%的容量仍显示实际数值，10分不表示容量相等。治疗不加致命容量，未增加来伤频率假设。

|分数|爆发输出|成熟输出|爆发防御|持续生存|
|---|---|---|---|---|
${histogram}

下表输出倍率按评分所取的单敌/五敌优势比较单位；完整单敌、五敌值见output-calibration.md。有限生命为已选爆防状态与持续去盾参照的较弱一路；朝日的持续参照为前10回合，另存第11回合后100%的到期底座，不称为永久容量。

|角色|原分 爆/持/防/生|新分 爆/持/防/生|原爆/新爆/原持/新持倍率|原爆防/新爆防/原持续/新持续容量|
|---|---|---|---|---|
${records.map(row).join('\n')}
`
}
