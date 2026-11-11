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
  {id:'habit-q5a', value:'严重打鼾或曾被诊断睡眠呼吸暂停（OSA）'},
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

window.PROJECT_CONFIGS = {

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

    steps: [
      'consent', 'basicInfo', 'vision', 'habit',
      'psqi', 'isi', 'rmeq', 'dass',
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
  //  筛选题文案来源：睡眠对情绪记忆的调节作用_公开招募上线资料.docx
  // ──────────────────────────────────────────────
  'emotion-memory': {
    id: 'emotion-memory',
    type: 'emotion',
    title: '睡眠对情绪记忆的调节作用',
    brief: '探索睡眠如何调节情绪记忆的加工。需到访实验室 2 次，完成问卷、情绪记忆任务与过夜睡眠记录。',
    visits: '2 次',
    duration: '第 1 次 19:00–次日 10:00；第 2 次约 10:00',
    reward: '完整参与 450 元',
    active: true,
    collectContactInBasic: false,   // 基本信息页不收集手机号/微信号；联系方式由 Q16a/Q16b 收集
    typeLabel: '情绪记忆实验',
    typeIcon: '💭',

    steps: [
      'consent', 'basicInfo', 'customScreening',
      'psqi', 'isi', 'rmeq', 'dass',
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
        id: 'Q01', text: '您是否曾被别人告知，自己晚上打呼噜（打鼾）？', type: 'radio',
        options: [
          { value: 'A', label: '从来没有人提到过' },
          { value: 'B', label: '偶尔被提到过一两次' },
          { value: 'C', label: '曾被反复提醒过，包括同一个人多次提醒' },
          { value: 'D', label: '不清楚或记不清' },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q02', text: '是否有人明确说过，您的鼾声很大，影响别人睡觉，或关上门后仍能听见？', type: 'radio',
        showIf: { questionId: 'Q01', value: ['B', 'C'] },
        options: [
          { value: 'A', label: '没有' },
          { value: 'B', label: '有' },
          { value: 'C', label: '不清楚或记不清' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q03', text: '换到陌生环境（如酒店、临时住宿处）睡觉时，您通常多久能入睡？', type: 'radio',
        options: [
          { value: 'A', label: '通常能在30分钟内入睡' },
          { value: 'B', label: '通常需要超过30分钟，或经常很难入睡' },
          { value: 'C', label: '没有类似经历，或不清楚' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q04', text: '平时睡觉时，您是否经常有以下情况？（多选）', type: 'checkbox',
        options: [
          { value: 'A', label: '持续的轻微背景声（如空调、风扇的运转声）使我难以入睡' },
          { value: 'B', label: '偶尔出现的轻微声音（如远处的说话声、走动声）会把我吵醒' },
          { value: 'C', label: '以上情况均无' },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q05', text: '过去1个月内，您夜间睡觉的鼻塞情况通常是？', type: 'radio',
        options: [
          { value: 'A', label: '没有鼻塞' },
          { value: 'B', label: '有鼻塞，但不影响夜间呼吸和睡眠' },
          { value: 'C', label: '鼻塞明显影响夜间呼吸或睡眠' },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q06', text: '过去1个月内，您是否有以下情况？（多选）', type: 'checkbox',
        options: [
          { value: 'A', label: '目前有经医生诊断的睡眠疾病（如睡眠呼吸暂停、不宁腿综合征、发作性睡病等）' },
          { value: 'B', label: '反复在睡眠中因憋气醒来，或已被告知睡觉时有呼吸停顿' },
          { value: 'C', label: '腿经常不舒服、很想活动，活动后缓解，并影响入睡或睡眠' },
          { value: 'D', label: '平均每周因尿意醒来、起床上厕所超过3次' },
          { value: 'E', label: '没有上述已知情况' },
        ],
        passIf: ['E'],
        mutexWith: { value: 'E', others: ['A', 'B', 'C', 'D'] },
      },
      {
        id: 'Q07', text: '过去1个月内，您是否有以下情况？（多选）', type: 'checkbox',
        options: [
          { value: 'A', label: '有夜班、通宵值班或昼夜轮换的工作／实习安排' },
          { value: 'B', label: '有跨时区旅行，出发地与目的地的时差达到2小时或以上' },
          { value: 'C', label: '以上均无' },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q08', text: '在普通安静的睡眠环境中，您使用耳塞的情况是？', type: 'radio',
        options: [
          { value: 'A', label: '平时不戴耳塞' },
          { value: 'B', label: '平时会戴耳塞，但不戴也能入睡' },
          { value: 'C', label: '不戴耳塞也经常难以入睡或容易醒来' },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q09', text: '过去1个月内，您是否吸烟，或使用含尼古丁的电子烟、戒烟贴片等产品？', type: 'radio',
        options: [
          { value: 'A', label: '没有' },
          { value: 'B', label: '有，包括偶尔使用' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q10', text: '您近期的用药或助眠产品使用情况是？（多选）请勿为参加实验自行停药或调整用药。', type: 'checkbox',
        options: [
          { value: 'A', label: '过去3个月内使用过安眠药、镇静药，或抗抑郁、抗焦虑等精神科药物' },
          { value: 'B', label: '目前或过去1周内使用过其他药物或助眠产品（如褪黑素、感冒药）' },
          { value: 'C', label: '以上均无' },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q11', text: '您是否有以下情况？（多选）', type: 'checkbox',
        options: [
          { value: 'A', label: '目前头皮有明显伤口、破损、红肿或持续瘙痒' },
          { value: 'B', label: '以前使用胶布或医用贴片时，贴敷部位曾出现明显红肿、起疹或瘙痒' },
          { value: 'C', label: '没有上述已知情况' },
        ],
        passIf: ['C'],
        mutexWith: { value: 'C', others: ['A', 'B'] },
      },
      {
        id: 'Q12', text: '最近3个月内，您是否染过头发？', type: 'radio',
        options: [
          { value: 'A', label: '否' },
          { value: 'B', label: '是' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q13', text: '您的听力情况是？', type: 'radio',
        options: [
          { value: 'A', label: '未发现听力问题，日常交谈和听音频没有困难' },
          { value: 'B', label: '有听力下降或听辨困难（包括只有一侧），或需要使用助听设备' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q14', text: '您观看电脑屏幕上的文字和图片时，属于以下哪种情况？', type: 'radio',
        options: [
          { value: 'A', label: '不戴眼镜也能看清' },
          { value: 'B', label: '佩戴合适的框架眼镜后能看清' },
          { value: 'C', label: '即使佩戴合适的眼镜，仍难以看清' },
        ],
        failIf: ['C'],
      },
      {
        id: 'Q15', text: '本实验包括观看部分含不愉快内容的图片、完成学习与记忆任务，以及佩戴脑电帽过夜。您是否愿意按上述安排参加？', type: 'radio',
        options: [
          { value: 'A', label: '已了解，愿意参加' },
          { value: 'B', label: '不愿意参加' },
        ],
        failIf: ['B'],
      },
      {
        id: 'Q16', text: '如您符合本实验的参与条件，您是否同意实验员通过您填写的手机号添加您的微信，联系您沟通实验时间安排及注意事项？（如手机号无法搜索到您的微信，实验员会通过手机短信与您联系）', type: 'radio',
        options: [
          { value: 'A', label: '同意' },
          { value: 'B', label: '不同意' },
        ],
      },
      {
        id: 'Q16a', text: '您的手机号是？', type: 'text', inputType: 'phone',
        showIf: { questionId: 'Q16', value: ['A'] },
        required: true,
      },
      {
        id: 'Q16b', text: '微信号（选填）您也可以直接填写微信号，实验员将通过您填写的微信号添加您的微信，与您联系。', type: 'text', inputType: 'text',
        showIf: { questionId: 'Q16', value: ['B'] },
        required: false,
        failIfEmpty: true,
      },
    ],

    guide: {
      scheduleSummary: [/* 待补充 */],
      timeline: [/* 待补充 */],
      prep: [/* 待补充 */],
    },

    email: {
      scheduleLines: [
        '第 1 次 — 晚上：<strong>19:00</strong> 到达实验室，熟悉环境',
        '第 1 次 — 晚间：<strong>19:30 – 23:00</strong> 完成记忆编码任务、佩戴脑电帽',
        '第 1 次 — 睡眠：<strong>23:00 – 07:00</strong>（全程脑电记录）',
        '第 1 次 — 晨间：<strong>07:00 – 10:00</strong> 完成情绪记忆测试后离开',
        '第 2 次 — 上午：<strong>10:00</strong> 到达实验室，完成后续情绪测试与问卷',
      ],
      reminders: [
        '本实验需到访实验室 2 次，第 1 次需在实验室过夜（19:00 至次日 10:00），请提前安排好事务。',
        '建议携带<strong>睡衣</strong>和个人洗漱用品。出于卫生考虑，实验室不提供牙刷。',
        '实验前一天及当天请勿饮用含酒精、咖啡因的饮品（咖啡、茶、可乐、能量饮料等）。',
        '实验需要佩戴脑电帽，您抵达实验室之后需要洗头，我们会提供洗发水和吹风机。',
        '<strong>请携带本人身份证或其他有效身份证件前来</strong>，实验现场需核对个人信息以发放被试费。',
        '完整参与全部 2 次实验后可获得报酬 <strong>450 元</strong>。',
      ],
      phoneCallReminder: false,
      breakfastNote: '我们将提供简单的早餐（牛奶与面包）。',
    },

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
};
