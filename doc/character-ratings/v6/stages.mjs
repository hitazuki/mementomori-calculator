// Reviewed lower/opening states at max skill + max weapon, not Lv1 skills.
// Unlisted mechanisms retain the v5 authored, bounded reference. No guessed allies' buffs.
const attack = n => ({effects:{attack:n},early:true})
const skill = (S1,S2,effects={}) => ({components:{...(S1?{S1}:{}),...(S2?{S2}:{})},effects,early:true})
export const lower = {
  5:{effects:{critRate:0}},6:attack(0),8:{effects:{critRate:0}},
  9:{slots:{S1:{guaranteedCrit:false},S2:{guaranteedCrit:false}}},14:attack(0),
  17:skill(null,'5.1,1,4'),18:{effects:{critRate:0},early:true},19:attack(0),
  25:skill('5.3,1,5+p3.8,1,1','6.4,2,1',{attack:.5}),
  27:skill(null,'5.2,1,5'),30:{slots:{S1:{damage:0}},components:{S2:'p5.2,1,1'}},
  35:skill(null,'3.5,1,5',{attack:0}),36:skill('3.4,1,5'),37:attack(0),
  38:attack(0),44:{effects:{specificPenetration:0},components:{S2:'4.7,4,0'}},
  45:skill('8,1,5','16,1,3'),47:attack(0),50:skill(null,'3,8,0',{attack:0}),
  52:{},55:skill(null,'8,1,1'),56:skill('8,2,0',null),
  58:skill(null,'2,7,0'),59:attack(0),60:{pastDamageHp:0},
  61:{...skill('2.4,10,1+5.8,1,1','0,1,1'),disabled:['S2']},
  63:{...skill(null,'9.8,4,0'),slots:{S2:{guaranteedCrit:false}}},64:skill(null,'8.8,1,3'),65:skill(null,'3.8,3,2'),
  66:skill(null,'4.9,6,0'),68:skill(null,'6.8,1,1'),69:skill(null,'6.2,1,5'),
  71:skill(null,'2.3,4,0',{attack:0}),73:skill(null,'3.4,6,1'),75:skill(null,'5.8,3,0',{attack:.5}),
  77:skill(null,'7,1,3'),78:skill(null,'3.8,5,1',{attack:0}),
  79:skill('4.8,3,0','4.8,1,3',{attack:0}),80:skill(null,'4.8,4,0'),
  81:skill(null,'2.8,4,1'),82:skill(null,'4.2,5,1',{attack:0}),
  83:{early:true},84:skill('5.4,1,5',null,{attack:0}),
  85:skill(null,'3.8,1,2'),86:skill('1,5,0','2.5,5,0'),
  88:{effects:{attackFromHp:0}},89:{effects:{attack:0},slots:{S1:{damage:0},S2:{damage:0}}},
  90:skill(null,'4.7,6,1',{attack:.2}),92:skill(null,'4.8,1,3',{attack:0}),
  93:skill(null,'5.4,7,0',{attack:0}),96:skill('3.6,1,5','5.8,6,1',{attack:.05}),
  97:skill(null,'5.8,1,3'),99:skill(null,null,{attack:0}),
  100:skill(null,'9.8,1,3'),102:{...skill(null,'3.2,5,0',{attack:0}),scenarios:{1:{effects:{attack:0}},5:{effects:{attack:0}}}},
  103:skill(null,'4.8,1,3'),105:skill('6.8,2,3','13.2,1,3',{penetration:0}),
  106:skill(null,'4.8,1,3'),108:skill('4.8,1,5','5.8,1,5'),
  109:skill(null,'3.8,4,0'),112:skill(null,'15.2,1,3'),
  113:skill(null,'7.4,5,1',{attack:0}),114:skill('5.9,1,5','3.1,8,0',{attack:0}),
  115:skill('2.1,6,1','3.4,4,1'),121:{},122:{...skill(null,'5.6,5,0'),early:true},
  123:skill('8.8,1,3',null,{attack:0}),124:skill(null,'2.8,4,1',{attack:0}),
  125:{},126:skill('4.1,1,4','2.8,4,0',{attack:0}),
  128:{slots:{S1:{damage:0},S2:{damage:0}}},129:{},
  130:skill('6.7,4,0','7.6,5,0',{attack:0}),131:skill(null,'15.6,1,2'),
  132:{effects:{attack:0},slots:{S1:{damage:.1,specificDefenseDown:.2},S2:{damage:.1,specificDefenseDown:.2}}},
  134:skill(null,'3.8,1,5'),135:skill(null,'4.2,7,1',{attack:0}),
  137:{components:{S2:'15.2,1,2'},slots:{S1:{damage:.1},S2:{damage:.1}}},
  139:skill(null,'3.8,1,4'),140:skill(null,'13.2,1,3'),
  141:skill(null,'1.6,10,0',{attack:0}),148:skill(null,'3.4,5,0',{attack:0}),
  149:skill(null,'9.4,3,0',{attack:0}),
  150:{...skill('9.8,3,0','0,1,1',{attack:0,critRate:0}),disabled:['S2']},
  151:{},153:skill(null,'6.4,5,0'),
}

