/* X-Sleep Lab — Centralized Content
 * To update the site: edit SITE_CONTENT below, then save.
 * No HTML editing required for content changes.
 */

const SITE_CONTENT = {

  /* ---- Lab Info ---- */
  lab: {
    email:       'xiatao@psych.ac.cn',
    established: 'January 2026',
    address: {
      en: 'No. 16 Lincui Road, Chaoyang District\nBeijing 100101, China\nInstitute of Psychology, CAS',
      zh: '北京市朝阳区林萃路16号院\n中国科学院心理研究所\n邮编 100101'
    }
  },

  /* ---- Publications (newest first within year) ---- */
  publications: [
    {
      year: 2026,
      html: '<strong>Xia, T.*</strong>, Hu, C.-P., Türker, B., Munoz Musat, E., Naccache, L., Arnulf, I., Oudiette, D.*, &amp; Hu, X.* (2026). How sleeping minds decide: State-specific reconfigurations of lexical decision-making. <em>PLoS Computational Biology</em>. <span style="font-size:0.86em; color:var(--color-primary-mid); font-style:italic;">(in press)</span>'
    },
    {
      year: 2025,
      html: '<strong>Xia, T.*</strong>, Hu, X.* (2025). Memory editing during sleep: mechanisms, clinical applications, and technological innovations. <em>Trends in Cognitive Sciences</em>. <a href="https://doi.org/10.1016/j.tics.2025.07.010" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2025,
      html: 'Liu, J.*, Chen, D., <strong>Xia, T.</strong>, Zeng, S., Xue, G., &amp; Hu, X.* (2025). Slow-wave sleep and REM sleep differentially contribute to memory representational transformation. <em>Communications Biology</em>, 8, 1407. <a href="https://doi.org/10.1038/s42003-025-08812-3" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2024,
      html: '<strong>Xia, T.</strong>, Chen, D., Zeng, S., Yao, Z., Liu, J., Qin, S., Paller, K.A., Torres-Platas, S.G., Antony, J.W., &amp; Hu, X.* (2024). Aversive memories can be weakened during human sleep via the reactivation of positive interfering memories. <em>Proceedings of the National Academy of Sciences</em>, 121(31), e2400678121. <a href="https://doi.org/10.1073/pnas.2400678121" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2024,
      html: 'Chen, D., <strong>Xia, T.</strong>, Yao, Z., Zhang, L., &amp; Hu, X.* (2024). Modulating social learning-induced evaluation updating during human sleep. <em>npj Science of Learning</em>, 9, 43. <a href="https://doi.org/10.1038/s41539-024-00255-5" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2024,
      html: 'Yao, Z., <strong>Xia, T.</strong>, Wei, J., Zhang, Z., Lin, X., Zhang, D., Qin, P., Ma, Y.*, &amp; Hu, X.* (2024). Reactivating positive personality traits during sleep promotes positive self-referential processing. <em>iScience</em>, 27, 110341. <a href="https://doi.org/10.1016/j.isci.2024.110341" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2024,
      html: 'Zhao, J., <strong>Xia, T.</strong>, &amp; Hu, C. (2024). The status quo, challenges, and recommendations of pre-registration in psychological science. <em>Advances in Psychological Science</em>, 32(5), 715–727. <span style="font-size:0.86em; color:var(--color-primary-mid); font-style:italic;">(in Chinese)</span> <a href="https://doi.org/10.3724/SP.J.1042.2024.00715" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2023,
      html: 'Liu, J., <strong>Xia, T.</strong>, Chen, D., Yao, Z., Zhu, M., Antony, J.W., Lee, T.M.*, &amp; Hu, X.* (2023). Item-specific neural representations during human sleep support long-term memory. <em>PLoS Biology</em>, 21(11): e3002399. <a href="https://doi.org/10.1371/journal.pbio.3002399" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2023,
      html: '<strong>Xia, T.</strong>, Yao, Z., Guo, X., Liu, J., Chen, D., Liu, Q.*, Paller, K.A., &amp; Hu, X.* (2023). Updating memories of unwanted emotions during human sleep. <em>Current Biology</em>, 33(2), 309–320. <a href="https://doi.org/10.1016/j.cub.2022.12.004" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2023,
      html: '<strong>Xia, T.</strong>, Antony, J., Paller, K.A., &amp; Hu, X.* (2023). Targeted memory reactivation during sleep influences social bias as a function of slow-oscillation phase and delta power. <em>Psychophysiology</em>. <a href="https://doi.org/10.1111/psyp.14224" target="_blank" rel="noopener">[DOI]</a>'
    },
    {
      year: 2023,
      html: 'Jin, R., <strong>Xia, T.</strong>, Gawronski, B., &amp; Hu, X.* (2023). Attitudinal Effects of Stimulus Co-occurrence and Stimulus Relations: Sleep Supports Propositional Learning Via Memory Consolidation. <em>Social Psychological and Personality Science</em>, 14(1), 51–59. <a href="https://doi.org/10.1177/19485506221078012" target="_blank" rel="noopener">[DOI]</a>'
    }
  ],

  /* ---- Preprints (newest first) ---- */
  preprints: [
    {
      html: 'Chen, D., <strong>Xia, T.</strong>, Liu, J., Zhang, Y., Zuo, X., Wu, H., Lai, C. S. W., &amp; Hu, X. (2026). Reactivating conflicting evaluative memories during sleep reduces decision ambivalence. <em>Preprint</em>. <a href="https://doi.org/10.64898/2026.03.11.710434" target="_blank" rel="noopener">[DOI]</a>'
    }
  ],

  /* ---- News Items (newest first)
   * homepageSlot: 1|2|3 → shown on homepage in that order
   * link: URL for "Read more" button on news page (null = no button)
   * homepageLink: URL for homepage strip card click (default: 'news.html')
   * readMore: { en, zh } for custom button text
   ---- */
  news: [
    {
      tag:      { en: 'Recruiting · 2026', zh: '诚聘英才 · 2026' },
      title:    { en: 'X-Sleep Lab is Recruiting a Research Assistant (1 opening)', zh: 'X-Sleep Lab 诚招科研助理（1 名）' },
      desc:     { en: 'We are looking for 1 motivated research assistant to support ongoing sleep neuroscience projects at the Institute of Psychology, Chinese Academy of Sciences.', zh: '诚招 1 名科研助理，协助中科院心理所 X-Sleep Lab 开展睡眠认知神经科学相关研究项目。' },
      date:     { en: '2026', zh: '2026年' },
      emoji:    '🔬',
      gradient: 'linear-gradient(135deg, #1A2E3D 0%, #3D607A 100%)',
      link:     'join.html',
      readMore: { en: 'See open positions →', zh: '查看招聘信息 →' },
      homepageSlot: 3
    },
    {
      tag:      { en: 'New Publication · 2026', zh: '新论文 · 2026' },
      title:    { en: 'How sleeping minds decide: State-specific reconfigurations of lexical decision-making', zh: '睡眠中的心智决策：词汇决策加工的状态特异性重构' },
      desc:     { en: 'Xia Tao et al. (2026). A new study on how sleeping minds reconfigure lexical decision processing. <em>PLoS Computational Biology</em>.', zh: '夏涛等（2026年）。关于睡眠如何重构词汇决策加工的新研究，发表于《PLoS 计算生物学》。' },
      date:     { en: 'January 2026', zh: '2026年1月' },
      emoji:    '🧠',
      gradient: 'linear-gradient(135deg, #1E3347 0%, #3D607A 100%)',
      image:    'news_pic/plos-computational-biology.png',
      link:     null,
      homepageLink: 'news.html',
      homepageSlot: 2
    },
    {
      tag:      { en: 'New Publication · 2025', zh: '新论文 · 2025' },
      title:    { en: 'Memory editing during sleep: mechanisms, clinical applications, and technological innovations', zh: '睡眠中的记忆编辑：机制、临床应用与技术创新' },
      desc:     { en: 'A comprehensive review co-authored by Xia Tao and Xiaoqing Hu. <em>Trends in Cognitive Sciences</em>, 2025.', zh: '夏涛与胡晓晴合著综述，发表于《认知科学趋势》，2025年9月。' },
      date:     { en: 'September 2025', zh: '2025年9月' },
      emoji:    '📚',
      gradient: 'linear-gradient(135deg, #1E3347 0%, #4A6580 100%)',
      image:    'news_pic/trends-in-cognitive-sciences.png',
      link:     'https://doi.org/10.1016/j.tics.2025.07.010',
      readMore: { en: 'Read paper →', zh: '阅读论文 →' },
      homepageLink: 'news.html',
      homepageSlot: 1
    },
    {
      tag:      { en: 'New Publication · PNAS 2024', zh: '新论文 · PNAS 2024' },
      title:    { en: 'Aversive memories can be weakened during human sleep via reactivation of positive interfering memories', zh: '睡眠中可通过再激活正性干扰记忆来削弱厌恶性记忆' },
      desc:     { en: 'Published in <em>Proceedings of the National Academy of Sciences</em>, 2024. A landmark study demonstrating targeted emotional memory modification during sleep.', zh: '发表于《美国科学院院刊》，2024年。证明睡眠中可进行靶向情绪记忆调控的里程碑研究。' },
      date:     { en: 'August 2024', zh: '2024年8月' },
      emoji:    '🌙',
      gradient: 'linear-gradient(135deg, #2E4A63 0%, #6B8BA4 100%)',
      image:    'news_pic/pnas.png',
      link:     'https://doi.org/10.1073/pnas.2400678121',
      readMore: { en: 'Read paper →', zh: '阅读论文 →' }
    },
    {
      tag:      { en: 'New Publication · Current Biology 2023', zh: '新论文 · Current Biology 2023' },
      title:    { en: 'Updating memories of unwanted emotions during human sleep', zh: '在人类睡眠中更新不想要的情绪记忆' },
      desc:     { en: 'Published in <em>Current Biology</em>, 2023. Using targeted memory reactivation during NREM sleep to update the emotional content of aversive memories.', zh: '发表于《当代生物学》，2023年。利用 NREM 睡眠期间的靶向记忆再激活更新厌恶性记忆的情绪内容。' },
      date:     { en: 'January 2023', zh: '2023年1月' },
      emoji:    '✨',
      gradient: 'linear-gradient(135deg, #1E3347 0%, #4A6580 80%)',
      image:    'news_pic/current-biology.png',
      link:     'https://doi.org/10.1016/j.cub.2022.12.004',
      readMore: { en: 'Read paper →', zh: '阅读论文 →' }
    }
  ],

  /* ---- Team Members (non-PI) ---- */
  members: {
    grad: [
      {
        seed:     'baoyiru',
        name:     { en: 'Yiru Bao 包一茹', zh: 'Yiru Bao 包一茹' },
        title:    { en: 'Ph.D. Candidate',    zh: '博士在读' },
        education:'B.Sc.',
        email:    'baoyr@psych.ac.cn',
        research: { en: 'Sleep &amp; memory modulation', zh: '睡眠与记忆调控' },
        photo:    'home_pic/byr.png'
      },
      {
        seed:     'chenjiahe',
        name:     { en: 'Jiahe Chen 陈嘉禾', zh: 'Jiahe Chen 陈嘉禾' },
        title:    { en: 'Visiting Graduate Student · Beijing Normal University', zh: '访问研究生 · 北京师范大学' },
        education:'B.Sc.',
        email:    '',
        research: { en: 'Sleep BCI &amp; memory consolidation', zh: '睡眠脑机接口与记忆巩固' },
        photo:    'home_pic/chenjiahe.png'
      },
      {
        seed:     'zhangtiantong',
        name:     { en: 'Tiantong Zhang 张天彤', zh: 'Tiantong Zhang 张天彤' },
        title:    { en: 'Visiting Graduate Student · Beijing Forestry University', zh: '访问研究生 · 北京林业大学' },
        education:'B.Sc.',
        email:    '',
        research: { en: 'Sleep &amp; emotional memory', zh: '睡眠与情绪记忆' },
        photo:    'home_pic/zhangtiantong.png'
      },
    ],
    ra: [
      {
        seed:     'linxiaoai',
        name:     { en: 'Xiaoai Lin 蔺小艾', zh: 'Xiaoai Lin 蔺小艾' },
        title:    { en: 'Research Assistant', zh: '研究助理' },
        education:'B.Sc.',
        email:    '',
        research: { en: 'Sleep &amp; memory editing', zh: '睡眠与记忆编辑' },
        photo:    'home_pic/linxiaoai.png'
      },
      {
        seed:     'rax',
        name:     { en: 'This could be you', zh: '也许就是你' },
        title:    { en: 'Research Assistant',  zh: '研究助理' },
        education:'',
        email:    'xiatao@psych.ac.cn',
        research: { en: 'We are recruiting — <a href="join.html">Join us →</a>', zh: '正在招募中 — <a href="join.html">加入我们 →</a>' }
      }
    ],
    undergrad: [
      {
        seed:     'ugx',
        name:     { en: 'Undergraduate Researcher', zh: '本科生研究员' },
        title:    { en: 'Undergraduate Student',     zh: '本科生' },
        education:'B.Sc. (in progress)',
        email:    'ug@psych.ac.cn',
        research: { en: 'Sleep, memory &amp; behavior', zh: '睡眠、记忆与行为' }
      }
    ]
  }
};

