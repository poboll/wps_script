// WPS AirScript 每日任务聚合脚本
// AirScript adaptation and modifications Copyright (c) 2026 poboll
// 检查日期：2026-07-26
// 请使用 AirScript 1.0，并在编辑器中添加“网络 API”服务。

let sheetNameSubConfig = "daily"; // 分配置表名称
let pushHeader = "【每日任务】";
let sheetNameConfig = "CONFIG"; // 总配置表
let sheetNamePush = "PUSH"; // 推送表
let sheetNameEmail = "EMAIL"; // 邮箱表
let line = 100; // 最多读取 100 行
let message = "";
let messageOnlyError = 0;
let messageNickname = 0;
let requestTimeout = 15000;
let userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

var jsonPush = [
  { name: "bark", key: "", flag: "0" },
  { name: "pushplus", key: "", flag: "0" },
  { name: "ServerChan", key: "", flag: "0" },
  { name: "email", key: "", flag: "0" },
  { name: "dingtalk", key: "", flag: "0" },
  { name: "discord", key: "", flag: "0" },
];
var jsonEmail = {
  server: "",
  port: "",
  sender: "",
  authorizationCode: "",
};

var taskHandlers = {
  YOUDAO: runYoudao,
  ALIYUN: runAliyun,
  BAIDUWP: runBaiduWp,
  BILIBILI: runBilibili,
  V2EX: runV2ex,
  ACFUN: runAcfun,
  ENSHAN: runEnshan,
  FNNASCLUB: runFnnasClub,
  TIEBA: runTieba,
  SMZDM: runSmzdm,
  IQIYI: runIqiyi,
  KGQQ: runKgqq,
  BAIDU: runBaiduSubmit,
};

readMainConfig();
readPushConfig();
readEmailConfig();
main();

function main() {
  if (ActivateSheet(sheetNameSubConfig) != 1) {
    console.log("未找到工作表：" + sheetNameSubConfig + "，请先运行 UPDATE.js");
    return;
  }

  for (let i = 2; i <= line; i++) {
    let task = cell("A", i).toUpperCase();
    let credential = cell("B", i);
    let exec = cell("C", i);

    if (task == "" && credential == "") {
      break;
    }
    if (exec == "是") {
      execHandle(task, credential, i);
      Time.sleep(1200);
    }
  }

  push(message);
}

// 读取 CONFIG 表中的消息设置。
function readMainConfig() {
  if (ActivateSheet(sheetNameConfig) != 1) {
    return;
  }

  for (let i = 2; i <= line; i++) {
    let name = cell("A", i);
    if (name == "") {
      break;
    }
    if (name == sheetNameSubConfig) {
      messageOnlyError = cell("C", i) == "是" ? 1 : 0;
      messageNickname = cell("D", i) == "是" ? 1 : 0;
      break;
    }
  }
}

// 读取 PUSH 表；未配置的渠道不会发送请求。
function readPushConfig() {
  if (ActivateSheet(sheetNamePush) != 1) {
    return;
  }

  for (let i = 2; i <= 21; i++) {
    let pushName = cell("A", i);
    if (pushName == "") {
      break;
    }
    jsonPushHandle(pushName, cell("C", i), cell("B", i));
  }
}

function readEmailConfig() {
  let emailEnabled = 0;
  for (let i = 0; i < jsonPush.length; i++) {
    if (jsonPush[i].name == "email" && jsonPush[i].flag == 1) {
      emailEnabled = 1;
      break;
    }
  }
  if (emailEnabled != 1 || ActivateSheet(sheetNameEmail) != 1) {
    return;
  }

  jsonEmail.server = cell("A", 2);
  jsonEmail.port = cell("B", 2);
  jsonEmail.sender = cell("C", 2);
  jsonEmail.authorizationCode = cell("D", 2);
}

// 执行一行任务，并把结果与执行时间回写到 E、F 列。
function execHandle(task, credential, pos) {
  let nickname = cell("D", pos);
  let messageName = messageNickname == 1 && nickname != "" ? nickname : "第 " + pos + " 行";
  let result = "";
  let success = 0;

  try {
    if (!taskHandlers[task]) {
      throw new Error("不支持的任务标识：" + task);
    }
    if (credential == "") {
      throw new Error("凭据为空");
    }
    result = taskHandlers[task](credential);
    success = 1;
    console.log("[" + task + "][" + messageName + "] " + result);
  } catch (error) {
    result = "失败：" + errorMessage(error);
    console.log("[" + task + "][" + messageName + "] " + result);
  }

  Application.Range("E" + pos).Value = result;
  Application.Range("F" + pos).Value = formatDateTime(new Date());

  if (success == 0 || messageOnlyError == 0) {
    message += "\n" + task + " / " + messageName + "：" + result;
  }
}

// 有道云笔记：刷新会话 Cookie 后执行同步、签到和广告空间任务。
function runYoudao(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, { "User-Agent": "YNote" });
  let sessionResponse = request("https://note.youdao.com/login/acc/pe/getsess?product=YNOTE", {
    method: "GET",
    headers: headers,
  });
  cookie = mergeResponseCookies(cookie, sessionResponse.headers || {});
  headers = cookieHeaders(cookie, { "User-Agent": "YNote" });

  let sync = requestJson("https://note.youdao.com/yws/api/daupromotion?method=sync", {
    method: "POST",
    headers: headers,
  });
  if (sync.error || sync.code) {
    throw new Error(sync.message || sync.error || "同步任务失败");
  }

  let checkin = requestJson("https://note.youdao.com/yws/mapi/user?method=checkin", {
    method: "POST",
    headers: headers,
  });
  if (checkin.error || checkin.code) {
    throw new Error(checkin.message || checkin.error || "签到失败");
  }

  let totalBytes = Number(sync.rewardSpace || 0) + Number(checkin.space || 0);
  let adCount = clampNumber(config.ad_count, 3, 0, 3);
  for (let i = 0; i < adCount; i++) {
    let ad = requestJson("https://note.youdao.com/yws/mapi/user?method=adRandomPrompt", {
      method: "POST",
      headers: headers,
    });
    totalBytes += Number(ad.space || 0);
    Time.sleep(500);
  }

  let account = cookieValue(cookie, "YNOTE_PERS");
  let accountParts = account.split("||");
  let accountName = accountParts.length > 1 ? accountParts[accountParts.length - 2] : "已验证";
  return "账号 " + accountName + "，本次获得约 " + Math.floor(totalBytes / 1048576) + " MB 空间";
}

// 阿里云盘：刷新 access token、签到并领取当日奖励。
function runAliyun(raw) {
  let config = parseCredential(raw, "refresh_token");
  let refreshToken = required(config.refresh_token, "refresh_token");
  let token = requestJson("https://auth.aliyundrive.com/v2/account/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!token.access_token) {
    throw new Error(token.message || "refresh_token 已失效");
  }

  let headers = {
    Authorization: token.access_token,
    "Content-Type": "application/json",
  };
  let sign = requestJson("https://member.aliyundrive.com/v1/activity/sign_in_list", {
    method: "POST",
    headers: headers,
    body: "{}",
  });
  if (!sign.success || !sign.result) {
    throw new Error(sign.message || "签到接口返回异常");
  }

  let day = Number(sign.result.signInCount || 0);
  let reward = requestJson("https://member.aliyundrive.com/v1/activity/sign_in_reward", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ signInDay: day }),
  });
  let rewardName = getPath(reward, ["result", "name"], "") ||
    getPath(reward, ["result", "description"], "");
  return "累计签到 " + day + " 天" + (rewardName ? "，奖励：" + rewardName : "，今日无可领取奖励");
}

