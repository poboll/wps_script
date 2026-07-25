<p align="center">
  <img src="./docs/images/project-preview.svg" alt="poboll WPS AirScript 每日任务自动化预览" width="100%">
</p>

<h1 align="center">WPS AirScript 自动化脚本</h1>

<p align="center">在金山文档中配置多账号、定时执行任务、回写结果并统一推送通知。</p>

<p align="center">
  <a href="https://github.com/poboll/wps_script/stargazers"><img src="https://img.shields.io/github/stars/poboll/wps_script?style=flat-square" alt="GitHub stars"></a>
  <a href="https://github.com/poboll/wps_script/network/members"><img src="https://img.shields.io/github/forks/poboll/wps_script?style=flat-square" alt="GitHub forks"></a>
  <a href="https://github.com/poboll/wps_script/issues"><img src="https://img.shields.io/github/issues/poboll/wps_script?style=flat-square" alt="GitHub issues"></a>
  <a href="https://wps-docs.caiths.com"><img src="https://img.shields.io/badge/docs-wps--docs.caiths.com-175CD3?style=flat-square" alt="在线文档"></a>
  <img src="https://img.shields.io/badge/checked-2026--07--26-067647?style=flat-square" alt="检查日期 2026-07-26">
</p>

## 项目说明

本仓库提供适用于 WPS AirScript 的 JavaScript 自动化脚本。`polymerization` 是当前维护的聚合版本；`single` 是历史独立版本，不再作为主要维护目标。

