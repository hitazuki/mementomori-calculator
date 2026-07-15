# MementoMori 多功能计算器

面向《MementoMori》玩家的计算与规划工具集，提供伤害分析、讨伐模拟、资源性价比、礼包规划、抽卡收益与秘仪评分。

[在线使用](https://hitazuki.github.io/mementomori-calculator/)

## 功能

- **伤害分析**：单体伤害、变量扫描、热力图、敏感性分析、多方案对比及交叉拉表。
- **讨伐模拟**：配置阵容、Boss 与站位，模拟 10 回合技能循环和队伍倍率。
- **资源规划**：比较商店兑换、礼包价值与超值限时组合包购买方案。
- **抽卡分析**：估算角色与禁忌武具卡池的概率、成本和回收价值。
- **秘仪评分**：按自定义权重评估秘仪组合与角色配置。
- **多语言与主题**：支持简体中文、繁体中文、英文及明暗主题。

## 本地运行

需要 Node.js 和 npm。

```bash
npm install
npm run dev
```

开发服务器默认访问地址：<http://127.0.0.1:5173/mementomori-calculator/>

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm test` | 运行多语言与核心逻辑测试 |
| `npm run build` | 测试、生成礼包数据并构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run sync:master` | 从 Master 数据同步项目所需资料 |
| `npm run sync:assets` | 同步角色与道具图片资源 |

## 技术栈

Vue 3 · Vite · Pinia · Vue I18n · ECharts · 原生 CSS

## 目录说明

```text
src/
├── components/   # 通用及功能组件
├── composables/  # 页面状态与复用逻辑
├── constants/    # 计算所需的静态数据
├── engine/       # 伤害、礼包、抽卡、讨伐等核心逻辑
├── locales/      # 多语言文案
├── styles/       # 全局样式
└── views/        # 功能页面
doc/               # 公式、数据口径与功能说明
scripts/           # 数据生成和同步脚本
test/              # 单元测试
```

## 数据与计算口径

- 伤害公式与变量说明见 [`doc/damage/`](doc/damage/)。
- 道具评分及礼包 CE 口径见 [`doc/items/items-calc-formula.md`](doc/items/items-calc-formula.md)。
- 部分评分可在网页中调整，并保存在浏览器本地。
- 游戏版本更新可能影响数据与结果；重要决策请结合当前游戏内信息核对。

## License

[MIT](LICENSE)
