/* One ruleset for emotion-memory: browser, SCF and read-only historical review. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./configs.js'));
  else root.EmotionRules = factory(EMOTION_FORM_SCHEMA);
})(typeof window === 'undefined' ? globalThis : window, function (schema) {
  'use strict';
  const VERSION = 'emotion-2026-11-27-v2';
  const FORM_VERSION = 'emotion-form-2026-11-25';
  const PROJECT = 'emotion-memory';
  const {config, PSQI_Q5, FREQ03, ISI_Q, RMEQ_Q, DASS_Q, DASS_OPT, wording, copy} = schema;
  const S = config.screening;
  const UNKNOWN = {Q01: ['D', '打鼾反馈不清楚'], Q02: ['C', '鼾声影响不清楚'], Q03: ['C', '陌生环境无经历或不清楚']};
  const OUTCOME = {passed: '合格', pending: '待定', failed: '不合格'};
  const freq = FREQ03.map(x => x.label);
  const PSQI = [
    ['q1'], ['q2'], ['q3'], ['q4'],
    ...PSQI_Q5.map(x => [x.key,freq]),
    ['q6',freq], ['q7',freq],
    ['q8',['没有困难','一点困难','比较困难','很大困难']],
    ['q9',['很好','较好','较差','很差']],
  ].map(([id, options]) => [id, wording.psqi[id], options]);
  const {ac: AC} = wording;
  const STAGES = ['consent','basicInfo','psqi','isi','rmeq','dass','customScreening'];
  const BASIC = {consent:'consent',name:'B01',age:'B02',gender:'B03',identity:'B04'};
  const checkDisplay = DASS_Q.flatMap((_,i) => [
    {type:'dass', text:wording.dass[i], dassIdx:i},
    ...Object.entries(AC).filter(([,item]) => item.after === i).map(([id,item]) => ({
      type:'lie', id, text:item.text, options:item.options.map((label,value) => ({label,value})),
    })),
  ]);
  // Canonical DASS-21 item numbers, independent of where AC items are inserted.
  const DIM = {
    depression: [[3,5,10,13,16,17,21], S.dassDepressionMax, '抑郁'],
    anxiety: [[2,4,7,9,15,19,20], S.dassAnxietyMax, '焦虑'],
    stress: [[1,6,8,11,12,14,18], S.dassStressMax, '压力'],
  };
  const text = v => typeof v === 'string' ? v.trim() : '';
  const integer = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const minutes = v => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text(v))
    ? Number(v.slice(0,2))*60 + Number(v.slice(3,5)) : null;
  function onsetTime(absoluteMinutes) {
    const seconds = Math.round((absoluteMinutes % 1440) * 60) % 86400;
    const clock = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60];
    if (seconds % 60) clock.push(seconds % 60);
    return clock.map(value => String(value).padStart(2,'0')).join(':');
  }
  const inBedMinutes = p => (minutes(p.q3) - minutes(p.q1) + 1440) % 1440;
  const sum = a => a.reduce((x,y) => x+y,0);
  const comp = n => n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : 3;
  const visible = (q, values) => !q.showIf || q.showIf.value.includes(values[q.showIf.questionId]);
  function scorePsqi(p) {
    const latScore = p.q2 <= 15 ? 0 : p.q2 <= 30 ? 1 : p.q2 <= 60 ? 2 : 3;
    const hrs = p.q4;
    const inBed = inBedMinutes(p);
    const efficiency = hrs * 6000 / inBed;
    const disturbances = sum(PSQI_Q5.slice(1).map(x => p[x.key]));
    return [
      p.q9, comp(latScore+p.q5a), hrs > 7 ? 0 : hrs >= 6 ? 1 : hrs >= 5 ? 2 : 3,
      efficiency >= 85 ? 0 : efficiency >= 75 ? 1 : efficiency >= 65 ? 2 : 3,
      disturbances === 0 ? 0 : disturbances <= 9 ? 1 : disturbances <= 18 ? 2 : 3,
      p.q6, comp(p.q7+p.q8),
    ];
  }

  function evaluate(raw = {}, {historical = false} = {}) {
    const input = raw || {};
    const basic = input.basic || {}, qin = input.custom || {}, pin = input.psqi || {};
    const answers = {basic:{}, custom:{}, psqi:{}, isi:[], rmeq:[], dass:[], ac:{}};
    const missing = [], excluded = [], pending = [];
    const note = (list, code, reason) => list.push({code, reason});
    const required = (key, v, ok) => {
      if (!ok) missing.push(key);
      return ok ? v : null;
    };
    const fail = (code, reason) => note(excluded,code,reason);
    const review = (code, reason) => note(pending,code,reason);
    const b = answers.basic;
    b.consent = required('consent', true, basic.consent === true);
    b.name = required('姓名', text(basic.name), text(basic.name).length > 0 && text(basic.name).length <= 80);
    b.age = required('年龄', basic.age, Number.isSafeInteger(basic.age));
    b.gender = required('性别', basic.gender, ['男','女'].includes(basic.gender));
    b.identity = required('身份', basic.identity || null, !basic.identity || ['学生','在职'].includes(basic.identity));
    if (b.age !== null && (b.age < S.ageMin || b.age > S.ageMax)) fail('AGE','年龄不在18–24岁范围内');

    for (const q of config.customScreening) {
      if (!visible(q,answers.custom)) continue;
      const v = qin[q.id];
      if (q.type === 'text') {
        const val = text(v);
        const ok = q.id === 'Q16a' ? /^\d{11}$/.test(val) : typeof v === 'string' && val.length <= 100;
        // An explicit empty optional input records the offered contact path.
        // Missing historical values are not evidence that the applicant left it blank.
        answers.custom[q.id] = required(q.id,val,ok);
        if (q.failIfEmpty && ok && !val) fail('CONTACT','未提供后续联系途径');
        continue;
      }
      const allowed = q.options.map(o => o.value);
      const vals = q.type === 'checkbox' ? v : [v];
      const ok = Array.isArray(vals) && vals.length > 0 && new Set(vals).size === vals.length &&
        vals.every(x=>allowed.includes(x)) &&
        !(q.mutexWith && vals.includes(q.mutexWith.value) && vals.length > 1);
      answers.custom[q.id] = required(q.id,q.type === 'checkbox' && ok ? [...vals].sort() : v,ok);
      if (!ok) continue;
      const bad = vals.filter(x => (q.failIf && q.failIf.includes(x)) || (q.passIf && !q.passIf.includes(x)));
      if (bad.length) fail(q.id,q.id+'：'+bad.map(x=>q.options.find(o=>o.value===x).label).join('；'));
      if (UNKNOWN[q.id]?.[0] === v) review(q.id,UNKNOWN[q.id][1]);
    }

    for (const [id, , opts] of PSQI) {
      const v = pin[id];
      const ok = opts ? integer(v,0,opts.length-1)
        : id === 'q1' || id === 'q3' ? minutes(v) !== null
        : Number.isFinite(v) && v >= 0 && (id === 'q2' ? v <= Number.MAX_SAFE_INTEGER / 60 : v <= 24);
      answers.psqi[id] = required('PSQI-'+id,v,ok);
    }
    if (answers.psqi.q5j > 0) {
      const v = text(pin.other);
      answers.psqi.other = required('PSQI-其他原因',v,v.length > 0 && v.length <= 500);
    }
    const p = answers.psqi;
    const contradictory = p.q1 !== null && p.q3 !== null && p.q4 !== null &&
      (inBedMinutes(p) === 0 || p.q4 * 60 > inBedMinutes(p) + 1e-8);
    if (contradictory) missing.push('PSQI-实睡时长与卧床时间矛盾');
    let onset = null, onsetDay = null;
    if (p.q1 !== null && p.q2 !== null) {
      const bed = minutes(p.q1);
      // Sleep-night chronology starts at noon; do not wrap a late morning
      // onset back before the deadline when sleep latency crosses midnight.
      const start = bed < 720 ? bed + 1440 : bed;
      const fell = start + p.q2;
      onset = onsetTime(fell);
      onsetDay = Math.floor(fell / 1440);
      if (!contradictory && fell > 1440 + minutes(S.psqiBedtimeDeadline)) fail('BEDTIME','通常实际入睡时间晚于00:30');
    }
    const psqiComponents = !missing.some(key => key.startsWith('PSQI-')) ? scorePsqi(p) : null;
    const psqi = psqiComponents ? sum(psqiComponents) : null;
    if (psqi !== null && psqi > S.psqiMax) fail('PSQI','PSQI总分超过'+S.psqiMax);
    answers.isi = ISI_Q.map((_,i) => {
      const v = input.isi?.[i]; return required('ISI-'+(i+1),v,integer(v,0,4));
    });
    const isi = answers.isi.every(x=>x!==null) ? sum(answers.isi) : null;
    if (isi !== null && isi > S.isiMax) fail('ISI','ISI总分超过'+S.isiMax);
    answers.rmeq = RMEQ_Q.map((q,i) => {
      const v = input.rmeq?.[i]; return required('rMEQ-'+(i+1),v,q.options.some(x=>x.value===v));
    });
    const rmeq = answers.rmeq.every(x=>x!==null) ? sum(answers.rmeq) : null;
    if (rmeq !== null && (rmeq < S.rmeqMin || rmeq > S.rmeqMax)) fail('RMEQ','rMEQ总分不在'+S.rmeqMin+'–'+S.rmeqMax+'范围内');
    answers.dass = DASS_Q.map((_,i) => {
      const v = input.dass?.[i]; return required('DASS-'+(i+1),v,integer(v,0,3));
    });
    const dass = {}, dassRaw = {};
    const completeDass = answers.dass.every(answer => answer !== null);
    for (const [key,[items,max,label]] of Object.entries(DIM)) {
      const values = items.map(i=>answers.dass[i-1]);
      dassRaw[key] = completeDass ? sum(values) : null;
      dass[key] = completeDass ? dassRaw[key] * 2 : null;
      if (dass[key] !== null && dass[key] > max) review('DASS-'+key,`DASS${label}${dass[key]}分（乘2），超过${max}分`);
    }
    for (const [id,question] of Object.entries(AC)) {
      const v = input.ac?.[id];
      answers.ac[id] = required(id,v,integer(v,0,question.options.length-1));
      if (answers.ac[id] !== null && v !== (id === 'AC01' ? 1 : 0)) fail(id,`答题检查未通过（${id}，原答：${question.options[v]}）`);
    }
    if (historical && missing.some(id => !['consent','姓名','性别','身份'].includes(id))) review('HISTORY_INCOMPLETE','历史答卷信息不完整');
    const classification = missing.length && !historical ? null : excluded.length ? 'failed' : pending.length ? 'pending' : 'passed';
    return {version:VERSION, formVersion:FORM_VERSION, classification, missing, excluded, pending, onset, onsetDay,
      scores:{psqi,psqiComponents,isi,rmeq,dass,dassRaw}, answers};
  }

  function stageFor(key) {
    if (key === 'consent') return 'consent';
    if (['姓名','年龄','性别','身份'].includes(key)) return 'basicInfo';
    if (key.startsWith('PSQI-')) return 'psqi';
    if (key.startsWith('ISI-')) return 'isi';
    if (key.startsWith('rMEQ-')) return 'rmeq';
    if (key.startsWith('DASS-') || key.startsWith('AC')) return 'dass';
    return 'customScreening';
  }

  // Validate the completed pages independently of the unvisited pages.
  // On the final screening page a validated exclusion can end the form
  // once all visible items up to and including that exclusion are answered.
  function evaluateStage(raw, stage) {
    const end = STAGES.indexOf(stage);
    if (end < 0) return null;
    const input = {basic:raw?.basic};
    for (const section of ['psqi','isi','rmeq','dass']) {
      if (STAGES.indexOf(section) <= end) input[section] = raw?.[section];
    }
    if (end >= STAGES.indexOf('dass')) input.ac = raw?.ac;
    if (stage === 'customScreening') input.custom = raw?.custom;
    const result = evaluate(input);
    let missing = result.missing.filter(key => STAGES.indexOf(stageFor(key)) <= end);
    const complete = stage === 'customScreening' && missing.length === 0;
    if (stage === 'customScreening' && !complete) {
      const index = id => config.customScreening.findIndex(question => question.id === (id === 'CONTACT' ? 'Q16b' : id));
      const check = result.excluded.find(reason => index(reason.code) >= 0);
      if (check) missing = missing.filter(key => stageFor(key) !== stage || index(key) <= index(check.code));
    }
    const classification = missing.length ? null : complete ? result.classification : result.excluded.length ? 'failed' : null;
    return {...result, classification, missing, stage, completion:complete ? 'complete' : classification === 'failed' ? 'early' : null};
  }

  function answerLines(a, completion = 'complete') {
    const rows = [];
    const add = (id, question, value, answer, options, state) => {
      let status = state;
      if (!status) status = value == null ? (completion === 'early' ? '因提前结束未作答' : '未作答') : '已作答';
      rows.push([id,question,JSON.stringify(value ?? null),JSON.stringify(answer ?? value ?? null),
        JSON.stringify(options ?? null),status].join('\t'));
    };
    for (const [key,id] of Object.entries(BASIC)) {
      const value = a.basic[key];
      const options = key === 'gender' ? ['男','女'] : key === 'identity' ? ['学生','在职'] : null;
      add(id,wording.basic[id],value,value,options,key === 'identity' && value == null ? '选填未答' : null);
    }
    for (const q of config.customScreening) {
      const value = a.custom[q.id];
      const label = code => q.options?.find(option=>option.value===code)?.label ?? code;
      const hidden = q.showIf && a.custom[q.showIf.questionId] != null && !visible(q,a.custom);
      const state = hidden ? '未显示' : q.id === 'Q16b' && value === '' ? '选填未答' : null;
      add(q.id,q.text,value,Array.isArray(value) ? value.map(label) : label(value),q.options,state);
    }
    for (const [id,question,options] of PSQI) {
      const value = a.psqi[id];
      add('P'+id.slice(1).padStart(id.length === 2 ? 2 : 3,'0'),question,value,options?.[value],options);
    }
    add('P05j_other_reason',wording.psqi.other,a.psqi.other,null,null,a.psqi.q5j === 0 ? '未显示' : null);
    ISI_Q.forEach((q,i)=>add('I'+String(i+1).padStart(2,'0'),wording.isi[i],a.isi[i],q.options[a.isi[i]],q.options));
    RMEQ_Q.forEach((q,i)=>add('R'+String(i+1).padStart(2,'0'),wording.rmeq[i],a.rmeq[i],
      q.options.find(option=>option.value===a.rmeq[i])?.label,q.options));
    DASS_Q.forEach((_,i)=>add('D'+String(i+1).padStart(2,'0'),wording.dass[i],a.dass[i],DASS_OPT[a.dass[i]]?.label,DASS_OPT));
    for (const [id,q] of Object.entries(AC)) add(id,q.text,a.ac[id],q.options[a.ac[id]],q.options);
    return rows.join('\n');
  }
  return {VERSION,FORM_VERSION,PROJECT,OUTCOME,PSQI,STAGES,wording,copy,checkDisplay,visible,evaluate,evaluateStage,answerLines};
});
