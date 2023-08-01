<p align="center">
    <img src="https://socialify.git.ci/poboll/wps_script/image?description=1&descriptionEditable=WPS%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC%E9%9B%86%E5%90%88%EF%BC%8C%E9%80%82%E7%94%A8%E4%BA%8E%E2%80%9C%E9%87%91%E5%B1%B1%E6%96%87%E6%A1%A3%E2%80%9D%E4%B8%ADAirScript%E8%87%AA%E5%8A%A8%E5%8C%96%E6%89%A7%E8%A1%8C%E3%80%82%E7%AD%BE%E5%88%B0%E5%88%97%E8%A1%A8%3A%20%EF%BD%9C%E7%88%B1%E5%A5%87%E8%89%BA%EF%BD%9C%E5%85%A8%E6%B0%91K%E6%AD%8C%EF%BD%9C%E6%9C%89%E9%81%93%E4%BA%91%E7%AC%94%E8%AE%B0%EF%BD%9C%E7%99%BE%E5%BA%A6%E8%B4%B4%E5%90%A7%EF%BD%9CBilibili%EF%BD%9CV2EX%EF%BD%9CAcFun%EF%BD%9C%E5%A4%A9%E7%BF%BC%E4%BA%91%E7%9B%98%EF%BD%9CFa%E7%B1%B3%E5%AE%B6%EF%BD%9C%E5%B0%8F%E7%B1%B3%E8%BF%90%E5%8A%A8%EF%BD%9C%E7%99%BE%E5%BA%A6%E6%90%9C%E7%B4%A2%E8%B5%84%E6%BA%90%E5%B9%B3%E5%8F%B0%EF%BD%9C&font=KoHo&forks=1&issues=1&language=1&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto"/>
    <br><strong><font size=50>签到脚本集合</font></strong>
    <br>基于【金山文档】的签到脚本
    <br>支持多账号使用、支持消息推送
</p>

<p align="center">
    <a href="https://github.com/poboll/wps_script/stargazers"><img src="https://img.shields.io/github/stars/poboll/wps_script?style=popout-square" alt="GitHub stars"></a>
    <a href="https://github.com/poboll/wps_script/network/members"><img src="https://img.shields.io/github/forks/poboll/wps_script?style=popout-square" alt="GitHub forks"></a>
    <a href="https://github.com/poboll/wps_script/issues"><img src="https://img.shields.io/github/issues/poboll/wps_script?style=popout-square" alt="GitHub issues"></a>
</p>


## 聚合脚本（polymerization）

文件夹“polymerization”为聚合脚本，运行UPDATE.js即可自动生成表格及配置内容。

### 聚合脚本优势

* 所有脚本及配置表格汇集在一个文档中，利于统一管理和配置
* 方便后续更新脚本，仅需运行UPDATE脚本即可自动新增最新表格及配置，不再需要手动新建表格框架
* 方便定时任务的添加与查看
* 支持仅推送错误消息、推送昵称等，支持更多的推送方式
* 配置灵活快捷，利于新增脚本及新配置功能
* 支持多脚本共用同一个表格，如WPS(轻量版)、WPS(客户端版)、WPS(稻壳版)脚本共用名称为wps的表格。

## 非聚合脚本（独立脚本、single）

文件夹“single”为独立脚本，需要手动创建表格。一个文档内只有一个脚本。

### 非聚合脚本表格内容参考

| cookie(默认20个) | 是否执行(是/否) | 账号名称(可不填写) | bark   | 是否推送(是/否) | pushplus | 是否推送(是/否) | ServerChan | 是否推送(是/否) |
| ---------------- | --------------- | ------------------ | ------ | --------------- | -------- | --------------- | ---------- | --------------- |
| xxxxxxxx1        | 是              | 昵称1              | xxxxxx | 否              | xxxxxx   | 否              | xxxxxx     | 否              |
| xxxxxxxx2        | 否              | 昵称2              |        |                 |          |                 |            |                 |

## 更多  

[IOS手机端获取cookie的方法可参考](./docs/ios-cn.md)

[Bark每日定时推送消息](./docs/bark-cn.md)

## 签到列表

🟢: 正常运行 🔴: 暂不可用 🟡: 待测试 🟤: 随缘