// 百度网盘：会员签到、每日答题和会员成长查询。
function runBaiduWp(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, {
    Referer: "https://pan.baidu.com/wap/svip/growth/task",
    Accept: "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
  });

  let sign = requestJson(
    "https://pan.baidu.com/rest/2.0/membership/level?app_id=250528&web=5&method=signin",
    { method: "GET", headers: headers }
  );
  if (Number(sign.error_code || 0) != 0) {
    throw new Error(sign.error_msg || "签到失败");
  }

  Time.sleep(800);
  let question = requestJson(
    "https://pan.baidu.com/act/v2/membergrowv2/getdailyquestion?app_id=250528&web=5",
    { method: "GET", headers: headers }
  );
  let answerText = "未获取到题目";
  if (question.ask_id !== undefined && question.answer !== undefined) {
    let answerUrl =
      "https://pan.baidu.com/act/v2/membergrowv2/answerquestion?app_id=250528&web=5" +
      "&ask_id=" + encodeURIComponent(question.ask_id) +
      "&answer=" + encodeURIComponent(question.answer);
    let answer = requestJson(answerUrl, { method: "GET", headers: headers });
    answerText = answer.show_msg || "答题积分 " + Number(answer.score || 0);
  }

  let info = requestJson(
    "https://pan.baidu.com/rest/2.0/membership/user?app_id=250528&web=5&method=query",
    { method: "GET", headers: headers }
  );
  return "签到积分 " + Number(sign.points || 0) + "；" + answerText +
    "；会员等级 " + valueOrDash(info.current_level) + "，成长值 " + valueOrDash(info.current_value);
}

// Bilibili：核心签到默认开启；投币、观看、分享、权益和兑换必须在 JSON 中显式开启。
function runBilibili(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, { Referer: "https://www.bilibili.com/" });
  let nav = requestJson("https://api.bilibili.com/x/web-interface/nav", {
    method: "GET",
    headers: headers,
  });
  if (!getPath(nav, ["data", "isLogin"], false)) {
    throw new Error(nav.message || "Cookie 已失效");
  }

  let user = getPath(nav, ["data", "uname"], "未知用户");
  let uid = getPath(nav, ["data", "mid"], "");
  let vipType = Number(getPath(nav, ["data", "vipType"], 0));
  let csrf = cookieValue(cookie, "bili_jct");
  let results = [];

  let live = requestJson("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign", {
    method: "GET",
    headers: headers,
  });
  results.push("直播签到：" + businessMessage(live, [0, 1011040]));

  let manga = requestJson("https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn", {
    method: "POST",
    headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: "platform=android",
  });
  let mangaDuplicate = String(manga.msg || "").indexOf("duplicate") >= 0;
  if (Number(manga.code || 0) != 0 && !mangaDuplicate) {
    results.push("漫画签到：" + (manga.msg || "失败"));
  } else {
    results.push("漫画签到：" + (mangaDuplicate ? "今日已签到" : "成功"));
  }

  let expLogs = safeJsonRequest("https://api.bilibili.com/x/member/web/exp/log?jsonp=jsonp", {
    method: "GET",
    headers: headers,
  });
  let todayExp = sumTodayBilibiliExp(expLogs);
  let liveStatus = safeJsonRequest("https://api.live.bilibili.com/pay/v1/Exchange/getStatus", {
    method: "GET",
    headers: headers,
  });
  let silver = getPath(liveStatus, ["data", "silver"], "-");
  let gold = getPath(liveStatus, ["data", "gold"], "-");

  let needsVideo = enabled(config.watch, false) || enabled(config.share, false) ||
    clampNumber(config.coin_num, 0, 0, 5) > 0;
  let videos = needsVideo ? getBilibiliVideos(headers, uid, config) : [];

  if (enabled(config.vip_reward, false)) {
    requireCsrf(csrf, "领取会员权益");
    let privileges = requestJson("https://api.bilibili.com/x/vip/privilege/my", {
      method: "GET",
      headers: headers,
    });
    let welfare = getPath(privileges, ["data", "list"], []);
    let received = 0;
    for (let i = 0; i < welfare.length; i++) {
      if (Number(welfare[i].state) == 0 && Number(welfare[i].vip_type) == vipType) {
        let receive = requestJson("https://api.bilibili.com/x/vip/privilege/receive", {
          method: "POST",
          headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
          body: formEncode({ type: welfare[i].type, csrf: csrf }),
        });
        if (Number(receive.code) == 0) {
          received++;
        }
        Time.sleep(500);
      }
    }
    results.push("会员权益：领取 " + received + " 项");
  }

  let coinTarget = clampNumber(config.coin_num, 0, 0, 5);
  if (coinTarget > 0) {
    requireCsrf(csrf, "投币");
    let coinSuccess = 0;
    for (let i = 0; i < videos.length && coinSuccess < coinTarget; i++) {
      let coinResult = requestJson("https://api.bilibili.com/x/web-interface/coin/add", {
        method: "POST",
        headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: formEncode({
          aid: videos[i].aid,
          multiply: 1,
          select_like: 1,
          cross_domain: "true",
          csrf: csrf,
        }),
      });
      if (Number(coinResult.code) == 0) {
        coinSuccess++;
      } else if (Number(coinResult.code) != 34005) {
        break;
      }
      Time.sleep(700);
    }
    results.push("投币：" + coinSuccess + "/" + coinTarget);
  }

  if (enabled(config.watch, false)) {
    requireCsrf(csrf, "观看上报");
    if (!videos.length) {
      results.push("观看上报：无可用视频");
    } else {
      let watch = requestJson("https://api.bilibili.com/x/v2/history/report", {
        method: "POST",
        headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: formEncode({
          aid: videos[0].aid,
          cid: videos[0].cid || 0,
          progress: 300,
          csrf: csrf,
        }),
      });
      results.push("观看上报：" + businessMessage(watch, [0]));
    }
  }

  if (enabled(config.share, false)) {
    requireCsrf(csrf, "分享任务");
    if (!videos.length) {
      results.push("分享任务：无可用视频");
    } else {
      let share = requestJson("https://api.bilibili.com/x/web-interface/share/add", {
        method: "POST",
        headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: formEncode({ aid: videos[0].aid, csrf: csrf }),
      });
      results.push("分享任务：" + businessMessage(share, [0]));
    }
  }

  if (enabled(config.silver2coin, false)) {
    requireCsrf(csrf, "银瓜子兑换");
    let exchange = requestJson("https://api.live.bilibili.com/xlive/revenue/v1/wallet/silver2coin", {
      method: "POST",
      headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
      body: formEncode({ csrf: csrf }),
    });
    results.push("银瓜子兑换：" + businessMessage(exchange, [0]));
  }

  return "用户 " + user + "，今日经验 " + todayExp + "，银瓜子 " + silver + "，金瓜子 " + gold +
    "；" + results.join("；");
}

