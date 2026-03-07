/* X-Sleep Lab — md-loader.js
 *
 * Provides render functions for publications, news, and team members.
 *
 * Data priority (highest wins):
 *  1. SITE_DATA.md  — fetched at runtime (needs HTTP server / Live Server)
 *  2. SITE_CONTENT  — from content.js (synchronous, always available)
 *
 * This means the site works immediately via content.js, and SITE_DATA.md
 * overrides content when a server is running.
 */

(function () {
  'use strict';

  /* ── Internal state ─────────────────────────────────────────────── */
  var _data = null;

  /* ── Seed data immediately from content.js (synchronous) ─────────
   * content.js is loaded before this script and defines SITE_CONTENT.
   * We use it as the immediate data source so the page renders at once. */
  if (typeof SITE_CONTENT !== 'undefined') {
    _data = SITE_CONTENT;
  }

  /* ── Bilingual string resolver ──────────────────────────────────── */
  function _t(obj, lang) {
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  }

  /* ════════════════════════════════════════════════════════════════
   * RENDER FUNCTIONS  (same interface as old content.js)
   * ════════════════════════════════════════════════════════════════ */

  /* ── Publications page ──────────────────────────────────────────── */
  function _renderPublications() {
    var container = document.getElementById('pub-list');
    if (!container || !_data) return;

    var html = '<div class="pub-year-block">' +
      '<h2 class="pub-year">Preprints</h2>';

    if (_data.preprints && _data.preprints.length) {
      html += _data.preprints.map(function (p) {
        return '<div class="pub-entry">' + p.html + '</div>';
      }).join('');
    } else {
      html += '<div class="pub-entry">Preprints will be listed here.</div>';
    }
    html += '</div>';

    var yearMap = {};
    _data.publications.forEach(function (pub) {
      if (!yearMap[pub.year]) yearMap[pub.year] = [];
      yearMap[pub.year].push(pub);
    });
    var years = Object.keys(yearMap).sort(function (a, b) { return b - a; });
    html += years.map(function (year) {
      return '<div class="pub-year-block">' +
        '<h2 class="pub-year">' + year + '</h2>' +
        yearMap[year].map(function (p) {
          return '<div class="pub-entry">' + p.html + '</div>';
        }).join('') +
        '</div>';
    }).join('');

    container.innerHTML = html;
  }

  /* ── News page grid ─────────────────────────────────────────────── */
  function _renderNewsPage(lang) {
    var container = document.getElementById('news-grid');
    if (!container || !_data) return;

    container.innerHTML = _data.news.map(function (item) {
      var media = item.image
        ? '<img class="news-card-img" src="' + item.image + '" alt="' + _t(item.title, lang) + '">'
        : '<div class="news-card-placeholder" style="background:' + item.gradient + ';">' + item.emoji + '</div>';

      var rmHtml = '';
      if (item.link) {
        var ext = item.link.indexOf('http') === 0;
        var rmText = item.readMore ? _t(item.readMore, lang) : (lang === 'zh' ? '阅读更多 →' : 'Read more →');
        rmHtml = '<a href="' + item.link + '"' +
          (ext ? ' target="_blank" rel="noopener"' : '') +
          ' class="news-read-more">' + rmText + '</a>';
      }

      return '<article class="news-card">' + media +
        '<div class="news-card-body">' +
          '<span class="news-tag">' + _t(item.tag, lang) + '</span>' +
          '<h3>' + _t(item.title, lang) + '</h3>' +
          '<p>' + _t(item.desc, lang) + '</p>' +
          rmHtml +
          '<span class="news-date">' + _t(item.date, lang) + '</span>' +
        '</div></article>';
    }).join('');
  }

  /* ── Homepage news strip ────────────────────────────────────────── */
  function _renderNewsStrip(lang) {
    var container = document.getElementById('news-strip-grid');
    if (!container || !_data) return;

    var items = _data.news
      .filter(function (n) { return n.homepageSlot; })
      .sort(function (a, b) { return a.homepageSlot - b.homepageSlot; });

    container.innerHTML = items.map(function (item) {
      var href = (item.homepageLink !== undefined) ? item.homepageLink : (item.link || 'news.html');
      if (!href) href = 'news.html';
      var ext = href.indexOf('http') === 0;
      return '<a href="' + href + '" class="news-strip-card"' +
        (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="news-strip-tag">' + _t(item.tag, lang) + '</span>' +
        '<h4>' + _t(item.title, lang) + '</h4>' +
        '<p>' + _t(item.desc, lang) + '</p>' +
        '<span class="news-strip-date">' + _t(item.date, lang) + '</span>' +
        '</a>';
    }).join('');
  }

  /* ── Team member card HTML ──────────────────────────────────────── */
  function _memberCard(member, lang) {
    var avatarSrc = member.photo
      ? member.photo
      : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.seed;
    return '<article class="member-card">' +
      '<img class="member-avatar" src="' + avatarSrc + '" alt="" width="100" height="100">' +
      '<h3>' + _t(member.name, lang) + '</h3>' +
      '<p class="member-title">' + _t(member.title, lang) + '</p>' +
      '<p class="member-education">' + member.education + '</p>' +
      '<p class="member-contact"><a href="mailto:' + member.email + '">' + member.email + '</a></p>' +
      '<p class="member-research">' + _t(member.research, lang) + '</p>' +
      '</article>';
  }

  /* ── Team members (grad / RA / undergrad) ───────────────────────── */
  function _renderTeamMembers(lang) {
    if (!_data || !_data.members) return;

    var gradGrid = document.getElementById('grad-grid');
    if (gradGrid) {
      gradGrid.innerHTML = _data.members.grad.map(function (m) {
        return _memberCard(m, lang);
      }).join('');
    }

    var raGrid = document.getElementById('ra-grid');
    if (raGrid) {
      raGrid.innerHTML = _data.members.ra.map(function (m) {
        return _memberCard(m, lang);
      }).join('');
    }

    var ugGrid = document.getElementById('undergrad-grid');
    if (ugGrid) {
      ugGrid.innerHTML = _data.members.undergrad.map(function (m) {
        return _memberCard(m, lang);
      }).join('');
    }

    /* Update PI avatar if SITE_DATA.md provides a photo */
    if (_data.pi && _data.pi.photo) {
      var piAvatar = document.getElementById('pi-avatar');
      if (piAvatar) piAvatar.src = _data.pi.photo;
    }
  }

  /* ── Inject research direction images (from SITE_DATA.md) ────────── */
  function _applyResearchImages() {
    if (!_data || !_data.research) return;
    var r = _data.research;
    var map = {
      r1_image: '.highlight-media--r1',
      r2_image: '.highlight-media--r2',
      r3_image: '.highlight-media--r3'
    };
    Object.keys(map).forEach(function (key) {
      if (r[key]) {
        document.querySelectorAll(map[key]).forEach(function (el) {
          el.style.backgroundImage = 'url(\'' + r[key] + '\')';
        });
      }
    });
  }

  /* ── Expose globals (overrides content.js render functions) ────────
   * These are defined synchronously so lang-switch.js can call them. */
  window.renderPublications = _renderPublications;
  window.renderNewsPage     = _renderNewsPage;
  window.renderNewsStrip    = _renderNewsStrip;
  window.renderTeamMembers  = _renderTeamMembers;

  /* ════════════════════════════════════════════════════════════════
   * OPTIONAL: fetch SITE_DATA.md to override content.js data.
   * Works when using VS Code Live Server or any HTTP server.
   * Silently ignored when opening via file:// protocol.
   * ════════════════════════════════════════════════════════════════ */

  /* ── Markdown → HTML converter ──────────────────────────────────── */
  function mdToHtml(text) {
    if (!text) return '';
    var h = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    h = h.replace(/_\(([^)]+)\)_/g,
      '<span style="font-size:0.86em;color:var(--color-primary-mid);font-style:italic;">($1)</span>');
    return h;
  }

  function parseKV(text) {
    var result = {};
    text.split('\n').forEach(function (line) {
      var m = line.match(/^([a-zA-Z_]+):\s*(.*)/);
      if (m) result[m[1]] = m[2].trim();
    });
    return result;
  }

  function nv(v) {
    return (!v || v === '(none)' || v === 'null') ? null : v;
  }

  function parsePublications(text) {
    var pubs = [];
    var yearBlocks = text.split(/^###\s*/m);
    yearBlocks.forEach(function (block) {
      if (!block.trim()) return;
      var lines = block.split('\n');
      var year = parseInt(lines[0].trim(), 10);
      if (!year) return;
      lines.slice(1).forEach(function (line) {
        if (/^\s*-\s+/.test(line)) {
          pubs.push({ year: year, html: mdToHtml(line.replace(/^\s*-\s+/, '')) });
        }
      });
    });
    return pubs;
  }

  function parseNews(text) {
    var items = [];
    var blocks = text.split(/^###\s+Item\b/m);
    blocks.forEach(function (block) {
      if (!block.trim()) return;
      var kv = parseKV(block);
      if (!kv.tag_en) return;
      var slot = kv.homepage_slot ? parseInt(kv.homepage_slot, 10) : undefined;
      if (isNaN(slot)) slot = undefined;
      items.push({
        tag:          { en: kv.tag_en   || '', zh: kv.tag_zh   || '' },
        title:        { en: kv.title_en || '', zh: kv.title_zh || '' },
        desc:         { en: mdToHtml(kv.desc_en || ''), zh: mdToHtml(kv.desc_zh || '') },
        date:         { en: kv.date_en  || '', zh: kv.date_zh  || '' },
        emoji:        kv.emoji    || '📄',
        gradient:     kv.gradient || 'linear-gradient(135deg, #1E3347 0%, #3D607A 100%)',
        image:        nv(kv.image),
        link:         nv(kv.link),
        readMore:     { en: kv.readmore_en || 'Read more →', zh: kv.readmore_zh || '阅读更多 →' },
        homepageSlot: slot,
        homepageLink: kv.homepage_link || 'news.html'
      });
    });
    return items;
  }

  function parseTeamSection(text) {
    var members = [];
    var blocks = text.split(/^###\s+/m);
    blocks.forEach(function (block) {
      if (!block.trim()) return;
      var kv = parseKV(block);
      if (!kv.name_en) return;
      members.push({
        seed:      kv.seed || kv.name_en.replace(/\s+/g, '').toLowerCase(),
        name:      { en: kv.name_en, zh: kv.name_zh || kv.name_en },
        title:     { en: kv.title_en  || '', zh: kv.title_zh  || '' },
        education: kv.education || '',
        email:     kv.email     || '',
        photo:     nv(kv.photo),
        research:  { en: kv.research_en || '', zh: kv.research_zh || '' }
      });
    });
    return members;
  }

  function parseSiteData(text) {
    var data = {
      publications: _data ? _data.publications.slice() : [],
      preprints:    _data ? (_data.preprints || []) : [],
      news:         _data ? _data.news.slice()         : [],
      members:      _data ? JSON.parse(JSON.stringify(_data.members)) : { grad: [], ra: [], undergrad: [] },
      lab:          {},
      pi:           {},
      research:     {}
    };
    var parts = text.split(/^(?=## [A-Z_])/m);
    parts.forEach(function (part) {
      var m = part.match(/^## ([A-Z_]+)[^\n]*\n([\s\S]*)/);
      if (!m) return;
      var name = m[1], body = m[2];
      switch (name) {
        case 'LAB':                 data.lab               = parseKV(body); break;
        case 'RESEARCH_IMAGES':     data.research          = parseKV(body); break;
        case 'PUBLICATIONS':        data.publications      = parsePublications(body); break;
        case 'NEWS':                data.news              = parseNews(body); break;
        case 'TEAM_PI':             data.pi                = parseKV(body); break;
        case 'TEAM_GRAD':           data.members.grad      = parseTeamSection(body); break;
        case 'TEAM_RA':             data.members.ra        = parseTeamSection(body); break;
        case 'TEAM_UNDERGRAD':      data.members.undergrad = parseTeamSection(body); break;
      }
    });
    return data;
  }

  function getPage() {
    var href = window.location.href;
    if (href.indexOf('team')         !== -1) return 'team';
    if (href.indexOf('publications') !== -1) return 'publications';
    if (href.indexOf('news')         !== -1) return 'news';
    return 'index';
  }

  function getLang() {
    return localStorage.getItem('xsleeplab_lang') || 'en';
  }

  /* Try to load SITE_DATA.md — silently skipped if server not available */
  if (typeof fetch !== 'undefined') {
    fetch('SITE_DATA.md')
      .then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        return r.text();
      })
      .then(function (text) {
        _data = parseSiteData(text);
        _applyResearchImages();
        /* Re-render current page with updated data from SITE_DATA.md */
        var page = getPage();
        var lang = getLang();
        if (page === 'index')        { _renderNewsStrip(lang); }
        if (page === 'news')         { _renderNewsPage(lang); }
        if (page === 'publications') { _renderPublications(); }
        if (page === 'team')         { _renderTeamMembers(lang); }
      })
      .catch(function () {
        /* SITE_DATA.md not available — content.js data is already in use */
      });
  }

})();
