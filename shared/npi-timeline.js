// 新品快學發售時程（npi.html 與首頁共用）：新增發表項目時填 pre（預購開始日）與 launch（發售日），格式 YYYY-MM-DD；沒填 launch＝台灣未上市
// short＝首頁卡片說明用的簡稱
const NPI_TIMELINE = [
  {keys:['p18pro','watch','airpods'], short:'iPhone 18 Pro／AW／AirPods 5', name:'iPhone 18 Pro系列／AW S12＆Ultra 4／AirPods 5', date:'9/11–12 預購・9/18 發售', pre:'2026-09-11', launch:'2026-09-18'},
  {keys:['macmini'], short:'Mac mini', name:'Mac mini M6＆M5 Pro', date:'8/27–9/20 預購・9/22 發售', pre:'2026-08-27', launch:'2026-09-22'},
  {keys:['duo'], short:'iPhone Duo', name:'iPhone Duo 摺疊機', date:'10/16 晚間8點預購・10/23 發售', pre:'2026-10-16', launch:'2026-10-23'},
  {keys:['homepod'], short:'HomePod mini 2', name:'HomePod mini 2', date:'10/15 預購・10/30 發售', pre:'2026-10-15', launch:'2026-10-30'},
  {keys:['appletv'], short:'Apple TV 4K', name:'Apple TV 4K（第 4 代）', date:'10/15 預購・11/13 發售', pre:'2026-10-15', launch:'2026-11-13'},
  {keys:['mbp14m6'], short:'MacBook Pro M6', name:'MacBook Pro 14吋 M6', date:'10/29 01:10 預購・11/6 發售', pre:'2026-10-29', launch:'2026-11-06'},
  {keys:['imacm6'], short:'iMac M6', name:'iMac 24吋 M6', date:'10/29 01:10 預購・11/6 發售', pre:'2026-10-29', launch:'2026-11-06'},
  {keys:['ipadmini8'], short:'iPad mini 8', name:'iPad mini 8（2026）', date:'10/29 01:10 預購・11/6 發售', pre:'2026-10-29', launch:'2026-11-06'},
  {keys:['mbpproled'], short:'MacBook Pro PROLED', name:'MacBook Pro PROLED XDR（14.2吋／16.3吋）', date:'10/30 09:00 預購・11/6 發售', pre:'2026-10-30', launch:'2026-11-06'},
  {keys:['homeview','homecoll'], short:'HomeView', name:'Apple HomeView／Home Collection', date:'台灣上市時間未定（無台幣價）'},
];

// 發售狀態：依今天日期自動判斷（pre＝預購開始日、launch＝發售日，格式 YYYY-MM-DD；沒填＝台灣未上市）
function npiStatus(t){
  if(!t.launch) return {text:'台灣未上市', cls:'badge-gray'};
  const now = new Date(); now.setHours(0,0,0,0);
  const d = s => { const [y,m,dd] = s.split('-').map(Number); return new Date(y, m-1, dd); };
  if(now >= d(t.launch)) return {text:'已發售', cls:'badge-green'};
  if(t.pre && now >= d(t.pre)) return {text:'預購中', cls:'badge-orange'};
  return {text:'即將預購', cls:'badge-blue'};
}
// 排序：未發售的在前（依發售日由近到遠）→ 已發售的在後（最近發售的在前）→ 台灣未上市（沒填 launch）最後；同組維持上方陣列原順序
function npiSortedTimeline(){
  const now = new Date(); now.setHours(0,0,0,0);
  const d = s => { const [y,m,dd] = s.split('-').map(Number); return new Date(y, m-1, dd).getTime(); };
  const grp = t => !t.launch ? 2 : (now >= d(t.launch) ? 1 : 0);
  return NPI_TIMELINE.map((t,i) => ({t,i}))
    .sort((a,b) => {
      const ga = grp(a.t), gb = grp(b.t);
      if(ga !== gb) return ga - gb;
      if(ga === 0) return d(a.t.launch) - d(b.t.launch) || a.i - b.i;
      if(ga === 1) return d(b.t.launch) - d(a.t.launch) || a.i - b.i;
      return a.i - b.i;
    }).map(x => x.t);
}