/* ================================================================
 * RENDER FUNCTIONS
 * Called by lang-switch.js after language is determined.
 * ================================================================ */

/* ---- Helper: resolve bilingual string ---- */
function _t(obj, lang) {
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
}

/* ---- Render: Publications page ---- */
function renderPublications() {
  var container = document.getElementById('pub-list');
  if (!container || !SITE_CONTENT) return;

  var html = '';

  /* Preprints section (header only for now) */
  html += '<div class="pub-year-block">' +
    '<h2 class="pub-year">Preprints</h2>';

  if (SITE_CONTENT.preprints && SITE_CONTENT.preprints.length) {
    html += SITE_CONTENT.preprints.map(function (p) {
      return '<div class="pub-entry">' + p.html + '</div>';
    }).join('');
  } else {
    html += '<div class="pub-entry">Preprints will be listed here.</div>';
  }

  html += '</div>';

  var yearMap = {};
  SITE_CONTENT.publications.forEach(function (pub) {
    if (!yearMap[pub.year]) yearMap[pub.year] = [];
    yearMap[pub.year].push(pub);
  });

  var years = Object.keys(yearMap).sort(function (a, b) { return b - a; });

  html += years.map(function (year) {
    return '<div class="pub-year-block">' +
      '<h2 class="pub-year">' + year + '</h2>' +
      yearMap[year].map(function (pub) {
        return '<div class="pub-entry">' + pub.html + '</div>';
      }).join('') +
      '</div>';
  }).join('');

  container.innerHTML = html;
}

