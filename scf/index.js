'use strict';

/**
 * X-Sleep Lab 被试报名通知 — 腾讯云函数（SCF）
 *
 * 部署：Node.js 18 事件函数 + 函数 URL（免鉴权）。详见同目录 README.md。
 *
 * 这个函数存在的理由：飞书群机器人的 webhook 一旦写在前端 JS 里就是公开的，
 * 任何人都能拿去往实验室群里灌消息。放在这里之后：
 *   1. webhook 只存在于环境变量 FEISHU_WEBHOOK，前端看不到；
 *   2. 卡片由本函数依据固定结构拼装，调用方无法控制消息形态；
 *   3. 数据落在腾讯云北京节点，不出境。
 */

const https = require('https');
const { URL } = require('url');

const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK || '';

const ALLOWED_ORIGINS = [
  'https://xsleeplab.cn',
  'https://www.xsleeplab.cn',
  'https://xsleeplab.github.io',
];

// 简易频率限制：同一 IP 每小时最多 5 次。
// SCF 实例会被复用但不保证常驻，所以这是一道减速带而非强保证。
const RATE_LIMIT_MAX = 5;
const SLOT_RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();

function rateLimited(key, max) {
  const now = Date.now();
  const limit = max || RATE_LIMIT_MAX;
  const recent = (hits.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= limit) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();          // 防止内存无限增长
  return false;
}

// 调用方可控的文本一律截断并剔除控制字符，避免撑爆卡片或破坏排版
const safe = (v, max) =>
  String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max || 120);

const safeList = (a, max) => (Array.isArray(a) ? a.slice(0, max || 40) : []);

const yn = b => (b ? '✅' : '❌');

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

const reply = (statusCode, origin, obj) => ({
  statusCode,
  headers: corsHeaders(origin),
  body: JSON.stringify(obj),
});

function postJSON(url, payload, extraHeaders) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(JSON.stringify(payload), 'utf8');
    const headers = { 'Content-Type': 'application/json', 'Content-Length': data.length };
    if (extraHeaders) Object.assign(headers, extraHeaders);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: headers,
      // 单次请求 4s。带预约的冷启动提交还会依次查询、写入并回读时段，
      // 因此 SCF 函数超时必须按 README 配置为至少 60s。
      timeout: 4000,
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => req.destroy(new Error('feishu request timeout')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ------------------------------------------------------------- bitable
// 把每份报名追加成多维表格的一行，供实验室筛选、排序、导出 Excel。
// 飞书卡片是主通道（决定给被试的成败），写表是尽力而为——配置没弄好
// 不该让被试提交失败，但会记进函数日志。

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const BITABLE_APP_TOKEN = process.env.BITABLE_APP_TOKEN || '';
const BITABLE_TABLE_ID = process.env.BITABLE_TABLE_ID || '';
const bitableReady = () =>
  !!(FEISHU_APP_ID && FEISHU_APP_SECRET && BITABLE_APP_TOKEN && BITABLE_TABLE_ID);

let tokenCache = { value: '', expireAt: 0 };

async function tenantToken() {
  if (tokenCache.value && Date.now() < tokenCache.expireAt) return tokenCache.value;
  const res = await postJSON(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    { app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET });
  const j = JSON.parse(res.body);
  if (j.code !== 0) throw new Error('取 tenant_access_token 失败: ' + res.body);
  // 官方有效期 7200s，提前 5 分钟过期以留出余量
  tokenCache = { value: j.tenant_access_token, expireAt: Date.now() + ((j.expire || 7200) - 300) * 1000 };
  return tokenCache.value;
}

function beijingNow() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
}

