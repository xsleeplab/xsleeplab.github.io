/**
 * configs.js — 所有项目配置（数据源）
 *
 * 引擎（engine.js）从 window.PROJECT_CONFIGS 读取项目信息。
 * 新增项目只需在此文件中追加一个条目。
 */

// ==================== 共享量表题目 ====================

const PSQI_Q5 = [
  {key:'q5a',text:'过去一个月，您有多少次不能在 30 分钟内入睡？'},{key:'q5b',text:'过去一个月，您有多少次在半夜或凌晨醒来，睡眠被打断？'},
  {key:'q5c',text:'过去一个月，您有多少次在夜间睡眠过程中需要起床上厕所？'},{key:'q5d',text:'过去一个月，您有多少次因夜间呼吸不畅而睡不好？'},{key:'q5e',text:'过去一个月，您有多少次因自己咳嗽或大声打鼾而睡不好？'},
  {key:'q5f',text:'过去一个月，您有多少次因夜间感到太冷而睡不好？'},{key:'q5g',text:'过去一个月，您有多少次因夜间感到太热而睡不好？'},{key:'q5h',text:'过去一个月，您有多少次因做噩梦而睡不好？'},
  {key:'q5i',text:'过去一个月，您有多少次因夜间疼痛而睡不好？'},{key:'q5j',text:'过去一个月，您有多少次因上述情况之外的其他原因而睡不好？'},
];
const FREQ03 = [{value:0,label:'无'},{value:1,label:'每周不到一次'},{value:2,label:'每周一两次'},{value:3,label:'每周三次以上'}];

const ISI_Q = [
  {text:'入睡困难程度',options:['无','轻微','中度','严重','非常严重']},
  {text:'维持睡眠困难程度',options:['无','轻微','中度','严重','非常严重']},
  {text:'早醒问题',options:['无','轻微','中度','严重','非常严重']},
  {text:'对睡眠模式的满意程度',options:['非常满意','满意','一般','不满意','非常不满意']},
  {text:'睡眠问题对日常功能的影响程度',options:['没有影响','轻微影响','有些影响','较大影响','非常影响']},
  {text:'睡眠问题被他人注意到的程度',options:['没有','轻微','有些','较明显','非常明显']},
  {text:'对睡眠问题的担忧程度',options:['一点也不担忧','轻微担忧','有些担忧','较为担忧','非常担忧']},
];

const DASS_Q = [
  '我发现自己很难放松下来','我感到口干','我好像不能有什么好的感觉','我感到呼吸困难',
  '我感到做事缺乏主动性','我对事情容易反应过度','我有颤抖的感觉（例如手抖）','我感到精神紧张',
  '我担心自己在某些场合会惊慌失措出洋相','我觉得对未来没什么可期望的','我发现自己变得烦躁不安',
  '我发现自己很难放松','我感到悲伤和沮丧','我不能容忍任何阻碍我做事的事物',
  '我感到快要惊慌失措了','我对任何事情都不能产生热情','我觉得自己不怎么有价值',
  '我觉得自己相当敏感','我感到心跳明显加快但并没有做任何体力活动','我无缘无故地感到害怕','我觉得生活没有意义',
];
const DASS_OPT = [{value:0,label:'不符合'},{value:1,label:'有时符合'},{value:2,label:'常常符合'},{value:3,label:'总是符合'}];

// DASS 测谎题
const DASS_LIE = [
  { text: '请在本题选择"有时符合"', insertAfter: 9, check: 'attention' },
  { text: '我从来没有感到过疲倦或困倦', insertAfter: 14, check: 'impossible' },
];

function buildDassDisplay() {
  const display = [];
  let lieIdx = 0;
  for (let i = 0; i < DASS_Q.length; i++) {
    display.push({ type: 'dass', text: DASS_Q[i], dassIdx: i });
    while (lieIdx < DASS_LIE.length && DASS_LIE[lieIdx].insertAfter === i) {
      display.push({ type: 'lie', text: DASS_LIE[lieIdx].text, check: DASS_LIE[lieIdx].check });
      lieIdx++;
    }
  }
  return display;
}
const DASS_DISPLAY = buildDassDisplay();

