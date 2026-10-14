/* 門市工具箱使用統計。
   同一瀏覽器、同一天只計 1 人；各頁同一天只計 1 次。
   不上傳姓名或裝置識別碼，只對公開計數器 +1。 */
(function (root, factory) {
  var api = factory();
  root.ToolboxUsage = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && root.location) api.track(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var HOST = 'tksqftksqf-ui.github.io';
  var NS = 'dc-pt-toolbox-8e2c';
  var ENDPOINT = 'https://abacus.jasoncameron.dev';
  var STORAGE_KEY = 'toolbox-usage-v1';
  var SKIP_PAGE = 'stats.html';
  var PAGES = [
    ['index.html', '首頁'],
    ['search.html', '貨號查詢'],
    ['npi.html', 'NPI 新品快學'],
    ['activity.html', '優惠活動'],
    ['arrivals.html', '近期到貨'],
    ['edu.html', '教育優惠'],
    ['bts.html', 'BTS 開學季'],
    ['jiaan.html', '激安活動'],
    ['planogram.html', 'Planogram'],
    ['security.html', '展示機規範']
  ];

  function taipeiDay(date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  function recentDays(now, count) {
    var days = [];
    var i;
    for (i = count - 1; i >= 0; i -= 1) {
      days.push(taipeiDay(new Date(now.getTime() - i * 86400000)));
    }
    return days;
  }

  function pageKey(pathname) {
    var parts = String(pathname || '').split('/').filter(Boolean);
    var last = parts.length ? parts[parts.length - 1] : 'index.html';
    if (last === 'store-manual') return 'index.html';
    if (!/\.html$/i.test(last)) return null;
    return last;
  }

  function freshState(day) {
    return { day: day, visitor: false, pages: {} };
  }

  function normalize(state, day) {
    if (!state || state.day !== day || !state.pages || typeof state.pages !== 'object') {
      return freshState(day);
    }
    return { day: day, visitor: !!state.visitor, pages: Object.assign({}, state.pages) };
  }

  function planHit(state, ctx) {
    if (!ctx || ctx.hostname !== HOST) return { state: state, keys: [] };
    var page = pageKey(ctx.pathname);
    if (!page || page === SKIP_PAGE) return { state: state, keys: [] };
    var day = taipeiDay(ctx.now instanceof Date ? ctx.now : new Date());
    var next = normalize(state, day);
    var keys = [];
    if (!next.visitor) {
      next.visitor = true;
      keys.push(day);
    }
    if (!next.pages[page]) {
      next.pages[page] = true;
      keys.push(day + '__' + page);
    }
    return { state: next, keys: keys };
  }

  function counterUrl(action, key) {
    return ENDPOINT + '/' + action + '/' + NS + '/' + encodeURIComponent(key);
  }

  function hit(key) {
    if (typeof fetch !== 'function') return;
    fetch(counterUrl('hit', key), { method: 'GET', mode: 'cors', keepalive: true }).catch(function () {});
  }

  function readState(storage) {
    try {
      return JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      return null;
    }
  }

  function track(win) {
    var target = win || (typeof window !== 'undefined' ? window : null);
    if (!target || !target.location || !target.localStorage) return;
    var planned = planHit(readState(target.localStorage), {
      hostname: target.location.hostname,
      pathname: target.location.pathname,
      now: new Date()
    });
    if (!planned.keys.length) return;
    try {
      target.localStorage.setItem(STORAGE_KEY, JSON.stringify(planned.state));
    } catch (err) {
      return;
    }
    planned.keys.forEach(hit);
  }

  return {
    HOST: HOST,
    PAGES: PAGES,
    SKIP_PAGE: SKIP_PAGE,
    taipeiDay: taipeiDay,
    recentDays: recentDays,
    pageKey: pageKey,
    planHit: planHit,
    counterUrl: counterUrl,
    track: track
  };
});
