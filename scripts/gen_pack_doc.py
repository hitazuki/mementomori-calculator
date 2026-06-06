import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure we run from project root
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

with open('data/Master/TreasureChestMB.json', encoding='utf-8') as f: tc_list = json.load(f)
with open('data/Master/TreasureChestItemMB.json', encoding='utf-8') as f: tci_list = json.load(f)
with open('data/Master/ItemMB.json', encoding='utf-8') as f: item_list = json.load(f)
with open('data/Master/VipMB.json', encoding='utf-8') as f: vip_list = json.load(f)
with open('data/Master/MonthlyLoginBonusMB.json', encoding='utf-8') as f: mlb_list = json.load(f)
with open('data/Master/MonthlyLoginBonusRewardListMB.json', encoding='utf-8') as f: mlb_rw = json.load(f)
with open('data/Master/LimitedLoginBonusMB.json', encoding='utf-8') as f: llb_list = json.load(f)
with open('data/Master/LimitedLoginBonusRewardListMB.json', encoding='utf-8') as f: llb_rw = json.load(f)
with open('data/Master/LuckyChanceMB.json', encoding='utf-8') as f: lc_list = json.load(f)
with open('data/Master/BookSortAssistanceMB.json', encoding='utf-8') as f: bsa_list = json.load(f)
with open('data/Master/PanelMB.json', encoding='utf-8') as f: panel_list = json.load(f)
with open('data/Master/PanelMissionMB.json', encoding='utf-8') as f: pm_list = json.load(f)
with open('data/Master/EquipmentSetMaterialBoxMB.json', encoding='utf-8') as f: esmb_list = json.load(f)
with open('data/Master/EquipmentMB.json', encoding='utf-8') as f: eq_list = json.load(f)

item_by_key = {}
for i in item_list:
    item_by_key[(i['ItemType'], i['ItemId'])] = i
tci_by_id = {x['Id']: x for x in tci_list}
mlb_rw_by_id = {x['Id']: x for x in mlb_rw}
llb_rw_by_id = {x['Id']: x for x in llb_rw}

# Equipment lookup: ItemType=4 uses EquipmentId as key
eq_by_id = {e['Id']: e for e in eq_list}

# Load Chinese text resources for item names
with open('data/Master/TextResourceZhCnMB.json', encoding='utf-8') as f:
    zh_texts = json.load(f)
zh_by_key = {t['StringKey']: t['Text'] for t in zh_texts}

def iname(itype, iid):
    """Get Chinese display name for an item/equipment"""
    # Check ItemMB first
    i = item_by_key.get((itype, iid))
    if i:
        nk = i['NameKey']
        if nk in zh_by_key:
            return zh_by_key[nk]
        return nk.replace('[ItemName','').replace(']','')
    # Equipment (ItemType=4 uses EquipmentId)
    if itype == 4:
        eq = eq_by_id.get(iid)
        if eq:
            nk = eq.get('NameKey','')
            if nk in zh_by_key:
                return zh_by_key[nk]
            return nk.replace('[EquipmentName','').replace(']','')
    return f'T{itype}I{iid}'

def item_icon(itype, iid):
    i = item_by_key.get((itype, iid))
    if i and i.get('IconId'):
        return f'Item_{i["IconId"]:04d}.png'
    return ''

out = []
out.append('# 组合包 (Pack) 数据汇总')
out.append('')
out.append(f'> 数据来源：客户端 Master 数据 (`data/Master/`)，APK v4.15.0')
out.append(f'> 共 {len(item_list)} 种道具，{len(tc_list)} 种宝箱，{len(vip_list)} 个VIP等级')
out.append('')

