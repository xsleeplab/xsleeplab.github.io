/**
 * 核查报名是否真正保存，以及被试页面和主试卡片是否准确表达该状态。
 * 输入：本仓库源码、内存中的合成报名和预设服务响应；不连接任何真实服务。
 * 输出：Node测试结果。设置ARCHIVE_TEST_SOURCE_ROOT可对修复前快照运行相同测试。
 * 流程：隔离运行云函数 → 模拟飞书保存及通知 → 用真实前端函数显示结果 → 核对状态。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// 允许同一组测试分别读取原始快照和修复副本，避免前后采用不同判定标准。
const sourceRoot = process.env.ARCHIVE_TEST_SOURCE_ROOT
  || fileURLToPath(new URL('../', import.meta.url));
const [handlerSource, engineSource] = await Promise.all([
  readFile(path.join(sourceRoot, 'scf/index.js'), 'utf8'),
  readFile(path.join(sourceRoot, 'signup/engine.js'), 'utf8'),
]);
const classifierStart = engineSource.indexOf('function classifySubmissionResponse(');
const submitStart = engineSource.indexOf('function sendEmail()', classifierStart);
const submitEnd = engineSource.indexOf('// Mobile menu toggle', submitStart);
assert(classifierStart >= 0 && submitStart > classifierStart && submitEnd > submitStart);
const fetchStart = engineSource.indexOf('function fetchJSONWithTimeout(');
const fetchEnd = engineSource.indexOf('\nfunction getRadio(', fetchStart);
assert(fetchStart >= 0 && fetchEnd > fetchStart);

/**
 * 用原始前端函数显示服务端回执，取得被试实际会看到的提示和按钮状态。
 * 页面元素只在内存中存在；fetch由固定回执替代，不会向网站提交。
 */
async function renderReceipt(receipt, requestedSlot = null, httpStatus = 200) {
  const status = { className: '', message: '' };
  // 浏览器里设置textContent或innerHTML都会替换原提示，这里保留相同效果。
  Object.defineProperties(status, {
    textContent: { set(value) { this.message = value; }, get() { return this.message; } },
    innerHTML: { set(value) { this.message = value; }, get() { return this.message; } },
  });
  const button = { disabled: false, textContent: '' };
  const elements = {
    'btn-send-email': button,
    'email-status': status,
    'confirm-email': { value: 'offline@example.invalid' },
    'slot-picker-card': { dataset: { slotState: 'fallback' } },
  };
  const context = vm.createContext({
    document: { getElementById: id => elements[id] },
    chosenSlot: requestedSlot,
    collectSubmission: () => ({ name: '离线测试', email: 'offline@example.invalid' }),
    // 保留真实的HTTP状态检查及JSON解析流程，只将底层网络回应替换成内存数据。
    fetch: async () => ({
      ok: httpStatus >= 200 && httpStatus < 300, status: httpStatus,
      json: async () => structuredClone(receipt),
    }),
    AbortController, setTimeout, clearTimeout,
    SUBMIT_ENDPOINT: 'https://offline.invalid', SUBMISSION_TIMEOUT_MS: 65000,
    console: { error() {} },
  });
  vm.runInContext(engineSource.slice(fetchStart, fetchEnd) + '\n'
    + engineSource.slice(classifierStart, submitEnd), context);
  const decision = httpStatus >= 200 && httpStatus < 300
    ? context.classifySubmissionResponse(receipt, requestedSlot)
    : { kind: 'transport-unconfirmed' };
  context.sendEmail();
  // 等待现有Promise回调完成，不使用网络或人为延迟。
  await new Promise(resolve => setImmediate(resolve));
  return { decision, status, button };
}

/**
 * 隔离运行云函数，并在内存中模拟保存记录和群机器人响应。
 * 每个场景使用独立环境，不接触本机真实凭据，也不修改全局https模块。
 */
async function submitOffline({ configured = true, archiveCode = 0, recordId = 'recOffline123', notificationOK = true } = {}) {
  const observed = { archiveCalls: 0, notificationCalls: 0, card: null, archiveFields: null };
  const environment = { FEISHU_WEBHOOK: 'https://notify.invalid/webhook' };
  if (configured) Object.assign(environment, {
    FEISHU_APP_ID: 'offline-app', FEISHU_APP_SECRET: 'offline-secret',
    BITABLE_APP_TOKEN: 'offline-base', BITABLE_TABLE_ID: 'offline-table',
  });
  const fakeHttps = {
    request(options, callback) {
      const request = new EventEmitter();
      const chunks = [];
      request.write = chunk => chunks.push(Buffer.from(chunk));
      request.destroy = error => request.emit('error', error);
      request.end = () => queueMicrotask(() => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          let body;
          let httpStatus = 200;
          if (options.hostname === 'notify.invalid') {
            observed.notificationCalls++;
            observed.card = payload;
            httpStatus = notificationOK ? 200 : 500;
            body = { code: notificationOK ? 0 : 1 };
          } else if (options.path.includes('/auth/v3/tenant_access_token/internal')) {
            body = { code: 0, tenant_access_token: 'offline-token', expire: 7200 };
          } else if (options.path.endsWith('/tables/offline-table/records')) {
            observed.archiveCalls++;
            observed.archiveFields = payload.fields;
            body = archiveCode
              ? { code: archiveCode, msg: 'offline rejection' }
              : { code: 0, data: { record: recordId ? { record_id: recordId } : {} } };
          } else throw new Error('禁止未预期请求：' + options.hostname + options.path);
          const response = new EventEmitter();
          response.statusCode = httpStatus;
          response.setEncoding = () => {};
          callback(response);
          response.emit('data', JSON.stringify(body));
          response.emit('end');
        } catch (error) { request.emit('error', error); }
      });
      return request;
    },
  };
  const exported = {};
  const context = vm.createContext({
    module: { exports: exported }, exports: exported, Buffer,
    process: { env: environment }, console: { error() {} },
    require(name) {
      if (name === 'https') return fakeHttps;
      if (name === 'url') return { URL };
      throw new Error('禁止额外模块：' + name);
    },
  });
  vm.runInContext(handlerSource, context);
  const response = await exported.main_handler({
    httpMethod: 'POST', headers: { origin: 'https://xsleeplab.cn' },
    body: JSON.stringify({
      name: '离线测试', email: 'offline@example.invalid', age: 20,
      project: { id: 'emotion-memory', title: '睡眠对情绪记忆的调节作用' },
      outcome: 'passed', overallPass: true,
    }),
  });
  const receipt = JSON.parse(response.body);
  return { response, receipt, observed, ui: await renderReceipt(receipt, null, response.statusCode) };
}

