# 电脑端获取 Cookie 和令牌

Chrome、Edge 等 Chromium 浏览器能直接显示已发出的 Request Cookie，不需要安装抓包证书，是本项目首选方式。

> 检查日期：2026-07-26。只操作本人账号。不要把完整 cURL、Cookie、Authorization 或未脱敏 HAR 发到 Issue。

## 通用 Cookie

1. 打开目标网站并完成登录。
2. 打开开发者工具：macOS 使用 `Command + Option + I`，Windows/Linux 使用 `F12` 或 `Control + Shift + I`。
3. 选择 **Network**，刷新页面或打开账号页。
4. 选择目标域名的一条已登录请求。
5. 打开 **Headers → Request Headers**，复制 `Cookie` 后面的完整值，不包含 `Cookie:` 标题。
6. 将值粘贴到 `daily` 表对应行 B 列。

| 任务 | 建议域名 | 关键字段 |
| --- | --- | --- |
| `YOUDAO` | `note.youdao.com` | `YNOTE_PERS` |
| `BAIDUWP`、`TIEBA` | `pan.baidu.com`、`tieba.baidu.com` | `BDUSS` |
| `BILIBILI` | `bilibili.com` | `SESSDATA`，扩展功能还需 `bili_jct` |
| `V2EX` | `v2ex.com` | `A2` |
| `IQIYI` | `iqiyi.com` | `P00001`，扩展流程可能还需 `P00003` |
| `KGQQ` | `node.kg.qq.com` | `uid` |

AcFun、恩山、飞牛 NAS 社区和什么值得买应复制目标域名实际发出的完整 Cookie，不要只猜某一个 Cookie 名称。

## 阿里云盘 refresh_token

1. 登录 [阿里云盘 Web](https://www.alipan.com/drive/)。
2. 在开发者工具打开 **Application → Local Storage**，搜索 `refresh_token`。
3. 如果存储值是 JSON，只复制其中 `refresh_token` 的字符串。
4. 在 `ALIYUN` 行 B 列直接填令牌，或填 `{"refresh_token":"REPLACE_ME"}`。

不要误填有效期较短的 `access_token`，也不要在 Console 执行来历不明的取令牌代码。

## 百度站点提交

`BAIDU` 必须使用 JSON：

```json
{
  "data_url": "https://example.com/urls.txt",
  "submit_url": "https://data.zz.baidu.com/urls?site=https%3A%2F%2Fexample.com&token=REPLACE_ME",
  "max_retries": 1
}
```

`data_url` 每行返回一个待提交 URL；`submit_url` 必须是百度搜索资源平台生成的官方 HTTPS 地址。token 属于站点凭据，不要公开。

写入后把 C 列改为“是”，手动运行 `daily.js`，以 E 列回写结果判断凭据，F 列记录执行时间。完整网页版教程：[wps-docs.caiths.com/more/desktop](https://wps-docs.caiths.com/more/desktop)。

参考：[Chrome Network](https://developer.chrome.com/docs/devtools/network/reference)、[Chrome Cookies](https://developer.chrome.com/docs/devtools/application/cookies)。