function getBilibiliVideos(headers, uid, config) {
  let videos = [];
  if (Number(config.coin_type || 0) == 1 && uid) {
    let followingUrl =
      "https://api.bilibili.com/x/relation/followings?vmid=" + encodeURIComponent(uid) +
      "&pn=1&ps=20&order=desc&order_type=attention";
    let following = safeJsonRequest(followingUrl, { method: "GET", headers: headers });
    let list = getPath(following, ["data", "list"], []);
    for (let i = 0; i < list.length && videos.length < 8; i++) {
      let mid = list[i].mid;
      if (!mid) {
        continue;
      }
      let spaceUrl =
        "https://api.bilibili.com/x/space/arc/search?mid=" + encodeURIComponent(mid) +
        "&pn=1&ps=2&tid=0&order=pubdate&keyword=";
      let space = safeJsonRequest(spaceUrl, { method: "GET", headers: headers });
      let uploads = getPath(space, ["data", "list", "vlist"], []);
      for (let j = 0; j < uploads.length; j++) {
        videos.push({ aid: uploads[j].aid, cid: uploads[j].cid || 0, title: uploads[j].title || "" });
      }
      Time.sleep(400);
    }
  }

  if (!videos.length) {
    let region = requestJson("https://api.bilibili.com/x/web-interface/dynamic/region?ps=8&rid=1", {
      method: "GET",
      headers: headers,
    });
    let archives = getPath(region, ["data", "archives"], []);
    for (let i = 0; i < archives.length; i++) {
      videos.push({ aid: archives[i].aid, cid: archives[i].cid || 0, title: archives[i].title || "" });
    }
  }
  return videos;
}

