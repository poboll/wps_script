# Android 获取 Cookie：Reqable 抓包

网页能登录时优先使用[电脑端教程](./desktop-cn.md)。只有目标请求必须由 Android App 触发时，才使用 Reqable 的 VPN 录制模式。

> 检查日期：2026-07-26。只抓取本人设备、本人账号的流量。本文不提供 Root、系统证书写入、证书锁定绕过或截取他人流量的方法。

## 配置

1. 从 [Google Play](https://play.google.com/store/apps/details?id=com.reqable.android) 或 [Reqable 官网](https://reqable.com/en-US/download/)安装应用。
2. 进入 **Traffic**，将 **Record Mode** 设为 **VPN**，点击 **Start** 并允许 VPN 连接。
3. 点击盾牌/证书入口，按内置向导安装用户 CA，证书用途选择“VPN 和应用”或“CA 证书”。
4. 回到 Reqable，确认 CA 状态正常。先用浏览器打开一个 HTTPS 页面测试。

Android 7 及更高版本允许 App 拒绝用户 CA。浏览器可抓取而目标 App 断网时，通常是 App 不信任用户 CA 或使用证书锁定，应改用官方 Web 登录页。

## 抓取 Cookie

1. 清空记录和筛选条件，开始录制。
2. 打开目标 App，进入账号页或刷新一次任务页。
3. 返回 Reqable 并停止录制。
4. 按目标域名筛选，在 **Request → Headers** 复制 `Cookie` 冒号后的完整值。
5. 不要复制响应中的 `Set-Cookie`、整份 cURL 或未脱敏 HAR。

普通任务把 Cookie 原文写入 `daily` 表 B 列；可选功能使用 JSON：

```json
{
  "cookie": "P00001=REPLACE_ME; P00003=REPLACE_ME",
  "rewards": false,
  "shake_limit": 10
}
```

把 C 列改为“是”后手动运行 `daily.js`，以 E 列回写判断凭据是否有效，F 列记录执行时间。关键字段和每项 JSON 见[每日任务说明](./daily-airscript-cn.md)。

## 清理

1. 停止 Reqable 录制并断开 VPN。
2. 删除带 Cookie 的流量记录和导出文件。
3. 在 Android“安全/更多安全设置 → 加密与凭据 → 用户凭据”删除 Reqable 用户 CA，实际路径以设备为准。
4. 检查系统 VPN 页面，确认 Reqable 不再连接。

完整网页版教程：[wps-docs.caiths.com/more/android](https://wps-docs.caiths.com/more/android)。

参考：[Reqable 证书安装](https://reqable.com/en-US/docs/getting-started/installation/)、[抓包教程](https://reqable.com/en-US/docs/getting-started/tutorial-capture/)、[Android FAQ](https://reqable.com/en-US/docs/faq/android)。