/* ---- Render: News page grid ---- */
function renderNewsPage(lang) {
  var container = document.getElementById('news-grid');
  if (!container || !SITE_CONTENT) return;
  lang = lang || 'en';

  container.innerHTML = SITE_CONTENT.news.map(function (item) {
    var tag   = _t(item.tag,   lang);
    var title = _t(item.title, lang);
    var desc  = _t(item.desc,  lang);
    var date  = _t(item.date,  lang);

    var mediaHtml;
    if (item.image) {
      mediaHtml = '<img class="news-card-img" src="' + item.image + '" alt="' + title + '">';
    } else {
      mediaHtml = '<div class="news-card-placeholder" style="background: ' + item.gradient + ';">' + item.emoji + '</div>';
    }

    var readMoreHtml = '';
    if (item.link) {
      var isExt   = item.link.indexOf('http') === 0;
      var attrs   = isExt ? ' target="_blank" rel="noopener"' : '';
      var rmText  = item.readMore ? _t(item.readMore, lang) : (lang === 'zh' ? '阅读更多 →' : 'Read more →');
      readMoreHtml = '<a href="' + item.link + '"' + attrs + ' class="news-read-more">' + rmText + '</a>';
    }

    return '<article class="news-card">' +
      mediaHtml +
      '<div class="news-card-body">' +
        '<span class="news-tag">' + tag + '</span>' +
        '<h3>' + title + '</h3>' +
        '<p>' + desc + '</p>' +
        readMoreHtml +
        '<span class="news-date">' + date + '</span>' +
      '</div>' +
    '</article>';
  }).join('');
}

