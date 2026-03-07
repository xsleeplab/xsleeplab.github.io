/* X-Sleep Lab — Language Switch (default: English) */

(function () {
  const LANG_KEY = 'xsleeplab_lang';

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  function getPage() {
    const path = window.location.pathname + window.location.href;
    if (path.includes('team'))         return 'team';
    if (path.includes('research'))     return 'research';
    if (path.includes('publications')) return 'publications';
    if (path.includes('news'))         return 'news';
    if (path.includes('join'))         return 'join';
    return 'index';
  }

  function setText(key, value) {
    document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function setHTML(key, value) {
    document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) {
      el.innerHTML = value;
    });
  }

  function updateContent(lang) {
    if (typeof translations === 'undefined') return;
    var t = translations[lang];
    var page = getPage();

    /* ---- Global: nav ---- */
    setText('nav.home',         t.nav.home);
    setText('nav.team',         t.nav.team);
    setText('nav.research',     t.nav.research);
    setText('nav.publications', t.nav.publications);
    setText('nav.news',         t.nav.news);
    setText('nav.join',         t.nav.join);
    setText('breadcrumb.home',  t.nav.home);

    /* ---- Global: footer ---- */
    setText('footer.labName',      t.footer.labName);
    setText('footer.desc',         t.footer.desc);
    setText('footer.navTitle',     t.footer.navTitle);
    setText('footer.contactTitle', t.footer.contactTitle);
    setText('footer.address',      t.footer.address);
    setText('footer.copyright',    t.footer.copyright);

    /* ---- Page-specific ---- */
    if (page === 'index') {
      var idx = t.index;
      setText('index.slide1Tag',    idx.slide1Tag);
      setText('index.slide1Sub',    idx.slide1Sub);
      setText('index.slide1Cta',    idx.slide1Cta);
      setText('index.slide2Tag',    idx.slide2Tag);
      setText('index.slide2Title',  idx.slide2Title);
      setText('index.slide2Sub',    idx.slide2Sub);
      setText('index.slide2Cta',    idx.slide2Cta);
      setText('index.slide3Tag',    idx.slide3Tag);
      setText('index.slide3Title',  idx.slide3Title);
      setText('index.slide3Sub',    idx.slide3Sub);
      setText('index.slide3Cta',    idx.slide3Cta);
      setText('index.aboutLabel',   idx.aboutLabel);
      setText('index.aboutTitle',   idx.aboutTitle);
      setText('index.about1',       idx.about1);
      setText('index.about2',       idx.about2);
      setText('index.about3',       idx.about3);
      setText('index.statsLabel',   idx.statsLabel);
      setText('index.stat1Num',     idx.stat1Num);
      setText('index.stat1Label',   idx.stat1Label);
      setText('index.stat2Num',     idx.stat2Num);
      setText('index.stat2Label',   idx.stat2Label);
      setText('index.stat3Num',     idx.stat3Num);
      setText('index.stat3Label',   idx.stat3Label);
      setText('index.stat4Num',     idx.stat4Num);
      setText('index.stat4Label',   idx.stat4Label);
      setText('index.researchLabel',idx.researchLabel);
      setText('index.researchTitle',idx.researchTitle);
      setText('index.researchSub',  idx.researchSub);
      setText('index.r1Icon',       idx.r1Icon);
      setText('index.r1Title',      idx.r1Title);
      setText('index.r1Desc',       idx.r1Desc);
      setText('index.r1Link',       idx.r1Link);
      setText('index.r2Icon',       idx.r2Icon);
      setText('index.r2Title',      idx.r2Title);
      setText('index.r2Desc',       idx.r2Desc);
      setText('index.r2Link',       idx.r2Link);
      setText('index.r3Icon',       idx.r3Icon);
      setText('index.r3Title',      idx.r3Title);
      setText('index.r3Desc',       idx.r3Desc);
      setText('index.r3Link',       idx.r3Link);
      setText('index.newsLabel',    idx.newsLabel);
      setText('index.newsTitle',    idx.newsTitle);
      setText('index.viewAllNews',  idx.viewAllNews);
      /* News strip — rendered from content.js */
      if (typeof renderNewsStrip === 'function') renderNewsStrip(lang);
      document.title = lang === 'zh' ? 'X-Sleep Lab | 中科院心理所' : 'X-Sleep Lab | IPcas';
    }

    if (page === 'team') {
      var tm = t.team;
      setText('team.breadcrumb',     tm.breadcrumb);
      setText('team.pageTitle',      tm.pageTitle);
      setText('team.pageSub',        tm.pageSub);
      setText('team.piLabel',        tm.piLabel);
      setText('team.piName',         tm.piName);
      setText('team.piNameZh',       tm.piNameZh);
      setText('team.piRole',         tm.piRole);
      setHTML('team.piAffiliation',  tm.piAffiliation.replace(/\n/g, '<br>'));
      setText('team.piBio',          tm.piBio);
      setText('team.piRGLink',       tm.piRGLink);
      setText('team.piGSLink',       tm.piGSLink);
      setText('team.gradLabel',      tm.gradLabel);
      setText('team.raLabel',        tm.raLabel);
      setText('team.undergradLabel', tm.undergradLabel);
      setText('team.alumniLink',     tm.alumniLink);
      /* Member cards — rendered from content.js */
      if (typeof renderTeamMembers === 'function') renderTeamMembers(lang);
      document.title = lang === 'zh' ? '团队成员 | X-Sleep Lab' : 'Team | X-Sleep Lab';
    }

    if (page === 'research') {
      var rs = t.research;
      setText('research.breadcrumb', rs.breadcrumb);
      setText('research.pageTitle',  rs.pageTitle);
      setText('research.pageSub',    rs.pageSub);
      setText('research.item1Num',   rs.item1Num);
      setText('research.item1Title', rs.item1Title);
      setText('research.item1Text',  rs.item1Text);
      setText('research.item1Papers',rs.item1Papers);
      setText('research.item1p1',    rs.item1p1);
      setText('research.item1p2',    rs.item1p2);
      setText('research.item1p3',    rs.item1p3);
      setText('research.item2Num',   rs.item2Num);
      setText('research.item2Title', rs.item2Title);
      setText('research.item2Text',  rs.item2Text);
      setText('research.item2Papers',rs.item2Papers);
      setText('research.item2p1',    rs.item2p1);
      setText('research.item2p2',    rs.item2p2);
      setText('research.item3Num',   rs.item3Num);
      setText('research.item3Title', rs.item3Title);
      setText('research.item3Text',  rs.item3Text);
      setText('research.item3Papers',rs.item3Papers);
      setText('research.item3p1',    rs.item3p1);
      setText('research.item3p2',    rs.item3p2);
      document.title = lang === 'zh' ? '研究项目 | X-Sleep Lab' : 'Research | X-Sleep Lab';
    }

    if (page === 'publications') {
      var pb = t.publications;
      setText('publications.breadcrumb',     pb.breadcrumb);
      setText('publications.pageTitle',      pb.pageTitle);
      setText('publications.pageSub',        pb.pageSub);
      setText('publications.researchGate',   pb.researchGate);
      setText('publications.confTitle',      pb.confTitle);
      setText('publications.confPlaceholder',pb.confPlaceholder);
      setText('publications.awardsTitle',    pb.awardsTitle);
      setText('publications.awardsText',     pb.awardsText);
      /* Publication list — rendered from content.js */
      if (typeof renderPublications === 'function') renderPublications();
      document.title = lang === 'zh' ? '研究成果 | X-Sleep Lab' : 'Publications | X-Sleep Lab';
    }

    if (page === 'news') {
      var nw = t.news;
      setText('news.breadcrumb', nw.breadcrumb);
      setText('news.pageTitle',  nw.pageTitle);
      setText('news.pageSub',    nw.pageSub);
      /* News cards — rendered from content.js */
      if (typeof renderNewsPage === 'function') renderNewsPage(lang);
      document.title = lang === 'zh' ? '新闻动态 | X-Sleep Lab' : 'News | X-Sleep Lab';
    }

    if (page === 'join') {
      var jn = t.join;
      setText('join.breadcrumb',       jn.breadcrumb);
      setText('join.pageTitle',        jn.pageTitle);
      setText('join.pageSub',          jn.pageSub);
      setText('join.overviewLabel',    jn.overviewLabel);
      setText('join.overviewTitle',    jn.overviewTitle);
      setText('join.overviewText',     jn.overviewText);
      setText('join.phdLabel',         jn.phdLabel);
      setText('join.phdTitle',         jn.phdTitle);
      setText('join.phdText',          jn.phdText);
      setText('join.phdReqs',          jn.phdReqs);
      setText('join.phdReq1',          jn.phdReq1);
      setText('join.phdReq2',          jn.phdReq2);
      setText('join.phdReq3',          jn.phdReq3);
      setText('join.phdReq4',          jn.phdReq4);
      setText('join.phdHow',           jn.phdHow);
      setText('join.raLabel',          jn.raLabel);
      setText('join.raTitle',          jn.raTitle);
      setText('join.raText',           jn.raText);
      setText('join.ugLabel',          jn.ugLabel);
      setText('join.ugTitle',          jn.ugTitle);
      setText('join.ugText',           jn.ugText);
      setText('join.contactLabel',     jn.contactLabel);
      setText('join.contactTitle',     jn.contactTitle);
      setText('join.contactText',      jn.contactText);
      setText('join.addressLabel',     jn.addressLabel);
      setHTML('join.addressValue',     jn.addressValue.replace(/\n/g, '<br>'));
      setText('join.piLabel',          jn.piLabel);
      setText('join.piValue',          jn.piValue);
      setText('join.emailLabel',       jn.emailLabel);
      setText('join.emailValue',       jn.emailValue);
      document.title = lang === 'zh' ? '加入我们 | X-Sleep Lab' : 'Join Us | X-Sleep Lab';
    }

    /* ---- html lang attribute ---- */
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    /* ---- Toggle button state ---- */
    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function init() {
    var lang = getLang();
    updateContent(lang);

    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var newLang = this.dataset.lang;
        setLang(newLang);
        updateContent(newLang);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
