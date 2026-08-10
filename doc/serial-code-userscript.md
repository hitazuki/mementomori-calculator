# MementoMori 序列码批量兑换脚本

本工具由项目页面、公开序列码数据和 Tampermonkey 用户脚本三部分组成。项目页面负责安装说明与公开码展示；用户脚本只在 MementoMori 官方兑换页运行，并调用官网原有的确认和兑换接口。

## 安装

1. 从浏览器扩展商店或 [Tampermonkey 官网](https://www.tampermonkey.net/)安装 Tampermonkey。
2. 打开项目部署后的脚本地址：

   ```text
   https://hitazuki.github.io/mementomori-calculator/userscripts/mememori-code-batch.user.js
   ```

3. Tampermonkey 显示安装确认页后，检查脚本名称和权限，点击“安装”。
4. 打开 [MementoMori 官方兑换页](https://mememori-game.com/code/)，页面上方出现“序列码批量兑换”面板即表示安装成功。

## 使用

1. 在官方表单中选择与游戏标题画面一致的 Server。
2. 输入玩家 ID。
3. 点击“同步公开码”，或者在文本框中每行填写一个序列码。
4. 点击“核对玩家”。脚本会使用第一个代码调用官网确认接口，并显示玩家名和世界。
5. 确认玩家信息无误后，点击“开始兑换”。
6. 脚本逐个执行 `Confirm` 和 `Register`，两次兑换之间至少等待 4 秒。
7. 可随时点击“暂停”；当前请求完成后队列停止。

脚本不会并发提交。遇到 HTTP 403、429、服务端错误、玩家信息不一致，或者连续两个代码失败时，会自动暂停。官方提示短时间内多次提交错误代码可能导致暂时无法输入，因此不要反复重试失败代码。

## 更新公开序列码

公开码维护在：

```text
public/data/serial-codes.json
```

新增条目的格式：

```json
{
  "code": "EXAMPLE2026",
  "title": "Public serial code",
  "regions": ["Japan", "Korea", "Asia", "America", "Europe", "Global"],
  "validFrom": null,
  "expiresAt": "2026-12-31T14:59:59Z",
  "source": "https://mememori-game.com/news/example",
  "enabled": true
}
```

- 时间必须使用带时区的 ISO 8601 格式，推荐统一保存为 UTC。
- 官方未公布期限时使用 `expiresAt: null`，不要填写虚构的远期日期。
- `enabled: false` 可立即停止向用户脚本分发某个代码。
- 修改数据后更新顶层 `updatedAt`，提交并等待 GitHub Pages 部署即可；无需升级脚本版本。
- 新增前应检查 `code` 是否重复，并尽量填写官方来源链接。

## 发布脚本更新

用户脚本源文件位于：

```text
public/userscripts/mememori-code-batch.user.js
```

每次修改执行逻辑后必须增加头部的 `@version`。GitHub Pages 部署完成后，Tampermonkey 会根据 `@updateURL` 检查更新。公开码数据变化不需要增加脚本版本。

## 数据与隐私

- 玩家 ID 和兑换结果只在官方页面及用户本机中处理。
- 公开码列表从本项目 GitHub Pages 获取。
- 脚本不会向本项目上传玩家 ID、玩家名、世界或兑换结果。
- 成功历史通过 Tampermonkey 本地存储保存，用于避免用户自行重复处理。
- 不要在公开 Issue 中粘贴个人用一次性序列码。

## 维护注意事项

官网表单结构或接口变化时，脚本可能停止工作。维护时应核对以下页面元素和接口，但不要使用真实个人码进行自动化测试：

```text
#cdkey_select_server
#cdkey_character
POST https://code-input.mememori-boi.com/SerialCode/Confirm
POST https://code-input.mememori-boi.com/SerialCode/Register
```
