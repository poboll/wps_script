const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "polymerization", "daily.js");
const source = fs.readFileSync(scriptPath, "utf8");
const updateSource = fs.readFileSync(
  path.join(__dirname, "..", "polymerization", "UPDATE.js"),
  "utf8"
);
const readmeSource = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const dailyDocSource = fs.readFileSync(
  path.join(__dirname, "..", "docs", "daily-airscript-cn.md"),
  "utf8"
);
const expectedTasks = [
  "YOUDAO", "ALIYUN", "BAIDUWP", "BILIBILI", "V2EX", "ACFUN", "ENSHAN",
  "FNNASCLUB", "TIEBA", "SMZDM", "IQIYI", "KGQQ", "BAIDU",
];
const excludedTasks = ["AOLAXING", "IMAOTAI", "MIMOTION"];

function response(body, status = 200, headers = {}) {
  let read = false;
  return {
    status,
    headers,
    json() {
      assert.equal(read, false, "AirScript 响应正文只能读取一次");
      read = true;
      return typeof body === "string" ? JSON.parse(body) : body;
    },
    text() {
      assert.equal(read, false, "AirScript 响应正文只能读取一次");
      read = true;
      return typeof body === "string" ? body : JSON.stringify(body);
    },
    binary() {
      assert.equal(read, false, "AirScript 响应正文只能读取一次");
      read = true;
      return Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    },
  };
}