/* ---- Render: Homepage news strip ---- */
function renderNewsStrip(lang) {
  var container = document.getElementById('news-strip-grid');
  if (!container || !SITE_CONTENT) return;
  lang = lang || 'en';

  var items = SITE_CONTENT.news
    .filter(function (n) { return n.homepageSlot; })
    .sort(function (a, b) { return a.homepageSlot - b.homepageSlot; });

  container.innerHTML = items.map(function (item) {
    var tag   = _t(item.tag,   lang);
    var title = _t(item.title, lang);
    var desc  = _t(item.desc,  lang);
    var date  = _t(item.date,  lang);

    var href = (item.homepageLink !== undefined) ? item.homepageLink : (item.link || 'news.html');
    if (!href) href = 'news.html';
    var isExt  = href.indexOf('http') === 0;
    var attrs  = isExt ? ' target="_blank" rel="noopener"' : '';

    return '<a href="' + href + '" class="news-strip-card"' + attrs + '>' +
      '<span class="news-strip-tag">' + tag + '</span>' +
      '<h4>' + title + '</h4>' +
      '<p>' + desc + '</p>' +
      '<span class="news-strip-date">' + date + '</span>' +
    '</a>';
  }).join('');
}

/* ---- Render: Team member card HTML ---- */
function _memberCard(member, lang) {
  var name     = _t(member.name,     lang);
  var title    = _t(member.title,    lang);
  var research = _t(member.research, lang);

  return '<article class="member-card">' +
    '<img class="member-avatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.seed + '" alt="" width="100" height="100">' +
    '<h3>' + name + '</h3>' +
    '<p class="member-title">' + title + '</p>' +
    '<p class="member-education">' + member.education + '</p>' +
    '<p class="member-contact"><a href="mailto:' + member.email + '">' + member.email + '</a></p>' +
    '<p class="member-research">' + research + '</p>' +
  '</article>';
}

/* ---- Render: Team members (grad / RA / undergrad) ---- */
function renderTeamMembers(lang) {
  if (!SITE_CONTENT || !SITE_CONTENT.members) return;
  lang = lang || 'en';

  var gradGrid = document.getElementById('grad-grid');
  if (gradGrid) {
    gradGrid.innerHTML = SITE_CONTENT.members.grad.map(function (m) {
      return _memberCard(m, lang);
    }).join('');
  }

  var raGrid = document.getElementById('ra-grid');
  if (raGrid) {
    raGrid.innerHTML = SITE_CONTENT.members.ra.map(function (m) {
      return _memberCard(m, lang);
    }).join('');
  }

  var ugGrid = document.getElementById('undergrad-grid');
  if (ugGrid) {
    ugGrid.innerHTML = SITE_CONTENT.members.undergrad.map(function (m) {
      return _memberCard(m, lang);
    }).join('');
  }
}