// Opening includes guaranteed own pre-hit events. Unknown teammate events are zero.
export const opening = {
  5:{effects:{critRate:.3}},8:{effects:{critRate:.06},slots:{S2:{critRate:.12}}},
  14:{slots:{S2:{attack:.243}}},25:{},27:{},
  47:attack(.7),50:{components:{S2:'6,8,0'}},55:{components:{S2:'12,1,1'}},
  61:{},63:{slots:{S2:{guaranteedCrit:false}}},69:{},
  71:{effects:{attack:.05},scenarios:{1:{components:{S2:'2.3,5,0'},slots:{S2:{attack:.15}}},5:{components:{S2:'2.3,8,0'},slots:{S2:{attack:.30}}}}},
  75:{slots:{S1:{attack:.6},S2:{attack:.7}},components:{S2:'5.8,5,0'}},
  78:{slots:{S2:{attack:.15}}},84:{components:{S1:'8.1,1,5'}},
  86:{components:{S2:'3.5,5,0'}},89:{effects:{attack:.25},slots:{S1:{damage:.02},S2:{damage:.04}}},
  92:{slots:{S2:{attack:.15}}},93:{slots:{S1:{attack:.1},S2:{attack:.2}},components:{S2:'8.4,7,0'}},
  99:{components:{N:'3,3,0'}},102:{scenarios:{1:{effects:{attack:.1},slots:{S1:{attack:.15},S2:{attack:.3}}},5:{effects:{attack:.1},slots:{S1:{attack:.15},S2:{attack:.3}}}}},
  114:{slots:{S1:{attack:.05},S2:{attack:.1}}},
  121:{effects:{attack:.3}},122:{effects:{attack:.3},scenarios:{1:{components:{S2:'5.6,5,0'}},5:{components:{S2:'11.2,5,0'}}}},
  123:{slots:{S1:{attack:.1},S2:{attack:.1}}},124:{slots:{S1:{attack:.08},S2:{attack:.16}}},
  126:{slots:{S1:{attack:.1},S2:{attack:.2}}},
  130:{slots:{S1:{attack:.1},S2:{attack:.2}}},
  132:{slots:{S1:{attack:.1,damage:.1,specificDefenseDown:.2},S2:{attack:.2,damage:.1,specificDefenseDown:.2}}},
  135:{effects:{attack:.06}},137:{effects:{critRate:.27}},
  148:{slots:{S1:{attack:.12},S2:{attack:.24}},components:{S2:'5.4,5,0'}},
  149:{slots:{S1:{attack:.25},S2:{attack:.25}}},
  150:{effects:{attack:.06,critRate:.06}},151:{slots:{S2:{attack:.3}}},
}