const RMEQ_Q = [
  { text: '如果您能够完全自由地计划白天的时间，您希望大约在什么时间起床？', options: [
    {value:5,label:'早上 5:00 – 6:30'},{value:4,label:'早上 6:30 – 7:45'},
    {value:3,label:'早上 7:45 – 9:45'},{value:2,label:'早上 9:45 – 11:00'},
    {value:1,label:'早上 11:00 – 正午 12:00'},
  ]},
  { text: '清晨起床后的半小时内，您的感觉如何？', options: [
    {value:1,label:'非常疲倦'},{value:2,label:'稍微疲倦'},
    {value:3,label:'一般清醒'},{value:4,label:'非常清醒'},
  ]},
  { text: '在夜晚，您大约到什么时候会感到疲倦、需要睡觉？', options: [
    {value:5,label:'晚上 20:00 – 21:00'},{value:4,label:'晚上 21:00 – 22:15'},
    {value:3,label:'晚上 22:15 – 次日 00:45'},{value:2,label:'凌晨 00:45 – 02:00'},
    {value:1,label:'凌晨 02:00 – 03:00'},
  ]},
  { text: '一天之中，哪个时段是您状态最好的时间？', options: [
    {value:5,label:'早上 5:00 – 8:00'},{value:4,label:'早上 8:00 – 10:00'},
    {value:3,label:'上午 10:00 – 下午 17:00'},{value:2,label:'下午 17:00 – 22:00'},
    {value:1,label:'晚上 22:00 – 次日 05:00'},
  ]},
  { text: '人可分为「清晨」型（早鸟）和「夜晚」型（夜猫）两类，您认为自己属于哪一类？', options: [
    {value:6,label:'绝对「清晨」型'},{value:4,label:'「清晨」型多过「夜晚」型'},
    {value:2,label:'「夜晚」型多过「清晨」型'},{value:0,label:'绝对「夜晚」型'},
  ]},
];

// 标准环境适应题（HABIT_Q）——overnight-sleep 使用
const HABIT_Q = [
  { text: '换到陌生环境睡觉，睡眠受到多大影响？', options: [
    {value:0,label:'完全没影响，沾枕头就睡着'},{value:1,label:'轻微影响，半小时内能睡着'},
    {value:2,label:'明显影响，需要1小时以上'},{value:3,label:'严重影响，几乎整晚睡不着'}
  ]},
  { text: '对睡眠环境中的声音敏感吗？', options: [
    {value:0,label:'不敏感，甚至需要背景音'},{value:1,label:'一般，普通安静即可'},{value:2,label:'非常敏感，细微声音都会惊醒'}
  ]},
  { text: '平时容易觉得皮肤发痒或有异物感吗？', options: [
    {value:0,label:'不容易，皮肤耐受度高'},{value:1,label:'一般'},{value:2,label:'容易，对异物感很敏感'}
  ]},
  { text: '目前的吸烟情况', options: [
    {value:0,label:'不吸烟'},{value:1,label:'已戒烟'},{value:2,label:'吸烟'}
  ], hasDetail: true },
  { text: '近期是否服用过助眠药物等', options: [
    {value:0,label:'否'},{value:1,label:'是'}
  ], hasDetail: true },
];

// 睡眠疾病多选题（HABIT_Q 第 6 题的子选项）
const HABIT_CONDITIONS = [
  {id:'habit-q5a', value:'打呼噜（睡觉时打鼾）'},
  {id:'habit-q5b', value:'不宁腿综合征（腿脚酸麻痒，睡前必须活动）'},
  {id:'habit-q5c', value:'夜尿症（每晚起床排尿≥2次）'},
  {id:'habit-q5d', value:'倒班工作 / 近期跨时区旅行'},
  {id:'habit-q5e', value:'无以上情况'},
];

// ==================== 步骤定义 ====================

// 步骤名 → DOM 面板 ID 映射
const STEP_PANEL_MAP = {
  'consent':          'step-0',
  'basicInfo':        'step-1',
  'vision':           'step-2',
  'habit':            'step-3',
  'customScreening':  'step-3',
  'psqi':             'step-4',
  'isi':              'step-5',
  'rmeq':             'step-6',
  'dass':             'step-7',
  'schedule':         'step-8',
};

// 步骤名 → 进度条显示标签
const STEP_LABELS = {
  'consent':          '知情同意',
  'basicInfo':        '基本信息',
  'vision':           '视力',
  'habit':            '环境适应',
  'customScreening':  '筛问题答',
  'psqi':             'PSQI',
  'isi':              'ISI',
  'rmeq':             '昼夜节律',
  'dass':             'DASS-21',
  'schedule':         '时间安排',
};

// ==================== 项目配置 ====================

