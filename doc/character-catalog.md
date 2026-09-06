# 角色概览

侧栏：角色图鉴 → 角色概览。展示CharacterMB中未标记IsIgnore的角色，不受讨伐名单限制。

数据由 `scripts/generate_character_catalog.mjs <Master目录> [输出目录]` 生成，默认保存到 `public/data/character-catalog/`，五语言分别加载。包括官方名称、称号、属性、职业、初始稀有度、基础速度，以及主动/被动技能各级原文和专武强化原文。技能等级文本可能是增量说明，首屏保留基础说明，其余等级展开阅读，不将最后一级的局部修改误当完整技能文本。

自动更新沿用现有链路：每日Sync Master Data从 `moonheart/mementomori-masterbook` 拉取MB，生成并提交资料；Sync Image Assets从Moonheart资源镜像补齐角色头像和全图鉴技能图标；成功后部署。已有图片跳过，远程未提供的图片下次重试，页面暂以文字占位。

初版由GitHub Actions生成正式JSON和新增图片，不上传本地导出资源。数据生成不依赖npm安装或本地解包目录。

属性可单选或显示全部，名称/称号/ID搜索可与属性组合，支持ID及基础速度排序。详情链接为 `#characters/<ID>`，返回保留本次列表筛选，语言切换重新加载相应数据。网络异常显示重试入口，图片失败显示文字占位。此页不使用讨伐模拟、伤害假设或“已忽略效果”说明。

专武效果直接按装备关联的 EquipmentExclusiveSkillDescriptionMB 读取三个阶段，在独立区域展示；不依赖技能是否有名称或是否包含专武等级记录，避免隐藏被动中的效果遗漏。缺失已关联的专武译文会中止生成。

