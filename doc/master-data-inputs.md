# 原始 Master 数据输入

原始游戏数据是仓库外部的临时输入，不随项目提交。开发服务器、生产构建、单元测试和页面运行只使用已提交的精简数据，不读取原始数据目录。

需要重新生成数据时，显式提供包含 `*MB.json` 文件的目录；不传目录会在写入任何输出前报用法错误：

```sh
npm run sync:master -- <master-directory>
npm run generate:catalog -- <master-directory> [output-directory]
node scripts/generate_equipment_reinforcement.mjs <master-directory>
node scripts/generate_equipment_reinforcement.mjs <master-directory> --check
node scripts/generate_equipment_upgrade.mjs <master-directory>
node scripts/generate_equipment_upgrade.mjs <master-directory> --check
node scripts/generate_raid_character_mb_texts.mjs <master-directory>
python scripts/gen_pack_doc.py <master-directory>
```

强化材料的 `--check` 只比对原始数据与已提交常量，不写文件。普通测试检查精简数据结构和计算结果，无需下载原始数据。

`Sync Master Data` 工作流自行检出外部 masterbook 仓库，并将找到的目录传给生成脚本。部署工作流无需原始数据。

资源同步通常使用已提交的角色数据。如果需要原始道具清单来校验道具图标，设置 `SYNC_ASSETS_ITEM_MASTER_FILE` 为外部 `ItemMB.json` 的完整路径；未设置时不读取原始道具数据，显式指定不存在的文件时会报错。

页面中的 `data/master_dict_*.json` 是 `public/data/` 下已提交的多语言字典，由部署作为静态资源提供，与原始 Master 目录无关。

## 游戏文本与图标的远程核对

新增或修改游戏专名、i18n、图标时必须主动查询以下远程来源。本地 `data/Master`、`asset_downloader` 可能过期，只作搜索线索；除非用户明确要求历史版本，否则不能据此断言最新名称或图标。

- Master 仓库： https://github.com/moonheart/mementomori-masterbook/tree/master/Master
- JSON 直链模板：`https://raw.githubusercontent.com/moonheart/mementomori-masterbook/master/Master/{Table}MB.json`
- 同一仓库的备用传输：`https://cdn.jsdelivr.net/gh/moonheart/mementomori-masterbook@master/Master/{Table}MB.json`。CDN 可能缓存；有版本疑问时使用同一个 commit SHA 替代两处 `master`，并记录 SHA。
- 道具原始图标：`https://list.moonheart.dev/p/public/mmtm/AddressableConvertAssets/Icon/Item/Item_{四位IconId}.png`
- 发布图标目录：`public/images/items/`。官方资源同步入口和其他资源路径见 `scripts/sync_assets.js`，不要把道具路径套用到其他图标类型。

核对顺序：

1. 从截图或已有文档获取搜索词，在远程 MB 中定位实体；例如礼包查 `ShopCommonProductMB`，道具查 `ItemMB`，宝箱查 `TreasureChestMB`。以实际表字段为准，不假设 MB 的 Id 等于 ItemId 或 IconId。
2. 提取名称/显示名称键及 IconId，以同一文本键查询 `TextResourceZhCnMB.json`、`TextResourceZhTwMB.json`、`TextResourceEnUsMB.json`、`TextResourceJaJpMB.json`、`TextResourceKoKrMB.json`。只为页面排版处理换行标签，不二次翻译专名。
3. 按 MB IconId 获取远程原始图片，验证图片内容并目视确认。不得以截图裁图、自制图标或相似图标替代。
4. 在对应功能文档留下来源 URL、MB Id、文本键、IconId、核对日期；需要复现时记录远程 commit SHA。`doc/items/Pack/EventGiftPacks.md` 的团结任务组合包可作为记录示例。

若下载失败或查不到键，先尝试备用传输；仍无法核对时明确报告缺失证据，不凭记忆或自行翻译填入。下载的原始文件放系统临时目录，需要调用生成器时将该临时目录显式作为参数传入；不把机器路径写入项目代码，也不提交原始 MB。
