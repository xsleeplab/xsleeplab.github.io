
/**
 * engine.js — 共享问卷引擎
 *
 * 从 window.PROJECT_CONFIGS[projectId] 读取项目配置，驱动问卷渲染、
 * 验证、评分、提交和日历预约全流程。
 *
 * 依赖：configs.js 须在本文件之前加载。
 */

// ==================== 常量 ====================
const SUBMIT_ENDPOINT = 'https://1301866011-fg2ytpu440.ap-beijing.tencentscf.com';
const SLOT_LOAD_TIMEOUT_MS = 12000;
const SUBMISSION_TIMEOUT_MS = 65000;
const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

// ==================== 状态 ====================
let currentStep = 0;
let selectedExpId = null;
let config = null;          // 当前项目配置（= PROJECT_CONFIGS[selectedExpId]）
let activeSteps = [];       // 当前项目的步骤名数组
let chosenSlot = null;
let calSlots = [];
let calWindow = 14;
let calViewYear = null;
let calViewMonth = null;

// 便捷访问
const getExp = () => PROJECT_CONFIGS[selectedExpId];
const visionRequired = () => config && config.steps.indexOf('vision') !== -1;
// 基本信息页是否收集手机号/微信号：默认收集，仅当项目显式设 collectContactInBasic:false 时隐藏
const basicContactEnabled = () => !config || config.collectContactInBasic !== false;
const lastStep = () => activeSteps[activeSteps.length - 1];
const lastStepIndex = () => activeSteps.length - 1;

// 获取当前步骤的类型名（用于 validation dispatch）
function currentStepType() {
  return activeSteps[currentStep] || '';
}

// ==================== 工具函数 ====================
function fetchJSONWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 15000);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .finally(() => clearTimeout(timer));
}

function getRadio(n) {
  const e = document.querySelector('input[name="' + n + '"]:checked');
  return e ? parseInt(e.value) : 0;
}

function radioLabel(name) {
  const el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.parentElement.textContent.trim() : '未填';
}

function parseTime(t) {
  const p = t.split(':').map(Number);
  return p[0] + p[1] / 60;
}

function showErr(id) { const e = document.getElementById(id); if (e) e.classList.add('show'); }
function clearErrors() { document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show')); }

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const confirmToken = params.get('confirm');
  if (confirmToken) {
    showConfirmPage(confirmToken);
    return;
  }

  const projectId = params.get('project');
  if (!projectId || !PROJECT_CONFIGS[projectId] || PROJECT_CONFIGS[projectId].active !== true) {
    window.location.replace('../participate.html');
    return;
  }

  config = PROJECT_CONFIGS[projectId];
  activeSteps = config.steps.slice();

  renderPSQI();
  renderISI();
  renderRMEQ();
  renderDASS();

  // 根据项目配置渲染 step-3（habit 或 customScreening）
  renderStep3Content();

  selectExperiment(projectId);
});

// ==================== STEP-3 动态内容 ====================
function renderStep3Content() {
  const panel = document.getElementById('step-3');
  if (!panel || !config) return;

  if (config.steps.indexOf('habit') !== -1 && config.habitQuestions) {
    renderHabitQuestions();
  } else if (config.steps.indexOf('customScreening') !== -1 && config.customScreening) {
    renderCustomScreeningQuestions();
  }
}

function renderHabitQuestions() {
  const panel = document.getElementById('step-3');
  // 恢复默认标题
  const title = panel.querySelector('.q-step-title');
  if (title) title.textContent = '环境适应与睡眠习惯';
  const desc = panel.querySelector('.q-step-desc');
  if (desc) desc.textContent = '以下问题帮助我们了解您在陌生环境中的睡眠状况和一些生活习惯，以便为您安排合适的实验条件。';

  // 渲染 HABIT_Q 的 radio groups
  renderHabit();
}

function renderCustomScreeningQuestions() {
  const panel = document.getElementById('step-3');
  const title = panel.querySelector('.q-step-title');
  if (title) title.textContent = '健康筛查';
  const desc = panel.querySelector('.q-step-desc');
  if (desc) desc.textContent = '以下问题帮助我们确认您是否符合本实验的参与条件，请如实作答。';

  // 清空 panel 中旧的 habit 内容，替换为 custom screening
  const existing = panel.querySelectorAll('.q-item, .checkbox-grid, .form-error, #habit-dye-wrapper, #habit-wake-wrapper');
  existing.forEach(el => el.remove());

  const container = document.createElement('div');
  container.id = 'custom-screening-container';

  config.customScreening.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'q-item';
    div.id = 'cs-item-' + i;
    div.setAttribute('data-qid', q.id);

    // 条件显示：如果配置了 showIf，先隐藏，等值变化时再显示
    if (q.showIf) {
      div.style.display = 'none';
      div.setAttribute('data-show-if-q', q.showIf.questionId);
      div.setAttribute('data-show-if-val', JSON.stringify(q.showIf.value));
    }

    let inputHtml = '';
    if (q.type === 'radio') {
      inputHtml = '<label class="form-label"><span class="q-item-number">' + (i + 1) + '.</span> ' + q.text + '</label><div class="radio-group" id="cs-q' + i + '"></div>';
    } else if (q.type === 'checkbox') {
      inputHtml = '<label class="form-label"><span class="q-item-number">' + (i + 1) + '.</span> ' + q.text + '</label><div class="checkbox-group" id="cs-q' + i + '"></div>';
    } else if (q.type === 'text') {
      const inputType = q.inputType === 'phone' ? 'tel' : 'text';
      const placeholder = q.inputType === 'phone' ? '请输入手机号' : '请输入';
      inputHtml = '<label class="form-label"><span class="q-item-number">' + (i + 1) + '.</span> ' + q.text + '</label>' +
        '<input type="' + inputType + '" class="form-input" id="cs-q' + i + '" placeholder="' + placeholder + '"' +
        (q.required ? ' required' : '') + '>';
    }
    div.innerHTML = inputHtml;
    container.appendChild(div);
  });

  const errDiv = document.createElement('div');
  errDiv.className = 'form-error';
  errDiv.id = 'err-custom-screening';
  errDiv.textContent = '请完整填写所有问题';
  container.appendChild(errDiv);

  // 找到 step-actions 并插入之前
  const actions = panel.querySelector('.step-actions');
  if (actions) {
    panel.insertBefore(container, actions);
  } else {
    panel.appendChild(container);
  }

  // 渲染各组输入控件
  config.customScreening.forEach((q, i) => {
    if (q.type === 'radio') {
      renderRadioGroup('cs-q' + i, 'cs-q' + i, q.options);
    } else if (q.type === 'checkbox') {
      renderCheckboxGroup('cs-q' + i, 'cs-q' + i, q.options);
    }
  });

  // 绑定条件显示逻辑
  setupConditionalDisplay();
}

// 渲染多选框组
function renderCheckboxGroup(cid, name, opts) {
  const c = document.getElementById(cid);
  if (!c) return;
  c.innerHTML = opts.map(o =>
    '<div class="checkbox-option"><input type="checkbox" name="' + name +
    '" id="' + name + '-' + o.value + '" value="' + o.value +
    '"><label for="' + name + '-' + o.value + '">' + o.label + '</label></div>'
  ).join('');

  // 绑定互斥逻辑
  const q = config.customScreening.find(q => 'cs-q' + config.customScreening.indexOf(q) === cid || q.id === cid);
  const qIdx = parseInt(cid.replace('cs-q', ''));
  const question = config.customScreening[qIdx];
  if (question && question.mutexWith) {
    c.addEventListener('change', function() {
      const mutex = question.mutexWith;
      const checked = Array.from(c.querySelectorAll('input:checked')).map(el => el.value);
      if (checked.indexOf(mutex.value) !== -1) {
        // 选了互斥值，取消其他
        c.querySelectorAll('input').forEach(el => {
          if (el.value !== mutex.value) el.checked = false;
        });
      } else {
        // 选了其他，取消互斥值
        const mutexEl = c.querySelector('input[value="' + mutex.value + '"]');
        if (mutexEl) mutexEl.checked = false;
      }
    });
  }
}

// 获取多选值
function getCheckboxValues(name) {
  return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(el => el.value);
}

