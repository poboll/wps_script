// DailyCheckIn AirScript adapter
// Upstream: https://github.com/Sitoi/dailycheckin @ 135cc236 (2026-07-09)
// Checked: 2026-07-25
// Before running, add the "Network API" service in the AirScript editor.

const SHEET_NAME = "dailycheckin";
const FIRST_DATA_ROW = 2;
const LAST_DATA_ROW = 100;
const REQUEST_TIMEOUT = 30000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const TASKS = {
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
};

main();

function main() {
  const sheet = Application.Sheets.Item(SHEET_NAME);
  sheet.Activate();

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
    const task = cell("A", row).toUpperCase();
    const credential = cell("B", row);
    const enabled = cell("C", row);
    const nickname = cell("D", row) || "第 " + row + " 行";

    if (!task && !credential) break;
    if (enabled !== "是") continue;

    let result;
    try {
      if (!TASKS[task]) throw new Error("不支持的任务标识: " + task);
      if (!credential) throw new Error("凭据为空");
      result = TASKS[task](credential);
      console.log("[" + task + "][" + nickname + "] " + result);
    } catch (error) {
      result = "失败: " + errorMessage(error);
      console.log("[" + task + "][" + nickname + "] " + result);
    }

    Application.Range("E" + row).Value = result;
    Application.Range("F" + row).Value = formatDate(new Date());
    Time.sleep(1500);
  }
}

function runYoudao(cookie) {
  const headers = cookieHeaders(cookie, { "User-Agent": "YNote" });
  request("https://note.youdao.com/yws/api/daupromotion?method=sync", {
    method: "POST",
    headers: headers,
  });
  const checkin = requestJson("https://note.youdao.com/yws/mapi/user?method=checkin", {
    method: "POST",
    headers: headers,
  });
  let bytes = Number(checkin.space || 0);
  for (let i = 0; i < 3; i++) {
    const ad = requestJson("https://note.youdao.com/yws/mapi/user?method=adRandomPrompt", {
      method: "POST",
      headers: headers,
    });
    bytes += Number(ad.space || 0);
  }
  return "成功，获得约 " + Math.floor(bytes / 1048576) + " MB 空间";
}

function runAliyun(refreshToken) {
  const token = requestJson("https://auth.aliyundrive.com/v2/account/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!token.access_token) throw new Error(token.message || "refresh_token 已失效");
  const headers = {
    Authorization: token.access_token,
    "Content-Type": "application/json",
  };
  const sign = requestJson("https://member.aliyundrive.com/v1/activity/sign_in_list", {
    method: "POST",
    headers: headers,
    body: "{}",
  });
  if (!sign.success || !sign.result) throw new Error(sign.message || "签到接口返回异常");
  const day = sign.result.signInCount;
  const reward = requestJson("https://member.aliyundrive.com/v1/activity/sign_in_reward", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ signInDay: day }),
  });
  const name = reward.result && (reward.result.name || reward.result.description);
  return "成功，累计签到 " + day + " 天" + (name ? "，奖励: " + name : "");
}

function runBaiduWp(cookie) {
  const headers = cookieHeaders(cookie, {
    Referer: "https://pan.baidu.com/wap/svip/growth/task",
    "X-Requested-With": "XMLHttpRequest",
  });
  const sign = requestJson(
    "https://pan.baidu.com/rest/2.0/membership/level?app_id=250528&web=5&method=signin",
    { headers: headers }
  );
  const question = requestJson(
    "https://pan.baidu.com/act/v2/membergrowv2/getdailyquestion?app_id=250528&web=5",
    { headers: headers }
  );
  let answerText = "未获取到题目";
  if (question.ask_id !== undefined && question.answer !== undefined) {
    const answer = requestJson(
      "https://pan.baidu.com/act/v2/membergrowv2/answerquestion?app_id=250528&web=5" +
        "&ask_id=" + encodeURIComponent(question.ask_id) +
        "&answer=" + encodeURIComponent(question.answer),
      { headers: headers }
    );
    answerText = answer.show_msg || ("答题积分 " + (answer.score || 0));
  }
  const info = requestJson(
    "https://pan.baidu.com/rest/2.0/membership/user?app_id=250528&web=5&method=query",
    { headers: headers }
  );
  if (sign.error_code && Number(sign.error_code) !== 0) {
    throw new Error(sign.error_msg || "签到失败");
  }
  return "成功，签到积分 " + (sign.points || 0) + "；" + answerText +
    "；会员等级 " + (info.current_level || "-") + "，成长值 " + (info.current_value || "-");
}

