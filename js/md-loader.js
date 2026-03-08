/* X-Sleep Lab — md-loader.js
 *
 * Provides render functions for publications, news, and team members.
 * Data source: content.js (SITE_CONTENT) — single source of truth.
 *
 * To update content: edit js/content.js, then push to GitHub.
 */

(function () {
  'use strict';

  var _data = (typeof SITE_CONTENT !== 'undefined') ? SITE_CONTENT : null;

  /* ── Bilingual string resolver ──────────────────────────────────── */
  function _t(obj, lang) {
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  }

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
      ugGrid.innerHTML = (_data.members.undergrad || []).map(function (m) {
        return _memberCard(m, lang);
      }).join('');
    }
  }

  /* ── Expose globals ─────────────────────────────────────────────── */
  window.renderPublications = _renderPublications;
  window.renderNewsPage     = _renderNewsPage;
  window.renderNewsStrip    = _renderNewsStrip;
  window.renderTeamMembers  = _renderTeamMembers;

})();
