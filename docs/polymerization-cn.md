# 聚合脚本使用说明

当前每日任务使用一份 [`daily.js`](../polymerization/daily.js) 和一张 `daily` 配置表。旧的“每个任务复制一份脚本、维护一张分配置表”方式仅适用于仓库中的历史脚本，不是本次每日任务适配的推荐流程。

## 准备工作

1. 在金山文档中新建智能表格。
2. 打开 **AirScript 1.0** 编辑器。
3. 创建文档共享脚本，并添加“网络 API”服务。
4. 只有需要邮件推送时才添加“邮件 API”。AirScript 2.0 当前尚未开放邮件 API，不能直接替代本项目的 SMTP 推送。

## 创建配置表

先复制并运行 [`polymerization/UPDATE.js`](../polymerization/UPDATE.js)。脚本会创建或补全：

- `CONFIG`：设置是否只推送失败消息，以及是否显示账号昵称。
- `PUSH`：配置 Bark、pushplus、ServerChan、邮箱、钉钉和 Discord。
- `EMAIL`：仅在启用邮件推送时使用。
- `daily`：保存每日任务标识、凭据、开关和执行结果。

`UPDATE.js` 只补充缺失行列，不会主动覆盖已有单元格。运行前仍建议保留自己的文档副本。

## 配置 daily 表

| 列 | 内容 | 说明 |
| --- | --- | --- |
| A | 任务标识 | 例如 `ALIYUN`、`TIEBA` |
| B | 凭据或 JSON 配置 | 简单任务直接填写 Cookie/令牌；扩展任务填写 JSON |
| C | 是否执行 | 只有“是”会执行 |
| D | 账号名称 | 可选，用于日志和推送 |
| E | 最近结果 | `daily.js` 自动回写 |
| F | 执行时间 | `daily.js` 自动回写 |

完整字段、默认开关和排除原因见 [每日任务 AirScript 适配说明](./daily-airscript-cn.md)。不要在 Issue、截图或公开聊天中提交真实凭据。

获取凭据时优先使用[电脑端浏览器](./desktop-cn.md)；必须由手机 App 触发时再参考 [iOS](./ios-cn.md) 或 [Android](./android-cn.md) 抓包教程。网页版完整教程位于 [wps-docs.caiths.com/polymerization](https://wps-docs.caiths.com/polymerization)。

## 创建自动化脚本

1. 新建一份文档共享脚本，建议命名为 `daily`。
2. 复制 [`polymerization/daily.js`](../polymerization/daily.js) 的完整内容并保存。
3. 确认已添加“网络 API”服务。
4. 先手动运行一次，查看 `daily` 表 E、F 列。
5. 确认结果后再创建定时任务。

脚本按行执行已启用任务，并在任务之间休眠。贴吧、全民 K 歌等请求量较多的任务已经设置默认上限；仍建议错峰执行，不要把多份高频脚本安排在同一分钟。

## 更新方式

更新时重新复制最新版 `UPDATE.js` 和 `daily.js`：

1. 运行 `UPDATE.js` 补齐新表格或新行。
2. 用最新版 `daily.js` 替换自动化脚本内容。
3. 检查新增任务默认均为“否”，按需启用。
4. 手动运行并确认 E 列结果后，再保留定时任务。

早期测试版本曾使用其他聚合表名。新版只读取 `daily` 表，不会读取或删除旧表；需要保留的凭据请手动迁移。

## 历史脚本

`polymerization` 目录中的其他脚本沿用各自分配置表，`single` 目录保存历史独立版本。它们没有纳入本次 2026-07-26 的逐项复核，不能套用每日任务页面中的状态结论。