- [在线文档](https://wps-docs.caiths.com)
- [从零配置聚合脚本](https://wps-docs.caiths.com/polymerization)
- [13 项任务与 B 列字段](https://wps-docs.caiths.com/daily-tasks)
- [电脑端获取凭据](https://wps-docs.caiths.com/more/desktop)
- [iOS 抓包教程](https://wps-docs.caiths.com/more/ios)
- [Android 抓包教程](https://wps-docs.caiths.com/more/android)
- [仓库内电脑端教程](./docs/desktop-cn.md)
- [仓库内 iOS 教程](./docs/ios-cn.md)
- [仓库内 Android 教程](./docs/android-cn.md)
- [每日任务适配说明](./docs/daily-airscript-cn.md)
- [聚合脚本使用说明](./docs/polymerization-cn.md)
- [脚本仓库](https://github.com/poboll/wps_script)

## 2026-07-26 更新

- 新增 [`polymerization/daily.js`](./polymerization/daily.js)，纳入 13 项适合 AirScript 且当前未确认下线的任务。
- 更新 [`polymerization/UPDATE.js`](./polymerization/UPDATE.js)，可自动创建 `daily` 配置表，不覆盖已有单元格。
- 按 AirScript 官方文档重写 HTTP、MD5、Buffer、休眠和表格逻辑，不使用第三方包或未支持语法。
- 将资产消耗、公开互动和抽奖等扩展流程改为显式开关；高请求量核心流程设置上限并节流。
- 增加 13 项任务的模拟契约测试，并明确区分“代码验证”和“真实账号验证”。

> 维护者没有使用用户 Cookie、密码或令牌进行线上测试。本文的“已适配”表示语法、请求结构、分支和模拟响应已检查，不代表第三方私有接口永久可用。

## 快速开始

1. 在金山文档中新建智能表格，并打开 **AirScript 1.0** 编辑器。
2. 在编辑器的“服务”中添加“网络 API”；需要邮件推送时再添加邮件服务。
3. 复制并运行 [`polymerization/UPDATE.js`](./polymerization/UPDATE.js)，创建配置表。
4. 在 `daily` 表中填写任务标识和凭据，将“是否执行”改为“是”。
5. 新建自动化脚本，复制 [`polymerization/daily.js`](./polymerization/daily.js)，按需设置定时任务。

`daily` 表结构：

| A：任务标识 | B：凭据或 JSON 配置 | C：是否执行 | D：账号名称 | E：最近结果 | F：执行时间 |
| --- | --- | --- | --- | --- | --- |
| `ALIYUN` | `refresh_token` | 否 | 阿里云盘 | 自动回写 | 自动回写 |
| `TIEBA` | `BDUSS=...; ...` | 否 | 百度贴吧 | 自动回写 | 自动回写 |

请勿在 Issue、截图、日志或公开文档中提交真实凭据。

## AirScript 能力边界

本次实现以 WPS 官方文档为准：

- 本项目使用 AirScript 1.0。2.0 当前尚未开放邮件 API，不能直接替代本项目的可选 SMTP 推送。
- [脚本语言](https://airsheet.wps.cn/docs/guide/rules.html)：支持大部分 ES6；不使用官方明确不支持的 `class`、对象方法简写、`import/export`、可选链、`await` 和生成器。
- [网络 API](https://airsheet.wps.cn/docs/api/advanced/HTTP.html)：使用同步 `HTTP.fetch/get/post`、请求头、字符串请求体和 0-60000 ms 超时。
- [内置函数](https://airsheet.wps.cn/docs/api/build-in.html)：只使用官方列出的 MD5/SHA/HMAC、`Buffer` 和 `Time.sleep()`。
- [Application](https://airsheet.wps.cn/docs/api/excel/databook/Application.html) 与 [Range](https://airsheet.wps.cn/docs/api/excel/workbook/Range.html)：使用官方表格 API 创建/切换工作表，并通过 `Text` 和 `Value` 读写单元格。
- [邮件 API](https://airsheet.wps.cn/docs/api/advanced/SMTP.html)：可选 SMTP 推送使用 1.0 的 `SMTP.login()` 和 `mailer.send()`。
- [AirScript 2.0 概述](https://airsheet.wps.cn/docs/apiV2/overview.html)：官方标明邮件 API 仍待开放，且部分 1.0 API 不能完全兼容。
- [高级服务限制](https://airsheet.wps.cn/docs/api/advanced/Overview.html#使用限制)：外部地址不能使用 IP 或显式端口，响应体不能超过 2 MB，高频调用需要主动节流。

AirScript 官方 `Crypto` 只提供摘要和 HMAC，不提供 AES-CBC；官方文档也未提供加密凭据存储。Cookie、令牌或密码会以单元格原文保存，请限制文档访问权限，优先使用可撤销 Cookie 或令牌。

Python 会话对象、自动 Cookie jar、代理参数、关闭 TLS 校验和第三方包均没有 AirScript 等价能力。本项目改为手动 Cookie、显式 headers 和平台默认 TLS 校验，不加载第三方依赖。

## 每日任务范围

状态含义：

- 🟡 **可用（代码验证）**：已完成 AirScript 代码、配置和模拟契约检查，等待用户用自己的凭据验证第三方接口。
- 🟠 **可用（受限）**：核心流程已适配，但含高请求量、私有接口或账号副作用；相关扩展默认关闭或受请求上限保护。
- 🔴 **不纳入**：当前不满足 AirScript 能力、安全性或服务状态要求，并给出明确原因。

| 状态 | 任务 | 标识 | 默认执行范围 | 可选范围 / 限制 | 代码审计日期 |
| --- | --- | --- | --- | --- | --- |
| 🟡 可用（代码验证） | 有道云笔记 | `YOUDAO` | 会话刷新、同步、签到、广告空间 | 最多 3 次广告任务 | 2026-07-26 |
| 🟡 可用（代码验证） | 阿里云盘 | `ALIYUN` | 刷新令牌、签到、领取当日奖励 | 无 | 2026-07-26 |
| 🟡 可用（代码验证） | 百度网盘 | `BAIDUWP` | 会员签到、每日答题、成长查询 | 无 | 2026-07-26 |
| 🟠 可用（受限） | Bilibili | `BILIBILI` | 登录检查、直播和漫画签到、只读统计 | 会员权益、投币、观看、分享、银瓜子兑换默认关闭 | 2026-07-26 |
| 🟡 可用（代码验证） | V2EX | `V2EX` | 每日奖励、余额、连续签到 | AirScript 不支持代理参数 | 2026-07-26 |
| 🟠 可用（受限） | AcFun | `ACFUN` | 签到、等级和香蕉查询 | 登录、点赞、弹幕、投香蕉需显式配置 | 2026-07-26 |
| 🟡 可用（代码验证） | 恩山无线论坛 | `ENSHAN` | 当前插件签到、连续天数、积分查询 | 无 | 2026-07-26 |
| 🟡 可用（代码验证） | 飞牛 NAS 社区 | `FNNASCLUB` | 每日打卡、打卡动态 | 无 | 2026-07-26 |
| 🟠 可用（受限） | 百度贴吧 | `TIEBA` | 分页取贴吧、MD5 签名、逐吧签到和统计 | 默认最多 3 页、20 个贴吧，可调至 5 页、50 个 | 2026-07-26 |
| 🟠 可用（受限） | 什么值得买 | `SMZDM` | MD5 签名签到、签到奖励 | 限时活动需提供 `activity_id` | 2026-07-26 |
| 🟠 可用（受限） | 爱奇艺 | `IQIYI` | VIP 与成长信息 | 抽奖和权益接口默认关闭 | 2026-07-26 |
| 🟠 可用（受限） | 全民 K 歌 | `KGQQ` | 资料、6 类奖励、鲜花差值 | 抽奖、音乐卡和 VIP 奖励默认关闭并节流 | 2026-07-26 |
| 🟡 可用（代码验证） | 百度站点提交 | `BAIDU` | 获取 URL 列表并提交 | 仅允许官方提交域名，最多 5 次尝试，源响应小于 1.8 MB | 2026-07-26 |
| 🔴 不纳入 | 奥拉星 | `AOLAXING` | 不适配 | 公开任务接口已明确返回“服务已下线” | 2026-07-26 |
| 🔴 不纳入 | i 茅台 | `IMAOTAI` | 不适配 | 依赖 AES-CBC/PKCS7、设备和定位参数，并执行真实申购 | 2026-07-26 |
| 🔴 不纳入 | 小米运动 | `MIMOTION` | 不适配 | 状态不稳定，且会写入伪造运动数据，不属于正常签到 | 2026-07-26 |

详细字段和 JSON 示例见 [每日任务适配说明](./docs/daily-airscript-cn.md)。

## 可选配置示例

普通任务可直接在 B 列填写 Cookie 或令牌。需要扩展功能时填写 JSON：

```json
{
  "cookie": "SESSDATA=...; bili_jct=...",
  "coin_num": 0,
  "vip_reward": false,
  "watch": false,
  "share": false,
  "silver2coin": false
}
```

百度站点提交必须使用 JSON：

```json
{
  "data_url": "https://example.com/urls.txt",
  "submit_url": "https://data.zz.baidu.com/urls?site=https%3A%2F%2Fexample.com&token=REPLACE_ME",
  "max_retries": 1
}
```

## 聚合脚本

`polymerization` 中的脚本共用以下工作表：

- `CONFIG`：设置是否只推送失败消息、是否显示账号昵称。
- `PUSH`：配置 Bark、pushplus、ServerChan、邮箱、钉钉或 Discord。
- `EMAIL`：仅在开启邮件推送时使用。
- `daily`：保存 13 项每日任务的账号配置、执行开关和 E/F 列回写结果。

`UPDATE.js` 只补充缺失行列，不会主动覆盖已有单元格。运行前仍建议保留自己的文档副本。

## 本地验证

```bash
node --check polymerization/daily.js
node --check polymerization/UPDATE.js
node tests/daily.test.js
```

测试覆盖 13 个任务的核心路径，并覆盖 Bilibili、AcFun、爱奇艺和全民 K 歌的主要可选路径。模拟测试不能代替 AirScript 编辑器实机运行或真实账号验证。

## 使用约束

- 仅在你有权使用的账号和服务上运行脚本。
- 第三方私有接口可能随时改变；以 E 列回写结果为准，不要仅依赖推送成功。
- 投币、公开互动、抽奖、兑换等操作可能消耗账号资产或触发风控，默认关闭。
- 不要把多个高频任务安排在同一分钟，建议错峰执行。
- 本项目用于个人自动化研究，不保证第三方服务长期兼容。

## License

本仓库以 [MIT](./LICENSE) 许可发布。2026 年 AirScript 迁移与维护由 [poboll](https://github.com/poboll) 完成；依法必须保留的第三方 MIT 声明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
