import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const https = require('node:https');
const scfPath = require.resolve('../scf/index.js');
const envKeys = [
  'FEISHU_WEBHOOK',
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'BITABLE_APP_TOKEN',
  'BITABLE_TABLE_ID',
  'BITABLE_SLOT_TABLE_ID',
];

function fakeRequest(onRequest) {
  return (options, callback) => {
    const request = new EventEmitter();
    const chunks = [];
    request.write = chunk => chunks.push(Buffer.from(chunk));
    request.end = () => {
      queueMicrotask(() => {
        let responseData;
        try {
          responseData = onRequest(options, Buffer.concat(chunks).toString('utf8'));
        } catch (error) {
          request.emit('error', error);
          return;
        }
        const response = new EventEmitter();
        response.statusCode = responseData.status;
        response.setEncoding = () => {};
        callback(response);
        response.emit('data', responseData.body);
        response.emit('end');
      });
    };
    request.destroy = error => request.emit('error', error);
    return request;
  };
}

test('unavailable slot storage cannot be reported downstream as a confirmed booking', async t => {
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousRequest = https.request;
  let notificationPayload;

  t.after(() => {
    https.request = previousRequest;
    delete require.cache[scfPath];
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  process.env.FEISHU_WEBHOOK = 'https://notify.invalid/webhook';
  for (const key of envKeys.slice(1)) delete process.env[key];
  https.request = fakeRequest((options, body) => {
    assert.equal(options.hostname, 'notify.invalid');
    notificationPayload = JSON.parse(body);
    return { status: 200, body: '{"code":0}' };
  });

  delete require.cache[scfPath];
  const { main_handler: handler } = require(scfPath);
  const response = await handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://xsleeplab.cn',
      'x-forwarded-for': '198.51.100.10',
    },
    body: JSON.stringify({
      name: 'Local Test',
      email: 'local-test@example.com',
      phone: '13800000000',
      outcome: 'passed',
      overallPass: true,
      project: { id: 'overnight-sleep', title: '夜间睡眠研究' },
      booking: { key: '2026-08-12|Lab 1' },
    }),
  });

  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.booking, undefined, 'response must not acknowledge an unreserved slot');
  assert.doesNotMatch(
    JSON.stringify(notificationPayload),
    /2026-08-12/,
    'notification must not claim a slot that the server did not reserve',
  );
});

test('a read-back booking remains a pending success when only the notification fails', async t => {
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousRequest = https.request;
  const previousConsoleError = console.error;
  const slotKey = '2026-08-12|Lab 1';

  t.after(() => {
    https.request = previousRequest;
    console.error = previousConsoleError;
    delete require.cache[scfPath];
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  Object.assign(process.env, {
    FEISHU_WEBHOOK: 'https://notify.invalid/webhook',
    FEISHU_APP_ID: 'app-id',
    FEISHU_APP_SECRET: 'app-secret',
    BITABLE_APP_TOKEN: 'base-token',
    BITABLE_TABLE_ID: 'submission-table',
    BITABLE_SLOT_TABLE_ID: 'slot-table',
  });
  console.error = () => {};

  https.request = fakeRequest((options, body) => {
    if (options.hostname === 'notify.invalid') {
      assert.match(body, /待确认/);
      return { status: 500, body: '{"code":1}' };
    }
    if (options.path.includes('/auth/v3/tenant_access_token/internal')) {
      return { status: 200, body: '{"code":0,"tenant_access_token":"token","expire":7200}' };
    }
    if (options.path.includes('/tables/slot-table/records/slot-row')) {
      if (options.method === 'PUT') {
        assert.match(body, /"状态":"已预约"/);
        return { status: 200, body: '{"code":0}' };
      }
      return {
        status: 200,
        body: '{"code":0,"data":{"record":{"fields":{"状态":"已预约","预约人":"Local Test","预约邮箱":"local-test@example.com"}}}}',
      };
    }
    if (options.path.includes('/tables/slot-table/records')) {
      return {
        status: 200,
        body: JSON.stringify({
          code: 0,
          data: {
            items: [{
              record_id: 'slot-row',
              fields: { 时段ID: slotKey, 状态: '可预约' },
            }],
            has_more: false,
          },
        }),
      };
    }
    if (options.path.includes('/tables/submission-table/records')) {
      assert.match(body, /2026-08-12 Lab 1/);
      assert.match(body, /待确认/);
      return { status: 200, body: '{"code":0}' };
    }
    throw new Error(`Unexpected request: ${options.method} ${options.hostname}${options.path}`);
  });

  delete require.cache[scfPath];
  const { main_handler: handler } = require(scfPath);
  const response = await handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://xsleeplab.cn',
      'x-forwarded-for': '198.51.100.11',
    },
    body: JSON.stringify({
      name: 'Local Test',
      email: 'local-test@example.com',
      phone: '13800000000',
      outcome: 'passed',
      overallPass: true,
      project: { id: 'overnight-sleep', title: '夜间睡眠研究' },
      booking: { key: slotKey },
    }),
  });

  const result = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(result.ok, true);
  assert.equal(result.booking, slotKey);
  assert.equal(result.bookingStatus, 'pending');
  assert.equal(result.notification, 'failed');
  assert.equal(result.archived, 'ok');
});

