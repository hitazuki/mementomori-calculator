# 核心数据流转与更新流程

本文档梳理了项目中各类核心数据（包括 Master 解包数据字典、超值特卖、魔女的赠礼等）的提取、清洗与构建流程。整个体系分为手动或按需触发的基础数据获取阶段，以及前端打包时前置钩子自动完成的数据聚合转换阶段。

## 数据流转架构

```mermaid
flowchart LR
    %% 外部数据源 (External Entities)
    API(("🌐 Tamamo API"))
    Editor(("🧑‍💻 开发者"))
    Master(("📦 游戏 Master 数据"))

    %% 数据处理脚本 (Processes)
    FetchProc["⚙️ npm run fetch-packs\n(fetch_ultra_sale.js)"]
    SyncProc["⚙️ npm run sync:master\n(extract_master_data.js)"]
    BuildProc["🔨 npm run build / dev\n(gen_all_packs.js)"]

    %% 数据源文件 (Data Stores)
    UltraJSON[/"📄 ultra-sale-packs.json"/]
    WitchJSON[/"📄 witchGiftPacks.json"/]
    DictJSON[/"📄 itemScores.json"/]
    BaseData[/"📄 characters.json 等"/]
    
    %% 最终产物文件 (Output Data Stores)
    AllPacksJSON[/"📄 allPacks.json\n(前端核心依赖)"/]
    UltraFlatJSON[/"📄 ultraSalePacks.json\n(向下兼容格式)"/]
    WitchMD[/"📝 WitchGiftPacks.md\n(自动生成文档)"/]

    %% --------- 数据流向 (Data Flows) ---------
    API -- "HTTP 抓取礼包数据" --> FetchProc
    FetchProc -- "写入保存" --> UltraJSON

    Editor -- "手动编辑维护" --> WitchJSON

    Master -- "读取解包" --> SyncProc
    SyncProc -- "清洗提取字典及图鉴" --> BaseData

    UltraJSON -- "流转注入" --> BuildProc
    WitchJSON -- "流转注入" --> BuildProc
    DictJSON -. "提供翻译字典" .-> BuildProc

    BuildProc -- "聚合/去重转换" --> AllPacksJSON
    BuildProc -- "展平转换" --> UltraFlatJSON
    BuildProc -- "Markdown 格式化" --> WitchMD

    %% 样式区分
    classDef process fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;
    classDef data fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef output fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    
    class FetchProc,SyncProc,BuildProc process;
    class UltraJSON,WitchJSON,DictJSON,BaseData data;
    class AllPacksJSON,UltraFlatJSON,WitchMD output;
```

## 常用更新操作说明

1. **同步 Master 解包数据**：当游戏发布新角色、新图鉴等大版本更新后，执行 `npm run sync:master`。这会更新 `characters.json` 和 `mysterium_data.json` 等基础核心数据字典。
2. **更新超值特卖**：执行 `npm run fetch-packs` 获取最新数据，检查变动后 Commit。
3. **更新魔女赠礼**：手动修改 `src/constants/witchGiftPacks.json` 配置文件。
4. **完成最终打包与验证**：执行 `npm run build` 或 `npm run dev`，构建脚本会自动将上述最新的基础数据源整合成前端应用最终需要的数据产物。

## 💡 Git 追踪策略与说明
为了保持仓库的纯净和自动化流程的稳定运行，项目对脚本和生成物采用了混合追踪策略：
- **默认拦截**：通过 `.gitignore` 黑名单，拦截了 `scripts/` 与 `doc/items/` 目录下的所有一次性本地爬虫、解包测试脚本与临时产物。
- **特定放行**：通过白名单强制追踪了参与 Web 打包流程的必须项（如 `gen_all_packs.js` 脚本、`ultra-sale-packs.json` 数据），以确保远端 GitHub Actions 的 CI/CD 线上构建不会因为缺失依赖而崩溃。