function runBilibili(cookie) {
  const headers = cookieHeaders(cookie, { Referer: "https://www.bilibili.com/" });
  const nav = requestJson("https://api.bilibili.com/x/web-interface/nav", { headers: headers });
  if (!nav.data || !nav.data.isLogin) throw new Error("Cookie 已失效");
  const live = requestJson("https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign", {
    headers: headers,
  });
  const manga = requestJson("https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn", {
    method: "POST",
    headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: "platform=android",
  });
  return "成功，用户 " + nav.data.uname + "，等级 " + nav.data.level_info.current_level +
    "；直播签到: " + apiMessage(live) + "；漫画签到: " + apiMessage(manga);
}

function runV2ex(cookie) {
  const headers = cookieHeaders(cookie, { Referer: "https://www.v2ex.com/mission/daily" });
  const daily = requestText("https://www.v2ex.com/mission/daily", { headers: headers });
  const path = firstMatch(daily, /onclick="location\.href = '([^']+)'/i);
  if (path && path !== "/balance") {
    request("https://www.v2ex.com" + path, { headers: headers });
  } else if (!path && daily.indexOf("每日登录奖励已领取") < 0) {
    throw new Error("未找到领取入口，Cookie 可能已失效");
  }
  const balance = requestText("https://www.v2ex.com/balance", { headers: headers });
  const username = firstMatch(balance, /href="\/member\/[^\"]+" class="top">([^<]+)</i) || "未知用户";
  const total = firstMatch(balance, /text-align: right;">([\d.]+)<\/td>/i) || "未知";
  return "成功，用户 " + username + "，余额 " + total;
}

function runAcfun(cookie) {
  const headers = cookieHeaders(cookie, { Referer: "https://www.acfun.cn/" });
  const sign = requestJson("https://www.acfun.cn/rest/pc-direct/user/signIn", {
    method: "POST",
    headers: headers,
    body: "",
  });
  if (sign.result !== 0 && sign.result !== 122) throw new Error(sign.msg || "签到失败");
  const info = requestJson("https://www.acfun.cn/rest/pc-direct/user/personalInfo", {
    headers: headers,
  });
  return (sign.msg || "签到成功") + (info.info ? "，等级 " + info.info.level + "，香蕉 " + info.info.banana : "");
}

function runEnshan(cookie) {
  const headers = cookieHeaders(cookie, { Referer: "https://www.right.com.cn/forum/forum.php" });
  const page = requestText("https://www.right.com.cn/forum/forum.php", { headers: headers });
  const formhash = firstMatch(page, /name=["']formhash["']\s+value=["']([^"']+)/i);
  if (!formhash) throw new Error("未找到 formhash，Cookie 可能已失效");
  const text = requestText("https://www.right.com.cn/forum/plugin.php?id=dsu_paulsign:sign", {
    method: "POST",
    headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: formEncode({ formhash: formhash, qdxq: "kx", qdmode: "1", todaysay: "" }),
  });
  if (!/签到成功|已经签到|今日已签/i.test(text)) throw new Error(stripHtml(text).slice(0, 120));
  return /已经签到|今日已签/i.test(text) ? "今日已签到" : "签到成功";
}

function runFnnasClub(cookie) {
  const headers = cookieHeaders(cookie, { Referer: "https://club.fnnas.com/" });
  const page = requestText("https://club.fnnas.com/plugin.php?id=zqlj_sign", { headers: headers });
  if (/今天已经打过卡|今日已打卡/.test(page)) return "今日已打卡";
  const sign = firstMatch(page, /plugin\.php\?id=zqlj_sign&amp;sign=([0-9a-f]+)/i) ||
    firstMatch(page, /plugin\.php\?id=zqlj_sign&sign=([0-9a-f]+)/i);
  if (!sign) throw new Error("未找到打卡参数，Cookie 可能已失效");
  const result = requestText("https://club.fnnas.com/plugin.php?id=zqlj_sign&sign=" + sign, {
    headers: headers,
  });
  if (!/打卡成功|已经打过卡/.test(result)) throw new Error("打卡接口返回异常");
  return /已经打过卡/.test(result) ? "今日已打卡" : "打卡成功";
}

function runTieba(cookie) {
  const bduss = cookieValue(cookie, "BDUSS");
  if (!bduss) throw new Error("Cookie 中缺少 BDUSS");
  const headers = cookieHeaders(cookie);
  const tbsInfo = requestJson("https://tieba.baidu.com/dc/common/tbs", { headers: headers });
  if (!tbsInfo.is_login || !tbsInfo.tbs) throw new Error("Cookie 已失效");
  const likeData = tiebaSigned({
    BDUSS: bduss,
    _client_type: "2",
    _client_id: "wappc_1534235498291_488",
    _client_version: "9.7.8.0",
    _phone_imei: "000000000000000",
    from: "1008621y",
    page_no: "1",
    page_size: "200",
    model: "MI+5",
    net_type: "1",
    timestamp: String(Math.floor(Date.now() / 1000)),
    vcode_tag: "11",
  });
  const liked = requestJson("https://c.tieba.baidu.com/c/f/forum/like", {
    method: "POST",
    headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: formEncode(likeData),
  });
  const forums = collectTiebaForums(liked.forum_list || {});
  let success = 0;
  let existed = 0;
  let failed = 0;
  for (let i = 0; i < forums.length; i++) {
    const data = tiebaSigned({
      BDUSS: bduss,
      _client_type: "2",
      _client_version: "9.7.8.0",
      _phone_imei: "000000000000000",
      model: "MI+5",
      net_type: "1",
      fid: forums[i].id,
      kw: forums[i].name,
      tbs: tbsInfo.tbs,
      timestamp: String(Math.floor(Date.now() / 1000)),
    });
    const result = requestJson("https://c.tieba.baidu.com/c/c/forum/sign", {
      method: "POST",
      headers: withHeaders(headers, { "Content-Type": "application/x-www-form-urlencoded" }),
      body: formEncode(data),
    });
    if (String(result.error_code) === "0") success++;
    else if (String(result.error_code) === "160002") existed++;
    else failed++;
    Time.sleep(1200);
  }
  return "完成，共 " + forums.length + " 个贴吧，成功 " + success + "，已签 " + existed + "，失败 " + failed;
}

function runSmzdm(cookie) {
  const headers = cookieHeaders(cookie, {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "smzdm_android_V10.4.1 rv:841 (Android12;zh)smzdmapp",
  });
  const now = Date.now();
  const tokenData = { f: "android", v: "10.4.1", weixin: "1", time: String(now) };
  tokenData.sign = md5Upper(
    "f=android&time=" + now + "&v=10.4.1&weixin=1&key=apr1$AwP!wRRT$gJ/q.X24poeBInlUJC"
  );
  const tokenResult = requestJson("https://user-api.smzdm.com/robot/token", {
    method: "POST",
    headers: headers,
    body: formEncode(tokenData),
  });
  const token = tokenResult.data && tokenResult.data.token;
  if (!token) throw new Error(tokenResult.error_msg || "未获取到 robot token");
  const timestamp = Date.now();
  const sk = "ierkM0OZZbsuBKLoAgQ6OJneLMXBQXmzX+LXkNTuKch8Ui2jGlahuFyWIzBiDq/L";
  const data = { f: "android", v: "10.4.1", sk: sk, weixin: "1", time: String(timestamp), token: token };
  data.sign = md5Upper(
    "f=android&sk=" + sk + "&time=" + timestamp + "&token=" + token +
      "&v=10.4.1&weixin=1&key=apr1$AwP!wRRT$gJ/q.X24poeBInlUJC"
  );
  const result = requestJson("https://user-api.smzdm.com/checkin", {
    method: "POST",
    headers: headers,
    body: formEncode(data),
  });
  if (result.error_code && Number(result.error_code) !== 0) throw new Error(result.error_msg || "签到失败");
  return result.error_msg || "签到成功";
}

function runIqiyi(cookie) {
  const token = cookieValue(cookie, "P00001");
  if (!token) throw new Error("Cookie 中缺少 P00001");
  const info = requestJson(
    "https://serv.vip.iqiyi.com/vipgrowth/query.action?P00001=" + encodeURIComponent(token)
  );
  if (info.code !== "A00000") throw new Error(info.msg || "账号查询失败");
  const data = info.data || {};
  return "账号有效，VIP 等级 " + (data.level || 0) + "，今日成长 " +
    (data.todayGrowthValue || 0) + "，当前成长 " + (data.growthvalue || 0) +
    "。抽奖接口波动较大，本适配器不自动抽奖";
}

function runKgqq(cookie) {
  const uid = cookieValue(cookie, "uid");
  if (!uid) throw new Error("Cookie 中缺少 uid");
  const headers = cookieHeaders(cookie);
  const entries = ["1", "2", "4", "16", "128", "512"];
  let success = 0;
  const mapExt = "JTdCJTIyZmlsZSUyJTNBJTIydGFza0pjZSUyMiUyQyUyMmNtZE5hbWUlMjIlM0ElMjJHZXRTaWduSW5Bd2FyZFJlcSUyMiUyQyUyMnduc0NvbmZpZyUyMiUzQSU3QiUyMmFwcGlkJTIyJTNBMTAwMDYyNiU3RCUyQyUyMmw1YXBpJTIyJTNBJTdCJTIybW9kaWQlMjIlM0E1MDM5MzclMkMlMjJjbWQlMjIlM0E1ODk4MjQlN0QlN0Q";
  for (let i = 0; i < entries.length; i++) {
    const url = "https://node.kg.qq.com/webapp/proxy?ns=KG_TASK&cmd=task.signinGetAward" +
      "&mapExt=" + mapExt + "&t_uid=" + encodeURIComponent(uid) + "&t_iShowEntry=" + entries[i];
    const result = requestJson(url, { headers: headers });
    if (!result.code || result.code === 0) success++;
    Time.sleep(500);
  }
  return "签到奖励请求完成 " + success + "/" + entries.length +
    "；全民 K 歌接口字段易变化，请以实际鲜花数为准";
}

function request(url, options) {
  options = options || {};
  options.timeout = options.timeout || REQUEST_TIMEOUT;
  options.headers = withHeaders({ "User-Agent": USER_AGENT }, options.headers || {});
  const response = HTTP.fetch(url, options);
  if (response.status < 200 || response.status >= 400) {
    throw new Error("HTTP " + response.status + " " + url);
  }
  return response;
}

function requestJson(url, options) {
  return request(url, options).json();
}

function requestText(url, options) {
  return request(url, options).text();
}

function cookieHeaders(cookie, extra) {
  return withHeaders({ Cookie: cookie, "User-Agent": USER_AGENT }, extra || {});
}

function withHeaders(base, extra) {
  const result = {};
  Object.keys(base || {}).forEach(function (key) { result[key] = base[key]; });
  Object.keys(extra || {}).forEach(function (key) { result[key] = extra[key]; });
  return result;
}

function formEncode(data) {
  return Object.keys(data).map(function (key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
  }).join("&");
}

function cookieValue(cookie, name) {
  const pairs = String(cookie).split(";");
  for (let i = 0; i < pairs.length; i++) {
    const index = pairs[i].indexOf("=");
    if (index < 0) continue;
    if (pairs[i].slice(0, index).trim() === name) return pairs[i].slice(index + 1).trim();
  }
  return "";
}

function tiebaSigned(data) {
  const raw = Object.keys(data).sort().map(function (key) {
    return key + "=" + data[key];
  }).join("") + "tiebaclient!!!";
  data.sign = md5Upper(raw);
  return data;
}

function md5Upper(value) {
  return Crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

function collectTiebaForums(lists) {
  let result = [];
  ["non-gconforum", "gconforum"].forEach(function (key) {
    const value = lists[key];
    if (Array.isArray(value)) result = result.concat(value);
    else if (value && typeof value === "object") result.push(value);
  });
  return result;
}

function firstMatch(text, pattern) {
  const match = String(text).match(pattern);
  return match ? match[1] : "";
}

function stripHtml(text) {
  return String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function apiMessage(result) {
  return result.message || result.msg || (result.code === 0 ? "成功" : "已请求");
}

function cell(column, row) {
  return String(Application.Range(column + row).Text || "").trim();
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}