test('booking acknowledgement requires a successful exact readback', async t => {
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousRequest = https.request;
  let activeReadback;

  t.after(() => {
    https.request = previousRequest;
    delete require.cache[scfPath];
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  Object.assign(process.env, {
    FEISHU_WEBHOOK: 'https://notify.invalid/webhook',
    FEISHU_APP_ID: 'app-id',
    FEISHU_APP_SECRET: 'app-secret',
    BITABLE_APP_TOKEN: 'base-token',
    BITABLE_TABLE_ID: 'submission-table',
    BITABLE_SLOT_TABLE_ID: 'slot-table',
  });

  https.request = fakeRequest(options => {
    if (options.hostname === 'notify.invalid') {
      return { status: 200, body: '{"code":0}' };
    }
    if (options.path.includes('/auth/v3/tenant_access_token/internal')) {
      return { status: 200, body: '{"code":0,"tenant_access_token":"token","expire":7200}' };
    }
    if (options.path.includes('/tables/slot-table/records/slot-row')) {
      if (options.method === 'PUT') return { status: 200, body: '{"code":0}' };
      return { status: 200, body: JSON.stringify(activeReadback) };
    }
    if (options.path.includes('/tables/slot-table/records')) {
      return {
        status: 200,
        body: JSON.stringify({
          code: 0,
          data: {
            items: [{
              record_id: 'slot-row',
              fields: { 时段ID: '2026-08-12|Lab 1', 状态: '可预约' },
            }],
            has_more: false,
          },
        }),
      };
    }
    if (options.path.includes('/tables/submission-table/records')) {
      return { status: 200, body: '{"code":0}' };
    }
    throw new Error(`Unexpected request: ${options.method} ${options.hostname}${options.path}`);
  });

  delete require.cache[scfPath];
  const { main_handler: handler } = require(scfPath);
  const scenarios = [
    {
      ip: '198.51.100.14',
      readback: { code: 1254045, msg: 'read failed' },
      error: 'slot-confirm-failed',
    },
    {
      ip: '198.51.100.15',
      readback: {
        code: 0,
        data: { record: { fields: { 状态: '已预约', 预约人: 'Local Test', 预约邮箱: 'other@example.com' } } },
      },
      error: 'slot-taken',
    },
  ];

  for (const scenario of scenarios) {
    activeReadback = scenario.readback;
    const response = await handler({
      httpMethod: 'POST',
      headers: {
        origin: 'https://xsleeplab.cn',
        'x-forwarded-for': scenario.ip,
      },
      body: JSON.stringify({
        name: 'Local Test',
        email: 'local-test@example.com',
        outcome: 'passed',
        overallPass: true,
        project: { id: 'overnight-sleep', title: '夜间睡眠研究' },
        booking: { key: '2026-08-12|Lab 1' },
      }),
    });
    const result = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(result.ok, false);
    assert.equal(result.error, scenario.error);
    assert.equal(result.booking, undefined);
  }
});

test('an archived submission remains successful when only the notification fails', async t => {
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousRequest = https.request;
  const previousConsoleError = console.error;

  t.after(() => {
    https.request = previousRequest;
    console.error = previousConsoleError;
    delete require.cache[scfPath];
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  Object.assign(process.env, {
    FEISHU_WEBHOOK: 'https://notify.invalid/webhook',
    FEISHU_APP_ID: 'app-id',
    FEISHU_APP_SECRET: 'app-secret',
    BITABLE_APP_TOKEN: 'base-token',
    BITABLE_TABLE_ID: 'submission-table',
  });
  delete process.env.BITABLE_SLOT_TABLE_ID;
  console.error = () => {};

  https.request = fakeRequest(options => {
    if (options.hostname === 'notify.invalid') {
      return { status: 500, body: '{"code":1}' };
    }
    if (options.path.includes('/auth/v3/tenant_access_token/internal')) {
      return { status: 200, body: '{"code":0,"tenant_access_token":"token","expire":7200}' };
    }
    if (options.path.includes('/tables/submission-table/records')) {
      return { status: 200, body: '{"code":0}' };
    }
    throw new Error(`Unexpected request: ${options.method} ${options.hostname}${options.path}`);
  });

  delete require.cache[scfPath];
  const { main_handler: handler } = require(scfPath);
  const response = await handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://xsleeplab.cn',
      'x-forwarded-for': '198.51.100.13',
    },
    body: JSON.stringify({
      name: 'Local Test',
      email: 'local-test@example.com',
      outcome: 'passed',
      overallPass: true,
    }),
  });

  const result = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(result.ok, true);
  assert.equal(result.archived, 'ok');
  assert.equal(result.notification, 'failed');
});

test('slot availability checks do not consume the submission quota', async t => {
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousRequest = https.request;

  t.after(() => {
    https.request = previousRequest;
    delete require.cache[scfPath];
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  process.env.FEISHU_WEBHOOK = 'https://notify.invalid/webhook';
  for (const key of envKeys.slice(1)) delete process.env[key];
  https.request = fakeRequest(() => ({ status: 200, body: '{"code":0}' }));

  delete require.cache[scfPath];
  const { main_handler: handler } = require(scfPath);
  const headers = {
    origin: 'https://xsleeplab.cn',
    'x-forwarded-for': '198.51.100.12',
  };

  for (let i = 0; i < 5; i++) {
    const response = await handler({
      httpMethod: 'POST',
      headers,
      body: JSON.stringify({ action: 'slots' }),
    });
    assert.equal(response.statusCode, 200);
  }

  const submission = await handler({
    httpMethod: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Local Test',
      email: 'local-test@example.com',
      outcome: 'passed',
      overallPass: true,
    }),
  });

  assert.equal(submission.statusCode, 200);
  assert.equal(JSON.parse(submission.body).ok, true);
});