// 获取文本输入值
function getTextValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// 设置条件显示
function setupConditionalDisplay() {
  config.customScreening.forEach((q, i) => {
    if (!q.showIf) return;
    const triggerIdx = config.customScreening.findIndex(qq => qq.id === q.showIf.questionId);
    if (triggerIdx === -1) return;
    const triggerQ = config.customScreening[triggerIdx];
    const triggerInputId = 'cs-q' + triggerIdx;

    const updateVisibility = () => {
      let triggerVal;
      if (triggerQ.type === 'radio') {
        const el = document.querySelector('input[name="' + triggerInputId + '"]:checked');
        triggerVal = el ? el.value : null;
      } else if (triggerQ.type === 'checkbox') {
        triggerVal = getCheckboxValues(triggerInputId);
      } else {
        triggerVal = getTextValue(triggerInputId);
      }

      const targetEl = document.getElementById('cs-item-' + i);
      if (!targetEl) return;
      const showVals = q.showIf.value;
      let shouldShow = false;
      if (Array.isArray(triggerVal)) {
        // checkbox: 如果任一选中值在showVals中则显示
        shouldShow = triggerVal.some(v => showVals.indexOf(v) !== -1);
      } else {
        shouldShow = showVals.indexOf(triggerVal) !== -1;
      }
      targetEl.style.display = shouldShow ? '' : 'none';
    };

    // 绑定触发器的变化事件
    if (triggerQ.type === 'radio') {
      document.querySelectorAll('input[name="cs-q' + triggerIdx + '"]').forEach(el => {
        el.addEventListener('change', updateVisibility);
      });
    } else if (triggerQ.type === 'checkbox') {
      document.querySelectorAll('input[name="cs-q' + triggerIdx + '"]').forEach(el => {
        el.addEventListener('change', updateVisibility);
      });
    } else {
      const el = document.getElementById('cs-q' + triggerIdx);
      if (el) el.addEventListener('input', updateVisibility);
    }
  });
}

// ==================== CONFIRM FLOW ====================
function showConfirmPage(token) {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('questionnaire-page').style.display = 'none';
  document.getElementById('results-page').style.display = 'none';
  document.getElementById('confirm-page').style.display = '';

  fetchJSONWithTimeout(SUBMIT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', token: token }),
  }, 15000).then(function (res) {
    if (!res || !res.ok) { showConfirmState('error'); return; }
    if (res.status === 'confirmed') {
      var detail = document.getElementById('confirm-success-detail');
      var msg = '';
      if (res.name) msg += '<strong>' + res.name + '</strong>，';
      if (res.date) msg += '您预约的 <strong>' + res.date + '</strong> 的实验已确认。';
      else msg += '您的预约已确认成功。';
      detail.innerHTML = msg;
      showConfirmState('success');
    } else if (res.status === 'already') {
      showConfirmState('already');
    } else if (res.status === 'not-found') {
      showConfirmState('not-found');
    } else {
      showConfirmState('error');
    }
  }).catch(function () {
    showConfirmState('error');
  });
}

function showConfirmState(state) {
  var states = ['loading', 'success', 'already', 'not-found', 'error'];
  states.forEach(function (s) {
    var el = document.getElementById('confirm-' + s);
    if (el) el.style.display = (s === state) ? '' : 'none';
  });
}

// ==================== RENDERING ====================
function renderRadioGroup(cid, name, opts) {
  const c = document.getElementById(cid);
  if (!c) return;
  c.innerHTML = opts.map(o =>
    '<div class="radio-option"><input type="radio" name="' + name +
    '" id="' + name + '-' + o.value + '" value="' + o.value +
    '"><label for="' + name + '-' + o.value + '">' + o.label + '</label></div>'
  ).join('');
}

function renderPSQI() {
  const c = document.getElementById('psqi-q5-items');
  c.innerHTML = PSQI_Q5.map((it, i) => {
    let extra = '';
    if (it.key === 'q5j') {
      extra = '<input type="text" class="form-input" id="psqi-q5j-detail" placeholder="请简要说明其他原因" style="margin-top:8px;display:none">';
    }
    return '<div class="q-item"><label class="form-label"><span class="q-item-number">' + (i + 5) + '.</span> ' + it.text + '</label><div class="radio-group" id="psqi-' + it.key + '"></div>' + extra + '</div>';
  }).join('');
  PSQI_Q5.forEach(it => renderRadioGroup('psqi-' + it.key, 'psqi-' + it.key, FREQ03));
  document.querySelectorAll('input[name="psqi-q5j"]').forEach(r => {
    r.addEventListener('change', () => {
      const det = document.getElementById('psqi-q5j-detail');
      det.style.display = r.value > 0 ? 'block' : 'none';
    });
  });
  renderRadioGroup('psqi-q6', 'psqi-q6', FREQ03);
  renderRadioGroup('psqi-q7', 'psqi-q7', FREQ03);
  renderRadioGroup('psqi-q8', 'psqi-q8', [{value:0,label:'没有困难'},{value:1,label:'一点困难'},{value:2,label:'比较困难'},{value:3,label:'很大困难'}]);
  renderRadioGroup('psqi-q9', 'psqi-q9', [{value:0,label:'很好'},{value:1,label:'较好'},{value:2,label:'较差'},{value:3,label:'很差'}]);
}

function renderISI() {
  const c = document.getElementById('isi-items');
  c.innerHTML = ISI_Q.map((q, i) =>
    '<div class="q-item"><label class="form-label"><span class="q-item-number">' + (i + 1) + '.</span> ' + q.text + '</label><div class="radio-group" id="isi-q' + i + '"></div></div>'
  ).join('');
  ISI_Q.forEach((q, i) => renderRadioGroup('isi-q' + i, 'isi-q' + i, q.options.map((l, v) => ({value: v, label: l}))));
}

function renderDASS() {
  const c = document.getElementById('dass-items');
  c.innerHTML = DASS_DISPLAY.map((item, di) =>
    '<div class="q-item"><label class="form-label"><span class="q-item-number">' + (di + 1) + '.</span> ' + item.text + '</label><div class="radio-group" id="dass-q' + di + '"></div></div>'
  ).join('');
  DASS_DISPLAY.forEach((_, di) => renderRadioGroup('dass-q' + di, 'dass-q' + di, DASS_OPT));
}

function renderRMEQ() {
  const c = document.getElementById('rmeq-items');
  if (!c) return;
  c.innerHTML = RMEQ_Q.map((q, i) =>
    '<div class="q-item"><label class="form-label"><span class="q-item-number">' + (i + 1) + '.</span> ' + q.text + '</label><div class="radio-group" id="rmeq-q' + i + '"></div></div>'
  ).join('');
  RMEQ_Q.forEach((q, i) => renderRadioGroup('rmeq-q' + i, 'rmeq-q' + i, q.options));
}

function renderHabit() {
  if (!config || !config.habitQuestions) return;
  config.habitQuestions.forEach((q, i) => {
    renderRadioGroup('habit-q' + i, 'habit-q' + i, q.options);
    if (q.hasDetail) {
      document.querySelectorAll('input[name="habit-q' + i + '"]').forEach(r => {
        r.addEventListener('change', () => {
          const det = document.getElementById('habit-q' + i + '-detail');
          if (det) det.style.display = r.value > 0 ? 'block' : 'none';
        });
      });
    }
  });
  renderRadioGroup('habit-dye', 'habit-dye', [{value:0,label:'否'},{value:1,label:'是'}]);
  // 互斥逻辑
  const noneBox = document.getElementById('habit-q5e');
  const otherBoxes = ['habit-q5a','habit-q5b','habit-q5c','habit-q5d'].map(id => document.getElementById(id));
  if (noneBox) {
    noneBox.addEventListener('change', () => {
      if (noneBox.checked) otherBoxes.forEach(b => { if (b) b.checked = false; });
    });
  }
  otherBoxes.forEach(b => {
    if (b) b.addEventListener('change', () => {
      if (b.checked && noneBox) noneBox.checked = false;
    });
  });
}

function renderScheduleTimeline(cfg) {
  const el = document.getElementById('schedule-timeline');
  if (!el || !cfg.guide) { if (el) el.style.display = 'none'; return; }
  const summary = cfg.guide.scheduleSummary;
  if (!summary || summary.length === 0) { el.style.display = 'none'; return; }
  let h = '<h4>📅 实验时间安排</h4><ul class="mini-timeline">';
  summary.forEach(s => { h += '<li><span class="mt-desc">' + s + '</span></li>'; });
  h += '</ul>';
  el.innerHTML = h;
  el.style.display = 'block';
}