const asNumber = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// 字段名必须与表格列名完全一致，否则飞书会整行拒绝。
function buildFields(d) {
  const s = d.scores || {};
  const psqi = s.psqi || {}, isi = s.isi || {}, rmeq = s.rmeq || {}, dass = s.dass || {};
  const vision = d.vision || {}, habit = d.habit || {}, sched = d.schedule || {};
  const early = d.outcome === 'early-exit';

  const f = {
    '姓名': safe(d.name, 40),
    '提交时间': beijingNow(),
    '结果': d.outcome === 'passed' ? '合格' : early ? '中止' : '不合格',
    '手机': safe(d.phone, 30),
    '邮箱': safe(d.email, 60),
    '报名项目': safe(d.project && d.project.title, 40),
    '中止原因': d.exit ? safe(d.exit.where + '：' + d.exit.why, 100) : '',
    '预约时段': d.booking && d.booking.key
      ? safe('[待确认] ' + String(d.booking.key).replace('|', ' '), 40)
      : '',
  };
  const age = asNumber(d.age);
  if (age !== null) f['年龄'] = age;

  // 提前退出的人没答完量表，留空好过写入 0（那会被读成满分）
  if (early) return f;

  const put = (k, v) => { const n = asNumber(v); if (n !== null) f[k] = n; };
  put('PSQI', psqi.total);
  put('ISI', isi.total);
  put('rMEQ', rmeq.total);
  put('DASS抑郁', dass.depression);
  put('DASS焦虑', dass.anxiety);
  put('DASS压力', dass.stress);

  f['昼夜类型'] = safe(rmeq.type, 12);
  f['视力'] = vision.required === false
    ? '本项目不筛查'
    : '近视 ' + safe(vision.leftMyopia, 6) + '/' + safe(vision.rightMyopia, 6) +
      '，远视 ' + safe(vision.leftHyperopia, 6) + '/' + safe(vision.rightHyperopia, 6) +
      '，散光' + safe(vision.astigmatism, 4);
  f['环境适应'] = habit.pass ? '通过' : '未通过';
  f['三个月内染发'] = habit.dyePass === false ? '是' : '否';
  f['可用日期'] = safe(sched.days, 60);
  f['时间灵活度'] = safe(sched.flexibility, 40);
  f['最早可参与'] = safe(sched.earliest, 20);
  f['备注'] = safe(sched.note, 200);
  return f;
}

async function appendBitableRow(d) {
  if (!bitableReady()) return 'skipped';
  const token = await tenantToken();
  const url = 'https://open.feishu.cn/open-apis/bitable/v1/apps/' +
              encodeURIComponent(BITABLE_APP_TOKEN) + '/tables/' +
              encodeURIComponent(BITABLE_TABLE_ID) + '/records';
  const res = await postJSON(url, { fields: buildFields(d) },
    { Authorization: 'Bearer ' + token });
  const j = JSON.parse(res.body);
  if (j.code !== 0) {
    // 常见：99991672 权限未开通/未发版；91403 应用没被加进这张表格；
    //      1254045 列名对不上；1254005 app_token 或 table_id 不对
    const err = new Error('写入多维表格失败 code=' + j.code + ' msg=' + j.msg);
    err.bitableCode = j.code;
    throw err;
  }
  return 'ok';
}

// ---------------------------------------------------------------- slots
// 预约时段。表里的行由函数自动补齐（未来 SLOT_DAYS 天 × 两间实验室），
// 主试只需把某一格的「状态」改成「关闭」即可停用，不必手工建行。
//
// 隐私：给被试的接口只返回日期/实验室/可用与否，预约人姓名与邮箱在函数
// 内部就被丢弃，不是靠前端隐藏——数据根本不出服务端。

const BITABLE_SLOT_TABLE_ID = process.env.BITABLE_SLOT_TABLE_ID || '';
const SLOT_DAYS = 28;                 // 开放未来四周
const LABS = ['Lab 1', 'Lab 2'];      // 两间睡眠实验室，每天各一个名额
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const slotsReady = () => bitableReady() && !!BITABLE_SLOT_TABLE_ID;

const beijingDate = offsetDays => {
  const d = new Date(Date.now() + 8 * 3600 * 1000 + (offsetDays || 0) * 86400 * 1000);
  const iso = d.toISOString().slice(0, 10);
  return { iso, weekday: WEEKDAYS[d.getUTCDay()], stamp: dateStamp(iso) };
};

// 多维表格的「日期」列存毫秒时间戳。取北京时间当天零点，日历视图里才落在正确那一格。
// 注意：所有查找与预约都以「时段ID」文本为准，这个时间戳纯粹供日历视图显示，
// 即使时区显示有偏差也不会影响预约逻辑。
function dateStamp(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - 8 * 3600 * 1000;
}