// 正常保存应有记录编号，并保持现有正常提交显示。
test('保存成功：回传记录编号，页面显示已提交', async () => {
  const result = await submitOffline();
  assert.equal(result.receipt.ok, true);
  assert.equal(result.receipt.archived, 'ok');
  assert.equal(result.receipt.archiveRecordId, 'recOffline123');
  assert.equal(result.ui.decision.kind, 'confirmed');
  assert.match(result.ui.status.message, /报名信息已提交/);
  assert.equal(result.observed.archiveCalls, 1);
  assert.equal(result.observed.notificationCalls, 1);
  assert.match(JSON.stringify(result.observed.card), /recOffline123/);
});

test('未预约的报名不写额外时段列，项目名完整保留', async () => {
  const result = await submitOffline();
  assert.equal(Object.hasOwn(result.observed.archiveFields, '预约时段'), false);
  assert.equal(result.observed.archiveFields['报名项目'], '睡眠对情绪记忆的调节作用');
});

// 保存失败不能被通知成功掩盖，也不能让被试反复点击制造重复报名。
test('保存失败但通知成功：页面待核实，群卡明确告警', async () => {
  const result = await submitOffline({ archiveCode: 1254045 });
  assert.equal(result.receipt.ok, false);
  assert.equal(result.receipt.archived, 'failed');
  assert.equal(result.receipt.archiveCode, 1254045);
  assert.equal(result.ui.decision.kind, 'archive-unconfirmed');
  assert.match(result.ui.status.message, /保存.*未.*确认|保存状态待核实/);
  assert.doesNotMatch(result.ui.status.message, /报名成功|报名信息已提交|报名信息已记录/);
  assert.equal(result.ui.button.disabled, true);
  assert.match(JSON.stringify(result.observed.card), /资料保存待核查/);
});

test('未配置保存：页面待核实，群卡说明未配置', async () => {
  const result = await submitOffline({ configured: false });
  assert.equal(result.receipt.ok, false);
  assert.equal(result.receipt.archived, 'skipped');
  assert.equal(result.observed.archiveCalls, 0);
  assert.equal(result.ui.decision.kind, 'archive-unconfirmed');
  assert.equal(result.ui.button.disabled, true);
  assert.match(JSON.stringify(result.observed.card), /未配置/);
});

test('未获得记录编号：不把不完整回执当成保存成功', async () => {
  const result = await submitOffline({ recordId: null });
  assert.equal(result.receipt.archived, 'failed');
  assert.equal(result.receipt.ok, false);
  assert.equal(result.ui.decision.kind, 'archive-unconfirmed');
});

// 通知失败不应否定已经成功保存的答卷。
test('保存成功但通知失败：保留保存成功并提示通知延迟', async () => {
  const result = await submitOffline({ notificationOK: false });
  assert.equal(result.receipt.ok, true);
  assert.equal(result.receipt.archived, 'ok');
  assert.equal(result.receipt.notification, 'failed');
  assert.equal(result.ui.decision.kind, 'warning');
  assert.match(result.ui.status.message, /报名信息已记录.*通知暂时延迟/);
  assert.equal(result.ui.button.disabled, true);
});

test('保存和通知均失败：不显示完成，也不自动重复提交', async () => {
  const result = await submitOffline({ archiveCode: 1254045, notificationOK: false });
  assert.equal(result.receipt.ok, false);
  assert.equal(result.receipt.notification, 'failed');
  assert.equal(result.ui.decision.kind, 'transport-unconfirmed');
  assert.match(result.ui.status.message, /暂未确认/);
  assert.doesNotMatch(result.ui.status.message, /报名信息已记录|报名成功/);
  assert.equal(result.ui.button.disabled, true);
});

// 更新前后端可能分步部署，旧服务缺少保存回执时也不能误报成功。
test('旧服务未提供保存状态：显示待核实', async () => {
  const ui = await renderReceipt({ ok: true });
  assert.equal(ui.decision.kind, 'archive-unconfirmed');
  assert.doesNotMatch(ui.status.message, /报名信息已提交/);
  assert.equal(ui.button.disabled, true);
});

test('时段已写入但报名归档失败：仍优先提示保存待核实', async () => {
  const ui = await renderReceipt({
    ok: false, archived: 'failed', notification: 'ok',
    booking: '2026-12-01', bookingStatus: 'pending',
  }, '2026-12-01');
  assert.equal(ui.decision.kind, 'archive-unconfirmed');
  assert.match(ui.status.message, /保存/);
  assert.equal(ui.button.disabled, true);
});

test('明确的时段冲突仍要求重新选择日期', async () => {
  const context = vm.createContext({});
  vm.runInContext(engineSource.slice(classifierStart, submitStart), context);
  assert.equal(context.classifySubmissionResponse({ ok: false, error: 'slot-taken' }, '2026-12-01').kind, 'retry');
});