// ==================== NAVIGATION ====================
// 根据项目配置显示/隐藏基本信息页的手机号、微信号字段
function applyBasicContactVisibility() {
  const show = basicContactEnabled() ? '' : 'none';
  ['f-phone', 'f-wechat'].forEach(id => {
    const el = document.getElementById(id);
    const group = el && el.closest('.form-group');
    if (group) group.style.display = show;
  });
}

function selectExperiment(id) {
  selectedExpId = id;
  config = PROJECT_CONFIGS[id];
  if (!config) return;
  activeSteps = config.steps.slice();
  applyBasicContactVisibility();

  document.getElementById('q-exp-badge').className = 'exp-type-badge ' + config.type;
  document.getElementById('q-exp-badge').textContent = (config.typeIcon || '') + ' ' + (config.typeLabel || config.type);
  document.getElementById('q-exp-title').textContent = config.title;
  renderScheduleTimeline(config);

  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('questionnaire-page').style.display = 'block';
  document.getElementById('results-page').style.display = 'none';
  showStep(0);
}

function backToLanding() {
  window.location.replace('../participate.html');
}

function showStep(step) {
  currentStep = step;
  document.querySelectorAll('.q-step-panel').forEach(p => p.classList.remove('active'));
  const stepType = activeSteps[step];
  const panelId = STEP_PANEL_MAP[stepType];
  if (panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
  }
  renderProgress();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

function renderProgress() {
  const c = document.getElementById('step-progress');
  const pos = currentStep;
  let h = '';
  activeSteps.forEach((stepName, i) => {
    const done = i < pos, active = i === pos;
    const label = STEP_LABELS[stepName] || stepName;
    h += '<div class="step-circle ' + (done ? 'done' : '') + ' ' + (active ? 'active' : '') + '" title="' + label + '">' + (done ? '✓' : (i + 1)) + '</div>';
    if (i < activeSteps.length - 1) h += '<div class="step-line ' + (done ? 'done' : '') + '"></div>';
  });
  c.innerHTML = h;
}

async function goNext() {
  if (!validateStep(currentStep)) return;
  const exit = earlyExitReason(currentStep);
  if (exit) { reportEarlyExit(exit); showEarlyExit(exit); return; }

  // step 1（基本信息）通过后，向服务端检查重复
  if (currentStepType() === 'basicInfo') {
    const btn = document.querySelector('#step-1 .btn-primary');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '检查中...';
    try {
      const r = await checkDuplicateOnServer();
      if (r.duplicate) {
        var el = document.getElementById('err-duplicate');
        if (el) {
          var fieldLabel = r.dupField === 'name' ? '姓名' : r.dupField === 'email' ? '邮箱' : r.dupField === 'phone' ? '手机号' : r.dupField === 'wechat' ? '微信号' : '信息';
          el.textContent = '该' + fieldLabel + '已被使用，请勿重复报名。如有疑问请联系 xsleeplab@hotmail.com';
        }
        showErr('err-duplicate');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  if (currentStep === activeSteps.length - 1) { submitQuestionnaire(); return; }
  showStep(currentStep + 1);
}

function goPrev() {
  if (currentStep > 0) showStep(currentStep - 1);
  else backToLanding();
}

// ==================== 提前退出 ====================
function visionFailReason() {
  const s = config.screening;
  const n = id => parseInt(document.getElementById(id).value) || 0;
  const astigDeg = n('vision-astigmatism-degree');
  if (astigDeg >= (s.visionAstigmatismMax || 100)) return '散光度数达到或超过 ' + (s.visionAstigmatismMax || 100) + ' 度';
  if (n('vision-left-myopia') >= (s.visionMyopiaMax || 800) || n('vision-right-myopia') >= (s.visionMyopiaMax || 800))
    return '近视度数达到或超过 ' + (s.visionMyopiaMax || 800) + ' 度';
  if (n('vision-left-hyperopia') >= (s.visionHyperopiaMax || 200) || n('vision-right-hyperopia') >= (s.visionHyperopiaMax || 200))
    return '远视度数达到或超过 ' + (s.visionHyperopiaMax || 200) + ' 度';
  return '视力条件不符合本实验要求';
}

function habitFailReason() {
  if (getRadio('habit-q0') > 1) return '在陌生环境中入睡较为困难';
  if (getRadio('habit-q1') > 1) return '对睡眠环境中的声音较为敏感';
  if (getRadio('habit-q2') > 1) return '对皮肤异物感较为敏感（脑电帽佩戴时间较长）';
  if (getRadio('habit-q3') !== 0) return '本实验要求参与者从不吸烟';
  if (getRadio('habit-q4') !== 0) return '近期服用过助眠或精神类药物';
  return '存在可能影响睡眠记录的健康状况';
}

function earlyExitReason(step) {
  const stepType = activeSteps[step];
  const s = config.screening;

  if (stepType === 'basicInfo') {
    const age = parseInt(document.getElementById('f-age').value);
    if (!isNaN(age) && (age < s.ageMin || age > s.ageMax))
      return { where: '年龄', why: '本实验招募 ' + s.ageMin + '–' + s.ageMax + ' 岁的参与者' };
  }
  if (stepType === 'vision' && visionRequired() && !checkVisionPass())
    return { where: '视力', why: visionFailReason() };
  if (stepType === 'habit') {
    if (s.dyeCheck && !checkDyePass())
      return { where: '染发', why: '三个月内染过头发', dye: true };
    if (!checkHabitPass())
      return { where: '环境适应', why: habitFailReason() };
  }
  if (stepType === 'customScreening') {
    const reason = customScreeningFailReason();
    if (reason)
      return { where: '健康筛查', why: reason };
  }
  return null;
}

function showEarlyExit(exit) {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('questionnaire-page').style.display = 'none';
  document.getElementById('results-page').style.display = 'block';
  document.getElementById('result-pass').style.display = 'none';
  document.getElementById('result-fail').style.display = 'block';

  const reason = document.getElementById('fail-reason');
  if (reason) {
    reason.style.display = 'block';
    document.getElementById('fail-reason-text').textContent = exit.why + '，因此无法参加本次实验。';
  }
  const dyeNote = document.getElementById('fail-dye-note');
  if (dyeNote) {
    dyeNote.style.display = exit.dye ? 'block' : 'none';
    if (exit.dye) document.getElementById('fail-dye-text').textContent =
      '距上次染发满三个月后，欢迎您再次报名。';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== VALIDATION ====================
function validateStep(step) {
  clearErrors();
  let v = true;
  const stepType = activeSteps[step];

  if (stepType === 'consent') {
    if (!document.getElementById('consent-check').checked) { showErr('err-consent'); v = false; }
  }

  if (stepType === 'basicInfo') {
    if (!document.getElementById('f-name').value.trim()) { showErr('err-name'); v = false; }
    if (basicContactEnabled()) {
      const ph = document.getElementById('f-phone').value.trim();
      if (!ph || ph.length < 11) { showErr('err-phone'); v = false; }
      if (!document.getElementById('f-wechat').value.trim()) { showErr('err-wechat'); v = false; }
    }
    const em = document.getElementById('f-email').value.trim();
    if (!em || !em.includes('@')) { showErr('err-email'); v = false; }
    const ag = document.getElementById('f-age').value;
    if (!ag || ag < 16 || ag > 80) { showErr('err-age'); v = false; }
    if (!document.querySelector('input[name="gender"]:checked')) { showErr('err-gender'); v = false; }
  }

  if (stepType === 'vision') {
    const lm = parseInt(document.getElementById('vision-left-myopia').value);
    const rm = parseInt(document.getElementById('vision-right-myopia').value);
    const lh = parseInt(document.getElementById('vision-left-hyperopia').value) || 0;
    const rh = parseInt(document.getElementById('vision-right-hyperopia').value) || 0;
    const astigDeg = document.getElementById('vision-astigmatism-degree');
    const glasses = document.querySelector('input[name="vision-glasses"]:checked');
    if (isNaN(lm) || isNaN(rm) || isNaN(lh) || isNaN(rh) || !astigDeg || astigDeg.value === '' || !glasses) {
      showErr('err-vision'); v = false;
    }
  }

  if (stepType === 'habit') {
    const qCount = config.habitQuestions ? config.habitQuestions.length : 0;
    for (let i = 0; i < qCount; i++) {
      if (!document.querySelector('input[name="habit-q' + i + '"]:checked')) {
        showErr('err-habit'); v = false; break;
      }
    }
    if (v) {
      const q5 = document.querySelectorAll('#habit-q5 input:checked');
      if (q5.length === 0) { showErr('err-habit'); v = false; }
    }
    if (config.screening.dyeCheck && !document.querySelector('input[name="habit-dye"]:checked')) {
      showErr('err-dye'); v = false;
    }
  }

  if (stepType === 'customScreening') {
    if (config.customScreening) {
      for (let i = 0; i < config.customScreening.length; i++) {
        const q = config.customScreening[i];
        // 跳过隐藏的条件题
        const itemEl = document.getElementById('cs-item-' + i);
        if (itemEl && itemEl.style.display === 'none') continue;

        if (q.type === 'radio') {
          if (!document.querySelector('input[name="cs-q' + i + '"]:checked')) {
            showErr('err-custom-screening'); v = false; break;
          }
        } else if (q.type === 'checkbox') {
          if (!document.querySelector('input[name="cs-q' + i + '"]:checked')) {
            showErr('err-custom-screening'); v = false; break;
          }
        } else if (q.type === 'text') {
          const val = getTextValue('cs-q' + i);
          if (q.required && !val) {
            showErr('err-custom-screening'); v = false; break;
          }
        }
      }
    }
  }

  if (stepType === 'psqi') {
    const q2 = document.getElementById('psqi-q2').value, q4 = document.getElementById('psqi-q4').value;
    if (!q2 || !q4) { showErr('err-psqi'); v = false; }
    if (v) {
      for (const k of [...PSQI_Q5.map(i => i.key), 'q6', 'q7', 'q8', 'q9']) {
        if (!document.querySelector('input[name="psqi-' + k + '"]:checked')) {
          showErr('err-psqi'); v = false; break;
        }
      }
    }
  }

  if (stepType === 'isi') {
    for (let i = 0; i < ISI_Q.length; i++) {
      if (!document.querySelector('input[name="isi-q' + i + '"]:checked')) {
        showErr('err-isi'); v = false; break;
      }
    }
  }

  if (stepType === 'rmeq') {
    for (let i = 0; i < RMEQ_Q.length; i++) {
      if (!document.querySelector('input[name="rmeq-q' + i + '"]:checked')) {
        showErr('err-rmeq'); v = false; break;
      }
    }
  }

  if (stepType === 'dass') {
    for (let i = 0; i < DASS_DISPLAY.length; i++) {
      if (!document.querySelector('input[name="dass-q' + i + '"]:checked')) {
        showErr('err-dass'); v = false; break;
      }
    }
  }

  if (!v) {
    const e = document.querySelector('.form-error.show');
    if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return v;
}

// ==================== SCORING ====================
function scorePSQI() {
  const c1 = getRadio('psqi-q9');
  const lat = parseFloat(document.getElementById('psqi-q2').value) || 0;
  const q2s = lat <= 15 ? 0 : lat <= 30 ? 1 : lat <= 60 ? 2 : 3;
  const s2 = q2s + getRadio('psqi-q5a'); const c2 = s2 === 0 ? 0 : s2 <= 2 ? 1 : s2 <= 4 ? 2 : 3;
  const hrs = parseFloat(document.getElementById('psqi-q4').value) || 0;
  const c3 = hrs > 7 ? 0 : hrs >= 6 ? 1 : hrs >= 5 ? 2 : 3;
  let bt = parseTime(document.getElementById('psqi-q1').value || '23:00');
  let wt = parseTime(document.getElementById('psqi-q3').value || '07:00');
  if (wt <= bt) wt += 24; const tib = wt - bt; const eff = tib > 0 ? (hrs / tib) * 100 : 0;
  const c4 = eff >= 85 ? 0 : eff >= 75 ? 1 : eff >= 65 ? 2 : 3;
  const dk = ['q5b','q5c','q5d','q5e','q5f','q5g','q5h','q5i','q5j'];
  const ds = dk.reduce((s, k) => s + getRadio('psqi-' + k), 0);
  const c5 = ds === 0 ? 0 : ds <= 9 ? 1 : ds <= 18 ? 2 : 3;
  const c6 = getRadio('psqi-q6');
  const dy = getRadio('psqi-q7') + getRadio('psqi-q8');
  const c7 = dy === 0 ? 0 : dy <= 2 ? 1 : dy <= 4 ? 2 : 3;
  return c1 + c2 + c3 + c4 + c5 + c6 + c7;
}

function scoreISI() {
  let t = 0;
  for (let i = 0; i < ISI_Q.length; i++) {
    const e = document.querySelector('input[name="isi-q' + i + '"]:checked');
    if (e) t += parseInt(e.value);
  }
  return t;
}

function scoreRMEQ() {
  let t = 0;
  for (let i = 0; i < RMEQ_Q.length; i++) {
    const e = document.querySelector('input[name="rmeq-q' + i + '"]:checked');
    if (e) t += parseInt(e.value);
  }
  return t;
}

function chronotypeLabel(s) {
  if (s <= 7)  return '明显夜晚型';
  if (s <= 11) return '中度夜晚型';
  if (s <= 17) return '中间型';
  if (s <= 21) return '中度清晨型';
  return '明显清晨型';
}

function checkChronotypePass() {
  const s = scoreRMEQ();
  const sc = config.screening;
  return s >= sc.rmeqMin && s <= sc.rmeqMax;
}

function scoreDASS() {
  const di = [2,4,9,13,17,18,22], ai = [1,3,6,8,15,20,21], si = [0,5,7,11,12,14,19];
  const gv = i => { const e = document.querySelector('input[name="dass-q' + i + '"]:checked'); return e ? parseInt(e.value) : 0; };
  return {
    depression: di.reduce((s, i) => s + gv(i), 0) * 2,
    anxiety: ai.reduce((s, i) => s + gv(i), 0) * 2,
    stress: si.reduce((s, i) => s + gv(i), 0) * 2,
  };
}

function checkLiePass() {
  const gv = i => { const e = document.querySelector('input[name="dass-q' + i + '"]:checked'); return e ? parseInt(e.value) : -1; };
  for (let di = 0; di < DASS_DISPLAY.length; di++) {
    const item = DASS_DISPLAY[di];
    if (item.type !== 'lie') continue;
    const v = gv(di);
    if (item.check === 'attention' && v !== 1) return false;
    if (item.check === 'impossible' && v >= 2) return false;
  }
  return true;
}

function checkHabitPass() {
  if (!config.habitQuestions) return true;
  const q0 = getRadio('habit-q0'); if (q0 > 1) return false;
  const q1 = getRadio('habit-q1'); if (q1 > 1) return false;
  const q2 = getRadio('habit-q2'); if (q2 > 1) return false;
  const q3 = getRadio('habit-q3'); if (q3 !== 0) return false;
  const q4 = getRadio('habit-q4'); if (q4 !== 0) return false;
  const conditions = Array.from(document.querySelectorAll('#habit-q5 input:checked'))
    .filter(e => e.id !== 'habit-q5e');
  if (conditions.length > 0) return false;
  return true;
}

function checkAgePass() {
  const age = parseInt(document.getElementById('f-age').value);
  const s = config.screening;
  return !isNaN(age) && age >= s.ageMin && age <= s.ageMax;
}

function checkDyePass() {
  const group = document.querySelector('input[name="habit-dye"]');
  // 本项目没有 habit 步骤（如 emotion-memory 用 customScreening Q12 做染发筛查）时，
  // 基于 habit-dye 的检查不适用，直接放行，避免误判。
  if (!group) return true;
  const e = document.querySelector('input[name="habit-dye"]:checked');
  return !!e && parseInt(e.value) === 0;
}

function checkVisionPass() {
  const s = config.screening;
  const lm = parseInt(document.getElementById('vision-left-myopia').value) || 0;
  const rm = parseInt(document.getElementById('vision-right-myopia').value) || 0;
  const lh = parseInt(document.getElementById('vision-left-hyperopia').value) || 0;
  const rh = parseInt(document.getElementById('vision-right-hyperopia').value) || 0;
  const astigDeg = parseInt(document.getElementById('vision-astigmatism-degree').value) || 0;
  if (lm >= s.visionMyopiaMax || rm >= s.visionMyopiaMax) return false;
  if (lh >= s.visionHyperopiaMax || rh >= s.visionHyperopiaMax) return false;
  if (astigDeg >= s.visionAstigmatismMax) return false;
  return true;
}

function checkCustomScreeningPass() {
  if (!config.customScreening) return true;
  for (let i = 0; i < config.customScreening.length; i++) {
    const q = config.customScreening[i];

    // 跳过隐藏的条件题
    const itemEl = document.getElementById('cs-item-' + i);
    if (itemEl && itemEl.style.display === 'none') continue;

    if (q.type === 'radio') {
      const val = getRadioStr('cs-q' + i);
      if (q.failIf && q.failIf.indexOf(val) !== -1) return false;
      if (q.passIf && q.passIf.indexOf(val) === -1) return false;
    } else if (q.type === 'checkbox') {
      const vals = getCheckboxValues('cs-q' + i);
      if (q.passIf) {
        // passIf: 必须只选了这些值
        if (vals.length === 0) return false;
        const allPass = vals.every(v => q.passIf.indexOf(v) !== -1);
        if (!allPass) return false;
      }
      if (q.failIf) {
        const anyFail = vals.some(v => q.failIf.indexOf(v) !== -1);
        if (anyFail) return false;
      }
      if (q.mutexWith) {
        // 互斥检查：如果选了mutexWith.value，就不能选others
        if (vals.indexOf(q.mutexWith.value) !== -1 && vals.length > 1) return false;
        // 如果选了others中的任何一个，就不能选mutexWith.value
        const hasOther = vals.some(v => q.mutexWith.others.indexOf(v) !== -1);
        if (hasOther && vals.indexOf(q.mutexWith.value) !== -1) return false;
      }
    } else if (q.type === 'text') {
      const val = getTextValue('cs-q' + i);
      if (q.required && !val) return false;
      if (q.failIfEmpty && !val) return false;
    }
  }
  return true;
}

function customScreeningFailReason() {
  if (!config.customScreening) return null;
  for (let i = 0; i < config.customScreening.length; i++) {
    const q = config.customScreening[i];

    // 跳过隐藏的条件题
    const itemEl = document.getElementById('cs-item-' + i);
    if (itemEl && itemEl.style.display === 'none') continue;

    if (q.type === 'radio') {
      const val = getRadioStr('cs-q' + i);
      if (q.failIf && q.failIf.indexOf(val) !== -1) return q.text;
      if (q.passIf && val && q.passIf.indexOf(val) === -1) return q.text;
    } else if (q.type === 'checkbox') {
      const vals = getCheckboxValues('cs-q' + i);
      if (q.passIf && vals.length > 0) {
        const allPass = vals.every(v => q.passIf.indexOf(v) !== -1);
        if (!allPass) return q.text;
      }
      if (q.failIf) {
        const anyFail = vals.some(v => q.failIf.indexOf(v) !== -1);
        if (anyFail) return q.text;
      }
    } else if (q.type === 'text') {
      const val = getTextValue('cs-q' + i);
      if (q.failIfEmpty && !val) return q.text;
    }
  }
  return null;
}

// 获取radio的字符串值（不parseInt）
function getRadioStr(name) {
  const e = document.querySelector('input[name="' + name + '"]:checked');
  return e ? e.value : '';
}

function checkBedtimeDeadline() {
  const deadline = config.screening.psqiBedtimeDeadline;
  if (!deadline) return true;
  const bedtime = document.getElementById('psqi-q1').value;
  if (!bedtime) return true;
  return bedtime <= deadline;
}

// ==================== SUBMIT ====================
function submitQuestionnaire() {
  if (!validateStep(currentStep)) return;
  const s = config.screening;
  const psqi = scorePSQI(), isi = scoreISI(), dass = scoreDASS();
  const habitPass = checkHabitPass();
  const visionPass = !visionRequired() || checkVisionPass();
  const chronoPass = checkChronotypePass();
  const dyePass = !s.dyeCheck || checkDyePass();
  const agePass = checkAgePass();
  const liePass = checkLiePass();
  const customPass = checkCustomScreeningPass();
  const dassPass = dass.depression <= s.dassDepressionMax &&
                   dass.anxiety <= s.dassAnxietyMax &&
                   dass.stress <= s.dassStressMax;

  const passed = psqi <= s.psqiMax && isi <= s.isiMax && dassPass &&
    habitPass && visionPass && chronoPass && agePass && dyePass && liePass && customPass;

  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('questionnaire-page').style.display = 'none';
  document.getElementById('results-page').style.display = 'block';

  if (passed) {
    document.getElementById('result-pass').style.display = 'block';
    document.getElementById('result-fail').style.display = 'none';
    document.getElementById('confirm-name').value = document.getElementById('f-name').value;
    document.getElementById('confirm-email').value = document.getElementById('f-email').value;
    document.getElementById('confirm-phone').value = document.getElementById('f-phone').value;
    document.getElementById('pass-exp-desc').textContent =
      '您的睡眠状况符合「' + config.title + '」的筛选要求。以下是该实验的详细指引。';
    renderGuide(config);
    loadSlots();
  } else {
    document.getElementById('result-pass').style.display = 'none';
    document.getElementById('result-fail').style.display = 'block';
    const reasonBox = document.getElementById('fail-reason');
    if (reasonBox) reasonBox.style.display = 'none';
    const record = collectSubmission();
    record.outcome = 'failed';
    postOutcome(record);
    const dyeNote = document.getElementById('fail-dye-note');
    if (dyeNote) {
      dyeNote.style.display = dyePass ? 'none' : 'block';
      if (!dyePass) {
        document.getElementById('fail-dye-text').textContent =
          (psqi <= s.psqiMax && isi <= s.isiMax && dassPass && habitPass && visionPass && chronoPass && agePass && liePass && customPass)
          ? '您其他各项均符合筛选要求。请在距上次染发满三个月后再来报名，我们很期待您的参与。'
          : '距上次染发满三个月后，欢迎您再次报名。';
      }
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderGuide(cfg) {
  const g = cfg.guide;
  const c = document.getElementById('guide-container');
  let h = '';

  h += '<div class="guide-section"><h3>实验流程</h3><p>' + (g.intro || cfg.brief) + '</p><div class="timeline">';
  (g.timeline || []).forEach(t => {
    h += '<div class="timeline-item"><div class="timeline-time">' + t.time + '</div><div class="timeline-desc">' + t.desc + '</div></div>';
  });
  h += '</div></div>';

  h += '<div class="guide-section"><h3>脑电图（EEG）说明</h3><p>实验过程中将使用脑电图（EEG）设备无创地记录您的脑电活动。您需要佩戴一个特制的电极帽，帽中的导电凝胶用于连接头皮与电极。EEG 记录完全无创，没有已知危险。实验结束后您可以在实验室洗漱后再离开，我们提供洗发水和吹风机。</p></div>';

  h += '<div class="guide-section"><h3>您需要准备什么？</h3><ul class="prep-list">';
  (g.prep || []).forEach(p => { h += '<li>' + p + '</li>'; });
  h += '</ul>';
  if (cfg.email && cfg.email.breakfastNote) {
    h += '<p style="margin-top:16px;color:var(--color-text-light);font-size:0.9rem">' + cfg.email.breakfastNote + '</p>';
  }
  h += '</div>';

  h += '<div class="guide-section"><h3>实验地点与交通</h3><div class="location-card"><div class="location-info"><p><strong>睡眠认知神经科学实验室</strong></p><p>北京市朝阳区林萃路16号 中国科学院心理研究所 和谐楼（南楼）829室</p><p style="margin-top:12px"><strong>如何到达：</strong></p><p>奥运村西公交站 / 北沙滩地铁站（B2东北口）。到达后请联系实验人员。</p><p style="margin-top:12px"><strong>联系方式：</strong></p><p>邮箱：xsleeplab@hotmail.com</p></div><div class="location-map"><iframe src="https://uri.amap.com/marker?position=116.3658,40.0036&name=X-Sleep Lab 睡眠实验室&src=xsleeplab&coordinate=gaode&callnative=0" width="100%" height="100%" style="border:0;border-radius:var(--radius-sm)" loading="lazy"></iframe></div></div></div>';

  c.innerHTML = h;
}

// ==================== 数据收集 ====================
function collectSubmission() {
  const val = id => ((document.getElementById(id) || {}).value || '');
  const s = config.screening;
  const psqi = scorePSQI(), isi = scoreISI(), rmeq = scoreRMEQ(), dass = scoreDASS();

  const liePass = checkLiePass();
  const visionNeeded = visionRequired();
  const visionPass = !visionNeeded || checkVisionPass();
  const habitPass = checkHabitPass();
  const chronoPass = checkChronotypePass();
  const dyePass = !s.dyeCheck || checkDyePass();
  const customPass = checkCustomScreeningPass();
  const dassPass = dass.depression <= s.dassDepressionMax &&
                   dass.anxiety <= s.dassAnxietyMax &&
                   dass.stress <= s.dassStressMax;

  const astigDeg = document.getElementById('vision-astigmatism-degree');
  const glassesEl = document.querySelector('input[name="vision-glasses"]:checked');
  const flexEl = document.querySelector('input[name="flexibility"]:checked');

  // Habit answers (only if habit step is active)
  let habitAnswers = [];
  let conditions = [];
  const habitLabels = ['环境适应', '声音敏感', '皮肤敏感', '吸烟情况', '药物使用'];
  if (config.habitQuestions) {
    habitAnswers = config.habitQuestions.map((q, i) => {
      let a = radioLabel('habit-q' + i);
      if (q.hasDetail) {
        const sel = document.querySelector('input[name="habit-q' + i + '"]:checked');
        const det = document.getElementById('habit-q' + i + '-detail');
        if (sel && parseInt(sel.value) > 0 && det && det.value.trim()) a += '（' + det.value.trim() + '）';
      }
      return { q: habitLabels[i] || q.text, a: a };
    });
    conditions = Array.from(document.querySelectorAll('#habit-q5 input:checked'))
      .filter(e => e.id !== 'habit-q5e').map(e => e.value);
  }

  const psqiOther = document.getElementById('psqi-q5j-detail');
  const psqiDetail = [
    { q: '上床时间', a: val('psqi-q1') || '未填' },
    { q: '入睡时长', a: (val('psqi-q2') || '未填') + ' 分钟' },
    { q: '起床时间', a: val('psqi-q3') || '未填' },
    { q: '实际睡眠', a: (val('psqi-q4') || '未填') + ' 小时' }
  ]
    .concat(PSQI_Q5.map(it => ({ q: it.text, a: radioLabel('psqi-' + it.key) })))
    .concat(psqiOther && psqiOther.value.trim() ? [{ q: '其他原因说明', a: psqiOther.value.trim() }] : [])
    .concat([
      { q: '助眠药物', a: radioLabel('psqi-q6') },
      { q: '日间困倦', a: radioLabel('psqi-q7') },
      { q: '保持热情', a: radioLabel('psqi-q8') },
      { q: '总体评价', a: radioLabel('psqi-q9') }
    ]);

  return {
    name:  (val('confirm-name')  || val('f-name')).trim(),
    email: (val('confirm-email') || val('f-email')).trim(),
    phone: (val('confirm-phone') || val('f-phone')).trim(),
    wechat: val('f-wechat').trim(),
    project: { id: config.id, title: config.title, typeLabel: config.typeLabel },
    projectId: config.id,
    age: document.getElementById('f-age').value,
    overallPass: psqi <= s.psqiMax && isi <= s.isiMax && chronoPass && visionPass &&
      habitPass && dassPass && dyePass && checkAgePass() && liePass && customPass,
    scores: {
      psqi: { total: psqi, threshold: '≤' + s.psqiMax, pass: psqi <= s.psqiMax },
      isi:  { total: isi,  threshold: '≤' + s.isiMax,  pass: isi <= s.isiMax },
      rmeq: { total: rmeq, threshold: s.rmeqMin + '–' + s.rmeqMax, pass: chronoPass, type: chronotypeLabel(rmeq) },
      dass: {
        depression: dass.depression, anxiety: dass.anxiety, stress: dass.stress,
        threshold: '抑郁≤' + s.dassDepressionMax + ' 焦虑≤' + s.dassAnxietyMax + ' 压力≤' + s.dassStressMax,
        pass: dassPass,
      },
      lie: { pass: liePass },
    },
    vision: visionNeeded ? {
      required: true,
      leftMyopia:     val('vision-left-myopia')      || '0',
      rightMyopia:    val('vision-right-myopia')     || '0',
      leftHyperopia:  val('vision-left-hyperopia')   || '0',
      rightHyperopia: val('vision-right-hyperopia')  || '0',
      astigmatism: astigDeg ? (parseInt(astigDeg.value) || 0) + '度' : '未填',
      glasses: glassesEl ? (glassesEl.value === '1' ? '是' : '否') : '未填',
      pass: visionPass,
    } : { required: false, pass: true },
    habit: {
      answers: habitAnswers.concat([
        { q: '三个月内染发', a: s.dyeCheck ? radioLabel('habit-dye') : '不适用' },
        { q: '平时起床时间', a: val('habit-wake-time') || '未填' }
      ]),
      conditions: conditions,
      pass: habitPass,
      dyePass: dyePass,
      wakeTime: val('habit-wake-time') || '',
    },
    customScreening: config.customScreening ? config.customScreening.map((q, i) => {
      const itemEl = document.getElementById('cs-item-' + i);
      const isVisible = !itemEl || itemEl.style.display !== 'none';
      let answer = '未填';
      if (isVisible) {
        if (q.type === 'radio') {
          answer = getRadioStr('cs-q' + i) || '未填';
        } else if (q.type === 'checkbox') {
          const vals = getCheckboxValues('cs-q' + i);
          answer = vals.length > 0 ? vals.join('、') : '未填';
        } else if (q.type === 'text') {
          answer = getTextValue('cs-q' + i) || '未填';
        }
      }
      return { id: q.id, q: q.text, a: answer, visible: isVisible };
    }) : [],
    detail: {
      psqi: psqiDetail,
      isi:  ISI_Q.map((q, i)  => ({ q: q.text, a: radioLabel('isi-q' + i) })),
      rmeq: RMEQ_Q.map((q, i) => ({ q: q.text, a: radioLabel('rmeq-q' + i) })),
      dass: DASS_DISPLAY.map((item, di) => ({ q: item.text, a: radioLabel('dass-q' + di), type: item.type })),
    },
    schedule: {
      days: Array.from(document.querySelectorAll('#avail-days input:checked')).map(e => e.value).join('、'),
      flexibility: flexEl ? flexEl.parentElement.textContent.trim() : '未填',
      earliest: val('earliest-date') || '未填',
      note: val('schedule-note').trim() || '无',
    },
  };
}

// ==================== 日历 ====================
function loadSlots() {
  const box = document.getElementById('cal-container');
  const picker = document.getElementById('slot-picker-card');
  chosenSlot = null;
  picker.style.display = 'block';
  picker.dataset.slotState = 'loading';
  box.innerHTML = '<p style="color:var(--color-text-light);font-size:0.92rem">正在载入可选日期…</p>';
  fetchJSONWithTimeout(SUBMIT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'slots', projectId: config.id }),
  }, SLOT_LOAD_TIMEOUT_MS)
    .then(d => {
      if (!d || !d.slots || !d.slots.length) {
        showSlotFallback('在线日历暂时不可用。您仍可提交报名，也可加入下方候补名单等待通知。');
        return;
      }
      calSlots = d.slots;
      calWindow = d.bookingWindow || 14;
      const now = new Date(Date.now() + 8 * 3600 * 1000);
      calViewYear = now.getUTCFullYear();
      calViewMonth = now.getUTCMonth();
      renderCalendar();
    })
    .catch(err => {
      console.error('[X-Sleep] 载入日历失败:', err);
      showSlotFallback(err && err.name === 'AbortError'
        ? '载入可选日期超时。您仍可提交报名，也可加入下方候补名单等待通知。'
        : '在线日历暂时不可用。您仍可提交报名，也可加入下方候补名单等待通知。');
    });
}

function waitlistHTML(expanded) {
  var formDisplay = expanded ? '' : 'none';
  var arrow = expanded ? '▾' : '▸';
  return '<div id="waitlist-section" style="margin-top:24px;border-top:1px solid var(--color-border);padding-top:20px">' +
    '<a href="javascript:void(0)" onclick="toggleWaitlistForm()" id="waitlist-toggle" ' +
    'style="display:flex;align-items:center;gap:6px;color:var(--color-primary);font-weight:600;font-size:0.95rem;cursor:pointer">' +
    '<span style="font-size:0.85em" id="waitlist-arrow">' + arrow + '</span> ' +
    '找不到合适的时间？加入候补名单</a>' +
    '<div id="waitlist-form-wrapper" style="display:' + formDisplay + ';margin-top:16px">' +
    '<p style="color:var(--color-text-light);font-size:0.9rem;margin-bottom:16px">留下您的联系方式，新时段开放时我们会第一时间邮件通知您，届时可通过邮件中的链接直接预约。</p>' +
    '<div id="waitlist-form">' +
    '<div class="form-group"><label class="form-label">姓名</label><input type="text" class="form-input" id="wl-name" placeholder="您的姓名"></div>' +
    '<div class="form-group"><label class="form-label">邮箱</label><input type="email" class="form-input" id="wl-email" placeholder="your@email.com"></div>' +
    '<div class="form-group"><label class="form-label">手机号</label><input type="tel" class="form-input" id="wl-phone" placeholder="手机号码"></div>' +
    '<div class="form-error" id="err-waitlist" style="display:none"></div>' +
    '<button class="btn btn-primary" onclick="submitWaitlist()" id="btn-waitlist">加入候补名单</button>' +
    '</div>' +
    '<div id="waitlist-success" style="display:none;text-align:center;padding:20px 0">' +
    '<div style="font-size:2.5rem;margin-bottom:12px">✅</div>' +
    '<h4 style="color:var(--color-success);margin-bottom:8px">已加入候补名单</h4>' +
    '<p style="color:var(--color-text-light);font-size:0.9rem">新时段开放时，我们会第一时间通知您。</p>' +
    '</div>' +
    '<div id="waitlist-duplicate" style="display:none;text-align:center;padding:20px 0">' +
    '<div style="font-size:2.5rem;margin-bottom:12px">🔔</div>' +
    '<h4 style="color:var(--color-primary);margin-bottom:8px">您已在候补名单中</h4>' +
    '<p style="color:var(--color-text-light);font-size:0.9rem">无需重复登记，我们会在新时段开放时通知您。</p>' +
    '</div>' +
    '</div></div>';
}

function toggleWaitlistForm() {
  var wrapper = document.getElementById('waitlist-form-wrapper');
  var arrow = document.getElementById('waitlist-arrow');
  if (!wrapper) return;
  if (wrapper.style.display === 'none') {
    wrapper.style.display = '';
    if (arrow) arrow.textContent = '▾';
  } else {
    wrapper.style.display = 'none';
    if (arrow) arrow.textContent = '▸';
  }
}

function showSlotFallback(message) {
  const picker = document.getElementById('slot-picker-card');
  const box = document.getElementById('cal-container');
  picker.dataset.slotState = 'fallback';
  box.innerHTML = '<p style="color:var(--color-text-light);font-size:0.92rem">' + message + '</p>' +
    waitlistHTML(true);
}

function submitWaitlist() {
  var name = (document.getElementById('wl-name').value || '').trim();
  var email = (document.getElementById('wl-email').value || '').trim();
  var phone = (document.getElementById('wl-phone').value || '').trim();
  var errEl = document.getElementById('err-waitlist');
  errEl.style.display = 'none';

  if (!name || !email) { errEl.textContent = '请填写姓名和邮箱'; errEl.style.display = ''; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = '请输入有效的邮箱地址'; errEl.style.display = ''; return; }

  var btn = document.getElementById('btn-waitlist');
  btn.disabled = true;
  btn.textContent = '提交中…';

  fetchJSONWithTimeout(SUBMIT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'waitlist', name: name, email: email, phone: phone }),
  }, 15000).then(function (res) {
    if (!res || !res.ok) {
      errEl.textContent = '提交失败，请稍后重试'; errEl.style.display = '';
      btn.disabled = false; btn.textContent = '加入候补名单'; return;
    }
    if (res.status === 'registered') {
      document.getElementById('waitlist-form').style.display = 'none';
      document.getElementById('waitlist-success').style.display = '';
    } else if (res.status === 'duplicate') {
      document.getElementById('waitlist-form').style.display = 'none';
      document.getElementById('waitlist-duplicate').style.display = '';
    } else if (res.status === 'unavailable') {
      errEl.textContent = '候补功能暂时不可用，请稍后重试'; errEl.style.display = '';
      btn.disabled = false; btn.textContent = '加入候补名单';
    } else {
      errEl.textContent = '提交失败，请稍后重试'; errEl.style.display = '';
      btn.disabled = false; btn.textContent = '加入候补名单';
    }
  }).catch(function () {
    errEl.textContent = '网络异常，请稍后重试'; errEl.style.display = '';
    btn.disabled = false; btn.textContent = '加入候补名单';
  });
}

function renderCalendar() {
  const box = document.getElementById('cal-container');
  const slotMap = {};
  calSlots.forEach(s => { slotMap[s.date] = s; });

  const year = calViewYear;
  const month = calViewMonth;
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstDay.getUTCDay();
  const todayIso = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

  const hasBookable = calSlots.some(s => s.status === '可预约' && s.booked < s.capacity);
  if (!hasBookable && !document.querySelector('.cal-cell.chosen')) {
    showSlotFallback('当前暂无可预约的时段。您可以加入下方的候补名单，新时段开放时我们会第一时间通知您。');
    return;
  }

  const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月',
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];

  let h = '';
  h += '<div class="cal-header">';
  h += '<button type="button" class="cal-nav" id="cal-prev" aria-label="上月">\u2039</button>';
  h += '<span class="cal-title">' + year + '年 ' + MONTH_NAMES[month] + '</span>';
  h += '<button type="button" class="cal-nav" id="cal-next" aria-label="下月">\u203a</button>';
  h += '</div>';

  h += '<div class="cal-weekdays">';
  WEEKDAYS_SHORT.forEach(w => { h += '<div class="cal-wd">' + w + '</div>'; });
  h += '</div>';

  h += '<div class="cal-grid">';
  for (let i = 0; i < startWeekday; i++) { h += '<div class="cal-cell empty"></div>'; }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const slot = slotMap[iso];
    const isToday = iso === todayIso;
    const wdId = (firstDay.getUTCDay() + d - 1) % 7;
    const wd = WEEKDAYS_SHORT[wdId];

    let cls = 'cal-cell';
    let statusText = '';
    let clickable = false;

    if (slot) {
      if (slot.status === '关闭') { cls += ' closed'; statusText = '关闭'; }
      else if (slot.booked >= slot.capacity) { cls += ' full'; statusText = '已约满'; }
      else if (chosenSlot === iso) { cls += ' chosen'; statusText = '已选择'; clickable = true; }
      else {
        cls += ' available';
        const remaining = slot.capacity - slot.booked;
        statusText = remaining > 1 ? '余 ' + remaining + ' 位' : '可预约';
        clickable = true;
      }
    } else {
      cls += ' disabled';
    }
    if (isToday) cls += ' today';

    h += '<div class="' + cls + '"' + (clickable ? ' data-date="' + iso + '"' : '') + '>';
    h += '<span class="cal-num">' + d + '</span>';
    h += '<span class="cal-wd-label">周' + wd + '</span>';
    if (statusText) h += '<span class="cal-status">' + statusText + '</span>';
    h += '</div>';
  }
  h += '</div>';

  h += '<div class="cal-legend">';
  h += '<span><i class="dot avail"></i> 可预约</span>';
  h += '<span><i class="dot full"></i> 已约满</span>';
  h += '<span><i class="dot closed"></i> 暂不开放</span>';
  h += '</div>';

  h += waitlistHTML(false);
  box.innerHTML = h;
  document.getElementById('slot-picker-card').dataset.slotState = 'ready';

  box.querySelectorAll('.cal-cell.available').forEach(cell => {
    cell.addEventListener('click', () => {
      box.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('chosen'));
      const date = cell.getAttribute('data-date');
      const slot = slotMap[date];
      if (slot) {
        const remaining = slot.capacity - slot.booked;
        cell.querySelector('.cal-status').textContent = remaining > 1 ? '余 ' + remaining + ' 位' : '可预约';
      }
      cell.classList.add('chosen');
      cell.querySelector('.cal-status').textContent = '已选择';
      chosenSlot = date;
      const err = document.getElementById('err-slot');
      if (err) err.classList.remove('show');
    });
  });

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const nowDate = new Date(Date.now() + 8 * 3600 * 1000);
  const curY = nowDate.getUTCFullYear(), curM = nowDate.getUTCMonth();
  prevBtn.disabled = (year === curY && month <= curM);
  const maxSlotDate = calSlots.length ? calSlots[calSlots.length - 1].date : '';
  if (maxSlotDate) {
    const maxParts = maxSlotDate.split('-').map(Number);
    const maxY = maxParts[0], maxM = maxParts[1] - 1;
    nextBtn.disabled = (year > maxY || (year === maxY && month >= maxM));
  }
  prevBtn.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderCalendar();
  });
}

