// Authored from max-level skill + weapon text. Only self-applicable, pre-action
// speed counts here. Percent speed bonuses share the same additive category.
export const openingSpeed = {
  4:[.10,'P1常驻10%'],36:[.20,'P1常驻20%'],39:[.15,'P1五人存活时15%'],
  43:[.20,'W开局20%，2回合'],44:[.30,'W开局30%，1回合；复活后的加速不重复计入'],
  57:[.25,'W开局25%，1回合'],84:[.20,'W开局20%，1回合'],
  86:[.30,'P2开局20%（1回合）+W合理同属性队10%（常驻）'],
  89:[.20,'P1/W对业红目标20%，自身也是业红'],99:[.30,'P2开局30%，4回合'],
  107:[.30,'P2开局30%，2回合'],121:[.30,'P2开局30%，2回合'],
  122:[.30,'P1开局30%，后续续期另有条件'],141:[.30,'P1/W合理同属性队开局30%，2回合'],
  148:[.30,'P2开局30%，4回合'],151:[.10,'P1合理不超过两属性配队，全队常驻10%'],
}
export const laterSpeed = {
  59:'P1要在回合开始时已有受控敌人，条件加速30%不预支到无控制的开局。',
  65:'S2自身减速发生在行动中，不能回填改变本次行动先后。',
  68:'P2第3回合30%加速，不提前计入首轮。',
  93:'W加速给速度最低的其他业红友军，不计自身。',
  114:'P2第7回合30%加速，不提前计入首轮。',
  123:'S1自减速发生在行动中，不回填本次行动顺序。',
  129:'P2加速给附近其他友军，不计自身。',
  130:'P1累计6次自损后才加速30%，未达到前不计。',
}

// Only the action-dependent part can lose points. floor is the separately
// reviewed opening/automatic protection, not a floor for offensive ratings.
// action=2 retains an entire first-round gap even at high speed.
export const actionDefense = {
  4:{action:2,floor:0,limit:3,note:'S2击杀后才有盾；高速度仍不能跳过首轮或保证击杀。'},
  15:{action:1,floor:2,limit:1,note:'S1足够暴击后才加防；回合开始生命与条件净化保留。'},
  17:{action:2,floor:7,limit:1,note:'S2攻击后才有减伤；一次复活和常驻生命不受速度扣分。'},
  23:{action:2,floor:0,limit:3,note:'S2攻击后才免疫，首轮无免疫；再生不能挽救先手致命伤。'},
  29:{action:1,floor:4,limit:2,note:'S1伤害结算后才生成盾；低血自动隐身单独保留。'},
  35:{action:2,floor:0,limit:3,note:'S2攻击后才有盾，第一轮无法用该盾承伤。'},
  38:{action:2,floor:4,limit:2,note:'S1先加防，S2伤害后才有盾；常驻生命/防御保留。'},
  42:{action:1,floor:7,limit:1,note:'S1才补盾；开局双防和回合开始免控不扣分。'},
  54:{action:1,floor:6,limit:1,note:'S1才加额外防御和小盾；常驻生命/防御与大伤阻绝保留。'},
  67:{action:1,floor:5,limit:2,note:'S1才获得主盾；常驻防御及低血自动盾保留。'},
  71:{action:1,floor:7,limit:1,note:'自行S1上毒后才强化对应来源的阻绝；常驻50%阻绝保底。'},
  72:{action:1,floor:3,limit:1,note:'先行动可先叠防御，但受击也能叠层，不能全按行动门槛扣分。'},
  74:{action:1,floor:4,limit:1,note:'S1吸收防御并造成伤害后才获得盾；常驻生命保留。'},
  86:{action:1,floor:0,limit:2,note:'攻击后且目标存活才补屏障；开局加速有助先开启，不能保护更快来伤。'},
  92:{action:1,floor:7,limit:1,note:'额外生命需S1逐次增加；开局100%生命与受击回复保留。'},
  99:{action:1,floor:0,limit:1,note:'主动驱散成功才有来源防御，开局30%加速可帮助先开启。'},
  113:{action:1,floor:8,limit:1,note:'首行动结束才有盾；开局75%减伤保留，不能将新盾提前算入。'},
  126:{action:1,floor:8,limit:1,note:'前两次S1才补盾；常驻75%减伤不受速度扣分。'},
  139:{action:1,floor:9,limit:1,note:'行动开始才加防；开局大盾及70%减伤保留。'},
  148:{action:1,floor:0,limit:1,note:'首行动开始才获得条件晕厥免疫；开局30%加速计入，免疫不当作抗伤。'},
  151:{action:1,floor:5,limit:2,note:'首次行动开始才有献身/65%阻绝，S1才加三防；开局两屏障保留。'},
  153:{action:1,floor:8,limit:1,note:'行动开始才附加来源防御；常驻75%减伤保留。'},
}