| 状态 | 类别 | 终端 | 任务名称 | 脚本名称 | 检查日期 | 是否支持多用户 | 是否需要表格 |备注 |使用步骤 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 🟢️ | 签到 | WEB | [阿里云盘(极简版)](https://www.aliyundrive.com) | aliyundrive_light.js | 2023-08-01 | 否 | 是 | 签到 |待编写 |
| 🟢️ | 签到 | WEB | [阿里云盘(多用户版)](https://www.aliyundrive.com) | aliyundrive_multiuser.js | 2023-08-01 | 是 | 是 | 签到 |待编写 |
| 🟤 | 签到 | WEB | [百度贴吧](https://tieba.baidu.com) | tieba.js | 2023-08-01 | 是 | 是 | 签到 |待编写 |
| 🟤 | 签到 | WEB | [吾爱论坛](https://www.52pojie.cn) | 52pojie.js | 2023-08-01 | 是 | 是 | 签到 |待编写 |
| 🟢️ | 签到 | WEB | [有道云笔记](https://note.youdao.com/) |noteyoudao.js | 2023-08-01 | 是 | 是 | 签到、领取空间 |[有道云](./docs/aliyundrive-cn.md) |
| 🟢️ | 签到 | 移动端 | [WPS(轻量版)](https://vip.wps.cn/) |wps_light.js | 2023-08-01 | 是 | 是 | 适用于PC端签到，需要手动兑换奖励 |待编写|
| 🟢️ | 签到 | 移动端 | [WPS(客户端版)](https://vip.wps.cn/) |wps_client.js | 2023-08-01 | 是 | 是 | 适用于手机端签到，不具备绕验证码功能 |待编写|
| 🟢️ | 签到 | 移动端 | [WPS(稻壳版)](https://vip.wps.cn/) |wps_docker.js | 2023-08-01 | 是 | 是 | 适用于稻壳签到，自动领取每日PPT | 待编写 |
| 🟢️ | 签到 | 移动端 | [网易云游戏](https://cg.163.com/) |wangyiyungame.js | 2023-08-01 | 是 | 是 | 签到 | 待编写 |
| 🟢️ | 签到 | 移动端 | [什么值得买](https://www.smzdm.com/) |smzdm.js | 2023-08-01 | 是 | 是 | 抽奖 | 待编写 |

## 支持的通知列表

- Bark（iOS）
- 邮箱推送（内置/自定义）
- Server酱
- pushplus
- 钉钉

## 建议  

* 不同wps版本签到间隔30分钟  
* 定时任务时间尽量上午九点半之后  
* 定时任务尽量不设在同一时间  

## 特别声明

- 本仓库发布的脚本仅用于测试和学习研究，禁止用于商业用途，不能保证其合法性，准确性，完整性和有效性，请根据情况自行判断。

- 本人对任何脚本问题概不负责，包括但不限于由任何脚本错误导致的任何损失或损害。

- 间接使用脚本的任何用户，包括但不限于建立VPS或在某些行为违反国家/地区法律或相关法规的情况下进行传播, 本人对于由此引起的任何隐私泄漏或其他后果概不负责。

- 请勿将本仓库的任何内容用于商业或非法目的，否则后果自负。

- 如果任何单位或个人认为该项目的脚本可能涉嫌侵犯其权利，则应及时通知并提供身份证明，所有权证明，我们将在收到认证文件后删除相关脚本。

- 任何以任何方式查看此项目的人或直接或间接使用该项目的任何脚本的使用者都应仔细阅读此声明。本人保留随时更改或补充此免责声明的权利。一旦使用并复制了任何相关脚本或Script项目的规则，则视为您已接受此免责声明。

**您必须在下载后的24小时内从计算机或手机中完全删除以上内容**

> ***您使用或者复制了本仓库且本人制作的任何脚本，则视为 `已接受` 此声明，请仔细阅读***

## 代码参考
<a href="https://github.com/HeiDaotu/WFRobertQL">WFRobertQL</a>
<a href="https://github.com/kxs2018/daily_sign">daily_sign</a>
<a href="https://www.52pojie.cn/thread-1811357-1-1.html">@qike2391</a>
<a href="https://github.com/wd210010/just_for_happy">wd210010</a>

## README模板来源于
<a href="https://github.com/Sitoi/dailycheckin">dailycheckin仓库</a>