// ==================== 提交与通信 ====================
function postOutcome(payload) {
  try {
    fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    console.error('[X-Sleep] 记录失败:', e);
  }
}

function reportEarlyExit(exit) {
  const v = id => ((document.getElementById(id) || {}).value || '').trim();
  postOutcome({
    outcome: 'early-exit',
    overallPass: false,
    name: v('f-name'), email: v('f-email'), phone: v('f-phone'), age: v('f-age'),
    project: { id: config.id, title: config.title, typeLabel: config.typeLabel },
    projectId: config.id,
    exit: { where: exit.where, why: exit.why },
  });
}

async function checkDuplicateOnServer() {
  const name   = (document.getElementById('f-name').value  || '').trim();
  const email  = (document.getElementById('f-email').value || '').trim();
  const phone  = (document.getElementById('f-phone').value || '').trim();
  const wechat = (document.getElementById('f-wechat').value || '').trim();
  if (!name && !email && !phone && !wechat) return { duplicate: false };
  try {
    var d = await fetchJSONWithTimeout(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkDuplicate', name: name, email: email, phone: phone, wechat: wechat, projectId: config.id }),
    }, 10000);
    return { duplicate: !!(d && d.duplicate), dupField: (d && d.dupField) || '' };
  } catch (e) {
    console.warn('[X-Sleep] dup check failed:', e);
    return { duplicate: false };
  }
}