const PROJECT_CONFIGS = {

  // ──────────────────────────────────────────────
  //  夜间睡眠研究（overnight-sleep）
  // ──────────────────────────────────────────────
  'overnight-sleep': {
    id: 'overnight-sleep',
    type: 'overnight',
    title: '夜间睡眠研究',
    brief: '晚上 7 点到达实验室，在实验室睡一夜（23:00 – 07:00），全程记录睡眠脑电。次日晨间完成简短测试后离开。',
    visits: '1 次（过夜）',
    duration: '19:00 – 次日 07:30',
    reward: '450 元',
    active: true,
    typeLabel: '晚睡实验',
    typeIcon: '🌙',
    bookingMode: 'waitlist',   // 不走日历自主预约；提交后进入候选池，由人工按空闲时间筛选联系

    steps: [
      'consent', 'basicInfo', 'vision', 'habit',
      'psqi', 'isi', 'rmeq', 'dass',
      'schedule',
    ],

    screening: {
      ageMin: 18, ageMax: 24,
      psqiMax: 5,
      isiMax: 7,
      rmeqMin: 8, rmeqMax: 21,
      dassDepressionMax: 9,
      dassAnxietyMax: 7,
      dassStressMax: 14,
      visionRequired: true,
      visionMyopiaMax: 800,
      visionHyperopiaMax: 200,
      visionAstigmatismMax: 100,
      lieCheck: true,
      dyeCheck: true,
    },

    habitQuestions: HABIT_Q,
    habitConditions: HABIT_CONDITIONS,
    customScreening: null,

    guide: {
      scheduleSummary: [
        '晚上：19:00 - 23:00 到达、准备与睡前实验',
        '睡眠：23:00 - 07:00（全程脑电记录）',
        '晨间：07:00 - 07:30 醒后实验后离开',
      ],
      timeline: [
        { time: '19:00', desc: '到达实验室，熟悉环境' },
        { time: '19:00 - 19:30', desc: '洗漱准备' },
        { time: '19:30 - 20:00', desc: '佩戴脑电设备' },
        { time: '20:00 - 22:30', desc: '完成睡前实验任务' },
        { time: '22:30 - 23:00', desc: '睡前最后准备' },
        { time: '23:00', desc: '入睡（全程脑电记录）' },
        { time: '07:00', desc: '起床，洗漱' },
        { time: '07:00 - 07:30', desc: '完成醒后实验任务' },
      ],
      prep: [
        '<strong>牙刷与牙膏</strong> — 出于卫生考虑，实验室不提供牙刷',
        '<strong>睡衣</strong> — 建议携带舒适的睡衣',
        '<strong>毛巾</strong> — 我们会提供毛巾，您也可以自带',
        '<strong>其他洗漱用品</strong> — 洗面奶、护肤品等个人用品',
        '<strong>助眠物品</strong> — 如有耳塞、眼罩等习惯可携带',
      ],
    },

    email: {
      scheduleLines: [
        '晚上：<strong>19:00</strong> 到达实验室，熟悉环境、洗漱准备',
        '晚间：<strong>19:30 – 23:00</strong> 佩戴脑电、完成睡前实验任务',
        '睡眠：<strong>23:00 – 07:00</strong>（全程脑电记录）',
        '晨间：<strong>07:00 – 07:30</strong> 醒后实验后离开',
      ],
      reminders: [
        '实验当晚需要在实验室过夜，请提前安排好当天的事务，确保 19:00 前能到达实验室。',
        '建议携带<strong>睡衣</strong>和个人洗漱用品。出于卫生考虑，实验室不提供牙刷。',
        '实验前一天及当天请勿饮用含酒精、咖啡因的饮品（咖啡、茶、可乐、能量饮料等）。',
        '实验需要佩戴脑电帽，您抵达实验室之后需要洗头，我们会提供洗发水和吹风机。毛巾会进行一人一换，定时清洗并烘干消毒。',
        '<strong>请携带本人身份证或其他有效身份证件前来</strong>，实验现场需核对个人信息以发放被试费。',
      ],
      phoneCallReminder: false,
      breakfastNote: '早晨我们将提供简单的早餐（牛奶与面包）。',
    },

    calendar: {
      blockedDays: [0, 3, 5],
      bookingWindow: 14,
      slotDays: 28,
      defaultCapacity: 2,
    },

    bitable: {
      appToken: 'Y2M3bVgB6ahVOZsakGec4gJZnce',
      mainTableId: 'tblP72z8LmOZsikw',
      slotTableId: 'tblpyVsObvNQFqqe',
      psqiTableId: 'tbl2sDHXED5HD395',
      isiTableId: 'tblfISUfqEwpOrEk',
      rmeqTableId: 'tblgamOXKj8Pdll3',
      dassTableId: 'tblKxiev2nRTwoI7',
      waitlistTableId: 'tblAiGsbgO5zw3us',
    },
  },


  // ──────────────────────────────────────────────
  //  睡眠对情绪记忆的调节作用（emotion-memory）
  //  ⚠️ 骨架配置——active:false，待完善后启用
  //  业务来源：公开招募平台修复执行说明（2026-11-25）
  // ──────────────────────────────────────────────
  'emotion-memory': {
    id: 'emotion-memory',
    type: 'emotion',
    title: '睡眠对情绪记忆的调节作用',
    brief: "实验包括观看部分含不愉快内容的图片、完成学习与记忆任务，以及佩戴脑电帽在实验室过夜。第一天晚上到场，第二天早晨完成任务后离开；第三天上午返回实验室完成约40分钟测试。具体日期由实验员联系协商。",
    visits: '2 次',
    duration: '首晚 19:10 或 19:30 到场，次晨约 08:10 或 08:30 离开；第三天 09:30 返场约 40 分钟',
    reward: '完整参与 450 元',
    active: true,
    collectContactInBasic: false,   // 基本信息页不收集手机号/微信号；联系方式由 Q16a/Q16b 收集
    emailDisabled: true,
    typeLabel: '情绪记忆实验',
    typeIcon: '💭',

    steps: [
      'consent', 'basicInfo', 'psqi', 'isi', 'rmeq', 'dass',
      'customScreening',
    ],

    screening: {
      ageMin: 18, ageMax: 24,
      psqiMax: 5,
      isiMax: 7,
      rmeqMin: 8, rmeqMax: 21,
      dassDepressionMax: 9,
      dassAnxietyMax: 7,
      dassStressMax: 14,
      visionRequired: false,
      lieCheck: true,
      dyeCheck: false,   // 染发筛查由 customScreening Q12 处理；本项目无 habit 步骤，不能启用基于 habit-dye 的检查
      psqiBedtimeDeadline: '00:30',
    },

    habitQuestions: null,
    habitConditions: null,

    // ── 自定义筛选题（Q01–Q16）──
    // type: 'radio' | 'checkbox' | 'text'
    // passIf: 选这些 value 通过 | failIf: 选这些 value 不通过
    // showIf: { questionId, value } 条件显示
    // mutexWith: 互互斥选项（多选时选了该值就不能选其他）
    customScreening: [
      {
        id: 'Q01', help: '请根据您目前已经知道的情况回答。', text: "您是否曾被别人告知，自己晚上睡觉会打呼噜（打鼾）？", type: 'radio',
        options: [
          { value: 'A', label: "从来没有人提到过。" },
          { value: 'B', label: "偶尔被提到过一两次。" },
          { value: 'C', label: "曾被反复提醒过，包括同一个人多次提醒。" },
          { value: 'D', label: "不清楚或记不清。" },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q02', text: "是否有人明确说过，您的鼾声很大，影响别人睡觉，或关上门后仍能听见？", type: 'radio',
        showIf: { questionId: 'Q01', value: ['B', 'C'] },
        options: [
          { value: 'A', label: "没有。" },
          { value: 'B', label: "有。" },
          { value: 'C', label: "不清楚或记不清。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q03', text: "换到陌生环境（如酒店、临时住宿处）睡觉时，您通常多久能入睡？", type: 'radio',
        options: [
          { value: 'A', label: "通常能在30分钟内入睡。" },
          { value: 'B', label: "通常需要超过30分钟，或经常很难入睡。" },
          { value: 'C', label: "没有类似经历，或不清楚。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q04', text: "平时睡觉时，您是否经常有以下情况？", type: 'checkbox',
        options: [
          { value: 'A', label: "持续的轻微背景声（如空调、风扇的运转声）使我难以入睡。" },
          { value: 'B', label: "偶尔出现的轻微声音（如远处的说话声、走动声）会把我吵醒。" },
          { value: 'C', label: "以上情况均无。" },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q05', text: "过去1个月内，您夜间睡觉时的鼻塞情况通常是？", type: 'radio',
        options: [
          { value: 'A', label: "没有鼻塞。" },
          { value: 'B', label: "有鼻塞，但不影响夜间呼吸和睡眠。" },
          { value: 'C', label: "鼻塞明显影响夜间呼吸或睡眠（如因鼻塞呼吸费力、难以入睡或夜间醒来）。" },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q06', text: "过去1个月内，您是否有以下情况？", type: 'checkbox',
        options: [
          { value: 'A', label: "目前有经医生诊断的睡眠疾病（如睡眠呼吸暂停、不宁腿综合征、发作性睡病等）。" },
          { value: 'B', label: "反复在睡眠中因憋气醒来，或已被告知睡觉时有呼吸停顿。" },
          { value: 'C', label: "晚上躺下休息时，腿部经常不舒服、很想活动，活动后缓解，并影响入睡或睡眠。" },
          { value: 'D', label: "平均每周因尿意醒来、起床上厕所超过3次。" },
          { value: 'E', label: "没有上述已知情况。" },
        ],
        passIf: ['E'],
        mutexWith: { value: 'E', others: ['A', 'B', 'C', 'D'] },
      },
      {
        id: 'Q07', text: "过去1个月内，您是否有以下情况？", type: 'checkbox',
        options: [
          { value: 'A', label: "有夜班、通宵值班或昼夜轮换的工作／实习安排。" },
          { value: 'B', label: "有跨时区旅行，出发地与目的地的时差达到2小时或以上。" },
          { value: 'C', label: "以上均无。" },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q08', text: "在普通安静的睡眠环境中，您使用耳塞的情况是？", type: 'radio',
        options: [
          { value: 'A', label: "平时不戴耳塞睡觉。" },
          { value: 'B', label: "平时会戴耳塞，但不戴也能正常入睡和维持睡眠。" },
          { value: 'C', label: "即使环境安静，不戴耳塞也经常难以入睡或容易醒来。" },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q09', text: "过去1个月内，您是否吸烟，或使用含尼古丁的电子烟、戒烟贴片、戒烟口香糖等产品？", type: 'radio',
        options: [
          { value: 'A', label: "没有。" },
          { value: 'B', label: "有，包括偶尔使用。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q10', help: '请勿为参加实验自行停药或调整用药。', text: "您近期的用药或助眠产品使用情况是？", type: 'checkbox',
        options: [
          { value: 'A', label: "过去3个月内使用过安眠药、镇静药，或抗抑郁、抗焦虑等精神科药物。" },
          { value: 'B', label: "目前或过去1周内使用过其他药物或助眠产品（如褪黑素、感冒药、抗过敏药）。" },
          { value: 'C', label: "以上均无。" },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q11', text: "您是否有以下情况？", type: 'checkbox',
        options: [
          { value: 'A', label: "目前头皮有明显伤口、破损、红肿或持续瘙痒。" },
          { value: 'B', label: "以前使用胶布或医用贴片时，贴敷部位曾出现明显红肿、起疹或瘙痒。" },
          { value: 'C', label: "没有上述已知情况。" },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q12', text: "最近3个月内，您是否染过头发？", type: 'radio',
        options: [
          { value: 'A', label: "否。" },
          { value: 'B', label: "是。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q13', text: "您的听力情况是？", type: 'radio',
        options: [
          { value: 'A', label: "未发现听力问题，日常交谈和听音频没有困难。" },
          { value: 'B', label: "有听力下降或听辨困难（包括只有一侧耳朵存在问题），或需要使用助听设备。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q14', text: "您观看电脑屏幕上的文字和图片时，属于以下哪种情况？", type: 'radio',
        options: [
          { value: 'A', label: "不戴眼镜也能看清。" },
          { value: 'B', label: "佩戴合适的框架眼镜后能看清。" },
          { value: 'C', label: "即使佩戴合适的眼镜，仍难以看清。" },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q15', text: "本实验包括观看部分含不愉快内容的图片、完成学习与记忆任务，以及佩戴脑电帽过夜。您是否愿意按上述安排参加？", type: 'radio',
        options: [
          { value: 'A', label: "已了解，愿意参加。" },
          { value: 'B', label: "不愿意参加。" },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q16', text: "如您符合本实验的参与条件，您是否同意实验员通过您填写的手机号添加您的微信，联系您沟通实验时间安排及注意事项？（如手机号无法搜索到您的微信，实验员会通过手机短信与您联系）", type: 'radio',
        options: [
          { value: 'A', label: "同意。" },
          { value: 'B', label: "不同意。" },
        ],
      },
      {
        id: 'Q16a', text: '您的手机号是？', type: 'text', inputType: 'phone',
        showIf: { questionId: 'Q16', value: ['A'] },
        required: true,
      },
      {
        id: 'Q16b', text: '微信号（选填）', help: '您也可以直接填写微信号，实验员将通过您填写的微信号添加您的微信，与您联系。', type: 'text', inputType: 'text',
        showIf: { questionId: 'Q16', value: ['B'] },
        required: false,
        failIfEmpty: true,
      },
    ],

    location: '中国科学院心理研究所和谐楼（南楼）829实验室（睡眠实验室）',
    scheduleDetails: [
      '19:10档：19:10—20:25洗漱、认真洗头吹干、换睡衣及脑电准备；20:25—22:25睡前6项任务；约22:40—次日06:40佩戴脑电帽睡眠8小时；06:40—08:10晨起5项任务，含清醒准备；第3天09:30—约10:10返场4项任务。',
      '19:30档：19:30—20:45准备；20:45—22:45睡前6项任务；约23:00—次日07:00睡眠8小时；07:00—08:30晨起5项任务，含清醒准备；第3天09:30—约10:10返场4项任务。',
    ],
    compensationDetails: '完成全部环节450元；完成睡前、过夜及次晨任务但不参加第三天返场400元；完成整夜但未完成全部晨起350元；完成睡前后未睡着或睡眠极差、研究方不安排睡后300元；完成睡前后主动放弃睡眠和睡后200元；睡前任务中途退出150元；到场后头围不适配无法参加50元。',

    calendar: {
      blockedDays: [],
      bookingWindow: 14,
      slotDays: 28,
      defaultCapacity: 1,
    },

    bitable: {
      appToken: 'W1HFbqKUOa7XIysFDY1cZXUWnJc',
      mainTableId: 'tblYeZgUybEFMfvr',
      slotTableId: 'tbl0lhk0DE1CRgTN',
      psqiTableId: 'tblXIhlQCHakSccD',
      isiTableId: 'tblHq7M54Nb9eLjg',
      rmeqTableId: 'tblFSR7ShBSSdeAY',
      dassTableId: 'tbl3YpEB0TZOq5jE',
      waitlistTableId: 'tblTMIZGaTSyXHUi',
    },
  },


  // ──────────────────────────────────────────────
  //  午睡与记忆研究（nap-memory）
  //  当天单次往返，含约 90 分钟午睡；候选时间由人工协调，不被试自选
  // ──────────────────────────────────────────────
  'nap-memory': {
    id: 'nap-memory',
    type: 'nap',
    title: '午睡与记忆研究',
    brief: '考察午睡对记忆巩固的作用。您需要在当天到访一次（北医六院昌平院区），完成行为任务后佩戴脑电午睡约 90 分钟，当天往返，无需过夜。',
    visits: '1 次（当天往返）',
    duration: '上午 11:30 – 下午 16:30（当天往返，不过夜）',
    location: '北京大学第六医院 昌平院区',
    reward: '350 元',
    active: true,
    typeLabel: '午睡实验',
    typeIcon: '☀️',
    bookingMode: 'waitlist',   // 被试填写候选时间，由研究团队统一协调、单独联系，不自主选日期
    collectContactInBasic: true, // 基本信息收集手机号 + 微信号
    emailDisabled: true,           // 本项目不收集邮箱

    steps: [
      'consent', 'basicInfo', 'customScreening',
      'psqi', 'isi', 'rmeq', 'dass',
      'schedule',
    ],

    screening: {
      ageMin: 18, ageMax: 24,
      psqiMax: 5,
      isiMax: 7,
      rmeqMin: 8, rmeqMax: 21,
      dassDepressionMax: 9,
      dassAnxietyMax: 7,
      dassStressMax: 14,
      visionRequired: false,   // 午睡当天往返，暂不设视力筛查
      lieCheck: true,
      dyeCheck: false,         // 午睡筛查项由 customScreening 处理，本项目无 habit 步骤
    },

    habitQuestions: null,
    habitConditions: null,

    // ── 午睡专属筛选题（复用通用 customScreening 渲染与判定）──
    // N01 是否有午睡习惯：必须选「是」才通过筛选
    // N02 / N03 午睡时长与时段：仅作记录，不参与通过/不通过判定
    customScreening: [
      {
        id: 'N01', text: '您平时是否有午睡（白天小睡）的习惯？', type: 'radio',
        options: [
          { value: 'A', label: '是' },
          { value: 'B', label: '否' },
        ],
        passIf: ['A'],
      },
      {
        id: 'N02', text: '您一般午睡多长时间？', type: 'radio',
        options: [
          { value: 'A', label: '30 分钟以内' },
          { value: 'B', label: '30–60 分钟' },
          { value: 'C', label: '60–90 分钟' },
          { value: 'D', label: '90 分钟以上' },
          { value: 'E', label: '不太固定' },
        ],
      },
      {
        id: 'N03', text: '您的午睡时间通常在哪个时段？', type: 'radio',
        options: [
          { value: 'A', label: '上午 11:00 – 下午 13:00' },
          { value: 'B', label: '下午 13:00 – 15:00' },
          { value: 'C', label: '下午 15:00 – 17:00' },
          { value: 'D', label: '其他或不固定' },
        ],
      },
    ],

    guide: {
      scheduleSummary: [
        '到场：上午 11:30 到达北京大学第六医院昌平院区',
        '行为任务：完成记忆编码任务并佩戴脑电设备',
        '午睡：约 90 分钟（全程脑电记录）',
        '醒后测试：完成记忆测试与问卷，下午约 16:30 前离开',
      ],
      timeline: [
        { time: '11:30', desc: '到达实验室（北医六院昌平院区），熟悉环境' },
        { time: '11:30 – 12:00', desc: '准备与说明' },
        { time: '12:00 – 13:30', desc: '完成记忆编码行为任务，佩戴脑电设备' },
        { time: '13:30 – 15:00', desc: '午睡约 90 分钟（全程脑电记录）' },
        { time: '15:00 – 16:30', desc: '醒后完成记忆测试与问卷，随后离开' },
      ],
      prep: [
        '<strong>早餐与午餐</strong> — 请正常吃早餐；实验当天我们会安排午餐，如您有饮食禁忌请提前告知',
        '<strong>身份证</strong> — 请携带本人身份证，现场需核对信息以发放被试费',
        '<strong>舒适衣物</strong> — 建议穿宽松舒适、便于午睡的衣物',
        '<strong>保持电话畅通</strong> — 实验当天我们会电话联系您唤醒',
      ],
    },

    email: {
      scheduleLines: [
        '到场：<strong>上午 11:30</strong> 到达北京大学第六医院昌平院区',
        '行为任务：<strong>12:00 – 13:30</strong> 完成记忆编码任务、佩戴脑电',
        '午睡：<strong>13:30 – 15:00</strong>（约 90 分钟，全程脑电记录）',
        '醒后测试与离开：<strong>15:00 – 16:30</strong> 完成测试后当天离开',
      ],
      reminders: [
        '<strong>实验当天我们会在您平时起床时间的基础上提前约 1.5 小时给您打电话把您唤醒</strong>，以保证您当天的午睡质量，请务必保持手机畅通。',
        '本实验当天往返，无需在实验室过夜；请预留上午 11:30 前到达的时间。',
        '实验前一天及当天请勿摄入含咖啡因的饮品（咖啡、茶、可乐、能量饮料等），也不要饮酒。',
        '当天请勿服用影响睡眠的药物或褪黑素等助眠产品。',
        '<strong>请携带本人身份证</strong>，现场需核对个人信息以发放被试费。',
        '完成当天全部流程后可获得被试费 <strong>350 元</strong>。',
      ],
      phoneCallReminder: true,
    },

    calendar: {
      blockedDays: [],
      bookingWindow: 14,
      slotDays: 28,
      defaultCapacity: 1,
    },

    // nap 专属飞书表 token（描述用途；真正落库路由由 SCF 环境变量 BITABLE_PROJECTS['nap-memory'] 决定，须与此保持一致）
    bitable: {
      appToken: 'XUSHbPcOoabkXSsrXW8cWSnrn44',
      mainTableId: 'tblTZ57uVsIUzHjl',
      slotTableId: '',
      psqiTableId: 'tbllZexmUy0NlmKM',
      isiTableId: 'tblPr7R1P1JgBSel',
      rmeqTableId: 'tblPuOi8ZVm7sGyZ',
      dassTableId: 'tblbuLr7FIXgMa1i',
      waitlistTableId: '',
    },
  },
};

// The production SCF and the historical dry-run use the same question schema.
const EMOTION_FORM_SCHEMA = {
  copy: {
    "intro": "实验包括观看部分含不愉快内容的图片、完成学习与记忆任务，以及佩戴脑电帽在实验室过夜。第一天晚上到场，第二天早晨完成任务后离开；第三天上午返回实验室完成约40分钟测试。具体日期由实验员联系协商。",
    "dataUse": "您填写的基本信息、联系方式和问卷答案，将用于本项目的招募筛查、人工复核及后续联系，并进行保密管理。后续联系将按您在问卷中选择并提供的方式进行。公开发表的研究结果不会披露您的个人身份。",
    "candidate": "报名已收到，您已通过系统初筛并进入候选名单。实验员将进一步查看您的填写结果，如果确认您符合实验条件，实验员将通过您填写的联系方式，与您沟通实验的具体时间安排和注意事项。",
    "failed": "感谢您的报名。根据本次问卷结果，暂无法安排您参加本实验。",
    "late": "您目前的作息与本实验安排不太匹配，感谢您的报名。"
  },
  wording: {
    "basic": {
      "consent": "我已阅读并理解以上知情同意书，自愿参加本研究。",
      "B01": "您的姓名是？",
      "B02": "您的年龄是？请填写整数周岁。",
      "B03": "您的性别是？",
      "B04": "您目前的身份是？"
    },
    "psqi": {
      "q1": "过去一个月，您通常几点上床睡觉？",
      "q2": "过去一个月，您通常需要多长时间才能入睡？",
      "q3": "过去一个月，您通常早上几点起床？",
      "q4": "过去一个月，您每晚实际睡眠时间有多少小时？",
      "q5a": "过去一个月，您有多少次不能在30分钟内入睡？",
      "q5b": "过去一个月，您有多少次在半夜或凌晨醒来，睡眠被打断？",
      "q5c": "过去一个月，您有多少次在夜间睡眠过程中需要起床上厕所？",
      "q5d": "过去一个月，您有多少次因夜间呼吸不畅而睡不好？",
      "q5e": "过去一个月，您有多少次因自己咳嗽或大声打鼾而睡不好？",
      "q5f": "过去一个月，您有多少次因夜间感到太冷而睡不好？",
      "q5g": "过去一个月，您有多少次因夜间感到太热而睡不好？",
      "q5h": "过去一个月，您有多少次因做噩梦而睡不好？",
      "q5i": "过去一个月，您有多少次因夜间疼痛而睡不好？",
      "q5j": "过去一个月，您有多少次因上述情况之外的其他原因而睡不好？",
      "q6": "过去一个月，您多久服用一次助眠药物？",
      "q7": "过去一个月，您在工作、吃饭或从事社交活动时，有多少次感到难以保持清醒？",
      "q8": "过去一个月，您在做事时保持足够热情有多大困难？",
      "q9": "过去一个月，您对自己的睡眠质量总体评价如何？",
      "other": "请说明上述情况之外，还有哪些原因影响您的睡眠。"
    },
    "isi": [
      "入睡困难程度？",
      "维持睡眠困难程度？",
      "早醒问题？",
      "对睡眠模式的满意程度？",
      "睡眠问题对日常功能的影响程度？",
      "睡眠问题被他人注意到的程度？",
      "对睡眠问题的担忧程度？"
    ],
    "rmeq": [
      "如果您能够完全自由地计划白天的时间，您希望大约在什么时间起床？",
      "清晨起床后的半小时内，您的感觉如何？",
      "在夜晚，您大约到什么时候会感到疲倦、需要睡觉？",
      "一天之中，哪个时段是您状态最好的时间？",
      "人可分为「清晨」型（早鸟）和「夜晚」型（夜猫）两类，您认为自己属于哪一类？"
    ],
    "dass": [
      "我发现自己很难放松下来。",
      "我感到口干。",
      "我好像不能有什么好的感觉。",
      "我感到呼吸困难。",
      "我感到做事缺乏主动性。",
      "我对事情容易反应过度。",
      "我有颤抖的感觉（例如手抖）。",
      "我感到精神紧张。",
      "我担心自己在某些场合会惊慌失措出洋相。",
      "我觉得对未来没什么可期望的。",
      "我发现自己变得烦躁不安。",
      "我发现自己很难放松。",
      "我感到悲伤和沮丧。",
      "我不能容忍任何阻碍我做事的事物。",
      "我感到快要惊慌失措了。",
      "我对任何事情都不能产生热情。",
      "我觉得自己不怎么有价值。",
      "我觉得自己相当敏感。",
      "我感到心跳明显加快但并没有做任何体力活动。",
      "我无缘无故地感到害怕。",
      "我觉得生活没有意义。"
    ],
    "ac": {
      "AC01": {
        "text": "请在本题选择“有时符合”。",
        "options": [
          "不符合",
          "有时符合",
          "常常符合",
          "总是符合"
        ],
        "after": 9
      },
      "AC02": {
        "text": "过去半年里，我从来没有感到过疲倦或困倦。",
        "options": [
          "不符合，至少有过一次",
          "符合，一次也没有"
        ],
        "after": 14
      }
    }
  },
  config: PROJECT_CONFIGS['emotion-memory'],
  PSQI_Q5, FREQ03, ISI_Q, RMEQ_Q, DASS_Q, DASS_OPT,
};
if (typeof window !== 'undefined') window.PROJECT_CONFIGS = PROJECT_CONFIGS;
if (typeof module === 'object' && module.exports) module.exports = EMOTION_FORM_SCHEMA;