function bitableUrl(tableId, suffix) {
  return 'https://open.feishu.cn/open-apis/bitable/v1/apps/' +
         encodeURIComponent(BITABLE_APP_TOKEN) + '/tables/' +
         encodeURIComponent(tableId) + '/records' + (suffix || '');
}

function requestJSON(method, url, payload, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = payload ? Buffer.from(JSON.stringify(payload), 'utf8') : null;
    const headers = { Authorization: 'Bearer ' + token };
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = data.length;
    }
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: method,
      headers: headers, timeout: 4000,
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('非 JSON 响应: ' + body.slice(0, 200))); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('bitable request timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function listSlotRecords(token) {
  const out = [];
  let pageToken = '';
  for (let page = 0; page < 6; page++) {      // 上限 3000 行，防跑飞
    const q = '?page_size=500' + (pageToken ? '&page_token=' + encodeURIComponent(pageToken) : '');
    const j = await requestJSON('GET', bitableUrl(BITABLE_SLOT_TABLE_ID, q), null, token);
    if (j.code !== 0) throw Object.assign(new Error('读取时段表失败 ' + j.code + ' ' + j.msg), { bitableCode: j.code });
    const d = j.data || {};
    (d.items || []).forEach(r => out.push(r));
    if (!d.has_more || !d.page_token) break;
    pageToken = d.page_token;
  }
  return out;
}

const slotKey = (iso, lab) => iso + '|' + lab;
const fieldText = v => (Array.isArray(v) ? (v[0] && (v[0].text || v[0])) : v) || '';

// 返回未来四周的完整网格，缺失的行顺带补建
async function buildSlotGrid() {
  const token = await tenantToken();
  const existing = await listSlotRecords(token);

  const byKey = {};
  existing.forEach(r => {
    const f = r.fields || {};
    const key = String(fieldText(f['时段ID']) || '');
    if (key) byKey[key] = { id: r.record_id, status: String(fieldText(f['状态']) || '可预约') };
  });

  const wanted = [];
  for (let i = 1; i <= SLOT_DAYS; i++) {          // 从明天起，不开放当天
    const { iso, weekday, stamp } = beijingDate(i);
    LABS.forEach(lab => wanted.push({ iso, weekday, stamp, lab, key: slotKey(iso, lab) }));
  }

  const missing = wanted.filter(w => !byKey[w.key]);
  if (missing.length) {
    const records = missing.map(w => ({
      fields: { '时段ID': w.key, '日期': w.stamp, '星期': w.weekday, '实验室': w.lab, '状态': '可预约' },
    }));
    // 分批，飞书单次上限 1000
    for (let i = 0; i < records.length; i += 500) {
      const j = await requestJSON('POST', bitableUrl(BITABLE_SLOT_TABLE_ID, '/batch_create'),
        { records: records.slice(i, i + 500) }, token);
      if (j.code !== 0) throw Object.assign(new Error('补建时段失败 ' + j.code + ' ' + j.msg), { bitableCode: j.code });
      (j.data && j.data.records || []).forEach(r => {
        byKey[String(fieldText((r.fields || {})['时段ID']))] = { id: r.record_id, status: '可预约' };
      });
    }
  }

  // 只回可用性，绝不含预约人信息
  return wanted.map(w => {
    const row = byKey[w.key] || { status: '可预约' };
    return { key: w.key, date: w.iso, weekday: w.weekday, lab: w.lab, status: row.status };
  });
}

