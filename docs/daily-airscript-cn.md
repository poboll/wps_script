# 每日任务 AirScript 适配说明

代码审计日期：2026-07-26

脚本：[`polymerization/daily.js`](../polymerization/daily.js)

配置生成：[`polymerization/UPDATE.js`](../polymerization/UPDATE.js)

逐项登录入口、B 列原始值/JSON 示例、默认行为、可选副作用和 E 列结果见[在线完整字段教程](https://wps-docs.caiths.com/daily-tasks)。凭据可按设备从[电脑端](./desktop-cn.md)、[iOS](./ios-cn.md)或 [Android](./android-cn.md)获取。

## 结论

当前纳入 13 项任务，排除 3 项。纳入表示任务所需的 HTTP、JSON/文本处理、摘要签名、Base64 和休眠能力可以由 AirScript 1.0 官方 API 表达，并且已经完成本地模拟契约测试。

没有真实 Cookie、密码、令牌或账号资产参与本次检查。因此，文档不会把“模拟通过”写成“真实账号验证通过”。第三方私有接口发生变化时，以 `daily` 表 E 列的回写结果为准。

## 官方能力核验

| 能力 | 官方结论 | 本项目用法 |
| --- | --- | --- |
| 运行时 | 使用 AirScript 1.0；2.0 当前尚未开放邮件 API | 网络请求、表格读写和可选 SMTP 推送 |
| JavaScript | 支持大部分 ES6；明确不支持 `class`、对象方法简写、`import/export`、可选链、`await`、生成器 | 主脚本避开所有明确不支持语法 |
| HTTP | 同步 `fetch/get/post/put/delete`；支持 headers、body、最长 60000 ms timeout | 所有目标服务请求和推送 |
| Response | status、headers、text、json、binary；正文只能读取一次 | 测试会阻止同一正文二次读取 |
| 表格 API | `Application.Sheets`、`Application.Range`、`Text`、`Value` 均有 1.0 文档 | 创建/切换配置表、读取凭据、回写结果 |
| Crypto | MD5、SHA-1、SHA-256、SHA-512 与 HMAC | 百度贴吧、什么值得买使用 MD5 |
| Buffer | 字符串/数组与 Buffer 转换，支持 Base64 | 动态生成全民 K 歌 `mapExt` |
| Time | `Time.sleep(milliseconds)` | 高频任务节流与失败重试 |
| 限制 | 禁止 IP/显式端口，响应最大 2 MB，高频调用会抛错 | 用户 URL 校验、1.8 MB 保护、请求上限 |

官方来源：

- [AirScript 脚本语言](https://airsheet.wps.cn/docs/guide/rules.html)
- [AirScript 网络 API](https://airsheet.wps.cn/docs/api/advanced/HTTP.html)
- [AirScript 内置函数](https://airsheet.wps.cn/docs/api/build-in.html)
- [AirScript Application API](https://airsheet.wps.cn/docs/api/excel/databook/Application.html)
- [AirScript Range API](https://airsheet.wps.cn/docs/api/excel/workbook/Range.html)
- [AirScript 1.0 邮件 API](https://airsheet.wps.cn/docs/api/advanced/SMTP.html)
- [AirScript 2.0 概述](https://airsheet.wps.cn/docs/apiV2/overview.html)
- [AirScript 高级服务限制](https://airsheet.wps.cn/docs/api/advanced/Overview.html#使用限制)

AirScript 官方 `Crypto` 没有 AES-CBC；当前官方文档也未提供加密凭据存储或环境变量服务。`CONFIG`、`daily` 和其他工作表中的 Cookie、令牌、密码都以单元格原文保存。应限制金山文档的访问权限，优先使用可撤销、最小权限的 Cookie 或令牌。

Python 会话对象、自动 Cookie jar、代理参数、关闭 TLS 校验和第三方包均没有 AirScript 等价能力。脚本只使用手动 Cookie、显式 headers 和平台默认 TLS 校验。

## 表格配置

运行 `UPDATE.js` 后会创建 `daily` 表：

| 列 | 内容 | 说明 |
| --- | --- | --- |
| A | 任务标识 | 例如 `ALIYUN`、`TIEBA` |
| B | 凭据或 JSON 配置 | 简单任务直接填 Cookie/令牌；扩展任务填 JSON |
| C | 是否执行 | 只有“是”会执行 |
| D | 账号名称 | 可选，用于日志和推送 |
| E | 最近结果 | 脚本自动回写 |
| F | 执行时间 | 脚本自动回写 |

早期测试版本创建过不同名称的聚合表。更新后请重新运行 `UPDATE.js`，把需要保留的凭据手动迁移到 `daily` 表；脚本不会读取或删除旧表。

## 任务与字段

| 任务 | 必填字段 | 默认范围 | 可选字段 |
| --- | --- | --- | --- |
| `YOUDAO` | `cookie` | 会话刷新、同步、签到、3 次广告空间 | `ad_count`：0-3 |
| `ALIYUN` | `refresh_token` | 刷新令牌、签到、领取奖励 | 无 |
| `BAIDUWP` | `cookie` | 会员签到、答题、等级与成长值 | 无 |
| `BILIBILI` | `cookie` | 登录、直播/漫画签到、经验和瓜子查询 | `vip_reward`、`coin_num`、`coin_type`、`watch`、`share`、`silver2coin` |
| `V2EX` | `cookie` | 每日奖励、余额、连续天数 | `proxy` 只会提示不支持，不会使用 |
| `ACFUN` | `cookie`，或 `phone` + `password` | 签到、等级和香蕉 | `like`、`danmu_text`、`banana` |
| `ENSHAN` | `cookie` | 当前插件签到、连续天数、恩山币和积分 | 无 |
| `FNNASCLUB` | `cookie` | 每日打卡、打卡动态 | 无 |
| `TIEBA` | 含 `BDUSS` 的 `cookie` | 分页、MD5 签名、逐吧签到、屏蔽统计 | `max_pages`：1-5，默认 3；`max_forums`：1-50，默认 20 |
| `SMZDM` | `cookie` | MD5 签到、签到奖励 | `activity_id`：仅限仍有效的活动 |
| `IQIYI` | 含 `P00001` 的 `cookie` | VIP 与成长信息 | `rewards`、`shake_limit`：1-10，默认 10；聚合抽奖还需 `P00003` |
| `KGQQ` | 含 `uid` 的 `cookie` | 资料、6 类奖励、鲜花差值 | `extended`、`music_rounds`：0-16 |
| `BAIDU` | `data_url`、`submit_url` | 获取 URL 文本并向官方地址提交 | `max_retries`：0-4 |

简单任务可以在 B 列直接填写原始凭据。以下情况使用 JSON。

### Bilibili

```json
{
  "cookie": "SESSDATA=...; bili_jct=...",
  "vip_reward": false,
  "coin_num": 0,
  "coin_type": 0,
  "watch": false,
  "share": false,
  "silver2coin": false
}
```

`coin_num` 限制为 0-5。权益、投币、观看、分享和兑换需要 `bili_jct`；投币和兑换可能消耗账号资产。

### AcFun

优先使用 Cookie：

```json
{
  "cookie": "auth_key=...; acPasstoken=...",
  "like": false,
  "danmu_text": "",
  "banana": false
}
```

也可以填写 `phone` 与 `password`，脚本会尝试从登录响应头中合并 Cookie。但 AirScript 没有加密凭据存储，不建议在共享表格中保存密码。`danmu_text` 非空时会发布公开弹幕，`banana` 会消耗香蕉。

### 爱奇艺

```json
{
  "cookie": "P00001=...; P00002=...; P00003=...",
  "rewards": false,
  "shake_limit": 10
}
```

`rewards=false` 时只执行账号和成长查询。开启后会调用多组私有活动接口，单组循环均有上限并加入间隔；活动码或设备参数失效时，核心查询仍可单独使用。

### 全民 K 歌

```json
{
  "cookie": "uid=...; ...",
  "extended": false,
  "music_rounds": 4
}
```

核心流程执行 6 类奖励并比较前后鲜花数。`extended=true` 会额外请求 4 类抽奖、音乐卡和 VIP 奖励；最坏请求数较高，默认关闭。

### 百度站点提交

```json
{
  "data_url": "https://example.com/urls.txt",
  "submit_url": "https://data.zz.baidu.com/urls?site=https%3A%2F%2Fexample.com&token=REPLACE_ME",
  "max_retries": 1
}
```

脚本只允许 `https://data.zz.baidu.com/urls` 作为提交地址，不接受 IP 或显式端口。URL 文本超过 1.8 MB 会停止执行；成功后不会重复提交。

## 默认关闭的行为

以下能力从 JavaScript 和 HTTP 角度可以实现，但不应在用户不知情时执行：

- Bilibili：领取会员权益、投币、观看上报、分享、银瓜子兑换。
- AcFun：账号密码登录、点赞后撤销、公开弹幕、投香蕉。
- 什么值得买：限时活动抽奖。
- 爱奇艺：摇奖、聚合抽奖、白金抽奖和等级权益。
- 全民 K 歌：额外抽奖、最多 16 轮音乐卡和 VIP 奖励。

这些功能必须在 B 列 JSON 中明确开启。每个任务的失败会写回自己的 E 列，不会把业务错误伪装成成功。

## 未纳入任务

| 标识 | 结论 | 原因 |
| --- | --- | --- |
| `AOLAXING` | 不适配 | 2026-07-26 复核时，公开任务接口明确返回“服务已下线”，不再作为状态正常的任务导入。 |
| `IMAOTAI` | 不适配 | 核心参数依赖 AES-CBC、PKCS7 和 Base64；AirScript 官方 Crypto 没有 AES。此外流程包含设备、定位和真实申购，不属于低风险签到。 |
| `MIMOTION` | 不适配 | HTTP 原语可以表达，但任务状态本身不稳定，并会上传伪造传感器/步数数据，不符合“状态正常的每日任务”筛选条件。 |

## 验证范围

本地检查命令：

```bash
node --check polymerization/daily.js
node --check polymerization/UPDATE.js
node tests/daily.test.js
```

测试内容：

- 13 个任务处理器全部存在并可在模拟 AirScript 全局对象中执行。
- 13 个核心路径全部覆盖。
- Bilibili、AcFun、爱奇艺、全民 K 歌的主要可选路径覆盖。
- HTTP options 只允许 `method`、`timeout`、`headers`、`body`。
- 同一 Response 正文如果被读取两次，测试立即失败。
- `daily.js` 和 `UPDATE.js` 均不包含官方明确禁止的 JavaScript 语法。
- `UPDATE.js` 可实际创建包含 13 项任务的 `daily` 表，重复运行不会覆盖 A-F 列已有内容。
- 主流程覆盖 A/B/C/D 列读取、C 列关闭跳过、E/F 列成功与失败回写，以及昵称汇总消息。

尚未验证：

- WPS AirScript 编辑器中的真实文档权限和服务授权。
- 任何用户的真实 Cookie、密码、令牌或账号资产。
- 第三方私有接口在未来日期的稳定性。

## 故障判断

1. 先查看 `daily` 表 E 列，不要只看推送是否发送。
2. `HTTP 401/403` 通常表示凭据过期或权限不足。
3. “未找到参数”通常表示目标网页结构变化或 Cookie 未登录。
4. 高频任务报错时，关闭扩展开关并错开定时任务。
5. 百度站点提交拒绝地址时，检查是否为 HTTPS 官方提交域名且没有显式端口。