// V2EX：领取每日登录奖励，并读取当日记录、余额和连续签到天数。
function runV2ex(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, { Referer: "https://www.v2ex.com/mission/daily" });
  let daily = requestText("https://www.v2ex.com/mission/daily", {
    method: "GET",
    headers: headers,
  });
  let path = firstMatch(daily, /onclick=["']location\.href\s*=\s*["']([^"']+)["']/i);
  if (path && path != "/balance") {
    request("https://www.v2ex.com" + path, { method: "GET", headers: headers });
    Time.sleep(500);
    daily = requestText("https://www.v2ex.com/mission/daily", { method: "GET", headers: headers });
  } else if (!path && daily.indexOf("每日登录奖励已领取") < 0 && daily.indexOf("已领取") < 0) {
    throw new Error("未找到领取入口，Cookie 可能已失效");
  }

  let balance = requestText("https://www.v2ex.com/balance", { method: "GET", headers: headers });
  let username = firstMatch(balance, /href=["']\/member\/[^"']+["']\s+class=["']top["']>([^<]+)/i) || "未知用户";
  let total = firstMatch(balance, /text-align:\s*right;["']>([\d.]+)<\/td>/i) || "未知";
  let today = firstMatch(balance, /<td class=["']d["']><span class=["']gray["']>(.*?)<\/span><\/td>/i) || "已领取";
  let streak = firstMatch(daily, /<div class=["']cell["']>(.*?)天<\/div>/i) || "未知";
  let proxyNote = config.proxy ? "；代理参数未使用" : "";
  return "用户 " + stripHtml(username) + "，今日 " + stripHtml(today) + "，余额 " + total +
    "，连续签到 " + stripHtml(streak) + " 天" + proxyNote;
}

// AcFun：优先使用 Cookie；也可用 JSON 提供 phone/password 登录。互动动作默认关闭。
function runAcfun(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = config.cookie || "";
  if (!cookie && config.phone && config.password) {
    cookie = acfunLogin(String(config.phone), String(config.password));
  }
  cookie = required(cookie, "cookie 或 phone/password");
  let headers = cookieHeaders(cookie, {
    Referer: "https://www.acfun.cn/",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  });

  let sign = requestJson("https://www.acfun.cn/rest/pc-direct/user/signIn", {
    method: "POST",
    headers: headers,
    body: "",
  });
  if (Number(sign.result) != 0 && Number(sign.result) != 122) {
    throw new Error(sign.msg || "签到失败");
  }

  let info = requestJson("https://www.acfun.cn/rest/pc-direct/user/personalInfo", {
    method: "GET",
    headers: headers,
  });
  let result = [sign.msg || "签到成功"];
  if (info.info) {
    result.push("等级 " + valueOrDash(info.info.level) + "，香蕉 " + valueOrDash(info.info.banana));
  }

  let needInteractive = enabled(config.like, false) || enabled(config.banana, false) ||
    String(config.danmu_text || "") != "";
  if (needInteractive) {
    let rank = requestJson("https://www.acfun.cn/rest/pc-direct/rank/channel", {
      method: "GET",
      headers: headers,
    });
    let contentId = getPath(rank, ["rankList", 0, "contentId"], "");
    if (!contentId) {
      throw new Error("未获取到互动任务视频");
    }

    if (enabled(config.like, false)) {
      let token = requestJson("https://id.app.acfun.cn/rest/web/token/get?sid=acfun.midground.api", {
        method: "POST",
        headers: headers,
        body: "",
      });
      let st = token["acfun.midground.api_st"] || "";
      let likeData = {
        kpn: "ACFUN_APP",
        kpf: "PC_WEB",
        subBiz: "mainApp",
        interactType: 1,
        objectType: 2,
        objectId: contentId,
        "acfun.midground.api_st": st,
      };
      let liked = requestJson("https://kuaishouzt.com/rest/zt/interact/add", {
        method: "POST",
        headers: headers,
        body: formEncode(likeData),
      });
      requestJson("https://kuaishouzt.com/rest/zt/interact/delete", {
        method: "POST",
        headers: headers,
        body: formEncode(likeData),
      });
      result.push("点赞任务：" + (Number(liked.result) == 1 ? "完成并撤销" : "失败"));
    }

    if (String(config.danmu_text || "") != "") {
      let videoPage = requestText("https://www.acfun.cn/v/ac" + contentId, {
        method: "GET",
        headers: headers,
      });
      let videoId = firstMatch(videoPage, /["']currentVideoId["']\s*:\s*(\d+)/i);
      if (!videoId) {
        throw new Error("未获取到弹幕视频 ID");
      }
      let danmu = requestJson("https://www.acfun.cn/rest/pc-direct/new-danmaku/add", {
        method: "POST",
        headers: headers,
        body: formEncode({
          mode: "1",
          color: "16777215",
          size: "25",
          body: String(config.danmu_text),
          videoId: videoId,
          position: "1",
          type: "douga",
          id: contentId,
        }),
      });
      result.push("弹幕任务：" + (Number(danmu.result) == 0 ? "成功" : danmu.msg || "失败"));
    }

    if (enabled(config.banana, false)) {
      let banana = requestJson("https://www.acfun.cn/rest/pc-direct/banana/throwBanana", {
        method: "POST",
        headers: headers,
        body: formEncode({ resourceId: contentId, count: "1", resourceType: "2" }),
      });
      result.push("投香蕉：" + (Number(banana.result) == 0 ? "成功" : banana.msg || "失败"));
    }
  }

  return result.join("；");
}

function acfunLogin(phone, password) {
  let response = request("https://id.app.acfun.cn/rest/web/login/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://www.acfun.cn/",
    },
    body: formEncode({ username: phone, password: password, key: "", captcha: "" }),
  });
  let headers = response.headers || {};
  let body = response.json();
  if (Number(body.result) != 0) {
    throw new Error(body.err_msg || body.msg || "AcFun 登录失败");
  }
  let cookie = mergeResponseCookies("", headers);
  if (!cookie) {
    throw new Error("登录成功但 AirScript 未返回可用 Cookie，请改用 Cookie 配置");
  }
  return cookie;
}

// 恩山无线论坛：使用当前签到插件，并查询恩山币和积分。
function runEnshan(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, {
    Referer: "https://www.right.com.cn/forum/",
    Accept: "application/json, text/javascript, */*; q=0.01",
  });
  let page = requestText("https://www.right.com.cn/forum/forum.php", {
    method: "GET",
    headers: headers,
  });
  let formhash = firstMatch(page, /name=["']formhash["']\s+value=["']([^"']+)/i) ||
    firstMatch(page, /formhash\s*[:=]\s*["']([^"']+)["']/i);
  if (!formhash) {
    throw new Error("未找到 formhash，Cookie 可能已失效");
  }

  let sign = requestJson("https://www.right.com.cn/forum/plugin.php?id=erling_qd:action&action=sign", {
    method: "POST",
    headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }),
    body: formEncode({ formhash: formhash }),
  });
  let signMessage = sign.message || (sign.success ? "签到成功" : "签到失败");
  if (!sign.success && signMessage.indexOf("已") < 0) {
    throw new Error(signMessage);
  }

  let creditPage = requestText(
    "https://www.right.com.cn/FORUM/home.php?mod=spacecp&ac=credit&showcredit=1",
    { method: "GET", headers: headers }
  );
  let coin = firstMatch(creditPage, /恩山币:\s*<\/em>(.*?)&nbsp;/i) || "-";
  let point = firstMatch(creditPage, /<em>积分:\s*<\/em>(.*?)<span/i) || "-";
  let days = sign.continuous_days !== undefined ? "，连续 " + sign.continuous_days + " 天" : "";
  return signMessage + days + "，恩山币 " + stripHtml(coin) + "，积分 " + stripHtml(point);
}

// 飞牛 NAS 社区：打卡并解析“我的打卡动态”。
function runFnnasClub(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, { Referer: "https://club.fnnas.com/portal.php" });
  let page = requestText("https://club.fnnas.com/plugin.php?id=zqlj_sign", {
    method: "GET",
    headers: headers,
  });
  let sign = firstMatch(page, /plugin\.php\?id=zqlj_sign(?:&amp;|&)sign=([0-9a-f]+)/i);
  let signMessage = "";
  if (/今日已打卡|今天已经打过卡/.test(page)) {
    signMessage = "今日已打卡";
  } else {
    if (!sign) {
      throw new Error("未找到打卡参数，Cookie 可能已失效");
    }
    let result = requestText("https://club.fnnas.com/plugin.php?id=zqlj_sign&sign=" + sign, {
      method: "GET",
      headers: headers,
    });
    if (/打卡成功/.test(result)) {
      signMessage = "打卡成功";
    } else if (/已经打过卡/.test(result)) {
      signMessage = "今日已打卡";
    } else {
      throw new Error("打卡接口返回异常");
    }
    page = requestText("https://club.fnnas.com/plugin.php?id=zqlj_sign", {
      method: "GET",
      headers: headers,
    });
  }

  let dynamic = parseFnnasDynamic(page);
  return signMessage + (dynamic ? "；" + dynamic : "；未解析到打卡动态");
}

function parseFnnasDynamic(html) {
  let block = firstMatch(
    html,
    /<strong>\s*我的打卡动态\s*<\/strong>([\s\S]*?<div[^>]*class=["']bm_c["'][^>]*>[\s\S]*?<\/div>)/i
  );
  if (!block) {
    return "";
  }
  let text = stripHtml(block.replace(/<\/li\s*>/gi, "；"));
  return text.replace(/^我的打卡动态\s*/, "").slice(0, 240);
}

// 百度贴吧：分页获取关注贴吧，按官方 MD5 能力签名并逐吧签到。
function runTieba(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let bduss = cookieValue(cookie, "BDUSS");
  if (!bduss) {
    throw new Error("Cookie 中缺少 BDUSS");
  }
  let headers = cookieHeaders(cookie, {});
  let tbsInfo = requestJsonRetry("https://tieba.baidu.com/dc/common/tbs", {
    method: "GET",
    headers: headers,
  }, 3);
  if (!tbsInfo.is_login || !tbsInfo.tbs) {
    throw new Error("Cookie 已失效");
  }

  let userInfo = safeJsonRequest("https://zhidao.baidu.com/api/loginInfo", {
    method: "GET",
    headers: headers,
  });
  let username = userInfo.userName || "未知用户";
  let forums = [];
  let pageNo = 1;
  let maxPages = clampNumber(config.max_pages, 3, 1, 5);

  while (pageNo <= maxPages) {
    let likeData = tiebaSigned({
      BDUSS: bduss,
      _client_type: "2",
      _client_id: "wappc_1534235498291_488",
      _client_version: "9.7.8.0",
      _phone_imei: "000000000000000",
      from: "1008621y",
      page_no: String(pageNo),
      page_size: "200",
      model: "MI+5",
      net_type: "1",
      timestamp: unixSeconds(),
      vcode_tag: "11",
    });
    let liked = requestJsonRetry("https://c.tieba.baidu.com/c/f/forum/like", {
      method: "POST",
      headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
      body: formEncode(likeData),
    }, 3);
    forums = forums.concat(collectTiebaForums(liked.forum_list || {}));
    if (String(liked.has_more) != "1") {
      break;
    }
    pageNo++;
    Time.sleep(800);
  }

  let maxForums = clampNumber(config.max_forums, 20, 1, 50);
  let totalFound = forums.length;
  if (forums.length > maxForums) {
    forums = forums.slice(0, maxForums);
  }
  let success = 0;
  let existed = 0;
  let shield = 0;
  let failed = 0;

  for (let i = 0; i < forums.length; i++) {
    let data = tiebaSigned({
      BDUSS: bduss,
      _client_type: "2",
      _client_version: "9.7.8.0",
      _phone_imei: "000000000000000",
      model: "MI+5",
      net_type: "1",
      fid: forums[i].id,
      kw: forums[i].name,
      tbs: tbsInfo.tbs,
      timestamp: unixSeconds(),
    });
    try {
      let result = requestJsonRetry("https://c.tieba.baidu.com/c/c/forum/sign", {
        method: "POST",
        headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: formEncode(data),
      }, 2);
      let code = String(result.error_code);
      if (code == "0") {
        success++;
      } else if (code == "160002") {
        existed++;
      } else if (code == "340006") {
        shield++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
    Time.sleep(650);
    if ((i + 1) % 10 == 0) {
      Time.sleep(1500);
    }
  }

  let limited = totalFound > forums.length ? "，受运行保护限制本次处理 " + forums.length + " 个" : "";
  return "用户 " + username + "，共发现 " + totalFound + " 个贴吧" + limited +
    "；成功 " + success + "，已签 " + existed + "，屏蔽 " + shield + "，失败 " + failed;
}

// 什么值得买：MD5 签名签到与签到奖励；限时活动需显式配置 activity_id。
function runSmzdm(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let headers = cookieHeaders(cookie, {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "smzdm_android_V10.4.1 rv:841 (Android12;zh)smzdmapp",
  });
  let now = Date.now();
  let tokenData = { f: "android", v: "10.4.1", weixin: "1", time: String(now) };
  tokenData.sign = md5Upper(
    "f=android&time=" + now + "&v=10.4.1&weixin=1&key=apr1$AwP!wRRT$gJ/q.X24poeBInlUJC"
  );
  let tokenResult = requestJson("https://user-api.smzdm.com/robot/token", {
    method: "POST",
    headers: headers,
    body: formEncode(tokenData),
  });
  let token = getPath(tokenResult, ["data", "token"], "");
  if (!token) {
    throw new Error(tokenResult.error_msg || "未获取到 robot token");
  }

  let timestamp = Date.now();
  let sk = "ierkM0OZZbsuBKLoAgQ6OJneLMXBQXmzX+LXkNTuKch8Ui2jGlahuFyWIzBiDq/L";
  let data = { f: "android", v: "10.4.1", sk: sk, weixin: "1", time: String(timestamp), token: token };
  data.sign = md5Upper(
    "f=android&sk=" + sk + "&time=" + timestamp + "&token=" + token +
      "&v=10.4.1&weixin=1&key=apr1$AwP!wRRT$gJ/q.X24poeBInlUJC"
  );
  let sign = requestJson("https://user-api.smzdm.com/checkin", {
    method: "POST",
    headers: headers,
    body: formEncode(data),
  });
  if (Number(sign.error_code || 0) != 0) {
    throw new Error(sign.error_msg || "签到失败");
  }

  let reward = requestJson("https://user-api.smzdm.com/checkin/all_reward", {
    method: "POST",
    headers: headers,
    body: formEncode(data),
  });
  let normalReward = getPath(reward, ["data", "normal_reward"], null);
  let rewardText = normalReward ?
    getPath(normalReward, ["reward_add", "content"], "") + " " + (normalReward.sub_title || "") :
    "未返回额外奖励";
  let parts = [sign.error_msg || "签到成功", stripHtml(rewardText).trim()];

  if (config.activity_id) {
    let activityHeaders = cookieHeaders(cookie, {
      Referer: "https://m.smzdm.com/",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Mobile Safari",
    });
    let activityId = encodeURIComponent(String(config.activity_id));
    let draw = requestJson("https://zhiyou.smzdm.com/user/lottery/jsonp_draw?active_id=" + activityId, {
      method: "POST",
      headers: activityHeaders,
      body: "",
    });
    let profile = requestText("https://zhiyou.smzdm.com/user/", {
      method: "GET",
      headers: activityHeaders,
    });
    let nickname = firstMatch(profile, /<a href=["']https:\/\/zhiyou\.smzdm\.com\/user["']>\s*(.*?)\s*<\/a>/i);
    let level = firstMatch(profile, /\/level\/(.*?)\.png/i);
    parts.push("活动抽奖：" + (draw.error_msg || draw.msg || "已请求"));
    if (nickname || level) {
      parts.push("用户 " + stripHtml(nickname || "-") + "，等级 " + (level || "-"));
    }
  }
  return parts.join("；");
}

// 爱奇艺：账号成长查询默认开启；抽奖和权益流程需 rewards=true。
function runIqiyi(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let p00001 = cookieValue(cookie, "P00001");
  let p00002 = cookieValue(cookie, "P00002");
  let p00003 = cookieValue(cookie, "P00003");
  if (!p00001) {
    throw new Error("Cookie 中缺少 P00001");
  }

  let info = iqiyiInfo(p00001);
  let data = info.data || {};
  let parts = [
    "VIP 等级 " + Number(data.level || 0),
    "今日成长 " + Number(data.todayGrowthValue || 0),
    "当前成长 " + Number(data.growthvalue || 0),
    "升级还需 " + Number(data.distance || 0),
    "到期 " + (data.deadline || "非 VIP 用户"),
  ];
  let display = parseIqiyiDisplay(p00002);
  if (display) {
    parts.unshift("用户 " + display);
  }

  if (enabled(config.rewards, false)) {
    let timesCodes = ["browseWeb", "browseWeb", "bookingMovie"];
    for (let i = 0; i < timesCodes.length; i++) {
      let giveUrl = "https://pcell.iqiyi.com/lotto/giveTimes?actCode=bcf9d354bc9f677c" +
        "&timesCode=" + encodeURIComponent(timesCodes[i]) + "&P00001=" + encodeURIComponent(p00001);
      safeJsonRequest(giveUrl, { method: "GET", headers: {} });
      Time.sleep(500);
    }

    let platinum = [];
    for (let i = 0; i < 5; i++) {
      let lottery = safeJsonRequest(
        "https://pcell.iqiyi.com/lotto/lottery?actCode=bcf9d354bc9f677c&P00001=" + encodeURIComponent(p00001),
        { method: "GET", headers: {} }
      );
      let gift = getPath(lottery, ["data", "giftName"], "");
      if (gift && gift.indexOf("未中奖") < 0) {
        platinum.push(gift);
      }
      Time.sleep(500);
    }
    parts.push("白金抽奖：" + (platinum.length ? platinum.join("、") : "未中奖或接口不可用"));

    if (data.deadline && data.deadline != "非 VIP 用户") {
      let right = safeJsonRequest("https://act.vip.iqiyi.com/level-right/receive", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formEncode({ code: "k8sj74234c683f", P00001: p00001 }),
      });
      parts.push("等级权益：" + (right.msg || "已请求"));
    }

    let shakeAwards = [];
    let shakeLimit = clampNumber(config.shake_limit, 10, 1, 10);
    for (let i = 0; i < shakeLimit; i++) {
      let extendParams = JSON.stringify({
        appIds: "iqiyi_pt_vip_iphone_video_autorenew_12m_348yuan_v2",
        supportSk2Identity: true,
        testMode: "0",
        iosSystemVersion: "17.4",
        bundleId: "com.qiyi.iphone",
      });
      let shakeUrl = "https://act.vip.iqiyi.com/shake-api/lottery?P00001=" + encodeURIComponent(p00001) +
        "&deviceID=" + encodeURIComponent(makeUuid()) + "&version=15.3.0&platform=" +
        encodeURIComponent(makeUuid().slice(0, 16)) + "&lotteryType=0&actCode=0k9GkUcjqqj4tne8" +
        "&extendParams=" + encodeURIComponent(extendParams);
      let shake = safeJsonRequest(shakeUrl, { method: "GET", headers: {} });
      if (shake.code == "A00000") {
        shakeAwards.push(getPath(shake, ["data", "title"], "已中奖"));
      } else {
        if (shake.msg) {
          shakeAwards.push(shake.msg);
        }
        break;
      }
      Time.sleep(600);
    }
    parts.push("每日摇奖：" + (shakeAwards.length ? shakeAwards.join("、") : "无结果"));

    if (p00003) {
      let query = iqiyiAggregate(0, p00001, p00003);
      let chance = clampNumber(query.chance, 0, 0, 10);
      let aggregateAwards = [];
      for (let i = 0; i < chance; i++) {
        let draw = iqiyiAggregate(1, p00001, p00003);
        if (draw.status && draw.msg) {
          aggregateAwards.push(draw.msg);
        }
        Time.sleep(500);
      }
      parts.push("聚合抽奖：" + (aggregateAwards.length ? aggregateAwards.join("、") : query.msg || "无机会"));
    } else {
      parts.push("聚合抽奖：Cookie 缺少 P00003，已跳过");
    }
  }
  return parts.join("；");
}

function iqiyiInfo(p00001) {
  let result = requestJson(
    "https://serv.vip.iqiyi.com/vipgrowth/query.action?P00001=" + encodeURIComponent(p00001),
    { method: "GET", headers: {} }
  );
  if (result.code != "A00000") {
    throw new Error(result.msg || "爱奇艺账号查询失败");
  }
  return result;
}

function iqiyiAggregate(drawType, p00001, p00003) {
  let params = {
    app_k: "b398b8ccbaeacca840073a7ee9b7e7e6",
    app_v: "11.6.5",
    platform_id: 10,
    dev_os: "8.0.0",
    dev_ua: "FRD-AL10",
    net_sts: 1,
    qyid: "2655b332a116d2247fac3dd66a5285011102",
    psp_uid: p00003,
    psp_cki: p00001,
    psp_status: 3,
    secure_v: 1,
    secure_p: "GPhone",
    req_sn: Date.now(),
  };
  if (drawType == 0) {
    params.lottery_chance = 1;
  }
  let result = safeJsonRequest(
    "https://iface2.iqiyi.com/aggregate/3.0/lottery_activity?" + formEncode(params),
    { method: "GET", headers: {} }
  );
  if (!result.code) {
    return {
      status: true,
      msg: result.awardName || "已请求",
      chance: Number(result.daysurpluschance || 0),
    };
  }
  return {
    status: false,
    msg: getPath(result, ["kv", "msg"], result.errorReason || "抽奖失败"),
    chance: 0,
  };
}

// 全民 K 歌：核心奖励和鲜花差值默认开启；高频扩展任务需 extended=true。
function runKgqq(raw) {
  let config = parseCredential(raw, "cookie");
  let cookie = required(config.cookie, "cookie");
  let uid = cookieValue(cookie, "uid");
  if (!uid) {
    throw new Error("Cookie 中缺少 uid");
  }
  let headers = cookieHeaders(cookie, {});
  let before = kgqqProfile(headers, uid);
  let entries = ["1", "2", "4", "16", "128", "512"];
  let signMap = kgqqMapExt({
    file: "taskJce",
    cmdName: "GetSignInAwardReq",
    wnsConfig: { appid: 1000626 },
    l5api: { modid: 503937, cmd: 589824 },
  });
  let coreSuccess = 0;

  for (let i = 0; i < entries.length; i++) {
    let url = "https://node.kg.qq.com/webapp/proxy?ns=KG_TASK&cmd=task.signinGetAward" +
      "&mapExt=" + signMap + "&t_uid=" + encodeURIComponent(uid) +
      "&t_iShowEntry=" + entries[i];
    let result = safeJsonRequest(url, { method: "GET", headers: headers });
    if (kgqqBusinessOk(result)) {
      coreSuccess++;
    }
    Time.sleep(500);
  }

  let extraSummary = "扩展任务未启用";
  if (enabled(config.extended, false)) {
    let lotteryPairs = [
      { entry: "1", type: "1", extendedRoute: false },
      { entry: "1", type: "2", extendedRoute: false },
      { entry: "4", type: "104", extendedRoute: false },
      { entry: "", type: "103", extendedRoute: true },
    ];
    let lotterySuccess = 0;
    for (let i = 0; i < lotteryPairs.length; i++) {
      let lotteryMapValue = {
        file: "taskJce",
        cmdName: "LotteryReq",
        l5api: { modid: 503937, cmd: 589824 },
      };
      if (lotteryPairs[i].extendedRoute) {
        lotteryMapValue.l5api_exp1 = { modid: 817089, cmd: 3801088 };
      } else {
        lotteryMapValue.wnsConfig = { appid: 1000557 };
      }
      let lotteryMap = kgqqMapExt(lotteryMapValue);
      let lotteryUrl = "https://node.kg.qq.com/webapp/proxy?ns=KG_TASK&cmd=task.getLottery" +
        "&mapExt=" + lotteryMap + "&t_uid=" + encodeURIComponent(uid) +
        "&t_type=" + lotteryPairs[i].type;
      if (lotteryPairs[i].entry) {
        lotteryUrl += "&t_iShowEntry=" + lotteryPairs[i].entry;
      }
      let lottery = safeJsonRequest(lotteryUrl, { method: "GET", headers: headers });
      if (kgqqBusinessOk(lottery)) {
        lotterySuccess++;
      }
      Time.sleep(500);
    }

    let musicRounds = clampNumber(config.music_rounds, 4, 0, 16);
    let musicSuccess = kgqqMusicRewards(headers, uid, musicRounds);
    let vip = kgqqVipReward(headers, uid);
    extraSummary = "抽奖 " + lotterySuccess + "/4，音乐卡 " + musicSuccess + "/" + musicRounds +
      "，VIP：" + vip;
  }

  let after = kgqqProfile(headers, uid);
  return "用户 " + before.nickname + "，核心奖励 " + coreSuccess + "/6，鲜花增加 " +
    (Number(after.flowers) - Number(before.flowers)) + "，当前鲜花 " + after.flowers + "；" + extraSummary;
}

function kgqqProfile(headers, uid) {
  let map = kgqqMapExt({
    file: "profile_webappJce",
    cmdName: "ProfileGet",
    appid: 1000626,
    dcapi: { interfaceId: 205359597 },
    l5api: { modid: 294017, cmd: 262144 },
    ip: "100.113.162.178",
    port: "12406",
  });
  let url = "https://node.kg.qq.com/webapp/proxy?ns=proto_profile&cmd=profile.getProfile" +
    "&mapExt=" + map + "&t_uUid=" + encodeURIComponent(uid);
  let result = requestJson(url, { method: "GET", headers: headers });
  let profile = getPath(result, ["data", "profile.getProfile"], null);
  if (!profile) {
    throw new Error(result.msg || "全民 K 歌资料查询失败");
  }
  return {
    nickname: getPath(profile, ["stPersonInfo", "sKgNick"], "未知用户"),
    flowers: Number(profile.uFlowerNum || 0),
  };
}

function kgqqMusicRewards(headers, uid, rounds) {
  let listMap = kgqqMapExt({
    cmdName: "GetBatchMusicCardsReq",
    file: "proto_music_stationJce",
    wnsDispatcher: true,
  });
  let rewardMap = kgqqMapExt({
    cmdName: "GetRewardReq",
    file: "proto_music_stationJce",
    wnsDispatcher: true,
  });
  let success = 0;

  for (let i = 0; i < rounds; i++) {
    let listUrl = "https://node.kg.qq.com/webapp/proxy?ns=proto_music_station" +
      "&cmd=message.batch_get_music_cards&mapExt=" + listMap +
      "&t_uUid=" + encodeURIComponent(uid) + "&g_tk_openkey=" + i;
    let listResult = safeJsonRequest(listUrl, { method: "GET", headers: headers });
    let cards = getPath(listResult, ["data", "message.batch_get_music_cards", "vctMusicCards"], []);
    let best = null;
    for (let j = 0; j < cards.length; j++) {
      if (!best || Number(getPath(cards[j], ["stReward", "uFlowerNum"], 0)) >
        Number(getPath(best, ["stReward", "uFlowerNum"], 0))) {
        best = cards[j];
      }
    }
    if (best && Number(getPath(best, ["stReward", "uFlowerNum"], 0)) > 1) {
      let flower = Number(getPath(best, ["stReward", "uFlowerNum"], 0));
      let rewardObject = flower > 10 ?
        { uInteractiveType: 1, uRewardType: 0, uFlowerNum: 15 } :
        { uInteractiveType: 0, uRewardType: 0, uFlowerNum: 10 };
      let rewardUrl = "https://node.kg.qq.com/webapp/proxy?" +
        formEncode({ "t_stReward:object": JSON.stringify(rewardObject) }) +
        "&ns=proto_music_station&cmd=message.get_reward&mapExt=" + rewardMap +
        "&t_uUid=" + encodeURIComponent(uid) +
        "&t_strUgcId=" + encodeURIComponent(best.strUgcId || "") +
        "&t_strKey=" + encodeURIComponent(best.strKey || "");
      let reward = safeJsonRequest(rewardUrl, { method: "GET", headers: headers });
      if (kgqqBusinessOk(reward)) {
        success++;
      }
    }
    Time.sleep(650);
  }
  return success;
}

function kgqqVipReward(headers, uid) {
  let infoUrl = "https://node.kg.qq.com/webapp/proxy?ns=proto_vip_webapp" +
    "&cmd=vip.get_vip_info&t_uUid=" + encodeURIComponent(uid) +
    "&t_uWebReq=1&t_uGetDataFromC4B=1";
  let info = safeJsonRequest(infoUrl, { method: "GET", headers: headers });
  let status = Number(getPath(info, ["data", "vip.get_vip_info", "stVipCoreInfo", "uStatus"], 0));
  if (status != 1) {
    return "非 VIP 或查询失败";
  }
  let map = kgqqMapExt({ cmdName: "GetVipDayReward" });
  let rewardUrl = "https://node.kg.qq.com/webapp/proxy?t_uUid=" + encodeURIComponent(uid) +
    "&ns=proto_vip_webapp&cmd=vip.get_vip_day_reward&mapExt=" + map +
    "&g_tk_openkey=642424811";
  let reward = safeJsonRequest(rewardUrl, { method: "GET", headers: headers });
  return getPath(reward, ["data", "vip.get_vip_day_reward", "strTips"], reward.msg || "已请求");
}

function kgqqMapExt(value) {
  return encodeURIComponent(Buffer.from(encodeURIComponent(JSON.stringify(value)), "utf8").toString("base64"));
}

function kgqqBusinessOk(result) {
  if (!result || typeof result != "object") {
    return false;
  }
  if (result.code !== undefined && Number(result.code) != 0) {
    return false;
  }
  return !!result.data || Number(result.code) == 0;
}

// 百度站点提交：只接受官方提交域名；同一批 URL 最多重试 5 次。
function runBaiduSubmit(raw) {
  let config = parseCredential(raw, "data_url");
  let dataUrl = required(config.data_url, "data_url");
  let submitUrl = required(config.submit_url, "submit_url");
  validateAirScriptUrl(dataUrl, "data_url");
  validateBaiduSubmitUrl(submitUrl);

  let urlsData = requestText(dataUrl, { method: "GET", headers: {} });
  let bodySize = utf8ByteLength(urlsData);
  if (bodySize > 1800000) {
    throw new Error("data_url 响应超过 1.8 MB，接近 AirScript 2 MB 上限");
  }
  let attempts = clampNumber(config.max_retries !== undefined ? config.max_retries + 1 : config.times, 1, 1, 5);
  let last = null;
  let used = 0;
  for (let i = 0; i < attempts; i++) {
    used++;
    last = requestJson(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: urlsData,
    });
    if (Number(last.success || 0) > 0) {
      break;
    }
    if (i + 1 < attempts) {
      Time.sleep(1000);
    }
  }
  if (!last || Number(last.success || 0) <= 0) {
    throw new Error((last && (last.message || last.error)) || "提交未成功");
  }
  return "提交成功 " + Number(last.success) + " 条，剩余额度 " + valueOrDash(last.remain) +
    "，请求 " + used + " 次";
}

// 消息推送，保持与仓库现有聚合脚本相同的渠道配置。
function push(content) {
  if (content == "") {
    console.log("消息为空不推送");
    return;
  }
  content = pushHeader + content;
  for (let i = 0; i < jsonPush.length; i++) {
    if (jsonPush[i].flag != 1 || jsonPush[i].key == "") {
      continue;
    }
    if (jsonPush[i].name == "bark") {
      bark(content, jsonPush[i].key);
    } else if (jsonPush[i].name == "pushplus") {
      pushplus(content, jsonPush[i].key);
    } else if (jsonPush[i].name == "ServerChan") {
      serverchan(content, jsonPush[i].key);
    } else if (jsonPush[i].name == "email") {
      email(content);
    } else if (jsonPush[i].name == "dingtalk") {
      dingtalk(content, jsonPush[i].key);
    } else if (jsonPush[i].name == "discord") {
      discord(content, jsonPush[i].key);
    }
    Time.sleep(1000);
  }
}

function bark(content, key) {
  HTTP.get("https://api.day.app/" + key + "/" + encodeURIComponent(content), {
    timeout: requestTimeout,
  });
}

function pushplus(content, key) {
  HTTP.fetch("https://www.pushplus.plus/send?token=" + encodeURIComponent(key) +
    "&content=" + encodeURIComponent(content), {
    method: "GET",
    timeout: requestTimeout,
  });
}

function serverchan(content, key) {
  HTTP.fetch("https://sctapi.ftqq.com/" + key + ".send?title=" +
    encodeURIComponent(pushHeader) + "&desp=" + encodeURIComponent(content), {
    method: "GET",
    timeout: requestTimeout,
  });
}

function email(content) {
  if (!jsonEmail.server || !jsonEmail.sender || !jsonEmail.authorizationCode) {
    console.log("邮箱配置不完整，已跳过");
    return;
  }
  let mailer = SMTP.login({
    host: jsonEmail.server,
    port: parseInt(jsonEmail.port, 10),
    username: jsonEmail.sender,
    password: jsonEmail.authorizationCode,
    secure: true,
  });
  mailer.send({
    from: pushHeader + "<" + jsonEmail.sender + ">",
    to: jsonEmail.sender,
    subject: pushHeader + " - " + formatDate(new Date()),
    text: content,
  });
}

function dingtalk(content, key) {
  HTTP.post("https://oapi.dingtalk.com/robot/send?access_token=" + encodeURIComponent(key), {
    msgtype: "text",
    text: { content: content },
  });
}

function discord(content, key) {
  validateAirScriptUrl(key, "Discord Webhook");
  HTTP.post(key, { content: content });
}

function request(url, options) {
  options = options || {};
  options.timeout = options.timeout || requestTimeout;
  options.headers = withHeaders({ "User-Agent": userAgent }, options.headers || {});
  let response = HTTP.fetch(url, options);
  if (response.status < 200 || response.status >= 400) {
    throw new Error("HTTP " + response.status + " " + safeUrlForLog(url));
  }
  return response;
}

function requestJson(url, options) {
  return request(url, options).json();
}

function requestText(url, options) {
  return request(url, options).text();
}

function safeJsonRequest(url, options) {
  try {
    return requestJson(url, options);
  } catch (error) {
    return { _error: errorMessage(error) };
  }
}

function requestJsonRetry(url, options, retries) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      return requestJson(url, options);
    } catch (error) {
      lastError = error;
      if (i + 1 < retries) {
        Time.sleep(500 * (i + 1));
      }
    }
  }
  throw lastError || new Error("请求失败");
}

function parseCredential(raw, defaultKey) {
  let text = String(raw || "").trim();
  if (text.charAt(0) == "{") {
    let value = JSON.parse(text);
    if (!value || typeof value != "object" || Array.isArray(value)) {
      throw new Error("JSON 凭据必须是对象");
    }
    return value;
  }
  let result = {};
  result[defaultKey] = text;
  return result;
}

function required(value, name) {
  if (value === undefined || value === null || String(value).trim() == "") {
    throw new Error("缺少 " + name);
  }
  return String(value).trim();
}

function enabled(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return value === true || value == 1 || value == "1" || value == "是" || value == "true";
}

function clampNumber(value, defaultValue, min, max) {
  let number = Number(value);
  if (!isFinite(number)) {
    number = defaultValue;
  }
  number = Math.floor(number);
  if (number < min) {
    return min;
  }
  if (number > max) {
    return max;
  }
  return number;
}

function cookieHeaders(cookie, extra) {
  return withHeaders({ Cookie: cookie, "User-Agent": userAgent }, extra || {});
}

function withHeaders(base, extra) {
  let result = {};
  let baseKeys = Object.keys(base || {});
  let extraKeys = Object.keys(extra || {});
  for (let i = 0; i < baseKeys.length; i++) {
    result[baseKeys[i]] = base[baseKeys[i]];
  }
  for (let i = 0; i < extraKeys.length; i++) {
    result[extraKeys[i]] = extra[extraKeys[i]];
  }
  return result;
}

function mergeResponseCookies(cookie, headers) {
  let jar = parseCookie(cookie);
  let raw = headers["set-cookie"] || headers["Set-Cookie"] || "";
  if (Array.isArray(raw)) {
    raw = raw.join(", ");
  }
  let pattern = /(?:^|,\s*)([^=;,\s]+)=([^;,]*)/g;
  let match = null;
  while ((match = pattern.exec(String(raw))) !== null) {
    jar[match[1]] = match[2];
  }
  let keys = Object.keys(jar);
  let output = [];
  for (let i = 0; i < keys.length; i++) {
    output.push(keys[i] + "=" + jar[keys[i]]);
  }
  return output.join("; ");
}

function parseCookie(cookie) {
  let result = {};
  let pairs = String(cookie || "").split(";");
  for (let i = 0; i < pairs.length; i++) {
    let index = pairs[i].indexOf("=");
    if (index < 1) {
      continue;
    }
    result[pairs[i].slice(0, index).trim()] = pairs[i].slice(index + 1).trim();
  }
  return result;
}

function cookieValue(cookie, name) {
  return parseCookie(cookie)[name] || "";
}

function formEncode(data) {
  let keys = Object.keys(data || {});
  let parts = [];
  for (let i = 0; i < keys.length; i++) {
    parts.push(encodeURIComponent(keys[i]) + "=" + encodeURIComponent(data[keys[i]]));
  }
  return parts.join("&");
}

function getPath(value, path, defaultValue) {
  let current = value;
  for (let i = 0; i < path.length; i++) {
    if (current === undefined || current === null || current[path[i]] === undefined) {
      return defaultValue;
    }
    current = current[path[i]];
  }
  return current;
}

function tiebaSigned(data) {
  let keys = Object.keys(data).sort();
  let raw = "";
  for (let i = 0; i < keys.length; i++) {
    raw += keys[i] + "=" + data[keys[i]];
  }
  data.sign = md5Upper(raw + "tiebaclient!!!");
  return data;
}

function md5Upper(value) {
  return Crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

function collectTiebaForums(lists) {
  let result = [];
  let keys = ["non-gconforum", "gconforum"];
  for (let i = 0; i < keys.length; i++) {
    let value = lists[keys[i]];
    if (Array.isArray(value)) {
      result = result.concat(value);
    } else if (value && typeof value == "object") {
      result.push(value);
    }
  }
  return result;
}

function sumTodayBilibiliExp(result) {
  let list = getPath(result, ["data", "list"], []);
  let today = formatDate(new Date());
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    if (String(list[i].time || "").split(" ")[0] == today) {
      total += Number(list[i].delta || 0);
    }
  }
  return total;
}

function businessMessage(result, acceptedCodes) {
  let code = Number(result.code || 0);
  if (acceptedCodes.indexOf(code) >= 0) {
    return result.message || result.msg || getPath(result, ["data", "text"], "成功");
  }
  return result.message || result.msg || "失败（code " + code + "）";
}

function requireCsrf(csrf, action) {
  if (!csrf) {
    throw new Error(action + "需要 Cookie 中的 bili_jct");
  }
}

function parseIqiyiDisplay(p00002) {
  if (!p00002) {
    return "";
  }
  try {
    let value = JSON.parse(decodeURIComponent(p00002));
    return value.nickname || maskAccount(value.user_name || "");
  } catch (error) {
    return "";
  }
}

function maskAccount(value) {
  let text = String(value || "");
  if (text.length <= 7) {
    return text;
  }
  return text.slice(0, 3) + "****" + text.slice(7);
}

function makeUuid() {
  let template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, function (character) {
    let random = Math.floor(Math.random() * 16);
    let value = character == "x" ? random : (random & 3) | 8;
    return value.toString(16);
  });
}

function validateAirScriptUrl(url, name) {
  let text = String(url || "");
  let match = text.match(/^https?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  if (!match) {
    throw new Error(name + " 必须是 HTTP 或 HTTPS 地址");
  }
  if (match[1].indexOf(":") >= 0 || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(match[1])) {
    throw new Error(name + " 不能使用 IP 或显式端口");
  }
}

function utf8ByteLength(value) {
  let encoded = encodeURIComponent(String(value || ""));
  return encoded.replace(/%[0-9A-F]{2}/gi, "x").length;
}

function validateBaiduSubmitUrl(url) {
  validateAirScriptUrl(url, "submit_url");
  if (!/^https:\/\/data\.zz\.baidu\.com\/urls\?/i.test(String(url))) {
    throw new Error("submit_url 必须使用 https://data.zz.baidu.com/urls");
  }
  if (String(url).indexOf("site=") < 0 || String(url).indexOf("token=") < 0) {
    throw new Error("submit_url 缺少 site 或 token");
  }
}

function safeUrlForLog(url) {
  return String(url || "").split("?")[0];
}

function firstMatch(text, pattern) {
  let match = String(text || "").match(pattern);
  return match ? match[1] : "";
}

function stripHtml(text) {
  return String(text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function valueOrDash(value) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function cell(column, row) {
  return String(Application.Range(column + row).Text || "").trim();
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function unixSeconds() {
  return String(Math.floor(Date.now() / 1000));
}

function twoDigits(value) {
  let text = String(value);
  return text.length < 2 ? "0" + text : text;
}

function formatDate(date) {
  return date.getFullYear() + "-" + twoDigits(date.getMonth() + 1) + "-" + twoDigits(date.getDate());
}

function formatDateTime(date) {
  return formatDate(date) + " " + twoDigits(date.getHours()) + ":" + twoDigits(date.getMinutes()) +
    ":" + twoDigits(date.getSeconds());
}

function ActivateSheet(sheetName) {
  try {
    let sheet = Application.Sheets.Item(sheetName);
    sheet.Activate();
    return 1;
  } catch (error) {
    return 0;
  }
}

function jsonPushHandle(pushName, pushFlag, pushKey) {
  for (let i = 0; i < jsonPush.length; i++) {
    if (jsonPush[i].name.toLowerCase() == String(pushName).toLowerCase()) {
      jsonPush[i].flag = pushFlag == "是" ? 1 : 0;
      jsonPush[i].key = pushKey;
      return;
    }
  }
}