// 预约：写入前先确认该格仍是「可预约」，写入后回读校验，尽量压缩撞单窗口
async function bookSlot(key, d) {
  const token = await tenantToken();
  const rows = await listSlotRecords(token);
  const hit = rows.find(r => String(fieldText((r.fields || {})['时段ID'])) === key);
  if (!hit) return { ok: false, reason: 'not-found' };

  const status = String(fieldText((hit.fields || {})['状态']) || '可预约');
  if (status !== '可预约') return { ok: false, reason: status === '关闭' ? 'closed' : 'taken' };

  const j = await requestJSON('PUT', bitableUrl(BITABLE_SLOT_TABLE_ID, '/' + hit.record_id), {
    fields: {
      '状态': '已预约',
      '预约人': safe(d.name, 40),
      '预约邮箱': safe(d.email, 60),
      '预约项目': safe(d.project && d.project.title, 40),
      '预约时间': beijingNow(),
    },
  }, token);
  if (j.code !== 0) return { ok: false, reason: 'write-failed', code: j.code };

  // 回读校验：多维表格没有唯一约束，并发写会互相覆盖。只有状态和
  // 预约身份都完整、精确匹配时才确认；读失败或字段缺失必须失败关闭。
  const after = await requestJSON('GET', bitableUrl(BITABLE_SLOT_TABLE_ID, '/' + hit.record_id), null, token);
  if (after.code !== 0) return { ok: false, reason: 'confirm-failed', code: after.code };
  const record = (after.data && after.data.record) || {};
  const fields = record.fields || {};
  const statusAfter = String(fieldText(fields['状态']) || '');
  const who = String(fieldText(fields['预约人']) || '');
  const email = String(fieldText(fields['预约邮箱']) || '');
  if (!statusAfter || !who || !email) return { ok: false, reason: 'confirm-failed' };
  if (statusAfter !== '已预约' || who !== safe(d.name, 40) || email !== safe(d.email, 60)) {
    return { ok: false, reason: 'taken' };
  }

  return { ok: true, key: key };
}

// ---------------------------------------------------------------- card

const divider = { tag: 'hr' };

const section = (title, lines) => ({
  tag: 'div',
  text: { tag: 'lark_md', content: '**' + title + '**\n' + lines.join('\n') },
});

const qaLines = (list, max) =>
  safeList(list, max).map(it => '· ' + safe(it.q, 60) + '：' + safe(it.a, 60));

// 提前退出的人没答完量表，不该套用完整卡片（那会把未作答显示成满分）。
// 用一张三行的紧凑卡片记录，既能统计漏斗，也不会刷屏。
function buildEarlyExitCard(d) {
  const exit = d.exit || {};
  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain_text', content: '⏹ 报名中止 · ' + safe(exit.where, 12) },
        template: 'grey',
      },
      elements: [
        { tag: 'div', fields: [
          { is_short: true, text: { tag: 'lark_md', content: '**姓名：**' + safe(d.name, 40) } },
          { is_short: true, text: { tag: 'lark_md', content: '**年龄：**' + safe(d.age, 6) } },
          { is_short: true, text: { tag: 'lark_md', content: '**手机：**' + safe(d.phone, 30) } },
          { is_short: true, text: { tag: 'lark_md', content: '**项目：**' + safe(d.project && d.project.title, 40) } },
        ]},
        { tag: 'div', text: { tag: 'lark_md', content: '**中止原因：**' + safe(exit.why, 80) } },
        { tag: 'note', elements: [{ tag: 'plain_text', content: '该被试在填写过程中即被排除，未完成量表。' }] },
      ],
    },
  };
}

