# 聚合脚本教程

聚合脚本**初次使用步骤**：（本文展示此步骤）

1. 复制并运行最新的更新脚本（UPDATE.js)会自动新增最新表格及配置
2. 复制所需的签到脚本，并添加网络API服务和加入定时任务

在原有的聚合脚本中**添加新脚本步骤**：（本文不展示此步骤，仅供了解）

1. 复制并运行最新的更新脚本（UPDATE.js)会自动新增最新表格及配置
2. 复制最新的签到脚本，并添加网络API服务和加入定时任务

文章中的代码已放入github仓库中，更多及最新代码将会在仓库中更新

```
https://github.com/poboll
```

如果上述链接访问过慢，可访问如下github加速镜像

```
https://githubfast.com/poboll
```

聚合脚本中的**表格是通过运行UPDATE脚本自动生成**的。表格介绍如下：

**主配置表格**（CONFIG）：

对脚本进行统一管理，能配置是否为仅推送错误消息，能配置推送内容是用"昵称"还是"单元格Ax"的格式指代账户。

**推送表格**（PUSH）：

对推送的方式进行配置。推送识别号如pushplus填token，Server酱填key。若需要邮箱推送方式，还需要配置邮箱表（EMAIL）。

**分配置表格**（如:aliyundrive_multiuser、wps等等）：

是具体对应脚本的配置。如:aliyundrive_multiuser指代（阿里云盘（多用户版））、wps指代（WPS（轻量版、客户端版、稻壳版）共有的配置）。表格中的cookie填脚本所需的消息，如阿里云盘（多用户版）填的为refresh_token，wps中填wps_sid。

## 实际操作

1. 浏览器访问金山文档网址，并点击新建

```
https://www.kdocs.cn/latest?from=docs
```

2. 点击“表格”
3. 点击“空白表格”

![wps-1](./images/wps-1.png)

![wps-2](./images/wps-2.png)

如图所示创建表格。

4. 依次点击“效率”-“高级开发”-“AirScript脚本编辑器”

![wps-3](./images/wps-3.png)

5. 依次点击“创建脚本”-“文档共享脚本”

![wps-4](./images/wps-4.png)

6. 进入github中复制最新的UPDATE.js代码

```
https://github.com/poboll/wps_script/tree/main/polymerization
```

![](./images/polymerization-1.png)

![](./images/polymerization-2.png)

![](./images/polymerization-3.png)

7. 将复制的UPDATE代码粘贴到脚本编辑器中，点击"保存"，再点击运行。

![](./images/polymerization-4.png)

8. 当UPDATE脚本运行完后，会自动生成如下的配置表格。（UPDATE.js是更新脚本，属于一次性脚本，当生成表格配置后就已经不需要了，可以自己选择是否要删除。建议不进行删除，当清除某列及某列以下部分、某行及某行以右部分，希望恢复原来表格，则运行UPDATE.js脚本会自动补全信息）

![](./images/polymerization-5.png)

9. 进入github中，依次复制最新脚本代码，如aliyundrive_multiuser.js，noteyoudao.js、tieba.js等。点击"+"依次将代码粘贴到编辑器内，并点击保存。（仅需添加自己需要的脚本即可，如只需要阿里云盘脚本，则仅添加阿里云盘脚本。）

![](./images/polymerization-6.png)

![](./images/polymerization-7.png)

![](./images/polymerization-8.png)

10. 按图所示，点击“服务”-“添加服务”，再点击“网络API”对应的“添加”按钮。**每个脚本都需要添加**。若需要邮箱推送，则添加“邮箱API”。

![wps-5](./images/wps-5.png)

11. 根据需要写每个分配置表的内容，如aliyundrive_multiuser中第一列填的是refresh_token。主配置表（CONFIG）及推送表（PUSH）根据自身需求填写

12. 可对点击“运行”进行测试。此测试步骤可忽略

13. 依次点击“高级开发”-“定时任务”，将刚刚的脚本添加到定时任务中。

![wps-6](./images/wps-6.png)

14. 依次点击“创建任务”-“每天”，并选择刚刚的“未命名脚本”，此时就完成了，每天指定时间将会进行签到。（仅需添加希望定时执行的脚本即可。若之后不想定时执行某个任务，可删除此定时任务，或将表格配置中的是否执行改为“否”）

![wps-7](./images/wps-7.png)

END