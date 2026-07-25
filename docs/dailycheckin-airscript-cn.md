# DailyCheckIn AirScript 适配说明

检查日期：2026-07-25  
参考上游：[`Sitoi/dailycheckin`](https://github.com/Sitoi/dailycheckin/tree/135cc236e59ac4f14bcddc44acb3cbb3ed6010b5)  
AirScript 文档：[`网络 API`](https://airsheet.wps.cn/docs/api/advanced/HTTP.html)、[`内置函数`](https://airsheet.wps.cn/docs/api/build-in.html)

## AirScript 能力结论

AirScript 在服务端同步执行现代 JavaScript。添加“网络 API”服务后，可使用 `HTTP.fetch/get/post`，设置请求方法、请求头、请求体和最长 60 秒的超时，并读取文本、JSON、响应头或二进制响应。

内置 `Crypto` 支持 MD5、SHA-1、SHA-256、SHA-512 及相应 HMAC，`Buffer` 支持二进制和 Base64 转换，`Time.sleep()` 可控制请求间隔。因此普通 Cookie、表单、JSON、HTML 解析和摘要签名任务适合迁移；依赖完整浏览器、验证码、代理、原生 App 设备证明或第三方 Python 包的流程不适合直接迁移。

## 本次适配

统一脚本为 [`polymerization/dailycheckin.js`](../polymerization/dailycheckin.js)。运行新版 `UPDATE.js` 后会创建 `dailycheckin` 表；按示例填写凭据，把“是否执行”改为“是”，再运行脚本。脚本会把最近结果和执行时间写回 E、F 列。

| 任务 | 标识 | 适配范围 | 当前结论 |
| --- | --- | --- | --- |
| 有道云笔记 | `YOUDAO` | 签到、广告空间 | 已适配，待真实 Cookie 验证 |
| 阿里云盘 | `ALIYUN` | 刷新 access token、签到、领取当日奖励 | 已适配，待真实 refresh_token 验证 |
| 百度网盘 | `BAIDUWP` | 会员签到、每日答题、会员信息 | 已适配，待真实 Cookie 验证 |
| Bilibili | `BILIBILI` | 登录检查、直播签到、漫画签到 | 已适配，待真实 Cookie 验证 |
| V2EX | `V2EX` | 每日登录奖励、余额查询 | 已适配，待真实 Cookie 验证 |
| AcFun | `ACFUN` | 每日签到、等级与香蕉查询 | 已适配，待真实 Cookie 验证 |
| 恩山无线论坛 | `ENSHAN` | formhash 获取、论坛签到 | 已适配，待真实 Cookie 验证 |
| 飞牛 NAS 社区 | `FNNASCLUB` | 打卡参数获取、每日打卡 | 已适配，待真实 Cookie 验证 |
| 百度贴吧 | `TIEBA` | TBS、关注贴吧列表、MD5 签名逐吧签到 | 已适配，待真实 Cookie 验证 |
| 什么值得买 | `SMZDM` | robot token、MD5 签名签到 | 已适配，待真实 Cookie 验证 |
| 爱奇艺 | `IQIYI` | VIP 账号与成长信息查询 | 部分适配；高频抽奖未启用 |
| 全民 K 歌 | `KGQQ` | 六类签到奖励请求 | 部分适配；接口字段易变化 |

“待真实 Cookie 验证”表示代码已完成语法、参数和模拟响应验证，但维护者没有用户凭据，未冒充线上实测结果。第三方接口随时可能调整，运行结果应以表格回写信息为准。

## 未适配任务

| 任务 | 原因 |
| --- | --- |
| i 茅台 | 涉及申购、设备与定位参数，不属于低风险的普通签到 |
| 小米运动 | 需要账号密码登录并修改运动数据，存在账号风控与行为风险 |
| 百度站点提交 | 属于站长 URL 提交工具，不是个人每日签到，配置模型不同 |
| 奥拉星 | 老旧活动接口稳定性不足，且缺少可验证账号 |

这些任务不会生成占位脚本，也不会在 README 中标成可用。
