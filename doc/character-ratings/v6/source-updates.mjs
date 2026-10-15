// Reviewed source changes; keep v5 inputs as historical evidence.
export const sourceUpdates = {
  65: {
    sourceHash: 'd088bd4a56838c81b956c869630f1392a2225056635f9ee0b9f3e147c3537726',
    reviewedAt: '2026-10-15',
    conditions: '首两行动强化要求5名存活友军在两次哀音行动开始时均保有P1护盾；少人或破盾会延迟10层引诱消除及S2三倍伤害。S2自降速度不回填当前行动顺序。',
    output: {
      growth: {event:'自身行动开始时逐名统计持有P1护盾的存活友军',initial:0,cap:10,perEvent:1,totalEvents:10,
        detail:'全队5人持盾时每次行动开始消除5层引诱，最快第2次行动前满10层；S1按5层消除后的15%加攻，S2按10层后的30%加攻及三倍伤害。少人或护盾提前耗尽会延迟。'},
      lifecycle: {activeWindow:'回合开始自身专长1500%→1700%盾，持盾时60%抗暴，盾持续3回合',
        replenishment:'每结束1次自身行动后可在回合开始再次补盾，新盾替换旧盾',
        afterExpiry:'破盾后失去护盾与抗暴；未满10层时也会延迟引诱消除，补盾后恢复保护'},
      note:'全队5人持盾时最多每行动消除5层，最快第二行动S2三倍；破盾或减员会延迟。',
    },
  },
}
