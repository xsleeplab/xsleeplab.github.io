import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

function mainScript(html) {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const match = scripts.find(([, source]) => source.includes('const EXPERIMENT_STEPS'));
  assert.ok(match, 'signup page must contain its questionnaire script');
  return match[1];
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function experimentSteps(source) {
  const start = source.indexOf('const ALL_STEPS');
  const end = source.indexOf('const HABIT_Q', start);
  assert.ok(start >= 0 && end > start, 'questionnaire step declarations must exist');

  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${source.slice(start, end)}\nglobalThis.__steps = EXPERIMENT_STEPS;`,
    context,
  );
  return structuredClone(context.__steps);
}

function primaryAction(html, step) {
  const start = html.indexOf(`id="step-${step}"`);
  assert.notEqual(start, -1, `step ${step} panel must exist`);

  const nextPanel = html.indexOf('class="q-step-panel"', start + 1);
  const end = nextPanel === -1 ? html.length : nextPanel;
  const panel = html.slice(start, end);
  const actions = [...panel.matchAll(/<button\b[^>]*onclick="([^"]+)"[^>]*>/g)];
  assert.ok(actions.length > 0, `step ${step} must have an actionable button`);
  return actions.at(-1)[1];
}

function runPrimaryAction({ goNextSource, action, activeSteps, currentStep }) {
  const observed = { shownSteps: [], submissions: 0 };
  const context = {
    activeSteps,
    currentStep,
    validateStep: () => true,
    earlyExitReason: () => null,
    reportEarlyExit: () => assert.fail('eligible answers must not report an early exit'),
    showEarlyExit: () => assert.fail('eligible answers must not show an early exit'),
    showStep: step => observed.shownSteps.push(step),
    submitQuestionnaire: () => { observed.submissions++; },
  };
  vm.createContext(context);
  vm.runInContext(`${goNextSource}\n${action}`, context);
  return observed;
}

function callFunction(source, name, ...args) {
  const context = { __args: structuredClone(args) };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction(source, name)}\nglobalThis.__result = ${name}(...__args);`,
    context,
  );
  return structuredClone(context.__result);
}

function callAsyncFunction(source, name, args, globals) {
  const context = { __args: structuredClone(args), ...globals };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction(source, name)}\nglobalThis.__promise = ${name}(...__args);`,
    context,
  );
  return context.__promise;
}

test('the complete questionnaire script parses as JavaScript', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  assert.doesNotThrow(() => new vm.Script(mainScript(html)));
});

test('every questionnaire flow submits when its final primary button is used', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  const stepsByExperiment = experimentSteps(source);
  const goNextSource = extractFunction(source, 'goNext');

  for (const [experiment, steps] of Object.entries(stepsByExperiment)) {
    const finalStep = steps.at(-1);
    const observed = runPrimaryAction({
      goNextSource,
      action: primaryAction(html, finalStep),
      activeSteps: steps,
      currentStep: finalStep,
    });

    assert.equal(observed.submissions, 1, `${experiment}: final action must submit`);
    assert.deepEqual(observed.shownSteps, [], `${experiment}: final action must not stall or advance`);
  }
});

test('questionnaire primary buttons still advance between non-final active steps', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  const stepsByExperiment = experimentSteps(source);
  const goNextSource = extractFunction(source, 'goNext');

  for (const [experiment, steps] of Object.entries(stepsByExperiment)) {
    const observed = runPrimaryAction({
      goNextSource,
      action: primaryAction(html, steps[0]),
      activeSteps: steps,
      currentStep: steps[0],
    });

    assert.equal(observed.submissions, 0, `${experiment}: intermediate action must not submit`);
    assert.deepEqual(observed.shownSteps, [steps[1]], `${experiment}: intermediate action must advance`);
  }
});

test('an incomplete DASS step stays blocked and exposes its error', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  const shown = new Set();
  let scrolled = false;
  const errorElement = {
    classList: {
      add: value => shown.add(value),
      remove: value => shown.delete(value),
    },
    scrollIntoView: () => { scrolled = true; },
  };
  const context = {
    DASS_Q: new Array(21),
    document: {
      getElementById: id => id === 'err-dass' ? errorElement : null,
      querySelectorAll: selector => selector === '.form-error' ? [errorElement] : [],
      querySelector: selector => selector === '.form-error.show' && shown.has('show')
        ? errorElement
        : null,
    },
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction(source, 'validateStep')}\n`
      + `${extractFunction(source, 'showErr')}\n`
      + `${extractFunction(source, 'clearErrors')}\n`
      + 'globalThis.__valid = validateStep(7);',
    context,
  );

  assert.equal(context.__valid, false);
  assert.equal(shown.has('show'), true);
  assert.equal(scrolled, true);
});