function classifySubmissionResponse(data, requestedSlot) {
  const error = data && data.error ? data.error : '服务端未确认送达';
  const retryableSlotErrors = ['slot-taken', 'slot-closed', 'slot-not-found'];
  if (data && data.error === 'duplicate') return { kind: 'duplicate' };
  if (data && data.ok !== true && retryableSlotErrors.includes(error)) return { kind: 'retry', error: error };
  if (data && data.ok !== true && requestedSlot && /^slot-/.test(error)) return { kind: 'unknown', error: error };
  if (!data || data.ok !== true) return { kind: 'error', error: error };
  if (requestedSlot && data.booking !== requestedSlot) return { kind: 'unconfirmed' };
  if (requestedSlot && data.bookingStatus !== 'confirmed') {
    return { kind: data.notification === 'failed' ? 'pending-warning' : 'pending' };
  }
  if (data.notification === 'failed') return { kind: 'warning' };
  return { kind: 'confirmed' };
}

function sendEmail() {
  const btn = document.getElementById('btn-send-email');
  const st  = document.getElementById('email-status');
  const email = document.getElementById('confirm-email').value.trim();
  if (!email) { st.className = 'form-submit-status error'; st.textContent = '请输入邮箱地址'; return; }

  const picker = document.getElementById('slot-picker-card');
  const slotState = picker ? picker.dataset.slotState : 'fallback';
  if (slotState === 'loading') {
    st.className = 'form-submit-status pending';
    st.textContent = '可选时段仍在载入，请稍候再提交。';
    return;
  }
  if (slotState === 'ready' && !chosenSlot) {
    const err = document.getElementById('err-slot');
    if (err) err.classList.add('show');
    st.className = 'form-submit-status error';
    st.textContent = '请先在上方选择一个实验日期';
    return;
  }

  btn.disabled = true;
  btn.textContent = '提交中...';
  st.className = 'form-submit-status pending';
  st.textContent = '正在安全提交，请勿关闭页面或重复点击。';

  const submission = collectSubmission();
  submission.outcome = 'passed';
  const requestedSlot = chosenSlot;
  if (requestedSlot) submission.booking = { key: requestedSlot };

  fetchJSONWithTimeout(SUBMIT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  }, SUBMISSION_TIMEOUT_MS)
    .then(d => {
      const outcome = classifySubmissionResponse(d, requestedSlot);
      if (outcome.kind === 'retry') {
        st.className = 'form-submit-status error';
        st.textContent = outcome.error === 'slot-taken'
          ? '很抱歉，该日期刚被其他参与者预约。已为您刷新，请重新选择。'
          : '该日期已不可预约，请重新选择。';
        chosenSlot = null;
        loadSlots();
        btn.disabled = false;
        btn.textContent = '确认并接收实验指引 →';
        return 'retry';
      }
      if (outcome.kind === 'error') return 'error';
      return outcome.kind;
    })
    .then(result => {
      if (result === 'retry') return;
      if (result === 'unknown') {
        st.className = 'form-submit-status notice';
        st.innerHTML = '服务器未能确认本次报名及预约状态，该时段可能已经写入。请勿重复提交，'
          + '请通过 <a href="mailto:xsleeplab@hotmail.com">xsleeplab@hotmail.com</a> 联系实验室核对。';
        btn.textContent = '状态待确认';
        return;
      }
      if (result === 'error') {
        st.className = 'form-submit-status error';
        st.innerHTML = '服务端明确拒绝了本次提交。请检查信息后重新提交，'
          + '或通过 <a href="mailto:xsleeplab@hotmail.com">xsleeplab@hotmail.com</a> 联系实验室。';
        btn.disabled = false;
        btn.textContent = '重新提交';
        return;
      }
      if (result === 'duplicate') {
        st.className = 'form-submit-status error';
        st.textContent = '该邮箱或手机号已报名，请勿重复提交。如有疑问请联系 xsleeplab@hotmail.com。';
        btn.disabled = false;
        btn.textContent = '重复报名';
        return;
      }
      if (result === 'unconfirmed') {
        st.className = 'form-submit-status notice';
        st.textContent = '报名信息已送达，但所选时段尚未得到服务器确认。请勿重复提交，实验室会尽快与您核对时间。';
        btn.textContent = '信息已提交';
        return;
      }
      if (result === 'pending' || result === 'pending-warning') {
        st.className = 'form-submit-status notice';
        st.textContent = result === 'pending-warning'
          ? '报名信息和所选日期已记录，最终安排以实验室邮件或电话确认为准；系统通知暂时延迟，无需重复提交。'
          : '报名信息已记录，最终安排以实验室邮件或电话确认为准。请勿重复提交。';
        btn.textContent = '日期待确认';
        return;
      }
      if (result === 'warning') {
        st.className = 'form-submit-status notice';
        st.textContent = requestedSlot
          ? '预约已确认，但系统通知暂时延迟。无需重复提交，实验室会核对记录并与您联系。'
          : '报名信息已记录，但系统通知暂时延迟。无需重复提交，实验室会核对记录并与您联系。';
        btn.textContent = requestedSlot ? '预约已确认' : '信息已提交';
        return;
      }
      st.className = 'form-submit-status success';
      const baseMsg = requestedSlot
        ? '报名成功！已为您预约 ' + requestedSlot + '。'
        : '报名信息已提交！';
      st.innerHTML = baseMsg
        + '<span style="display:block;margin-top:10px;padding:10px 14px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;color:#92400E;font-weight:600;font-size:1.02rem;text-align:center">📧 请注意查收邮件（含垃圾邮件箱）</span>'
        + '<span style="display:block;margin-top:6px;color:var(--color-text-light);font-size:0.9rem">我们会通过邮件发送实验指引与确认信息，请留意收件箱。</span>';
      btn.textContent = '已提交';
    })
    .catch(err => {
      console.error('[X-Sleep] 报名提交失败:', err);
      st.className = 'form-submit-status notice';
      st.innerHTML = '服务器未能返回可验证结果，报名状态<strong>暂未确认</strong>。请勿重复提交，'
        + '请通过 <a href="mailto:xsleeplab@hotmail.com">xsleeplab@hotmail.com</a> 联系实验室核对。';
      btn.textContent = '状态待确认';
    });
}

// Mobile menu toggle
document.addEventListener('click', function(e) {
  if (e.target.closest('.menu-toggle')) {
    const nav = document.getElementById('main-navigation');
    const btn = e.target.closest('.menu-toggle');
    nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', nav.classList.contains('open'));
  }
});
