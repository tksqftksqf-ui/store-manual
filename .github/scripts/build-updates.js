// 產生 updates.json：{ "<卡片href>": "YYYY-MM-DD" }，首頁據此顯示「最後更新」與「新更新」標記
// 內頁 → 該頁與其依賴檔的最後 commit 日期；外部 GitHub 頁 → 該 repo 的最後 push 日期
const { execSync } = require('child_process');
const fs = require('fs');

const INTERNAL = {
  'search.html':    ['search.html', 'shared/products.js'],
  'npi.html':       ['npi.html', 'npi-img'],
  'arrivals.html':  ['arrivals.html', 'shared/products.js', 'shared/arrivals-data.js'],
  'edu.html':       ['edu.html'],
  'bts.html':       ['bts.html'],
  'jiaan.html':     ['jiaan.html', 'shared/products.js'],
  'planogram.html': ['planogram.html'],
  'security.html':  ['security.html', 'security-img'],
  'activity.html':  ['activity.html'],
};
const EXTERNAL = {
  'https://z0910861851.github.io/price-tag-crop/': 'z0910861851/price-tag-crop',
  'https://muska126-gif.github.io/Apple-Product-Release-Tool/': 'muska126-gif/Apple-Product-Release-Tool',
  'https://muska126-gif.github.io/mac-sales-advisor/': 'muska126-gif/mac-sales-advisor',
  'https://magicbrian1206-maker.github.io/applecare/': 'magicbrian1206-maker/applecare',
};

const tw = d => new Date(new Date(d).getTime() + 8 * 3600e3).toISOString().slice(0, 10); // 台灣日期
const out = {};

for (const [href, paths] of Object.entries(INTERNAL)) {
  const ds = paths.map(p => {
    try { return execSync(`git log -1 --format=%cI -- ${p}`, { encoding: 'utf8' }).trim(); } catch (e) { return ''; }
  }).filter(Boolean).sort();
  if (ds.length) out[href] = tw(ds[ds.length - 1]);
}

(async () => {
  for (const [href, repo] of Object.entries(EXTERNAL)) {
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
        headers: { 'User-Agent': 'store-manual-updates', Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      out[href] = tw(j[0].commit.committer.date);
    } catch (e) { console.warn('skip', repo, e.message); } // 抓不到就不寫，首頁沿用卡片上原本的日期
  }
  fs.writeFileSync('updates.json', JSON.stringify(out, null, 1) + '\n');
  console.log(out);
})();