test('submission responses never claim an unconfirmed booking as successful', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  const classify = (response, requestedSlot) =>
    callFunction(source, 'classifySubmissionResponse', response, requestedSlot);

  assert.deepEqual(
    classify(
      { ok: true, booking: '2026-08-12|Lab 1', bookingStatus: 'confirmed' },
      '2026-08-12|Lab 1',
    ),
    { kind: 'confirmed' },
  );
  assert.deepEqual(
    classify({ ok: true, booking: '2026-08-12|Lab 1' }, '2026-08-12|Lab 1'),
    { kind: 'pending' },
  );
  assert.deepEqual(
    classify({ ok: true }, '2026-08-12|Lab 1'),
    { kind: 'unconfirmed' },
  );
  assert.deepEqual(
    classify(
      {
        ok: true,
        booking: '2026-08-12|Lab 1',
        bookingStatus: 'pending',
        notification: 'failed',
      },
      '2026-08-12|Lab 1',
    ),
    { kind: 'pending-warning' },
  );
  assert.deepEqual(
    classify({ ok: false, error: 'slot-taken' }, '2026-08-12|Lab 1'),
    { kind: 'retry', error: 'slot-taken' },
  );
  assert.deepEqual(
    classify({ ok: false, error: 'slot-write-failed' }, '2026-08-12|Lab 1'),
    { kind: 'unknown', error: 'slot-write-failed' },
  );
  assert.deepEqual(
    classify({ ok: false, error: 'slot-confirm-failed' }, '2026-08-12|Lab 1'),
    { kind: 'unknown', error: 'slot-confirm-failed' },
  );
  assert.deepEqual(
    classify({ ok: false, error: 'notify failed' }, null),
    { kind: 'error', error: 'notify failed' },
  );
});

test('a fully booked slot grid falls back to manual scheduling', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  let fallbackMessage = '';
  const context = {
    __slots: [
      { key: '2026-08-12|Lab 1', date: '2026-08-12', weekday: '周三', lab: 'Lab 1', status: '已预约' },
      { key: '2026-08-12|Lab 2', date: '2026-08-12', weekday: '周三', lab: 'Lab 2', status: '关闭' },
    ],
    showSlotFallback: message => { fallbackMessage = message; },
    document: {
      getElementById: () => assert.fail('a fully booked grid must return before rendering controls'),
    },
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction(source, 'hasBookableSlot')}\n${extractFunction(source, 'renderSlots')}\nrenderSlots(__slots);`,
    context,
  );
  assert.match(fallbackMessage, /暂无可预约时段/);
});

test('JSON requests stop waiting at their deadline', async () => {
  const html = await readFile(new URL('signup/index.html', root), 'utf8');
  const source = mainScript(html);
  let timerCallback;
  let aborted = false;

  const pending = callAsyncFunction(
    source,
    'fetchJSONWithTimeout',
    ['/slow', { method: 'POST' }, 12000],
    {
      AbortController,
      setTimeout: callback => { timerCallback = callback; return 1; },
      clearTimeout: () => {},
      fetch: (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          aborted = true;
          const error = new Error('request timeout');
          error.name = 'AbortError';
          reject(error);
        });
      }),
    },
  );

  assert.equal(typeof timerCallback, 'function');
  timerCallback();
  await assert.rejects(pending, error => error.name === 'AbortError');
  assert.equal(aborted, true);
});
