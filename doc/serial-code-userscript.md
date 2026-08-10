# MementoMori 序列码批量兑换脚本

本工具由项目安装页面、公开序列码数据和 Tampermonkey 用户脚本组成。用户脚本只在 MementoMori 官方兑换页运行，支持多账号持久化、按过期时间选择兑换码批次、串行兑换、断点恢复和本地备份。

## 安装

1. 从浏览器扩展商店或 [Tampermonkey 官网](https://www.tampermonkey.net/)安装 Tampermonkey。
2. 打开脚本安装地址：

   ```text
   https://hitazuki.github.io/mementomori-calculator/userscripts/mememori-code-batch.user.js
   ```

3. 检查脚本名称、匹配域名和权限后点击“安装”。
4. 打开 [MementoMori 官方兑换页](https://mememori-game.com/code/)，页面中出现批量兑换面板即表示安装成功。

Tampermonkey 会根据 `@updateURL` 检查新版。官网右上角切换语言后页面会重新加载，脚本自动跟随日语、英语、繁中、简中或韩语。

## 账号管理

1. 打开“管理账号”。
2. 填写备注、Server 和玩家 ID 后保存；备注仅用于本机识别。
3. 相同 `serverId + playerId` 只能保存一次，修改备注不会创建重复账号。
4. 账号首次保存时可以处于“未核对”状态；运行“核对所选账号”后会保存官网返回的玩家名、世界和核对时间。
5. 删除账号默认保留其兑换状态记录，重新添加同一 Server 和玩家 ID 后仍会自动跳过已成功或官网确认已使用的代码。
6. “清除记录”会永久删除该账号的本地兑换状态历史，执行前会再次确认。

账号资料保存在 Tampermonkey 的 `mmt-serial-code-accounts-v1` 存储中，不会上传到项目服务器。

## 多账号批量兑换

1. 选择兑换码批次；具有完全相同 `expiresAt` 的代码自动归为一批，`expiresAt: null` 属于无期限批次。
2. 勾选一个或多个账号。脚本默认只勾选最近使用的一个账号，多账号必须主动选择。
3. “核对所选账号”是可选预检。脚本依次调用官网 `Confirm`，展示每个账号的玩家名、世界和待兑换数量；不核对也可以直接点击“开始兑换”。
4. 正式兑换时，每个代码仍会先调用 `Confirm`；已有核对资料时会比对玩家信息，通过后才调用 `Register`。兑换成功也会更新该账号的玩家名、世界和最近核对时间。
5. 队列按账号执行：每个请求完成后统一等待 2 秒再处理下一项，包括同账号代码和账号切换；全局不会并发请求。
6. 官网接口请求超过 15 秒未响应时按失败处理，不会无限停留在“核对中”。“已经使用”只标记当前代码并继续，即使官网同时返回 HTTP 403，也以明确的“已经使用”正文为准；普通代码错误也只影响当前代码，但连续两个会暂停保护。超时或网络错误才会跳过该账号的剩余代码。
7. 本机已有“成功”或“官网确认已使用”记录的 `serverId:playerId:CODE` 组合自动跳过，不再向官网重试。
8. 点击“暂停”后，当前请求完成即保存断点。刷新页面不会自动继续，必须点击“恢复未完成任务”并再次点击继续兑换；恢复时不强制重新核对。

以下情况会暂停全部任务：

- HTTP 403 或 429。
- 服务端错误。
- 官网返回的玩家信息与核对结果不一致。
- 连续两个账号出现普通请求错误。

官网提示短时间内多次提交错误代码可能导致暂时无法输入，不要反复重试失败代码。官网明确提示“已经使用”时，脚本会保存独立的 `already-used` 状态；它不等同于本机兑换成功，但同样作为终态避免再次提交。

## 兑换记录与备份

兑换状态记录保存在 `mmt-serial-code-redemptions-v1`，包括本机兑换成功和官网确认已使用两类终态，键格式为：

```text
serverId:playerId:SERIALCODE
```

旧版 `mmt-serial-code-success-history` 会在首次运行 0.3.0 时合并迁移，旧键不会删除。

账号管理中的“导出备份”会生成 JSON，包含：

- `type: "mmt-serial-code-backup"`
- `schemaVersion: 1`
- 导出时间
- 账号资料
- 成功及已使用状态记录

备份不包含公开码缓存或暂停队列。导入时先校验并预览数量，然后按 `serverId + playerId` 合并账号、对兑换状态记录取并集；“成功”优先于“已使用”，不会删除本机已有历史。备份含有玩家 ID，请自行妥善保管，不要上传到公开 Issue。

本地数据在关闭浏览器、重启电脑或更新脚本后通常仍会保留，但卸载 Tampermonkey、清除扩展数据、更换浏览器配置或设备时可能丢失，建议定期导出备份。

## 更新公开序列码

公开码维护在：

```text
public/data/serial-codes.json
```

条目格式：

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

- 时间使用带时区的 ISO 8601 格式，推荐统一保存为 UTC。
- 官方未公布期限时使用 `expiresAt: null`。
- `enabled: false` 会立即停止分发该代码。
- 批次不需要手动编号，由 `expiresAt` 自动分组。
- 修改数据后更新顶层 `updatedAt` 并部署 GitHub Pages；数据变化不需要增加脚本版本。

## 发布与维护

用户脚本位于：

```text
public/userscripts/mememori-code-batch.user.js
```

修改执行逻辑后必须增加 `@version`。维护时应核对以下页面元素和接口，但不要使用真实个人码运行自动化 `Register` 测试：

```text
#cdkey_select_server
#cdkey_character
POST https://code-input.mememori-boi.com/SerialCode/Confirm
POST https://code-input.mememori-boi.com/SerialCode/Register
```

脚本内置纯逻辑测试入口，用于验证语言映射、账号合并、旧历史迁移、备份校验、任务顺序和请求间隔，不会访问官网接口。