# Data relationship docs
out.append('## 数据关系')
out.append('')
out.append('### 宝箱 (TreasureChest) 数据链')
out.append('')
out.append('```text')
out.append('TreasureChestMB[Id]                    <- 宝箱自身 ID（表中 ID 列）')
out.append('  └─ TreasureChestItemIdList[]         <- 指向 TreasureChestItemMB 的 Id 列表')
out.append('       └─ TreasureChestItemMB[Id]')
out.append('            ├─ FixItemList[]           <- 固定掉落（{ItemType, ItemId, ItemCount}）')
out.append('            ├─ SelectItemList[]        <- N选1 自选')
out.append('            └─ LotteryRewardId         <- 服务器端抽奖 ID（客户端无数据）')
out.append('```')
out.append('')
out.append('### 道具名称解析')
out.append('')
out.append('```text')
out.append('FixItemList / SelectItemList 中的 ItemType')
out.append('  ItemType=4 -> EquipmentMB 查找 -> NameKey -> TextResourceZhCnMB -> 中文名')
out.append('  其他        -> ItemMB 查找 -> NameKey -> TextResourceZhCnMB -> 中文名')
out.append('```')
out.append('')
out.append('### 月签到 / 限时签到 数据链')
out.append('')
out.append('```text')
out.append('MonthlyLoginBonusMB / LimitedLoginBonusMB')
out.append('  └─ RewardListId')
out.append('       -> MonthlyLoginBonusRewardListMB / LimitedLoginBonusRewardListMB[Id]')
out.append('            └─ RewardList[] -> {ItemType, ItemId, ItemCount}')
out.append('```')
out.append('')
out.append('### VIP 数据链')
out.append('')
out.append('```text')
out.append('VipMB[Id]')
out.append('  ├─ DailyRewardItemList[]    <- 每日奖励')
out.append('  ├─ ReachRewardItemList[]    <- 到达奖励')
out.append('  └─ VipGiftInfoList[]        <- 付费 VIP 礼包')
out.append('```')
out.append('')
out.append('---')
out.append('')

# === 1. VIP ===
out.append('## 1. VIP 礼包 (VipMB)')
out.append('')
out.append('| VIP | 经验 | 每日奖励 | 到达奖励 |')
out.append('|-----|------|---------|---------|')
for v in vip_list:
    daily = ' / '.join([f'{iname(r["ItemType"], r["ItemId"])} x{r["ItemCount"]}' for r in (v.get('DailyRewardItemList') or [])])
    reach = ' / '.join([f'{iname(r["ItemType"], r["ItemId"])} x{r["ItemCount"]}' for r in (v.get('ReachRewardItemList') or [])])
    out.append(f'| VIP{v["Id"]} | {v.get("RequiredExp",0)} | {daily} | {reach} |')
out.append('')
out.append('> VIP 礼包 (VipGiftInfoList) 包含付费购买的特殊礼包，此处省略详细内容。')
out.append('')

# === 2. Treasure Chests ===

# Filter: exclude アダマンタイトの原石
tc_filtered = [t for t in tc_list if 'アダマンタイトの原石' not in (t.get('Memo') or '')]
skipped = len(tc_list) - len(tc_filtered)

out.append('## 2. 宝箱/礼盒 (TreasureChestMB)')
out.append('')
out.append(f'共 {len(tc_list)} 种（已过滤 {skipped} 种原石），按类别分组。')
out.append('')

def zh_tc_name(t):
    nk = t.get('NameKey','')
    if nk in zh_by_key: return zh_by_key[nk]
    nk2 = t.get('DisplayNameKey','')
    if nk2 in zh_by_key: return zh_by_key[nk2]
    return t.get('Memo','') or nk

from collections import defaultdict
tc_groups = defaultdict(list)
for t in tc_filtered:
    memo = t.get('Memo','') or 'Unknown'
    prefix = memo.split('（')[0].split('　')[0].strip() if memo else t.get('NameKey','Unknown')
    tc_groups[prefix].append(t)

# Write as a single compact table with group separator rows
out.append('| ID | 名称 | 图标 | 内容物 |')
out.append('| --- | --- | --- | --- |')
for grp in sorted(tc_groups.keys(), key=lambda x: min(t['Id'] for t in tc_groups[x])):
    items_in_grp = tc_groups[grp]
    # Group header row
    out.append(f'| | **{grp}** | | ({len(items_in_grp)}个) |')
    for t in items_in_grp:
        name = zh_tc_name(t)
        icon = f'Item_{t["IconId"]:04d}.png' if t.get('IconId') else ''
        contents = []
        for tci_id in t.get('TreasureChestItemIdList', []):
            tci = tci_by_id.get(tci_id)
            if tci:
                for fix in (tci.get('FixItemList') or []):
                    fi = fix['FixItem']
                    contents.append(f'{iname(fi["ItemType"], fi["ItemId"])} x{fi["ItemCount"]}')
                for sel in (tci.get('SelectItemList') or []):
                    sel_items = []
                    for sfi in (sel.get('SelectableFixItemList') or []):
                        sel_items.append(f'{iname(sfi["ItemType"], sfi["ItemId"])} x{sfi["ItemCount"]}')
                    contents.append(f'[N选{sel.get("SelectCount","?")}: {" | ".join(sel_items)}]')
                if tci.get('LotteryRewardId', 0) > 0:
                    contents.append(f'[抽奖 LotteryId={tci["LotteryRewardId"]}]')
        cont_str = ' / '.join(contents) if contents else '[抽奖/随机]'
        out.append(f'| {t["Id"]} | {name} | {icon} | {cont_str} |')