function buildCard(d) {
  if (d.outcome === 'early-exit') return buildEarlyExitCard(d);
  const s = d.scores || {};
  const psqi = s.psqi || {}, isi = s.isi || {}, rmeq = s.rmeq || {}, dass = s.dass || {};
  const vision = d.vision || {};
  const habit = d.habit || {};
  const sched = d.schedule || {};
  const detail = d.detail || {};
  const passed = d.overallPass === true;

  const elements = [
    { tag: 'div', fields: [
      { is_short: true, text: { tag: 'lark_md', content: '**姓名：**' + safe(d.name, 40) } },
      { is_short: true, text: { tag: 'lark_md', content: '**手机：**' + safe(d.phone, 30) } },
      { is_short: true, text: { tag: 'lark_md', content: '**邮箱：**' + safe(d.email, 60) } },
      { is_short: true, text: { tag: 'lark_md', content: '**项目：**' + safe(d.project && d.project.title, 40) } },
    ]},
    divider,
    section('综合筛选：' + (passed ? '✅ 合格' : '❌ 不合格'), [
      'PSQI ' + safe(psqi.total, 6) + '（' + safe(psqi.threshold, 12) + '）' + yn(psqi.pass) +
        '　｜　ISI ' + safe(isi.total, 6) + '（' + safe(isi.threshold, 12) + '）' + yn(isi.pass),
      'rMEQ ' + safe(rmeq.total, 6) + ' — ' + safe(rmeq.type, 12) +
        '（' + safe(rmeq.threshold, 12) + '）' + yn(rmeq.pass),
      'DASS 抑郁' + safe(dass.depression, 6) + ' 焦虑' + safe(dass.anxiety, 6) +
        ' 压力' + safe(dass.stress, 6) + ' ' + yn(dass.pass),
      '视力 ' + (vision.required === false ? '—（本项目不筛查）' : yn(vision.pass)) +
        '　｜　环境适应 ' + yn(habit.pass) +
        '　｜　三个月内未染发 ' + yn(habit.dyePass),
    ]),
    divider,
    // 晚睡实验不采集视力，整段省略而不是显示一堆 0
    section('👁 视力', vision.required === false
      ? ['本项目不涉及精细视觉任务，未采集视力信息。']
      : [
          '左近视 ' + safe(vision.leftMyopia, 8) + '° ｜ 右近视 ' + safe(vision.rightMyopia, 8) + '°',
          '左远视 ' + safe(vision.leftHyperopia, 8) + '° ｜ 右远视 ' + safe(vision.rightHyperopia, 8) + '°',
          '散光：' + safe(vision.astigmatism, 8) + ' ｜ 佩戴眼镜：' + safe(vision.glasses, 8),
        ]),
    divider,
    section('🛏 环境适应', qaLines(habit.answers, 10).concat([
      '· 睡眠障碍：' + (safeList(habit.conditions, 12).map(c => safe(c, 30)).join('、') || '无'),
    ])),
    divider,
    // 每份逐题作答前先给出该量表的总分与判定，避免只能靠数选项推算
    section('📋 PSQI 逐题作答　总分 ' + safe(psqi.total, 6) +
            '（' + safe(psqi.threshold, 12) + '）' + yn(psqi.pass), qaLines(detail.psqi, 20)),
    divider,
    section('📋 ISI 逐题作答　总分 ' + safe(isi.total, 6) +
            '（' + safe(isi.threshold, 12) + '）' + yn(isi.pass), qaLines(detail.isi, 10)),
    divider,
    section('🌗 rMEQ 逐题作答　总分 ' + safe(rmeq.total, 6) + ' — ' + safe(rmeq.type, 12) +
            '（' + safe(rmeq.threshold, 12) + '）' + yn(rmeq.pass), qaLines(detail.rmeq, 8)),
    divider,
    section('📋 DASS-21 逐题作答　抑郁 ' + safe(dass.depression, 6) +
            ' / 焦虑 ' + safe(dass.anxiety, 6) + ' / 压力 ' + safe(dass.stress, 6) +
            ' ' + yn(dass.pass), qaLines(detail.dass, 25)),
    divider,
    section('📅 时段偏好（待确认）', d.booking && d.booking.key
      ? ['**[待确认] ' + safe(String(d.booking.key).replace('|', '　'), 40) + '**',
         '需由实验室邮件或电话最终确认',
         '备注：' + (safe(sched.note, 200) || '无')]
      : ['被试尚未选择时段', '备注：' + (safe(sched.note, 200) || '无')]),
  ];

  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: passed ? '✅ 新合格被试提交' : '⚠️ 新被试提交（未通过筛选）',
        },
        template: passed ? 'green' : 'red',
      },
      elements,
    },
  };
}

// ------------------------------------------------------------- handler