function createRuntime(responses = []) {
  const queue = responses.slice();
  const requests = [];
  const cells = {};
  let activeSheet = "";
  const context = {
    Buffer,
    console: { log() {} },
    Date,
    Error,
    JSON,
    Math,
    Number,
    Object,
    Array,
    RegExp,
    String,
    encodeURIComponent,
    decodeURIComponent,
    isFinite,
    parseInt,
    Application: {
      Sheets: {
        Item(name) {
          if (name !== "daily") throw new Error("sheet not found");
          return { Activate() { activeSheet = name; } };
        },
      },
      Range(address) {
        return {
          get Text() { return cells[activeSheet + "!" + address] || ""; },
          set Value(value) { cells[activeSheet + "!" + address] = value; },
        };
      },
    },
    HTTP: {
      fetch(url, options) {
        requests.push({ kind: "fetch", url, options });
        if (!queue.length) throw new Error("No mocked response for " + url);
        return queue.shift();
      },
      get(url, options) {
        requests.push({ kind: "get", url, options });
        if (!queue.length) throw new Error("No mocked response for " + url);
        return queue.shift();
      },
      post(url, body, options) {
        requests.push({ kind: "post", url, body, options });
        if (!queue.length) throw new Error("No mocked response for " + url);
        return queue.shift();
      },
    },
    Crypto: {
      createHash(algorithm) { return crypto.createHash(algorithm); },
      createHmac(algorithm, key) { return crypto.createHmac(algorithm, key); },
    },
    Time: { sleep() {} },
    SMTP: {
      login() {
        return { send() {} };
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "daily.js" });
  return { context, requests, queue, cells };
}

function runHandler(name, credential, responses) {
  const runtime = createRuntime(responses);
  assert.equal(typeof runtime.context[name], "function", name + " 未导出为顶层函数");
  const result = runtime.context[name](credential);
  assert.equal(runtime.queue.length, 0, name + " 有未使用的模拟响应");
  for (const request of runtime.requests) {
    if (request.kind !== "fetch") continue;
    const allowed = ["method", "timeout", "headers", "body"];
    for (const key of Object.keys(request.options || {})) {
      assert.ok(allowed.includes(key), name + " 使用了 AirScript HTTP 未文档化字段：" + key);
    }
  }
  return { result, requests: runtime.requests };
}

function runUpdate(initialState = {}) {
  const sheets = initialState.sheets || { Sheet1: {} };
  let activeSheet = initialState.activeSheet || Object.keys(sheets)[0];

  function sheetByName(name) {
    if (!Object.prototype.hasOwnProperty.call(sheets, name)) {
      throw new Error("sheet not found: " + name);
    }
    return {
      Name: name,
      Activate() { activeSheet = name; },
    };
  }

  const sheetCollection = {
    get Count() { return Object.keys(sheets).length; },
    Item(index) {
      const name = typeof index === "number" ? Object.keys(sheets)[index - 1] : index;
      return sheetByName(name);
    },
    Add(_before, _after, _count, _type, name) {
      if (Object.prototype.hasOwnProperty.call(sheets, name)) {
        throw new Error("duplicate sheet: " + name);
      }
      sheets[name] = {};
      activeSheet = name;
    },
  };

  const Application = {
    Sheets: sheetCollection,
    Enum: { XlSheetType: { xlWorksheet: -4167 } },
    get ActiveWorkbook() { return { Sheets: sheetCollection }; },
    get ActiveSheet() { return sheetByName(activeSheet); },
    Range(address) {
      return {
        get Text() {
          const value = sheets[activeSheet][address];
          return value === undefined || value === null ? "" : String(value);
        },
        set Value(value) { sheets[activeSheet][address] = value; },
      };
    },
  };

  const context = { Application, console: { log() {} } };
  vm.createContext(context);
  vm.runInContext(updateSource, context, { filename: "UPDATE.js" });
  return { sheets, activeSheet };
}

// 官方文档明确列出的不支持语法不得出现在 AirScript 主脚本中。
assert.doesNotMatch(source, /\bclass\s+[A-Za-z_$]/);
assert.doesNotMatch(source, /\b(?:import|export)\s/);
assert.doesNotMatch(source, /\?\./);
assert.doesNotMatch(source, /\bawait\b/);
assert.doesNotMatch(source, /\byield\b/);
assert.doesNotMatch(source, /\basync\s+function\b/);
{
  const runtime = createRuntime();
  const expectedHandlers = [
    "runYoudao", "runAliyun", "runBaiduWp", "runBilibili", "runV2ex", "runAcfun",
    "runEnshan", "runFnnasClub", "runTieba", "runSmzdm", "runIqiyi", "runKgqq",
    "runBaiduSubmit",
  ];
  for (const name of expectedHandlers) assert.equal(typeof runtime.context[name], "function");
  assert.equal(vm.runInContext("Object.keys(taskHandlers).length", runtime.context), 13);
  for (const task of expectedTasks) {
    assert.match(updateSource, new RegExp("\\['" + task + "'"));
    assert.match(readmeSource, new RegExp("`" + task + "`"));
    assert.match(dailyDocSource, new RegExp("`" + task + "`"));
  }
  for (const task of excludedTasks) {
    assert.doesNotMatch(updateSource, new RegExp("\\['" + task + "'"));
    assert.match(readmeSource, new RegExp("`" + task + "`"));
    assert.match(dailyDocSource, new RegExp("`" + task + "`"));
  }
}

{
  const first = runUpdate();
  const generatedTasks = expectedTasks.map((_, index) => first.sheets.daily["A" + (index + 2)]);
  assert.deepEqual(generatedTasks, expectedTasks, "UPDATE.js 应按文档顺序创建 13 项任务");
  for (let index = 0; index < expectedTasks.length; index++) {
    assert.equal(first.sheets.daily["C" + (index + 2)], "否", "新增任务必须默认关闭");
  }

  first.sheets.daily.B2 = "user-cookie";
  first.sheets.daily.C2 = "是";
  first.sheets.daily.D2 = "我的账号";
  const second = runUpdate(first);
  assert.equal(second.sheets.daily.B2, "user-cookie", "重复运行不得覆盖凭据");
  assert.equal(second.sheets.daily.C2, "是", "重复运行不得覆盖执行开关");
  assert.equal(second.sheets.daily.D2, "我的账号", "重复运行不得覆盖账号名称");
}

{
  const { result, requests } = runHandler("runYoudao", "YNOTE_PERS=a||user-id||b", [
    response("", 200, { "set-cookie": "YNOTE_SESS=updated; Path=/" }),
    response({ rewardSpace: 1048576 }),
    response({ space: 2097152 }),
    response({ space: 1048576 }),
    response({ space: 1048576 }),
    response({ space: 1048576 }),
  ]);
  assert.match(result, /6 MB/);
  assert.match(requests[1].options.headers.Cookie, /YNOTE_SESS=updated/);
}

{
  const { result } = runHandler("runAliyun", "refresh-token", [
    response({ access_token: "access-token" }),
    response({ success: true, result: { signInCount: 8 } }),
    response({ result: { name: "1 天会员" } }),
  ]);
  assert.match(result, /累计签到 8 天/);
}

{
  const { result } = runHandler("runBaiduWp", "BDUSS=ok", [
    response({ error_code: 0, points: 2 }),
    response({ ask_id: 1, answer: 3 }),
    response({ score: 5, show_msg: "回答正确" }),
    response({ current_level: 4, current_value: 120 }),
  ]);
  assert.match(result, /回答正确/);
  assert.match(result, /会员等级 4/);
}

{
  const { result } = runHandler("runBilibili", "SESSDATA=ok; bili_jct=csrf", [
    response({ data: { isLogin: true, uname: "tester", mid: 1, vipType: 0 } }),
    response({ code: 0, data: { text: "已签到" } }),
    response({ code: 0, msg: "success" }),
    response({ data: { list: [{ time: new Date().toISOString().slice(0, 10) + " 10:00:00", delta: 5 }] } }),
    response({ data: { silver: 10, gold: 2 } }),
  ]);
  assert.match(result, /用户 tester/);
  assert.match(result, /直播签到/);
  assert.match(result, /漫画签到/);
}

{
  const config = JSON.stringify({
    cookie: "SESSDATA=ok; bili_jct=csrf",
    vip_reward: true,
    coin_num: 1,
    watch: true,
    share: true,
    silver2coin: true,
  });
  const { result } = runHandler("runBilibili", config, [
    response({ data: { isLogin: true, uname: "tester", mid: 1, vipType: 1 } }),
    response({ code: 0, data: { text: "已签到" } }),
    response({ code: 0, msg: "success" }),
    response({ data: { list: [] } }),
    response({ data: { silver: 10, gold: 2 } }),
    response({ data: { archives: [{ aid: 11, cid: 22, title: "video" }] } }),
    response({ data: { list: [{ state: 0, vip_type: 1, type: 1 }] } }),
    response({ code: 0, message: "领取成功" }),
    response({ code: 0, message: "投币成功" }),
    response({ code: 0, message: "上报成功" }),
    response({ code: 0, message: "分享成功" }),
    response({ code: 0, message: "兑换成功" }),
  ]);
  assert.match(result, /会员权益：领取 1 项/);
  assert.match(result, /投币：1\/1/);
  assert.match(result, /观看上报：上报成功/);
  assert.match(result, /分享任务：分享成功/);
  assert.match(result, /银瓜子兑换：兑换成功/);
}

{
  const daily = '<div class="cell">连续登录 9 天</div>每日登录奖励已领取';
  const balance = '<a href="/member/tester" class="top">tester</a>' +
    '<td class="d"><span class="gray">每日登录奖励 10 铜币</span></td>' +
    '<td class="d" style="text-align: right;">12.34</td>';
  const { result } = runHandler("runV2ex", "A2=ok", [response(daily), response(balance)]);
  assert.match(result, /tester/);
  assert.match(result, /12.34/);
  assert.match(result, /连续签到/);
}

{
  const { result } = runHandler("runAcfun", "auth_key=ok", [
    response({ result: 0, msg: "签到成功" }),
    response({ result: 0, info: { level: 6, banana: 20 } }),
  ]);
  assert.match(result, /签到成功/);
  assert.match(result, /等级 6/);
}

{
  const config = JSON.stringify({
    cookie: "auth_key=ok",
    like: true,
    danmu_text: "测试弹幕",
    banana: true,
  });
  const { result } = runHandler("runAcfun", config, [
    response({ result: 0, msg: "签到成功" }),
    response({ result: 0, info: { level: 6, banana: 20 } }),
    response({ rankList: [{ contentId: "100" }] }),
    response({ result: 0, "acfun.midground.api_st": "st" }),
    response({ result: 1 }),
    response({ result: 1 }),
    response('{"currentVideoId":200}'),
    response({ result: 0 }),
    response({ result: 0 }),
  ]);
  assert.match(result, /点赞任务：完成并撤销/);
  assert.match(result, /弹幕任务：成功/);
  assert.match(result, /投香蕉：成功/);
}

{
  const runtime = createRuntime([
    response({ result: 0 }, 200, { "set-cookie": "auth_key=key; Path=/, acPasstoken=token; Path=/" }),
  ]);
  assert.match(runtime.context.acfunLogin("13800000000", "password"), /auth_key=key/);
}

{
  const page = '<input name="formhash" value="abc123">';
  const credits = '<em>恩山币: </em>88&nbsp;<em>积分: </em>99<span>';
  const { result, requests } = runHandler("runEnshan", "sid=ok", [
    response(page),
    response({ success: true, message: "签到成功", continuous_days: 3 }),
    response(credits),
  ]);
  assert.match(requests[1].url, /erling_qd:action/);
  assert.match(result, /连续 3 天/);
}

{
  const page = '<a href="plugin.php?id=zqlj_sign&sign=abcdef" class="btna">今日已打卡</a>' +
    '<strong>我的打卡动态</strong><div class="bm_c"><li>连续打卡：7 天</li></div>';
  const { result } = runHandler("runFnnasClub", "sid=ok", [response(page)]);
  assert.match(result, /今日已打卡/);
  assert.match(result, /连续打卡/);
}

{
  const { result, requests } = runHandler("runTieba", "BDUSS=ok", [
    response({ is_login: 1, tbs: "tbs" }),
    response({ userName: "tester" }),
    response({
      forum_list: { "non-gconforum": [{ id: "1", name: "测试" }] },
      has_more: "0",
    }),
    response({ error_code: "340006", error_msg: "屏蔽" }),
  ]);
  assert.match(result, /屏蔽 1/);
  assert.match(requests[2].options.body, /sign=[A-F0-9]{32}/);
}

{
  const { result } = runHandler("runSmzdm", "sess=ok", [
    response({ data: { token: "robot-token" } }),
    response({ error_code: 0, error_msg: "签到成功" }),
    response({ data: { normal_reward: { reward_add: { content: "10 积分" }, sub_title: "连续 5 天" } } }),
  ]);
  assert.match(result, /10 积分/);
  assert.match(result, /连续 5 天/);
}

{
  const { result } = runHandler("runIqiyi", "P00001=token; P00003=uid", [
    response({ code: "A00000", data: { level: 2, todayGrowthValue: 5, growthvalue: 20, distance: 80 } }),
  ]);
  assert.match(result, /VIP 等级 2/);
  assert.match(result, /当前成长 20/);
}

{
  const config = JSON.stringify({
    cookie: "P00001=token; P00003=uid",
    rewards: true,
    shake_limit: 2,
  });
  const { result } = runHandler("runIqiyi", config, [
    response({
      code: "A00000",
      data: { level: 7, todayGrowthValue: 5, growthvalue: 20, distance: 80, deadline: "2027-01-01" },
    }),
    response({ code: "A00000" }),
    response({ code: "A00000" }),
    response({ code: "A00000" }),
    response({ data: { giftName: "未中奖" } }),
    response({ data: { giftName: "会员天卡" } }),
    response({ data: { giftName: "未中奖" } }),
    response({ data: { giftName: "未中奖" } }),
    response({ data: { giftName: "未中奖" } }),
    response({ msg: "领取成功" }),
    response({ code: "A00000", data: { title: "积分" } }),
    response({ code: "A00001", msg: "抽奖次数用完" }),
    response({ daysurpluschance: 1, awardName: "" }),
    response({ daysurpluschance: 0, awardName: "成长值" }),
  ]);
  assert.match(result, /白金抽奖：会员天卡/);
  assert.match(result, /等级权益：领取成功/);
  assert.match(result, /每日摇奖：积分、抽奖次数用完/);
  assert.match(result, /聚合抽奖：成长值/);
}

{
  const profile = (flowers) => response({
    code: 0,
    data: {
      "profile.getProfile": {
        uFlowerNum: flowers,
        stPersonInfo: { sKgNick: "tester" },
      },
    },
  });
  const rewards = Array.from({ length: 6 }, () => response({ code: 0, data: { ok: true } }));
  const { result, requests } = runHandler("runKgqq", "uid=123", [profile(10), ...rewards, profile(16)]);
  assert.match(result, /核心奖励 6\/6/);
  assert.match(result, /鲜花增加 6/);
  const mapValue = new URL(requests[1].url).searchParams.get("mapExt");
  const decoded = decodeURIComponent(Buffer.from(mapValue, "base64").toString("utf8"));
  assert.equal(JSON.parse(decoded).cmdName, "GetSignInAwardReq");
}

{
  const profile = (flowers) => response({
    code: 0,
    data: {
      "profile.getProfile": {
        uFlowerNum: flowers,
        stPersonInfo: { sKgNick: "tester" },
      },
    },
  });
  const core = Array.from({ length: 6 }, () => response({ code: 0, data: { ok: true } }));
  const lotteries = Array.from({ length: 4 }, () => response({ code: 0, data: { ok: true } }));
  const musicList = response({
    code: 0,
    data: {
      "message.batch_get_music_cards": {
        vctMusicCards: [{
          strUgcId: "ugc",
          strKey: "key",
          stReward: { uFlowerNum: 15 },
        }],
      },
    },
  });
  const config = JSON.stringify({ cookie: "uid=123", extended: true, music_rounds: 1 });
  const { result } = runHandler("runKgqq", config, [
    profile(10),
    ...core,
    ...lotteries,
    musicList,
    response({ code: 0, data: { ok: true } }),
    response({ code: 0, data: { "vip.get_vip_info": { stVipCoreInfo: { uStatus: 0 } } } }),
    profile(25),
  ]);
  assert.match(result, /抽奖 4\/4/);
  assert.match(result, /音乐卡 1\/1/);
  assert.match(result, /非 VIP/);
}

{
  const config = JSON.stringify({
    data_url: "https://example.com/urls.txt",
    submit_url: "https://data.zz.baidu.com/urls?site=https%3A%2F%2Fexample.com&token=secret",
    max_retries: 1,
  });
  const { result, requests } = runHandler("runBaiduSubmit", config, [
    response("https://example.com/a\n"),
    response({ success: 1, remain: 99 }),
  ]);
  assert.match(result, /提交成功 1 条/);
  assert.equal(requests[1].options.body, "https://example.com/a\n");
}

{
  const runtime = createRuntime();
  assert.throws(
    () => runtime.context.validateAirScriptUrl("https://127.0.0.1?value=1", "test_url"),
    /不能使用 IP/
  );
  assert.throws(
    () => runtime.context.validateAirScriptUrl("https://example.com:8443/path", "test_url"),
    /不能使用 IP 或显式端口/
  );
  assert.equal(runtime.context.utf8ByteLength("A中"), 4);
}

console.log("daily.test.js: 13 tasks passed with AirScript-compatible mocks");
