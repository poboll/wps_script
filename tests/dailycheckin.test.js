const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "polymerization", "dailycheckin.js"),
  "utf8"
);

function response(body, status = 200, headers = {}) {
  return {
    status,
    headers,
    json() {
      return typeof body === "string" ? JSON.parse(body) : body;
    },
    text() {
      return typeof body === "string" ? body : JSON.stringify(body);
    },
  };
}

function createRuntime(rows, responses) {
  const cells = {};
  Object.keys(rows || {}).forEach((key) => { cells[key] = rows[key]; });
  const requests = [];
  const queue = (responses || []).slice();
  const context = {
    console: { log() {} },
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Error,
    RegExp,
    encodeURIComponent,
    Application: {
      Sheets: { Item() { return { Activate() {} }; } },
      Range(address) {
        return {
          get Text() { return cells[address] || ""; },
          set Value(value) { cells[address] = value; },
        };
      },
    },
    HTTP: {
      fetch(url, options) {
        requests.push({ url, options });
        if (!queue.length) throw new Error("No mocked response for " + url);
        return queue.shift();
      },
    },
    Crypto: {
      createHash(algorithm) { return crypto.createHash(algorithm); },
      createHmac(algorithm, key) { return crypto.createHmac(algorithm, key); },
    },
    Time: { sleep() {} },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "dailycheckin.js" });
  return { context, cells, requests };
}

{
  const runtime = createRuntime(
    { A2: "ALIYUN", B2: "refresh-token", C2: "是", D2: "账号一" },
    [
      response({ access_token: "access-token" }),
      response({ success: true, result: { signInCount: 8 } }),
      response({ result: { name: "1 天会员" } }),
    ]
  );
  assert.match(runtime.cells.E2, /累计签到 8 天/);
  assert.equal(runtime.requests[0].options.body.includes("refresh-token"), true);
  assert.equal(runtime.requests[1].options.headers.Authorization, "access-token");
}

{
  const runtime = createRuntime(
    { A2: "FNNASCLUB", B2: "sid=ok", C2: "是" },
    [
      response('<a href="plugin.php?id=zqlj_sign&amp;sign=abcdef12" class="btna">点击打卡</a>'),
      response("恭喜您，打卡成功！"),
    ]
  );
  assert.equal(runtime.cells.E2, "打卡成功");
  assert.match(runtime.requests[1].url, /sign=abcdef12$/);
}

{
  const runtime = createRuntime(
    { A2: "SMZDM", B2: "sess=ok", C2: "是" },
    [response({ data: { token: "robot-token" } }), response({ error_code: 0, error_msg: "签到成功" })]
  );
  assert.equal(runtime.cells.E2, "签到成功");
  assert.match(runtime.requests[0].options.body, /sign=[A-F0-9]{32}/);
  assert.match(runtime.requests[1].options.body, /token=robot-token/);
}

{
  const runtime = createRuntime(
    { A2: "UNKNOWN", B2: "value", C2: "是" },
    []
  );
  assert.match(runtime.cells.E2, /^失败: 不支持的任务标识/);
  assert.match(runtime.cells.F2, /^\d{4}-\d{2}-\d{2}/);
}

console.log("dailycheckin.test.js: all tests passed");