out.append('')

# === 3. Monthly Login Bonus ===
out.append('## 3. 月签到奖励 (MonthlyLoginBonusMB)')
out.append('')
out.append(f'共 {len(mlb_list)} 期月签到')
out.append('')
out.append('| ID | 年月 | 奖励列表ID | 天数 |')
out.append('|---|---|---|---|')
for m in mlb_list[:20]:
    rw_id = m.get('RewardListId', 0)
    rw = mlb_rw_by_id.get(rw_id)
    rw_count = len(rw.get('MonthlyLoginBonusRewardList', [])) if rw else '?'
    out.append(f'| {m["Id"]} | {m.get("YearMonth","")} | {rw_id} | {rw_count}天 |')
out.append('| ... | | | |')
out.append(f'> 详细奖励内容在 MonthlyLoginBonusRewardListMB 中，共 {len(mlb_rw)} 条记录')
out.append('')

# === 4. Limited Login Bonus ===
out.append('## 4. 限时签到活动 (LimitedLoginBonusMB)')
out.append('')
out.append(f'共 {len(llb_list)} 次限时签到')
out.append('')
out.append('| ID | 描述 | 标题Key | 奖励天数 |')
out.append('|---|---|---|---|')
for l in llb_list:
    memo = l.get('Memo','') or ''
    rw_id = l.get('RewardListId', 0)
    rw = llb_rw_by_id.get(rw_id)
    rw_count = len(rw.get('LimitedLoginBonusRewardList', [])) if rw else '?'
    out.append(f'| {l["Id"]} | {memo} | {l.get("TitleTextKey","")} | {rw_count}天 |')
out.append(f'> 详细奖励内容在 LimitedLoginBonusRewardListMB 中，共 {len(llb_rw)} 条记录')
out.append('')

# === 5. Lucky Chance ===
out.append('## 5. 幸运机会 (LuckyChanceMB)')
out.append('')
out.append(f'共 {len(lc_list)} 次活动')
out.append('')
for l in lc_list:
    out.append(f'- Id={l["Id"]}: {l.get("Memo","")} | {l.get("LuckyChanceNameTextKey","")} | {l.get("StartTime","")} ~ {l.get("EndTime","")}')
out.append('')

# === 6. Book Sort Assistance ===
out.append('## 6. 书库整理活动 (BookSortAssistanceMB)')
out.append('')
out.append(f'共 {len(bsa_list)} 次活动')
out.append('')
for b in bsa_list:
    grades = ', '.join([f'Lv{g["Grade"]}(稀有度{g["CharacterRarityFlags"]})' for g in b.get('BookSortAssistanceRewardGradeList', [])])
    out.append(f'- Id={b["Id"]}: {b.get("Memo","")} | ShopProductId={b["ShopProductDefaultId"]} | 奖励等级: {grades}')
out.append('')

# === 7. Panel Missions ===
out.append('## 7. 面板任务 (PanelMB + PanelMissionMB)')
out.append('')
out.append(f'共 {len(panel_list)} 个面板，{len(pm_list)} 个任务定义')
out.append('')
pm_by_id = {x['Id']: x for x in pm_list}
for p in panel_list[:10]:
    missions = []
    for mid in p.get('PanelMissionIdList', []):
        pm = pm_by_id.get(mid)
        if pm:
            missions.append(f'{pm.get("PanelMissionRewardTextKey","")} -> {iname(pm.get("RewardItemType",0), pm.get("RewardItemId",0))} x{pm.get("RewardItemCount",0)}')
    out.append(f'- Panel {p["Id"]}: {p.get("Memo","") or p.get("PanelNameTextKey","")} | {len(missions)}个任务')
    for m in missions[:3]:
        out.append(f'  - {m}')
    if len(missions) > 3:
        out.append(f'  - ...')
out.append('- ...')
out.append('')

# === 8. Equipment Set Material Box ===
out.append('## 8. 装备套装材料箱 (EquipmentSetMaterialBoxMB)')
out.append('')
out.append(f'共 {len(esmb_list)} 种')
out.append('')
for e in esmb_list[:15]:
    mats = [f'MatId={m}' for m in (e.get('EquipmentSetMaterialIdList') or [])]
    out.append(f'- Id={e["Id"]}: {e.get("Memo","")} | IconId={e.get("IconId","")} | 素材: {", ".join(mats)}')
out.append('- ...')
out.append('')

doc = '\n'.join(out)
with open('doc/items/pack.md', 'w', encoding='utf-8') as f:
    f.write(doc)
print(f'Written {len(doc)} chars to doc/items/pack.md')
