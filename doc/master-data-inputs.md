# 原始 Master 数据输入

原始游戏数据是仓库外部的临时输入，不随项目提交。开发服务器、生产构建、单元测试和页面运行只使用已提交的精简数据，不读取原始数据目录。

需要重新生成数据时，显式提供包含 `*MB.json` 文件的目录；不传目录会在写入任何输出前报用法错误：

```sh
npm run sync:master -- <master-directory>
npm run generate:catalog -- <master-directory> [output-directory]
node scripts/generate_equipment_reinforcement.mjs <master-directory>
node scripts/generate_equipment_reinforcement.mjs <master-directory> --check
node scripts/generate_raid_character_mb_texts.mjs <master-directory>
python scripts/gen_pack_doc.py <master-directory>
```

强化材料的 `--check` 只比对原始数据与已提交常量，不写文件。普通测试检查精简数据结构和计算结果，无需下载原始数据。

`Sync Master Data` 工作流自行检出外部 masterbook 仓库，并将找到的目录传给生成脚本。部署工作流无需原始数据。

资源同步通常使用已提交的角色数据。如果需要原始道具清单来校验道具图标，设置 `SYNC_ASSETS_ITEM_MASTER_FILE` 为外部 `ItemMB.json` 的完整路径；未设置时不读取原始道具数据，显式指定不存在的文件时会报错。

页面中的 `data/master_dict_*.json` 是 `public/data/` 下已提交的多语言字典，由部署作为静态资源提供，与原始 Master 目录无关。