exports.main_handler = async (event) => {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || '';
  const method = String(
    event.httpMethod ||
    (event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
    ''
  ).toUpperCase();

  // 浏览器跨域预检
  if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  if (method && method !== 'POST') return reply(405, origin, { ok: false, error: 'method not allowed' });

  // 浏览器发起的跨域请求一定带 Origin；为空时可能是本地调试或非浏览器调用，放行但记录。
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    console.warn('拒绝来源:', origin);
    return reply(403, origin, { ok: false, error: 'origin not allowed' });
  }

  if (!FEISHU_WEBHOOK) {
    console.error('环境变量 FEISHU_WEBHOOK 未配置');
    return reply(500, origin, { ok: false, error: 'server not configured' });
  }

  const fwd = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  const ip = fwd ? String(fwd).split(',')[0].trim()
                 : ((event.requestContext && event.requestContext.sourceIp) || 'unknown');

  let data;
  try {
    let raw = event.body != null ? event.body : '{}';
    if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return reply(400, origin, { ok: false, error: 'invalid JSON' });
  }
  const slotsRequest = data && data.action === 'slots';
  const rateKey = (slotsRequest ? 'slots:' : 'submit:') + ip;
  const rateMax = slotsRequest ? SLOT_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
  if (rateLimited(rateKey, rateMax)) {
    return reply(429, origin, { ok: false, error: slotsRequest ? 'too many slot requests' : 'too many submissions' });
  }
  // 查询可用时段：不需要身份，也不返回任何预约人信息
  if (slotsRequest) {
    if (!slotsReady()) return reply(200, origin, { ok: true, slots: [], disabled: true });
    try {
      return reply(200, origin, { ok: true, slots: await buildSlotGrid() });
    } catch (e) {
      console.error('[slots]', e && e.message);
      return reply(200, origin, { ok: true, slots: [], disabled: true, code: e && e.bitableCode });
    }
  }

  if (!data || !data.name || !data.email) {
    return reply(400, origin, { ok: false, error: 'missing name/email' });
  }

  // 预约要先于归档：时段被抢走时应让被试重选，而不是记录一条无时段的报名
  let booking = null;
  if (data.booking && data.booking.key && slotsReady()) {
    try {
      const r = await bookSlot(String(data.booking.key), data);
      if (!r.ok) return reply(200, origin, { ok: false, error: 'slot-' + r.reason });
      booking = data.booking.key;
    } catch (e) {
      console.error('[book]', e && e.message);
      return reply(200, origin, { ok: false, error: 'slot-write-failed' });
    }
  }

  // 后续归档和通知只能使用服务端已经确认的预约结果。客户端传来的
  // booking 只是请求，时段服务未配置或未确认时不能把它写成已预约。
  const deliveryData = Object.assign({}, data, {
    booking: booking ? { key: booking } : null,
  });

  // 写表与发卡片并行；写表失败不影响给被试的结果，但要留下日志。
  // 把飞书返回的错误码一并带回响应，排查时不必每次去翻函数日志
  // （只回数字码，不回含 app_id 的完整报错文本）。
  let archiveCode = null;
  const archiving = appendBitableRow(deliveryData)
    .catch(e => {
      console.error('[bitable]', e && e.message);
      archiveCode = (e && e.bitableCode) || 'exception';
      return 'failed';
    });

  const notificationFailureResponse = async () => {
    const archived = await archiving;
    // A confirmed booking or a completed archive is a durable receipt. Report
    // notification delay without inviting a duplicate submission. If neither
    // exists, the form still needs to surface a real delivery failure.
    if (!booking && archived !== 'ok') {
      const failedBody = { ok: false, error: 'notify failed', archived };
      if (archiveCode !== null) failedBody.archiveCode = archiveCode;
      return reply(502, origin, failedBody);
    }
    const body = { ok: true, archived, notification: 'failed' };
    if (booking) {
      body.booking = booking;
      body.bookingStatus = 'pending';
    }
    if (archiveCode !== null) body.archiveCode = archiveCode;
    return reply(200, origin, body);
  };

  try {
    const res = await postJSON(FEISHU_WEBHOOK, buildCard(deliveryData));
    let ok = res.status >= 200 && res.status < 300;
    // 飞书即使 HTTP 200 也可能在 body 里返回非零 code
    try {
      const parsed = JSON.parse(res.body);
      if (parsed && typeof parsed.code === 'number' && parsed.code !== 0) ok = false;
    } catch (_) { /* 非 JSON 响应，以状态码为准 */ }

    if (!ok) {
      console.error('飞书返回异常:', res.status, res.body);
      return notificationFailureResponse();
    }
    // archived 便于在浏览器控制台一眼看出归档是否配好
    const archived = await archiving;
    const body = { ok: true, archived };
    if (booking) {
      body.booking = booking;
      // Bitable has no atomic conditional update. Readback proves the request
      // was present at that moment, but final confirmation remains manual.
      body.bookingStatus = 'pending';
    }
    if (archiveCode !== null) body.archiveCode = archiveCode;
    return reply(200, origin, body);
  } catch (e) {
    console.error('转发飞书失败:', e && e.message);
    return notificationFailureResponse();
  }
};