// Fast windows are authored separately from the guaranteed opening. Event counts
// never imply rounds without a known trigger route. Unlisted growth stays late.
export const quick = {
  50:{mature:true,events:10,actions:2,reason:'前两次多段主动可产生10次暴击，下一回合转攻；依赖暴击，按短期窗口参考。'},
  97:{mature:true,events:5,penalty:1,reason:'累计净化5种可由一次多种净化完成；但需先有足够弱化，条件爆发降1档，仍保留开局下限。'},
  123:{mature:true,events:1,penalty:1,reason:'1次控制即可满5层，净化后可爆发；依赖被控制，条件窗口降1档，非必然开局。'},
  131:{mature:true,events:5,actions:2,penalty:1,reason:'S1净化2种、P1一次3种可合计5种；先要满足全队弱化条件，条件爆发降1档。'},
  134:{mature:true,events:4,penalty:1,reason:'目标有暴率上升时4次弱化事件即可满懈怠，否则需6次；层仅2回合，条件爆发降1档。'},
  149:{config:{effects:{attack:.5},components:{S2:'9.4,3,0'}},events:2,reason:'2次控制即可满50%加攻；S2五段另需累计净化10种，此短期窗口仍只算三段。'},
}
// Late damage measures mature strength. Waiting alone is not a penalty here.
// This once-only form expires after 8 rounds; its repeated-skill loop is not permanent.
export const lateCost = {61:3}
export const reviewNotes = {
  61:'10人次受击开启8回合零CD窗口，仅一次；到期回到S1/普攻，因窗口到期而作3档修正，并非因成长次数扣分。',
  97:'累计净化5种后S2达870%；专武补齐S1五目标420%、忧蓝500%攻击盾。专武被动属性源表仍缺失，不虚构。',
  69:'S1提供自身暴率/暴伤；S2强化要求目标弱化，未满足时620%，满足时930%。',
  88:'满记忆强化S2后的来源攻击给予附近两名友军，不计自身；解除记忆不增加自身技能倍率。',
  112:'S2为1520%，生命比较满足时2280%（1.5倍）；来源防御转攻按统一面板，主动自损限制循环。',
  137:'S2攻击比较满足时2280%，否则1520%；身影暴率逐回合消耗，不能作为长期常驻。',
}
export const upper = {
  5:{effects:{critRate:.8}},6:{components:{S1:'7,1,4'}},14:{effects:{attack:.27}},
  25:{effects:{attack:2.5}},36:{components:{S1:'6.2,1,5'}},
  43:{effects:{critDamage:.6}},44:{effects:{attack:.7}},52:{slots:{S1:{damage:.9}}},
  60:{pastDamageHp:4},77:{effects:{attack:1}},95:{effects:{attack:.4}},
  125:{components:{S2:'18.9,1,3'}},129:{components:{S1:'5.1,10,0',S2:'19.8,1,3'}},
  137:{effects:{critRate:.3}},151:{effects:{attack:.3}},
}

// Short-term vs long-term editorial judgments, based on lifecycle and 0%-bonus capacity.
// Keys are explicit authored scores; no keywords in the original text award points.
export const defenseScores = {
  1:[0,1],2:[0,0],3:[0,0],4:[5,2],5:[8,7],6:[9,2],7:[3,6],8:[0,0],9:[4,4],10:[1,4],
  11:[0,0],12:[0,0],13:[3,3],14:[0,0],15:[3,6],16:[2,4],17:[8,4],18:[7,5],19:[7,7],20:[6,7],
  21:[0,0],22:[2,1],23:[8,8],24:[3,2],25:[0,0],26:[2,3],27:[2,2],28:[9,8],29:[7,7],30:[2,2],
  31:[0,0],32:[3,4],33:[0,3],34:[0,0],35:[6,6],36:[4,5],37:[0,3],38:[7,6],39:[2,2],40:[5,5],
  41:[3,3],42:[9,8],43:[2,1],44:[8,2],45:[9,8],46:[6,6],47:[7,6],48:[9,7],49:[8,7],50:[7,5],
  51:[4,5],52:[7,7],53:[6,6],54:[7,6],55:[5,2],56:[8,8],57:[9,2],58:[9,8],59:[7,7],60:[7,8],
  61:[8,6],62:[6,6],63:[8,4],64:[7,2],65:[7,8],66:[7,2],67:[8,7],68:[7,3],69:[10,5],70:[6,6],
  71:[7,7],72:[3,4],73:[8,2],74:[6,5],75:[9,4],76:[3,4],77:[7,5],78:[10,1],79:[9,2],80:[8,8],
  81:[7,8],82:[1,7],83:[7,7],84:[0,2],85:[5,6],86:[5,7],87:[9,6],88:[6,2],89:[1,0],90:[10,9],
  92:[8,9],93:[3,0],95:[7,2],96:[9,9],97:[8,5],99:[1,0],100:[8,1],101:[10,7],102:[3,0],103:[7,8],
  105:[10,9],106:[3,1],107:[2,2],108:[7,7],109:[8,8],111:[6,8],112:[3,0],113:[9,8],114:[9,9],115:[9,8],
  116:[9,8],117:[9,7],121:[0,0],122:[0,0],123:[10,8],124:[9,9],125:[9,8],126:[10,8],128:[4,0],129:[9,8],
  130:[3,0],131:[9,8],132:[9,9],134:[9,8],135:[10,7],137:[9,7],139:[10,9],140:[9,7],141:[0,0],
  148:[1,0],149:[9,8],150:[9,7],151:[8,4],153:[9,9],
}
