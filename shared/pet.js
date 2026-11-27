/* 螢幕寵物（門市工具箱首頁用）
 * 只做療癒互動：摸頭、小遊戲、換角色。心情第一次從 0 開始，之後依使用時間變化。
 * 心情、角色、位置、收起狀態都只存在各自瀏覽器（localStorage，key 前綴 toolbox-pet-）。
 */
(function(){
  if(window.__spLoaded) return; window.__spLoaded = true;

  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/pet\.js(\?.*)?$/, '') : 'shared/';
  var CHARS = [
    {id:'cat1', name:'小橘',   img:BASE+'pet/cat1.webp', tail:' 喵～',
      poses:{joy:BASE+'pet/cat1_joy.webp', sleep:BASE+'pet/cat1_sleep.webp', pet:BASE+'pet/cat1_pet.webp', sad:BASE+'pet/cat1_sad.webp'}},
    {id:'cat2', name:'小黑',   img:BASE+'pet/cat2.webp', tail:' 喵。',
      poses:{joy:BASE+'pet/cat2_joy.webp', sleep:BASE+'pet/cat2_sleep.webp', pet:BASE+'pet/cat2_pet.webp', sad:BASE+'pet/cat2_sad.webp'}},
    {id:'jing', name:'驚驚',   img:BASE+'pet/jing.webp', tail:' 喵？',
      poses:{joy:BASE+'pet/jing_joy.webp', sleep:BASE+'pet/jing_sleep.webp', pet:BASE+'pet/jing_pet.webp', sad:BASE+'pet/jing_sad.webp'}},
    {id:'hua',  name:'花花',   img:BASE+'pet/hua.webp',  tail:' 喵～'},
    {id:'boy',  name:'小男生', img:BASE+'pet/boy.webp',  tail:''},
    {id:'girl', name:'小女生', img:BASE+'pet/girl.webp', tail:'～'}
  ];
  var K = {char:'toolbox-pet-char', mood:'toolbox-pet-mood', last:'toolbox-pet-last', pos:'toolbox-pet-pos', hidden:'toolbox-pet-hidden', seen:'toolbox-pet-seen', best:'toolbox-pet-best'};

  /* ---------- 小工具 ---------- */
  function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function clamp(v,a,b){ return Math.min(Math.max(v,a),b); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

  var ci = Math.max(0, CHARS.findIndex(function(c){ return c.id === get(K.char); }));
  function ch(){ return CHARS[ci]; }

  /* ---------- 樣式 ---------- */
  var css = [
  '.sp-pet{position:fixed;width:var(--sp-size,84px);height:var(--sp-size,84px);z-index:9000;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}',
  '.sp-pet.drag{cursor:grabbing}',
  '.sp-img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none;transform-origin:50% 100%;filter:drop-shadow(0 3px 5px rgba(0,0,0,.2));animation:sp-breathe 3.2s ease-in-out infinite}',
  '.sp-pet.drag .sp-img{animation:none;transform:scale(1.12) rotate(-5deg)}',
  '.sp-pet.sleep .sp-img{animation:none;transform:rotate(-12deg);opacity:.88}',
  '.sp-pet.sleep.sp-posed .sp-img{transform:none;opacity:1;animation:sp-breathe 3.2s ease-in-out infinite}',
  '.sp-low .sp-img{animation:sp-droop 4.6s ease-in-out infinite}',
  '.sp-low .sp-shadow{opacity:.14}',
  '.sp-shadow{position:absolute;left:50%;bottom:-2px;width:56%;height:8%;border-radius:50%;background:rgba(0,0,0,.35);transform:translateX(-50%);opacity:.2;filter:blur(2px);pointer-events:none}',
  '.sp-zzz{position:absolute;right:-6px;top:-2px;font-size:14px;font-weight:700;font-style:italic;color:var(--gray,#64748b);display:none;animation:sp-z 1.8s ease-in-out infinite;pointer-events:none}',
  '.sp-pet.sleep .sp-zzz{display:block}',
  '.sp-ring{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:2px solid var(--blue,#0071e3);z-index:-1;display:none;pointer-events:none;animation:sp-pulse 2s ease-out infinite}',
  '.sp-ring.on{display:block}',
  '.sp-bubble{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--white,#fff);color:var(--text,#1e293b);border:1px solid var(--border,#dde3ed);border-radius:14px;padding:5px 11px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.12);opacity:0;transition:opacity .25s;pointer-events:none}',
  '.sp-bubble.show{opacity:1}',
  '.sp-joy .sp-img{animation:sp-joy .9s ease-out}',
  '.sp-shake .sp-img{animation:sp-shake .45s ease-out}',
  '.sp-fx{position:fixed;z-index:9001;pointer-events:none;animation:sp-rise 1.2s ease-out forwards}',
  '.sp-fx svg{width:20px;height:20px;fill:#f0648f;display:block}',
  '.sp-pethud{position:absolute;left:50%;bottom:calc(100% + 36px);transform:translateX(-50%);display:none;align-items:center;gap:6px;background:var(--white,#fff);border:1px solid var(--border,#dde3ed);border-radius:999px;padding:5px 11px;box-shadow:0 4px 14px rgba(0,0,0,.14);white-space:nowrap;font-size:12px;font-weight:700;color:#f0648f;pointer-events:none}',
  '.sp-pethud.on{display:flex}',
  '.sp-done{pointer-events:auto;border:0;background:#f0648f;color:#fff;border-radius:999px;padding:3px 11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-left:2px}',
  '.sp-pat .sp-img{animation:sp-pat .16s ease-out}',
  '.sp-img{rotate:var(--sp-lean,0deg);transition:rotate .45s ease-out}',
  '.sp-look .sp-img{animation:sp-look 2.2s ease-in-out}',
  '.sp-stretch .sp-img{animation:sp-stretch 1.6s ease-in-out}',
  '.sp-hop .sp-img{animation:sp-hop .8s ease-out}',
  '.sp-tilt .sp-img{animation:sp-tilt 1.8s ease-in-out}',
  '@keyframes sp-look{0%,100%{transform:rotate(0)}22%{transform:rotate(-7deg) translateX(-3%)}50%{transform:rotate(-7deg) translateX(-3%)}72%{transform:rotate(6deg) translateX(3%)}90%{transform:rotate(6deg) translateX(3%)}}',
  '@keyframes sp-stretch{0%,100%{transform:scale(1,1)}35%{transform:scale(.94,1.1)}60%{transform:scale(.94,1.1)}80%{transform:scale(1.05,.95)}}',
  '@keyframes sp-hop{0%{transform:translateY(0) scale(1.05,.94)}30%{transform:translateY(-14%) scale(.97,1.04)}55%{transform:translateY(0) scale(1.05,.94)}75%{transform:translateY(-6%)}100%{transform:none}}',
  '@keyframes sp-tilt{0%,100%{transform:rotate(0)}25%,70%{transform:rotate(9deg) translateX(2%)}}',
  '@keyframes sp-droop{0%,100%{transform:scale(1,.97) translateY(1%)}50%{transform:scale(1.01,.94) translateY(2%)}}',
  '@keyframes sp-pat{0%{transform:scale(1)}50%{transform:scale(.93,1.05)}100%{transform:scale(1)}}',
  '.sp-pethud svg{width:14px;height:14px;fill:currentColor;flex:none}',
  '.sp-pethud .sp-bar{width:76px;flex:none}',
  '.sp-num{min-width:22px;text-align:right;font-size:12px;font-weight:700}',
  '.sp-lbl{font-size:12px;font-weight:700}',
  '.sp-box .sp-mood{padding:10px 16px 0}',
  /* 選單 */
  '.sp-menu{position:fixed;z-index:9002;display:none;background:var(--white,#fff);border:1px solid var(--border,#dde3ed);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:10px;width:228px}',
  '.sp-menu.open{display:block;animation:sp-pop .18s ease-out}',
  '.sp-mood{display:flex;align-items:center;gap:8px;padding:2px 4px 10px;color:#f0648f}',
  '.sp-mood svg{width:14px;height:14px;fill:currentColor;flex:none}',
  '.sp-bar{flex:1;height:5px;background:var(--light,#f1f5f9);border-radius:99px;overflow:hidden}',
  '.sp-fill{height:100%;width:60%;background:#f0648f;border-radius:99px;transition:width .5s}',
  '.sp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}',
  '.sp-btn{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid var(--border,#dde3ed);background:var(--light,#f1f5f9);color:var(--text,#1e293b);border-radius:12px;padding:8px 2px 6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}',
  '.sp-btn span{font-size:22px;line-height:1.1}',
  '.sp-btn:active{transform:scale(.95)}',
  '@media (hover:hover){.sp-btn:hover{border-color:var(--blue,#0071e3)}}',
  '.sp-tab{position:fixed;right:14px;bottom:14px;z-index:9000;width:40px;height:40px;border-radius:50%;border:1px solid var(--border,#dde3ed);background:var(--white,#fff);box-shadow:0 4px 14px rgba(0,0,0,.15);font-size:20px;cursor:pointer;display:none;padding:0}',
  /* 選單質感升級：霧面玻璃＋漸層圖示 */
  '.sp-menu{width:240px;padding:14px;border-radius:24px;background:rgba(255,255,255,.74);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);border:1px solid rgba(255,255,255,.92);box-shadow:0 18px 44px rgba(30,60,120,.2),0 2px 8px rgba(30,60,120,.08);transform-origin:var(--tx,50%) 100%}',
  '.sp-menu.below{transform-origin:var(--tx,50%) 0}',
  '.sp-menu.open{animation:sp-menupop .22s cubic-bezier(.2,.9,.3,1.2)}',
  '.sp-mhead{display:flex;align-items:center;gap:12px;padding:0 2px 12px}',
  '.sp-mav{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;background:linear-gradient(145deg,#fff,#ffe1ec);box-shadow:0 4px 12px rgba(240,100,143,.25),inset 0 0 0 2px rgba(255,255,255,.9)}',
  '.sp-mav img{width:38px;height:38px;object-fit:contain;display:block}',
  '.sp-minfo{flex:1;min-width:0}',
  '.sp-mname{font-size:15px;font-weight:800;letter-spacing:.04em;color:#1e293b;margin-bottom:5px}',
  '.sp-menu .sp-mood{padding:0;gap:7px}',
  '.sp-menu .sp-bar{height:7px;background:rgba(30,60,120,.1)}',
  '.sp-menu .sp-fill{background:linear-gradient(90deg,#ffb0cb,#f0648f 60%,#ff8a5c)}',
  '.sp-menu .sp-num{min-width:20px;font-size:12px}',
  '.sp-menu .sp-grid{gap:10px}',
  '.sp-menu .sp-btn{gap:8px;padding:13px 4px 11px;border-radius:18px;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.62);box-shadow:0 2px 8px rgba(30,60,120,.06);font-size:13px;font-weight:700;color:#334155;transition:transform .12s,box-shadow .2s,background .2s}',
  '@media (hover:hover){.sp-menu .sp-btn:hover{background:rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(30,60,120,.12);transform:translateY(-2px);border-color:rgba(255,255,255,.9)}}',
  '.sp-menu .sp-btn:active{transform:scale(.95)}',
  '.sp-ic{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;font-style:normal;box-shadow:0 6px 14px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.45)}',
  '.sp-ic.c1{background:linear-gradient(145deg,#ffa3c4,#f0648f)}',
  '.sp-ic.c2{background:linear-gradient(145deg,#93bbff,#5b7cf0)}',
  '.sp-ic.c3{background:linear-gradient(145deg,#80e3d2,#2fb5a3)}',
  '.sp-ic.c4{background:linear-gradient(145deg,#c8cfdb,#8d98ab)}',
  '.sp-svg{width:23px;height:23px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
  '.sp-tail{position:absolute;left:var(--tx,50%);bottom:-7px;width:14px;height:14px;margin-left:-7px;background:rgba(255,255,255,.94);border-right:1px solid rgba(255,255,255,.92);border-bottom:1px solid rgba(255,255,255,.92);border-radius:0 0 4px 0;transform:rotate(45deg);box-shadow:3px 3px 6px rgba(30,60,120,.06)}',
  '.sp-menu.below .sp-tail{bottom:auto;top:-7px;transform:rotate(225deg)}',
  '@media (max-width:700px){.sp-menu{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.97)}}',
  '@keyframes sp-menupop{from{opacity:0;transform:scale(.78)}to{opacity:1;transform:none}}',
  /* 遊戲 */
  '.sp-modal{position:fixed;inset:0;z-index:9100;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:12px}',
  '.sp-box{width:min(360px,100%);background:var(--white,#fff);border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,.3);overflow:hidden;color:var(--text,#1e293b);font-family:inherit}',
  '.sp-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-weight:700;font-size:15px;border-bottom:1px solid var(--border,#dde3ed)}',
  '.sp-x{border:0;background:var(--light,#f1f5f9);border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:13px;color:var(--gray,#64748b)}',
  '.sp-body{padding:14px 16px 16px}',
  '.sp-pick{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.sp-pick button{border:1px solid var(--border,#dde3ed);background:var(--light,#f1f5f9);border-radius:16px;padding:18px 6px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;color:inherit}',
  '.sp-pick button span{display:block;font-size:34px;margin-bottom:6px}',
  '.sp-hud{display:flex;justify-content:space-between;font-weight:700;font-size:14px;margin-bottom:8px}',
  '.sp-arena{position:relative;height:min(360px,56vh);background:linear-gradient(180deg,#e8f1ff,#fff7ec);border-radius:14px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}',
  '.sp-player{position:absolute;bottom:4px;left:0;width:64px;height:64px;object-fit:contain;pointer-events:none;will-change:transform}',
  '.sp-item{position:absolute;left:0;top:0;font-size:28px;line-height:34px;width:34px;text-align:center;pointer-events:none;will-change:transform}',
  '.sp-cap{position:absolute;left:50%;top:39px;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:800;line-height:1;letter-spacing:.02em;color:#475569;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff}',
  '.sp-item svg{width:38px;height:38px;margin:-2px 0 0 -2px;display:block;filter:drop-shadow(0 2px 3px rgba(30,60,120,.2))}',
  '.sp-tip{font-size:12px;color:var(--gray,#64748b);text-align:center;margin-top:8px}',
  '.sp-result{text-align:center;padding:10px 0 2px}',
  '.sp-result b{font-size:34px;display:block;margin:2px 0 4px}',
  '.sp-result p{margin:0 0 12px;color:var(--gray,#64748b);font-size:13px}',
  '.sp-acts{display:flex;gap:8px;justify-content:center}',
  '.sp-acts button{border:1px solid var(--border,#dde3ed);background:var(--light,#f1f5f9);border-radius:10px;padding:8px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:inherit}',
  '.sp-acts button.main{background:var(--blue,#0071e3);border-color:var(--blue,#0071e3);color:#fff}',
  '.sp-rps{text-align:center}',
  '.sp-rps-pet{width:96px;height:96px;margin:0 auto}',
  '.sp-rps-pet img{width:100%;height:100%;object-fit:contain}',
  '.sp-rps-hand{font-size:56px;height:70px;line-height:70px}',
  '.sp-rps-res{font-size:18px;font-weight:700;height:28px;margin:4px 0 10px}',
  '.sp-rps-btns{display:flex;gap:10px;justify-content:center}',
  '.sp-rps-btns button{width:78px;height:78px;border:1px solid var(--border,#dde3ed);background:var(--light,#f1f5f9);border-radius:18px;font-size:38px;cursor:pointer}',
  '.sp-rps-btns button:active{transform:scale(.93)}',
  '.sp-rps-score{margin-top:12px;font-size:13px;color:var(--gray,#64748b)}',
  '.sp-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
  '.sp-pbar{height:8px;background:var(--light,#f1f5f9);border-radius:99px;overflow:hidden;margin-bottom:8px}',
  '.sp-pfill{height:100%;width:100%;background:hsl(352,72%,40%);border-radius:99px;transition:width .08s,background .15s}',
  '.sp-smash{display:grid;place-items:center;background:hsl(340,30%,18%);cursor:pointer;transition:background .15s;position:relative}',
  '.sp-orb{position:relative;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle at 35% 30%,hsl(352,72%,62%) 0,hsl(352,72%,44%) 30%,hsl(352,72%,30%) 70%,hsl(352,72%,18%) 100%);box-shadow:0 0 36px hsla(352,72%,45%,.7),inset -8px -10px 22px hsla(352,72%,12%,.5);animation:sp-orbfloat 2.4s ease-in-out infinite;pointer-events:none;will-change:transform}',
  '.sp-orb.pa{animation:sp-punch .16s ease}',
  '.sp-orb.pb{animation:sp-punch2 .16s ease}',
  '.sp-crack{position:absolute;left:50%;top:50%;width:3px;height:0;background:rgba(90,10,45,.55);transform-origin:top center;border-radius:2px;opacity:0;transition:height .15s,opacity .15s}',
  '.sp-crack.on{opacity:1;height:62px}',
  '.sp-orb{transition:width .15s,height .15s,box-shadow .15s}',
  '.sp-orbtxt{position:absolute;left:0;right:0;top:0;bottom:0;display:grid;place-items:center;padding:16px;text-align:center;font-weight:800;font-size:22px;line-height:1.25;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;word-break:keep-all}',
  '.sp-spark{position:absolute;font-weight:800;font-size:18px;line-height:1;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,.35)}',
  '.sp-vent{position:absolute;font-weight:800;font-size:17px;pointer-events:none;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.35)}',
  '.sp-q{font-weight:700;font-size:15px;margin-bottom:12px;text-align:center}',
  '.sp-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
  '.sp-chip{border:1px solid #f1c9d2;background:#fff3f5;border-radius:999px;padding:9px 15px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#7a2335}',
  '.sp-chip:active{transform:scale(.95)}',
  '@media (hover:hover){.sp-chip:hover{background:#ffe6eb;border-color:#e8a3b2}}',
  '.sp-calm{background:linear-gradient(180deg,#e3f5f5,#f2fafa 60%,#fff);border-radius:16px;padding:14px 10px}',
  '.sp-breath{position:relative;height:216px;display:grid;place-items:center;margin:0 0 6px}',
  '.sp-bcircle{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#c3eaea 55%,#7fcfcf);box-shadow:0 0 44px rgba(80,180,180,.6),0 0 90px rgba(80,180,180,.28);animation:sp-breath 10s ease-in-out infinite}',
  '.sp-btext{position:absolute;font-weight:700;color:#0f5b5b;font-size:19px;letter-spacing:.15em}',
  '@media (prefers-reduced-motion:reduce){.sp-bcircle{animation:none}}',
  '.sp-box{max-height:calc(100vh - 24px);overflow-y:auto}',
  '@media (max-height:660px){.sp-breath{height:164px}.sp-bcircle{width:92px;height:92px}.sp-btext{font-size:16px}}',
  /* 動畫 */
  '@keyframes sp-breath{0%{transform:scale(.62)}40%{transform:scale(1.42)}100%{transform:scale(.62)}}',
  '@keyframes sp-orbfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
  '@keyframes sp-punch{0%{transform:scale(1)}40%{transform:scale(.85)}100%{transform:scale(1)}}',
  '@keyframes sp-punch2{0%{transform:scale(1)}40%{transform:scale(.85)}100%{transform:scale(1)}}',
  '@keyframes sp-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.03)}}',
  '@keyframes sp-joy{0%{transform:translateY(0) scale(1.08,.92)}35%{transform:translateY(-26%) scale(.95,1.08)}65%{transform:translateY(0) scale(1.08,.92)}85%{transform:translateY(-8%)}100%{transform:none}}',
  '@keyframes sp-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-6deg)}80%{transform:rotate(5deg)}}',
  '@keyframes sp-z{0%,100%{transform:translateY(0);opacity:.7}50%{transform:translateY(-5px);opacity:1}}',
  '@keyframes sp-pulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(2.3);opacity:0}}',
  '@keyframes sp-rise{from{opacity:1;transform:translateY(0) scale(.8)}to{opacity:0;transform:translateY(-56px) scale(1.3)}}',
  '@keyframes sp-pop{from{opacity:0;transform:scale(.94) translateY(6px)}to{opacity:1;transform:none}}',
  '@media (max-width:600px){:root{--sp-size:72px}}',
  '@media (prefers-reduced-motion:reduce){.sp-img,.sp-zzz,.sp-ring{animation:none;transition:none}}',
  '@media print{.sp-pet,.sp-menu,.sp-tab,.sp-modal{display:none!important}}',
  /* 遊戲面板改版：與寵物選單一致的霧面玻璃 */
  '.sp-modal{background:rgba(30,60,120,.3);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
  '.sp-box{border-radius:26px;background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border:1px solid rgba(255,255,255,.92);box-shadow:0 24px 60px rgba(30,60,120,.28),0 2px 8px rgba(30,60,120,.1)}',
  '.sp-ghead{padding:16px 16px 4px}',
  '.sp-box .sp-mood{padding:0}',
  '.sp-box .sp-bar{height:7px;background:rgba(30,60,120,.1)}',
  '.sp-box .sp-fill{background:linear-gradient(90deg,#ffb0cb,#f0648f 60%,#ff8a5c)}',
  '.sp-box .sp-num{min-width:20px;font-size:12px}',
  '.sp-x{display:grid;place-items:center;flex:none;width:30px;height:30px;padding:0;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(30,60,120,.1);align-self:flex-start}',
  '.sp-xsvg{stroke:#64748b;width:14px;height:14px;stroke-width:2.4;fill:none;stroke-linecap:round}',
  '.sp-body{padding:12px 16px 18px}',
  '.sp-pick{gap:10px}',
  '.sp-pick .sp-btn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px 12px;border-radius:18px;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.62);box-shadow:0 2px 8px rgba(30,60,120,.06);font-size:13px;font-weight:700;color:#334155;cursor:pointer;font-family:inherit;transition:transform .12s,box-shadow .2s,background .2s}',
  '@media (hover:hover){.sp-pick .sp-btn:hover{background:rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(30,60,120,.12);transform:translateY(-2px)}}',
  '.sp-pick .sp-btn:active{transform:scale(.95)}',
  '.sp-ic.c5{background:linear-gradient(145deg,#ffd08a,#ff9a3d)}',
  '.sp-ic.c6{background:linear-gradient(145deg,#ff9aa8,#e5484d)}',
  '.sp-acts button{border-radius:999px;padding:9px 20px;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.7);box-shadow:0 2px 8px rgba(30,60,120,.08);font-weight:700}',
  '.sp-acts button.main{background:linear-gradient(145deg,#93bbff,#5b7cf0);border-color:transparent;color:#fff;box-shadow:0 6px 14px rgba(91,124,240,.35)}',
  '.sp-arena{border-radius:18px}',
  '.sp-rps-btns button{background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(30,60,120,.08)}',
  '@media (max-width:700px){.sp-box{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.97)}.sp-modal{-webkit-backdrop-filter:none;backdrop-filter:none}}',
  '.sp-mhint{margin-top:12px;text-align:center;font-size:11.5px;color:#64748b;letter-spacing:.02em}',
  '.sp-hintline{text-align:center;font-size:12px;color:#64748b;margin-top:14px}',
  /* 今日運勢（搖籤） */
  '.sp-pick{grid-template-columns:repeat(2,1fr)}',
  '.sp-ic.c7{background:linear-gradient(145deg,#c9a8ff,#8b5cf6)}',
  '.sp-fort{text-align:center;padding:4px 0 6px}',
  '.sp-tubewrap{position:relative;width:150px;height:190px;margin:0 auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}',
  '.sp-tubesvg{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 10px rgba(120,80,20,.25));transform-origin:50% 90%}',
  '.sp-tubewrap.rattle .sp-tubesvg{animation:sp-rattle .32s ease-in-out}',
  '.sp-stick{position:absolute;left:50%;top:22px;width:9px;height:64px;margin-left:-4px;border-radius:3px;background:#f8e3b5;border:2px solid #a8742c;opacity:0;pointer-events:none}',
  '.sp-stick.go{animation:sp-stickout .9s ease-in forwards}',
  '.sp-ftip{margin-top:6px;font-size:13px;color:#64748b}',
  '.sp-ftip b{color:#f0648f;font-size:15px}',
  '.sp-fres{text-align:center;animation:sp-flip .5s cubic-bezier(.2,.9,.3,1.2)}',
  '.sp-ftier{font-size:44px;font-weight:900;letter-spacing:.08em;line-height:1.2;background:linear-gradient(135deg,var(--g1),var(--g2));-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px}',
  '.sp-frow{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;margin:0 0 6px;border-radius:12px;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);font-size:14px;color:#334155}',
  '.sp-frow b{font-weight:800;display:flex;align-items:center;gap:6px}',
  '.sp-star{color:#f5a623;letter-spacing:.1em}',
  '.sp-fsw{display:inline-block;width:14px;height:14px;border-radius:50%;box-shadow:0 0 0 1.5px rgba(0,0,0,.15)}',
  '.sp-fmsg{margin:10px 6px 4px;font-size:14px;font-weight:700;color:#334155;line-height:1.5}',
  '.sp-fnote{margin:0 0 12px;font-size:12px;color:#64748b}',
  '@keyframes sp-rattle{0%,100%{transform:rotate(0)}20%{transform:rotate(-9deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-6deg)}80%{transform:rotate(4deg)}}',
  '@keyframes sp-stickout{0%{opacity:0;transform:translateY(20px)}15%{opacity:1}60%{opacity:1;transform:translateY(-60px) rotate(8deg)}100%{opacity:0;transform:translateY(-95px) rotate(14deg) scale(1.25)}}',
  '@keyframes sp-flip{from{opacity:0;transform:scale(.7) rotateX(60deg)}to{opacity:1;transform:none}}',
  'body.sp-pad{padding-bottom:104px}'
  ].join('\n');
  var st = el('style'); st.textContent = css; document.head.appendChild(st);
  document.body.classList.add('sp-pad');            // 讓最底下的卡片不會被寵物蓋住

  /* ---------- DOM ---------- */
  var HEART = '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  var pet = el('div','sp-pet');
  var img = el('img','sp-img'); img.alt = ''; img.draggable = false; img.decoding = 'async';   // 圖片等寵物展開才載入（預設收起，不拖慢首頁）
  /* 姿勢：joy 開心／sleep 睡覺／pet 享受被摸／sad 低心情；角色沒有該姿勢圖就用基本圖 */
  var curSrc = '', joyUntil = 0, poseT = 0;
  function poseSrc(name){ var c = ch(); return (name !== 'base' && c.poses && c.poses[name]) || c.img; }
  function setPose(name){ var u = poseSrc(name); if(u !== curSrc){ curSrc = u; img.src = u; } }
  function restPose(){ return (typeof moodV === 'number' && moodV < 20 && awayMs !== null && ch().poses && ch().poses.sad) ? 'sad' : 'base'; }   // 第一次使用（awayMs 為 null）先用正常站姿
  function syncPose(){                                   // 依目前狀態決定顯示哪張
    pet.classList.toggle('sp-low', typeof moodV === 'number' && moodV < 20 && awayMs !== null && !pet.classList.contains('sleep'));   // 低友好值：慢慢垂下的呼吸
    if(Date.now() < joyUntil) return;
    if(typeof rubbing !== 'undefined' && rubbing) return setPose('pet');
    if(pet.classList.contains('sleep')) return setPose('sleep');
    setPose(restPose());
  }
  img.addEventListener('error', function(){ if(curSrc !== ch().img){ curSrc = ch().img; img.src = curSrc; } });
  function preloadPoses(){ var c = ch(); if(c.poses) Object.keys(c.poses).forEach(function(k){ new Image().src = c.poses[k]; }); }
  var bubble = el('div','sp-bubble');
  var ring = el('div','sp-ring');
  var hud = el('div','sp-pethud', HEART+'<span class="sp-lbl">友好值</span><div class="sp-bar"><div class="sp-fill"></div></div><span class="sp-num"></span><button class="sp-done" type="button">完成</button>');
  hud.querySelector('.sp-done').addEventListener('pointerdown', function(e){ e.stopPropagation(); });
  hud.querySelector('.sp-done').addEventListener('click', function(){ stopRub(true); });
  pet.appendChild(ring); pet.appendChild(hud); pet.appendChild(bubble); pet.appendChild(el('div','sp-shadow')); pet.appendChild(img); pet.appendChild(el('div','sp-zzz','zzz'));

  var ICON = function(path){ return '<svg class="sp-svg" viewBox="0 0 24 24">' + path + '</svg>'; };
  var IC_HEART = ICON('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>');
  var IC_GAME  = ICON('<line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/>');
  var IC_SWAP  = ICON('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
  var IC_DOWN  = ICON('<polyline points="6 9 12 15 18 9"/>');
  var menu = el('div','sp-menu',
    '<div class="sp-mhead"><div class="sp-mav"><img alt=""></div>' +
      '<div class="sp-minfo"><div class="sp-mname"></div>' +
      '<div class="sp-mood">'+HEART+'<div class="sp-bar"><div class="sp-fill"></div></div><span class="sp-num"></span></div></div></div>' +
    '<div class="sp-grid">' +
      '<button class="sp-btn" data-a="game"><i class="sp-ic c2">'+IC_GAME+'</i>遊戲</button>' +
      '<button class="sp-btn" data-a="rub"><i class="sp-ic c1">'+IC_HEART+'</i>摸摸</button>' +
      '<button class="sp-btn" data-a="char"><i class="sp-ic c3">'+IC_SWAP+'</i>換角色</button>' +
      '<button class="sp-btn" data-a="hide"><i class="sp-ic c4">'+IC_DOWN+'</i>收起</button>' +
    '</div><div class="sp-mhint">玩遊戲、摸摸都能增加友好值</div><div class="sp-tail"></div>');
  var mavImg = menu.querySelector('.sp-mav img'), mname = menu.querySelector('.sp-mname');
  var armed = false;                                     // 寵物第一次展開後才載入圖片
  function updateMenuHead(){ if(armed) mavImg.src = ch().img; mname.textContent = ch().name; }
  updateMenuHead();
  var tab = el('button','sp-tab','🐾'); tab.type = 'button'; tab.setAttribute('aria-label','叫出螢幕寵物');
  document.body.appendChild(pet); document.body.appendChild(menu); document.body.appendChild(tab);

  /* ---------- 位置（記在瀏覽器，存比例，視窗大小改變也不會跑出畫面） ---------- */
  function size(){ return pet.offsetWidth || 84; }
  function place(x,y){
    var s = size();
    x = clamp(x, 6, Math.max(6, innerWidth - s - 6));
    y = clamp(y, 6, Math.max(6, innerHeight - s - 6));
    pet.style.left = x+'px'; pet.style.top = y+'px';
    return {x:x, y:y};
  }
  function curPos(){ return {x:pet.offsetLeft, y:pet.offsetTop}; }
  function savePos(){
    var p = curPos(), s = size();
    set(K.pos, JSON.stringify({fx:p.x/Math.max(1,innerWidth-s), fy:p.y/Math.max(1,innerHeight-s)}));
  }
  function loadPos(){
    var s = size(), v = null;
    try{ v = JSON.parse(get(K.pos)); }catch(e){}
    if(v && typeof v.fx === 'number') place(v.fx*(innerWidth-s), v.fy*(innerHeight-s));
    else place(innerWidth - s - 16, innerHeight - s - 16);
  }

  /* ---------- 心情：第一次從 0 開始，之後記在這台裝置，依「使用時間」變化 ----------
   * ・離開越久心情越低（每離開 1 小時 -30，最低 0）
   * ・停留在首頁陪牠，每 1 分鐘 +1（陪伴最多把心情養到 40）
   * ・摸摸、遊戲可以加到滿 100
   */
  var moodV = 0, awayMs = null;
  (function(){
    var m = null; try{ m = JSON.parse(get(K.mood)); }catch(e){}
    var last = parseInt(get(K.last) || '0', 10);
    if(last) awayMs = Date.now() - last;                      // 距離上次使用多久（第一次使用為 null）
    if(m && typeof m.v === 'number')
      moodV = clamp(Math.round(m.v - 30 * (last ? (Date.now()-last)/3600000 : 0)), 0, 100);
  })();
  function getMood(){ return moodV; }
  function setMood(v){
    var was = moodV; moodV = clamp(v, 0, 100); renderMood();
    set(K.mood, JSON.stringify({v:moodV, t:Date.now()}));
    if(was < 100 && moodV >= 100) setTimeout(celebrate, 300);
  }
  function renderMood(){
    [].forEach.call(document.querySelectorAll('.sp-fill'), function(f){ f.style.width = moodV + '%'; });
    [].forEach.call(document.querySelectorAll('.sp-num'), function(n){ n.textContent = moodV; });
    syncPose();
  }
  function celebrate(){ hearts(7); anim('sp-joy', 900); say(pick(['友好值滿分','最喜歡你了','太幸福了','好開心好開心'])+ch().tail, 2400); }
  function touchLast(){ set(K.last, String(Date.now())); }       // 記下「最後一次在首頁」的時間
  setInterval(function(){
    if(document.visibilityState !== 'visible' || pet.style.display === 'none') return;
    touchLast();
    if(moodV < 40) setMood(moodV + 1);                            // 陪伴：停留越久越開心（到 40 為止）
  }, 60000);
  document.addEventListener('visibilitychange', touchLast);
  window.addEventListener('pagehide', touchLast);

  /* ---------- 說話與特效（文字都很短） ---------- */
  var sayT;
  function say(t, ms){
    bubble.textContent = t;
    bubble.style.transform = 'translateX(-50%)';           // 先歸位再量，避免靠近畫面邊緣時被切掉
    var r = bubble.getBoundingClientRect(), shift = 0;
    if(r.right > innerWidth - 8) shift = r.right - (innerWidth - 8);
    else if(r.left < 8) shift = r.left - 8;
    if(shift) bubble.style.transform = 'translateX(calc(-50% - ' + shift + 'px))';
    bubble.classList.add('show');
    clearTimeout(sayT); sayT = setTimeout(function(){ bubble.classList.remove('show'); }, ms||1800);
  }
  function anim(cls, ms){
    pet.classList.remove('sp-joy','sp-shake','sp-pat','sp-look','sp-stretch','sp-hop','sp-tilt'); void pet.offsetWidth; pet.classList.add(cls);
    if(cls === 'sp-joy'){ joyUntil = Date.now() + ms + 250; setPose('joy'); clearTimeout(poseT); poseT = setTimeout(syncPose, ms + 250); }
    setTimeout(function(){ pet.classList.remove(cls); }, ms);
  }
  function heart(dx,dy){
    var p = curPos(), s = size(), f = el('div','sp-fx',HEART);
    f.style.left = (p.x + s/2 + (dx||0) - 10)+'px'; f.style.top = (p.y + (dy||0))+'px';
    document.body.appendChild(f); setTimeout(function(){ f.remove(); }, 1300);
  }
  function hearts(n){ for(var i=0;i<n;i++) (function(i){ setTimeout(function(){ heart((Math.random()-.5)*44, Math.random()*18); }, i*140); })(i); }

  /* ---------- 選單 ---------- */
  var menuOpen = false;
  function openMenu(){
    menuOpen = true; menu.classList.add('open'); renderMood();
    menu.querySelector('.sp-mhint').style.display = getMood() < 60 ? '' : 'none';      // 心情不高才提示，高了就不囉嗦
    var p = curPos(), s = size(), w = menu.offsetWidth, h = menu.offsetHeight;
    var x = clamp(p.x + s/2 - w/2, 8, innerWidth - w - 8);
    var y = p.y - h - 12, below = false; if(y < 8){ y = p.y + s + 12; below = true; }
    menu.style.left = x+'px'; menu.style.top = clamp(y, 8, innerHeight - h - 8)+'px';
    menu.classList.toggle('below', below);
    menu.style.setProperty('--tx', clamp(p.x + s/2 - x, 30, w - 30) + 'px');         // 尖角對準寵物
    bubble.classList.remove('show');
  }
  function closeMenu(){ menuOpen = false; menu.classList.remove('open'); }
  document.addEventListener('pointerdown', function(e){
    if(menuOpen && !menu.contains(e.target) && !pet.contains(e.target)) closeMenu();
    if(rubbing && !pet.contains(e.target)) stopRub(false);   // 點到別處＝離開摸摸模式（不彈選單）
  });

  /* 天降業績的掉落物：手機、平板、筆電、iMac 各 1 分；金幣 3 分（約 12% 機率掉落） */
  var DEVICES = [
    '<svg viewBox="0 0 40 40"><rect x="13" y="3" width="14" height="34" rx="3.5" fill="#e7f0ff" stroke="#4b6cb7" stroke-width="2"/><rect x="15.5" y="7" width="9" height="22" rx="1.5" fill="#9ec1ff"/><circle cx="20" cy="33" r="1.4" fill="#4b6cb7"/></svg>',
    '<svg viewBox="0 0 40 40"><rect x="5" y="7" width="30" height="26" rx="3.5" fill="#f1ecff" stroke="#6a55c9" stroke-width="2"/><rect x="8.5" y="10.5" width="23" height="19" rx="1.5" fill="#b9a8ff"/><circle cx="20" cy="31.6" r="1" fill="#6a55c9"/></svg>',
    '<svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="17" rx="2.5" fill="#e8fbf4" stroke="#2d9a78" stroke-width="2"/><rect x="10.5" y="10.5" width="19" height="12" rx="1" fill="#8fe3c4"/><path d="M3.5 27.5h33l-1.6 4.2a2 2 0 0 1-1.9 1.3H7a2 2 0 0 1-1.9-1.3z" fill="#cdeee0" stroke="#2d9a78" stroke-width="2" stroke-linejoin="round"/></svg>'
  ];
  var MONEY = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16.5" fill="#ffd75e" stroke="#d99a00" stroke-width="2.2"/><circle cx="20" cy="20" r="12" fill="#ffe596" stroke="#e3ac1c" stroke-width="1.4"/><text x="20" y="26.6" text-anchor="middle" font-size="18" font-weight="800" font-family="Arial,sans-serif" fill="#b57b00">$</text></svg>';
  var IMAC = '<svg viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="24" rx="3" fill="#fff3e6" stroke="#d9822b" stroke-width="2"/><rect x="6.5" y="6.5" width="27" height="14.5" rx="1" fill="#ffc98a"/><rect x="6.5" y="21" width="27" height="5" fill="#ffe0bd"/><path d="M17 28h6l1.2 6h-8.4z" fill="#f2c28f" stroke="#d9822b" stroke-width="1.6" stroke-linejoin="round"/><rect x="11.5" y="34" width="17" height="3" rx="1.5" fill="#f2c28f" stroke="#d9822b" stroke-width="1.6"/></svg>';
  DEVICES.push(IMAC);
  var DEV_LABELS = ['iPhone','iPad','筆電','iMac'];             // 和 DEVICES 順序對應

  /* ---------- 摸頭：進入摸摸模式後，在角色身上來回滑動就會冒愛心 ---------- */
  var rubbing = false, rubEnd;
  function fitHud(){                                   // 靠近畫面邊緣時往內移，避免被切掉
    hud.style.transform = 'translateX(-50%)';
    var r = hud.getBoundingClientRect(), shift = 0;
    if(r.right > innerWidth - 8) shift = r.right - (innerWidth - 8);
    else if(r.left < 8) shift = r.left - 8;
    if(shift) hud.style.transform = 'translateX(calc(-50% - ' + shift + 'px))';
  }
  function startRub(){
    closeMenu(); rubbing = true; setPose('pet'); ring.classList.add('on'); say(pick(['摸摸我～','輕輕的喔','這裡這裡','好期待']), 1800);
    hud.classList.add('on'); fitHud();            // 進入不加分，摸的時間越久加越多
    clearTimeout(rubEnd); rubEnd = setTimeout(function(){ stopRub(true); }, 8000);
  }
  function stopRub(reopen){                            // reopen=true：摸完回到選單
    var was = rubbing;
    rubbing = false; syncPose(); ring.classList.remove('on'); hud.classList.remove('on'); clearTimeout(rubEnd);
    if(was && reopen && !modal && !dragging) openMenu();
  }
  var lastRub = 0, rubCount = 0;
  function rubTap(){                                     // 摸摸模式：點或來回滑動都算；每 3 顆愛心 +1，摸越久加越多
    clearTimeout(rubEnd); rubEnd = setTimeout(function(){ stopRub(true); }, 6000);
    var now = Date.now(); if(now - lastRub < 260) return; lastRub = now;
    heart((Math.random()-.5)*40, Math.random()*14);
    anim('sp-pat', 160);
    if(++rubCount % 3 === 0) setMood(getMood()+1);
    if(Math.random() < .15){
      var P = ['好舒服','嘿嘿','再摸再摸','好喜歡'];
      if(ch().tail.indexOf('喵') >= 0) P = P.concat(['呼嚕嚕','喵嗚～']);      // 貓咪多一點貓的反應
      say(pick(P)+ch().tail, 1400);
    }
  }

  /* ---------- 拖曳與點擊 ---------- */
  var rubDown = false;
  var dragging = false, moved = 0, sx, sy, ox, oy, wasOpen = false;
  pet.addEventListener('pointerdown', function(e){
    try{ pet.setPointerCapture(e.pointerId); }catch(_){}
    ring.classList.remove('on'); set(K.seen,'1');
    if(rubbing){ rubDown = true; rubTap(); return; }
    wasOpen = menuOpen; closeMenu();
    var p = curPos(); dragging = true; moved = 0; sx = e.clientX; sy = e.clientY; ox = p.x; oy = p.y;
    pet.classList.add('drag');
  });
  pet.addEventListener('pointermove', function(e){
    if(rubbing){ if(rubDown) rubTap(); return; }
    if(!dragging) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    moved = Math.max(moved, Math.hypot(dx,dy));
    place(ox+dx, oy+dy);
  });
  function endPointer(){
    rubDown = false;
    if(!dragging) return;
    dragging = false; pet.classList.remove('drag');
    if(moved >= 6){ savePos(); return; }
    if(!wasOpen) openMenu();
  }
  pet.addEventListener('pointerup', endPointer);
  pet.addEventListener('pointercancel', endPointer);
  window.addEventListener('resize', function(){ loadPos(); if(menuOpen) openMenu(); });

  /* ---------- 選單動作 ---------- */
  function setChar(i){ ci = (i + CHARS.length) % CHARS.length; set(K.char, ch().id); curSrc = ''; setPose(restPose()); preloadPoses(); updateMenuHead(); }
  /* 收起/展開狀態只記在這次瀏覽（sessionStorage）；下次重新開網頁：手機回到收起、電腦回到展開 */
  function getHid(){ try{ return sessionStorage.getItem(K.hidden); }catch(e){ return null; } }
  function setHid(v){ try{ sessionStorage.setItem(K.hidden, v); }catch(e){} }
  try{ localStorage.removeItem(K.hidden); }catch(e){}                  // 清掉舊版存在 localStorage 的收起狀態
  function hide(){ closeMenu(); stopRub(); pet.style.display = 'none'; tab.style.display = 'block'; setHid('1'); }
  function show(){ pet.style.display = ''; tab.style.display = 'none'; setHid('0'); arm(); loadPos(); if(!introDone) intro(); }
  tab.addEventListener('click', show);
  menu.addEventListener('click', function(e){
    var b = e.target.closest('.sp-btn'); if(!b) return;
    var a = b.getAttribute('data-a');
    if(a === 'rub') startRub();
    else if(a === 'game'){ closeMenu(); openGames(); }
    else if(a === 'char'){ setChar(ci+1); say('我是'+ch().name+ch().tail, 1600); anim('sp-joy',900); }
    else if(a === 'hide') hide();
  });

  /* ---------- 小遊戲 ---------- */
  var modal = null, gameStop = null;
  var gameNote = null;                                   // 剛玩過什麼：'played' 玩過遊戲／'smashWin' 情緒釋放成功
  var AFTER_PLAY = ['玩得開心嗎','謝謝你陪我玩','再玩一次好不好','好好玩'];
  var AFTER_SMASH = ['今天也辛苦了','壓力都散掉了嗎','深呼吸，你很棒'];
  function closeGames(){
    var had = !!modal;
    if(gameStop){ gameStop(); gameStop = null; }
    if(modal){ modal.remove(); modal = null; }
    if(had && gameNote){
      var t = pick(gameNote === 'smashWin' ? AFTER_SMASH : AFTER_PLAY) + ch().tail;
      gameNote = null; setTimeout(function(){ say(t, 2200); }, 250);
    }
    gameNote = null;
  }
  function openGames(){
    closeGames();
    modal = el('div','sp-modal',
      '<div class="sp-box"><div class="sp-mhead sp-ghead"><div class="sp-mav"><img alt=""></div>' +
      '<div class="sp-minfo"><div class="sp-mname sp-title">玩遊戲</div>' +
      '<div class="sp-mood">'+HEART+'<div class="sp-bar"><div class="sp-fill"></div></div><span class="sp-num"></span></div></div>' +
      '<button class="sp-x" aria-label="關閉"><svg class="sp-xsvg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
      '<div class="sp-body"></div></div>');
    modal.querySelector('.sp-mav img').src = ch().img;
    document.body.appendChild(modal); renderMood();
    modal.addEventListener('pointerdown', function(e){ if(e.target === modal) closeGames(); });
    modal.querySelector('.sp-x').addEventListener('click', closeGames);
    showPicker();
  }
  function body(){ return modal.querySelector('.sp-body'); }
  function setTitle(t){ modal.querySelector('.sp-title').textContent = t; }
  var IC_BAG = ICON('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>');
  var IC_CUT = ICON('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>');
  var IC_ZAP = ICON('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');
  var IC_STAR = ICON('<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>');
  function showPicker(){
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('玩遊戲');
    var b = body(); b.innerHTML = '<div class="sp-pick">' +
      '<button class="sp-btn" data-g="catch"><i class="sp-ic c5">'+IC_BAG+'</i>天降業績</button>' +
      '<button class="sp-btn" data-g="rps"><i class="sp-ic c2">'+IC_CUT+'</i>猜拳</button>' +
      '<button class="sp-btn" data-g="smash"><i class="sp-ic c6">'+IC_ZAP+'</i>情緒釋放</button>' +
      '<button class="sp-btn" data-g="fortune"><i class="sp-ic c7">'+IC_STAR+'</i>今日運勢</button></div>' +
      '<div class="sp-hintline">玩遊戲可以增加友好值，玩得越好加越多</div>';
    b.querySelector('[data-g=catch]').onclick = startCatch;
    b.querySelector('[data-g=rps]').onclick = startRps;
    b.querySelector('[data-g=smash]').onclick = startSmash;
    b.querySelector('[data-g=fortune]').onclick = startFortune;
  }

  /* 遊戲一：天降業績（10 秒，拖曳或方向鍵左右移動，接 3C 產品與鈔票） */
  function startCatch(){
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('天降業績');
    var b = body();
    b.innerHTML = '<div class="sp-hud"><span>剩 <b class="t">10</b> 秒</span><span>得分 <b class="s">0</b></span></div>' +
                  '<div class="sp-arena"><img class="sp-player" alt=""></div><div class="sp-tip">拖曳或按 ← → 移動</div>';
    var arena = b.querySelector('.sp-arena'), player = b.querySelector('.sp-player');
    var tEl = b.querySelector('.t'), sEl = b.querySelector('.s');
    player.src = ch().img;
    var W = arena.clientWidth, H = arena.clientHeight, PW = 64;
    var DUR = 10;                                   // 遊戲秒數
    var px = W/2, score = 0, left = DUR, spawn = .3, items = [], last = performance.now(), raf = 0, over = false;
    function movePlayer(){ player.style.transform = 'translateX('+(px-PW/2)+'px)'; }
    movePlayer();
    function setX(clientX){ var r = arena.getBoundingClientRect(); px = clamp(clientX - r.left, PW/2, W - PW/2); movePlayer(); }
    function onPtr(e){ setX(e.clientX); }
    arena.addEventListener('pointerdown', onPtr); arena.addEventListener('pointermove', onPtr);
    function onKey(e){
      if(e.key === 'ArrowLeft'){ px = clamp(px-28, PW/2, W-PW/2); movePlayer(); e.preventDefault(); }
      if(e.key === 'ArrowRight'){ px = clamp(px+28, PW/2, W-PW/2); movePlayer(); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    function addItem(){
      var star = Math.random() < .12, di = Math.floor(Math.random()*DEVICES.length),
          it = el('div','sp-item', (star ? MONEY : DEVICES[di]) + '<span class="sp-cap">' + (star ? '錢錢' : DEV_LABELS[di]) + '</span>');       // star＝金幣（3 分）
      var x = Math.random()*(W-34);
      it.style.transform = 'translate('+x+'px,-40px)'; arena.appendChild(it);
      items.push({el:it, x:x, y:-40, v:(H/2.4) + Math.random()*(H/3.2), pts:star?3:1});
    }
    function frame(t){
      if(over) return;
      var dt = Math.min(.05, (t - last)/1000); last = t;
      left -= dt; spawn -= dt;
      if(spawn <= 0){ addItem(); spawn = Math.max(.26, .55 - (DUR-left)*.03); }
      for(var i=items.length-1;i>=0;i--){
        var it = items[i]; it.y += it.v*dt;
        it.el.style.transform = 'translate('+it.x+'px,'+it.y+'px)';
        var cx = it.x + 17, bottom = it.y + 50;
        if(bottom >= H-4-PW*0.8 && it.y <= H-10 && Math.abs(cx - px) < PW*0.55){
          score += it.pts; sEl.textContent = score; it.el.remove(); items.splice(i,1);
        } else if(it.y > H){ it.el.remove(); items.splice(i,1); }
      }
      tEl.textContent = Math.max(0, Math.ceil(left));
      if(left <= 0){ finish(); return; }
      raf = requestAnimationFrame(frame);
    }
    function finish(){
      over = true; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      gameNote = 'played';
      var best = parseInt(get(K.best)||'0',10), isBest = score > best;
      if(isBest) set(K.best, String(score));
      var gain = Math.min(15, score); setMood(getMood() + gain);
      b.innerHTML = '<div class="sp-result"><b>'+score+' 分</b><p>'+(isBest ? '新紀錄！' : '最高紀錄 '+best+' 分')+'</p><p style="color:#f0648f;font-weight:700">友好值 +'+gain+'</p>' +
        '<div class="sp-acts"><button class="main" id="sp-again">再玩一次</button><button id="sp-back">返回</button></div></div>';
      b.querySelector('#sp-again').onclick = startCatch;
      b.querySelector('#sp-back').onclick = showPicker;
      hearts(score >= 8 ? 5 : 2);
      gameStop = null;
    }
    raf = requestAnimationFrame(frame);
    gameStop = function(){ over = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
  }

  /* 遊戲二：猜拳 */
  function startRps(){
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('猜拳');
    var HANDS = ['✊','✌️','✋'], w = 0, l = 0, d = 0;
    var b = body();
    b.innerHTML = '<div class="sp-rps"><div class="sp-rps-pet"><img alt=""></div><div class="sp-rps-hand">❓</div><div class="sp-rps-res">出拳吧</div>' +
      '<div class="sp-rps-btns"><button data-m="0">✊</button><button data-m="1">✌️</button><button data-m="2">✋</button></div>' +
      '<div class="sp-rps-score"></div></div>';
    b.querySelector('.sp-rps-pet img').src = ch().img;
    var hand = b.querySelector('.sp-rps-hand'), res = b.querySelector('.sp-rps-res'), sc = b.querySelector('.sp-rps-score');
    function renderScore(){ sc.textContent = '勝 '+w+'　負 '+l+'　平 '+d; }
    renderScore();
    [].forEach.call(b.querySelectorAll('.sp-rps-btns button'), function(btn){
      btn.onclick = function(){
        var m = +btn.getAttribute('data-m'), p = Math.floor(Math.random()*3);
        hand.textContent = HANDS[p];
        if(m === p){ d++; res.textContent = '平手！'; }
        else if((p - m + 3) % 3 === 1){ w++; res.textContent = '你贏了！'; hearts(2); anim('sp-shake',450); }
        else { l++; res.textContent = '我贏啦'+ch().tail; anim('sp-joy',900); }
        gameNote = 'played'; setMood(getMood()+2); res.textContent += '　友好值 +2'; renderScore();
      };
    });
  }

  /* 遊戲三：情緒釋放
   * 目的：釋放工作壓力。球上隨機寫一個工作壓力，連點打散它；
   * 壓力值從 100% 往下降，球與畫面從緊繃的暗紅，漸漸退成明亮平靜的青藍；10 秒內壓力歸零才算釋放成功並增加心情。
   * 第一下點下去才開始倒數。 */
  var SMASH_SECS = 10, SMASH_TARGET = 35, SMASH_REWARD = 15;
  var STRESSES = ['業績壓力','奧客','系統又當機','退換貨爭議','客人殺價','盤點','排班','待辦清單','庫存對不上','電話一直響','加班'];
  var CALM = ['辛苦了，你已經做得很好了','慢慢呼吸，壓力正在離開','放下它，你值得好好休息','一次一件事，你可以的'];
  var VENTS = ['砰！','走開！','退散！','不理你','放下它','呼～'];
  function startSmash(){                               // 第一步：選現在的壓力是什麼
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('情緒釋放');
    var bb = body();
    bb.innerHTML = '<div class="sp-q">現在最讓你有壓力的是？</div><div class="sp-chips"></div>';
    var box = bb.querySelector('.sp-chips');
    STRESSES.concat(['其他']).forEach(function(name){
      var c = el('button','sp-chip', name); c.type = 'button';
      c.onclick = function(){ launchSmash(name === '其他' ? '壓力' : name); };
      box.appendChild(c);
    });
  }
  function launchSmash(phrase){                        // 第二步：打散它
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('情緒釋放');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var b = body();
    b.innerHTML = '<div class="sp-hud"><span>剩 <b class="t">' + SMASH_SECS + '</b> 秒</span><span>壓力值 <b class="s">100</b>%</span></div>' +
                  '<div class="sp-pbar"><div class="sp-pfill"></div></div>' +
                  '<div class="sp-arena sp-smash"><div class="sp-orb"><div class="sp-orbtxt"></div></div></div>';
    var arena = b.querySelector('.sp-arena'), orb = b.querySelector('.sp-orb'), txt = b.querySelector('.sp-orbtxt');
    var tEl = b.querySelector('.t'), sEl = b.querySelector('.s'), pf = b.querySelector('.sp-pfill');
    txt.textContent = phrase;
    var ANG = [18, 110, 205, 295], cracks = [];
    ANG.forEach(function(a){ var c = el('div','sp-crack'); c.style.transform = 'translate(-50%,0) rotate(' + a + 'deg)'; orb.appendChild(c); cracks.push(c); });
    var hits = 0, started = 0, timer = 0, over = false, toggle = false;

    /* 色調：緊繃暗紅 → 平靜青藍；p = 0（滿壓力）～ 1（釋放） */
    function hsl(h,sat,l,a){ return 'hsl' + (a != null ? 'a' : '') + '(' + h + ',' + sat + '%,' + l + '%' + (a != null ? ',' + a : '') + ')'; }
    function tone(p){
      var h = Math.round(352 - 162*p), sat = Math.round(72 - 22*p), l = Math.round(30 + 36*p);
      orb.style.background = 'radial-gradient(circle at 35% 30%,' + hsl(h,sat,l+30) + ' 0,' + hsl(h,sat,l+14) + ' 30%,' + hsl(h,sat,l) + ' 70%,' + hsl(h,sat,l-12) + ' 100%)';
      orb.style.boxShadow = '0 0 36px ' + hsl(h,sat,l+10,.7) + ',inset -8px -10px 22px ' + hsl(h,sat,l-18,.45);
      arena.style.background = hsl(Math.round(340 - 150*p), Math.round(30 + 15*p), Math.round(18 + 74*p));
      pf.style.background = hsl(h,sat,l+8);
      var size = Math.round(150 - 58*p);
      orb.style.width = size + 'px'; orb.style.height = size + 'px';
      txt.style.opacity = String(Math.max(.15, 1 - .85*p));
      txt.style.fontSize = Math.round(22 - 6*p) + 'px';
      return {h:h, s:sat, l:l};
    }
    tone(0);
    function fgFor(p){ return p < .5 ? '#fff' : '#0f5b5b'; }

    function sparks(n, far, p){
      var r = arena.getBoundingClientRect(), cx = r.width/2, cy = r.height/2, chars = phrase.split('');
      var col = p < .5 ? '#ffd9c8' : '#0f6b6b';
      for(var i=0;i<n;i++){
        var sp = el('div','sp-spark', chars[Math.floor(Math.random()*chars.length)]), ang = Math.random()*Math.PI*2, d = (far ? 70 : 40) + Math.random()*(far ? 120 : 50);
        sp.style.left = (cx-9)+'px'; sp.style.top = (cy-9)+'px'; sp.style.color = col;
        arena.appendChild(sp);
        if(sp.animate) sp.animate([{transform:'translate(0,0) rotate(0) scale(1)',opacity:1},{transform:'translate('+Math.cos(ang)*d+'px,'+Math.sin(ang)*d+'px) rotate('+(Math.random()*240-120)+'deg) scale(.4)',opacity:0}],
                                  {duration: far ? 700 : 400, easing:'ease-out', fill:'forwards'});
        (function(x){ setTimeout(function(){ x.remove(); }, far ? 750 : 450); })(sp);
      }
    }
    function vent(e, p){                                  // 點的位置飄出發洩字眼
      var r = arena.getBoundingClientRect(), v = el('div','sp-vent', pick(VENTS));
      v.style.left = Math.max(4, Math.min(r.width-60, e.clientX - r.left - 20)) + 'px';
      v.style.top = Math.max(4, e.clientY - r.top - 30) + 'px'; v.style.color = fgFor(p);
      arena.appendChild(v);
      if(v.animate) v.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-46px)',opacity:0}], {duration:650, easing:'ease-out', fill:'forwards'});
      setTimeout(function(){ v.remove(); }, 700);
    }
    function punch(e, p){
      toggle = !toggle;
      orb.classList.remove(toggle ? 'pb' : 'pa'); orb.classList.add(toggle ? 'pa' : 'pb');
      orb.style.filter = 'brightness(1.4)'; setTimeout(function(){ orb.style.filter = ''; }, 90);
      if(reduce) return;
      sparks(5, false, p); vent(e, p);
      if(arena.animate) arena.animate([{transform:'translate(0,0)'},{transform:'translate(-3px,2px)'},{transform:'translate(3px,-2px)'},{transform:'translate(0,0)'}], {duration:120});
    }
    function tick(){
      var left = SMASH_SECS - (Date.now() - started)/1000;
      tEl.textContent = Math.max(0, Math.ceil(left));
      if(left <= 0) finish(false);
    }
    function onHit(e){
      if(over) return;
      if(e && e.preventDefault) e.preventDefault();
      if(!started){ started = Date.now(); timer = setInterval(tick, 100); }
      hits++;
      var p = Math.min(1, hits/SMASH_TARGET);
      sEl.textContent = Math.max(0, Math.round(100 - p*100));
      pf.style.width = Math.max(0, 100 - p*100) + '%';
      tone(p);
      var lv = Math.min(4, Math.floor(p*4));
      cracks.forEach(function(c, i){ if(i < lv) c.classList.add('on'); });
      punch(e, p);
      if(navigator.vibrate){ try{ navigator.vibrate(10); }catch(_){} }
      if(hits >= SMASH_TARGET) finish(true);
    }
    function finish(win){
      if(over) return; over = true; clearInterval(timer);
      gameNote = win ? 'smashWin' : 'played';
      arena.removeEventListener('pointerdown', onHit);
      var used = started ? Math.min(SMASH_SECS, (Date.now()-started)/1000).toFixed(1) : '0';
      var left = Math.max(0, Math.round(100 - Math.min(1, hits/SMASH_TARGET)*100));
      if(win){
        tone(1); sEl.textContent = '0'; pf.style.width = '0%';
        if(!reduce){
          if(orb.animate) orb.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.8)',opacity:0}], {duration:380, fill:'forwards'});
          sparks(26, true, 1);
        } else orb.style.visibility = 'hidden';
        setMood(getMood() + SMASH_REWARD); hearts(6); anim('sp-joy', 900);
      }
      setTimeout(function(){
        b.innerHTML = '<div class="sp-result' + (win ? ' sp-calm' : '') + '"><b' + (win ? ' style="color:#0f5b5b"' : '') + '>' + (win ? '釋放成功' : '壓力還沒散完') + '</b>' +
          (win ? '<p style="font-size:14px;color:#0f5b5b;font-weight:600">' + pick(CALM) + '</p>' +
                 '<div class="sp-breath"><div class="sp-bcircle"></div><span class="sp-btext">吸氣</span></div>' +
                 '<p style="font-size:16px;font-weight:700;color:#0f5b5b">今天會是Luck的一天</p>'
               : '<p>還剩 ' + left + '%，深呼吸，再試一次吧</p>') +
          (win ? '<p>用了 ' + used + ' 秒</p><p style="color:#f0648f;font-weight:700">友好值 +' + SMASH_REWARD + '</p>' : '') +
          '<div class="sp-acts"><button class="main" id="sp-again">再玩一次</button><button id="sp-back">返回</button></div></div>';
        b.querySelector('#sp-again').onclick = startSmash;
        b.querySelector('#sp-back').onclick = showPicker;
        if(win){                                       // 呼吸引導：吸氣 4 秒、吐氣 6 秒，循環到離開為止
          var bt = b.querySelector('.sp-btext'), btimer = 0;
          var cycle = function(){
            bt.textContent = '吸氣';
            btimer = setTimeout(function(){ bt.textContent = '吐氣'; btimer = setTimeout(cycle, 6000); }, 4000);
          };
          cycle();
          gameStop = function(){ clearTimeout(btimer); };
        }
      }, win && !reduce ? 750 : 300);
      gameStop = null;
    }
    arena.addEventListener('pointerdown', onHit);
    gameStop = function(){ over = true; clearInterval(timer); arena.removeEventListener('pointerdown', onHit); };
  }

  /* 遊戲四：今日運勢（搖籤）
   * 點籤筒搖 5 下掉出一支籤，翻出今天的運勢。台灣時間每天只有一個結果（存在這台裝置），
   * 當天第一次抽 +FORTUNE_REWARD 友好值，再進來只是看結果、不再加分。內容純屬娛樂，不涉及業績承諾。 */
  var FORTUNE_REWARD = 5, FORT_KEY = 'toolbox-pet-fort';
  var FORT_TIERS = [
    {t:'大吉', w:10, g:['#ffb300','#ff6b3d'], s:[5,5], m:'今天人緣特別好，說什麼客人都聽得進去。'},
    {t:'中吉', w:25, g:['#ff8ab3','#f0648f'], s:[4,5], m:'小小的好運在身邊，留意客人的小需求。'},
    {t:'小吉', w:30, g:['#6bb6ff','#5b7cf0'], s:[3,4], m:'穩穩做好每一件事，今天會很順。'},
    {t:'吉',   w:25, g:['#5fd1a8','#2fb5a3'], s:[3,4], m:'多笑一點，好運自然來。'},
    {t:'末吉', w:10, g:['#aab4c3','#7a8aa6'], s:[2,3], m:'今天慢慢來，一次處理一件事就好。'}
  ];
  var FORT_COLORS = [['橘色','#ff8a3d'],['粉紅色','#f58bb0'],['天空藍','#6bb6ff'],['薄荷綠','#5fd1a8'],['奶油黃','#f6d77a'],['薰衣草紫','#a98bf0'],['銀灰色','#aab4c3'],['白色','#ffffff']];
  var TUBE_SVG = '<svg class="sp-tubesvg" viewBox="0 0 120 150">' +
    '<g stroke="#a8742c" stroke-width="2" fill="#f8e3b5">' +
    '<rect x="34" y="14" width="7" height="50" rx="2" transform="rotate(-14 37 60)"/>' +
    '<rect x="46" y="8" width="7" height="54" rx="2" transform="rotate(-6 49 60)"/>' +
    '<rect x="58" y="12" width="7" height="52" rx="2" transform="rotate(3 61 60)"/>' +
    '<rect x="70" y="9" width="7" height="54" rx="2" transform="rotate(10 73 60)"/>' +
    '<rect x="81" y="16" width="7" height="48" rx="2" transform="rotate(18 84 60)"/></g>' +
    '<path d="M30 62h60l-6 80a8 8 0 0 1-8 7H44a8 8 0 0 1-8-7z" fill="#e9b872" stroke="#a8742c" stroke-width="3" stroke-linejoin="round"/>' +
    '<rect x="26" y="54" width="68" height="13" rx="6.5" fill="#f3cf95" stroke="#a8742c" stroke-width="3"/>' +
    '<circle cx="60" cy="104" r="17" fill="#d6453d"/><text x="60" y="111.5" text-anchor="middle" font-size="22" font-weight="800" font-family="PingFang TC,Noto Sans TC,sans-serif" fill="#fff">籤</text></svg>';
  function todayTW(){ return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei'}).format(new Date()); }   // YYYY-MM-DD
  function stars(n){ return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function loadFortune(){ var f = null; try{ f = JSON.parse(get(FORT_KEY)); }catch(e){} return (f && f.d === todayTW()) ? f : null; }
  function rollFortune(){
    var tot = FORT_TIERS.reduce(function(a, x){ return a + x.w; }, 0), r = Math.random()*tot, i = 0;
    for(; i < FORT_TIERS.length - 1; i++){ r -= FORT_TIERS[i].w; if(r < 0) break; }
    var T = FORT_TIERS[i], rnd = function(a, b){ return a + Math.floor(Math.random()*(b - a + 1)); };
    return { d:todayTW(), i:i, a:rnd(T.s[0], T.s[1]), b:rnd(T.s[0], T.s[1]), c:Math.floor(Math.random()*FORT_COLORS.length), n:rnd(1, 99) };
  }
  function showFortune(f, first){
    var T = FORT_TIERS[f.i], C = FORT_COLORS[f.c], b = body();
    if(first){ setMood(getMood() + FORTUNE_REWARD); hearts(f.i <= 1 ? 6 : 3); if(f.i <= 1) anim('sp-joy', 900); }
    b.innerHTML = '<div class="sp-fres" style="--g1:' + T.g[0] + ';--g2:' + T.g[1] + '"><div class="sp-ftier">' + T.t + '</div>' +
      '<div class="sp-frow"><span>業績運</span><b class="sp-star">' + stars(f.a) + '</b></div>' +
      '<div class="sp-frow"><span>客緣運</span><b class="sp-star">' + stars(f.b) + '</b></div>' +
      '<div class="sp-frow"><span>幸運色</span><b><i class="sp-fsw" style="background:' + C[1] + '"></i>' + C[0] + '</b></div>' +
      '<div class="sp-frow"><span>幸運數字</span><b>' + f.n + '</b></div>' +
      '<p class="sp-fmsg">' + T.m + '</p>' +
      '<p class="sp-fnote">' + (first ? '<span style="color:#f0648f;font-weight:700">友好值 +' + FORTUNE_REWARD + '</span>　' : '今天已經抽過囉　') + '每天抽一次，運勢僅供娛樂</p>' +
      '<div class="sp-acts"><button class="main" id="sp-back">返回</button></div></div>';
    b.querySelector('#sp-back').onclick = showPicker;
  }
  function startFortune(){
    if(gameStop){ gameStop(); gameStop = null; }
    setTitle('今日運勢');
    gameNote = 'played';
    var f = loadFortune();
    if(f){ showFortune(f, false); return; }                    // 今天抽過了：直接看結果，不再加分
    var b = body(), taps = 0, busy = false, tm = 0;
    b.innerHTML = '<div class="sp-fort"><div class="sp-tubewrap">' + TUBE_SVG + '<div class="sp-stick"></div></div>' +
                  '<div class="sp-ftip">點籤筒搖一搖　<b class="n">0</b> / 5</div></div>';
    var wrap = b.querySelector('.sp-tubewrap'), stick = b.querySelector('.sp-stick'), nEl = b.querySelector('.n');
    wrap.addEventListener('pointerdown', function(e){
      if(busy) return;
      if(e.preventDefault) e.preventDefault();
      taps++; nEl.textContent = taps;
      wrap.classList.remove('rattle'); void wrap.offsetWidth; wrap.classList.add('rattle');
      if(navigator.vibrate){ try{ navigator.vibrate(12); }catch(_){} }
      if(taps >= 5){
        busy = true; stick.classList.add('go');
        tm = setTimeout(function(){ var nf = rollFortune(); set(FORT_KEY, JSON.stringify(nf)); showFortune(nf, true); }, 900);
      }
    });
    gameStop = function(){ clearTimeout(tm); };
  }

  /* ---------- 閒置：偶爾睡覺、心情好時開心跳一下、肚子餓了提醒 ---------- */
  function startSleep(){
    pet.classList.add('sleep'); if(ch().poses && ch().poses.sleep) pet.classList.add('sp-posed');
    syncPose(); setTimeout(wake, 6000);
  }
  function wake(){ pet.classList.remove('sleep','sp-posed'); syncPose(); }
  var lastTip = Date.now(), tipIdx = 0;
  var TIPS = ['點我開選單，玩遊戲、摸摸都能增加友好值','遊戲玩得好，友好值加更多','摸摸的時間越久，友好值加越多','太久沒來，友好值會慢慢下降喔','情緒釋放打滿，一次加 15 點友好值','天降業績接到錢錢，一次算 3 分','換角色可以選自己喜歡的夥伴','今日運勢每天抽一次，第一次抽有友好值'];
  var lastHungry = 0;
  setInterval(function(){
    if(pet.style.display === 'none' || dragging || menuOpen || rubbing || modal) return;
    var mood = getMood(), r = Math.random();
    if(mood < 20 && Date.now() - lastHungry > 90000){ lastHungry = Date.now(); say(pick(['陪我玩嘛','好無聊喔…','摸摸我好不好','你在忙嗎？'])+ch().tail, 2200); }
    else if(mood < 70 && Date.now() - lastTip > 150000){ lastTip = Date.now(); say(TIPS[tipIdx++ % TIPS.length], 3800); }
    else if(mood >= 80 && r < .18){ anim('sp-joy', 900); if(Math.random() < .5) say(pick(['好開心！','有你真好','今天心情超好'])+ch().tail, 1800); }
    else if(r < .15){ startSleep(); }
  }, 7000);
  pet.addEventListener('pointerdown', function(){ wake(); });

  /* 待機小動作：東張西望、伸懶腰、小跳、歪頭（不加文字，只有動作） */
  var IDLE = ['sp-look','sp-stretch','sp-hop','sp-tilt'], IDLE_MS = {'sp-look':2200,'sp-stretch':1600,'sp-hop':800,'sp-tilt':1800};
  setInterval(function(){
    if(pet.style.display === 'none' || document.hidden || dragging || menuOpen || rubbing || modal || pet.classList.contains('sleep') || Date.now() < joyUntil) return;
    if(Math.random() > .4) return;
    var a = getMood() < 20 ? pick(['sp-look','sp-tilt']) : pick(IDLE);    // 低友好值不會蹦蹦跳跳
    anim(a, IDLE_MS[a]);
  }, 5000);

  /* 滑鼠移動時，寵物微微朝游標方向傾斜（只限滑鼠，觸控裝置不啟用） */
  var leanRaf = 0, leanX = 0;
  window.addEventListener('pointermove', function(e){
    if(e.pointerType !== 'mouse') return;
    leanX = e.clientX;
    if(leanRaf) return;
    leanRaf = requestAnimationFrame(function(){
      leanRaf = 0;
      var r = pet.getBoundingClientRect(), d = (leanX - (r.left + r.width/2)) / Math.max(window.innerWidth/2, 1);
      pet.style.setProperty('--sp-lean', (pet.classList.contains('sleep') || rubbing ? 0 : clamp(d, -1, 1) * 5).toFixed(1) + 'deg');
    });
  });

  /* ---------- 招呼語（第一次見面／好久不見／剛離開又回來／依台灣時間） ---------- */
  function greeting(){
    var tail = ch().tail;
    if(awayMs === null) return '第一次見面，我是' + ch().name + '，請多指教' + tail;
    if(awayMs >= 86400000) return '好久不見！好想你' + tail;
    if(getMood() < 20) return pick(['好想你，陪我玩嘛','你終於來了，我等好久','今天可以陪陪我嗎','摸摸我好不好','陪我玩遊戲，我就會開心起來','摸摸我或玩遊戲，我們的友好值會增加']) + tail;     // 心情低（正在哭臉）時撒嬌
    if(awayMs < 600000) return '歡迎回來' + tail;
    var h = +new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei', hourCycle:'h23', hour:'2-digit'}).format(new Date());
    var t = h >= 5 && h < 11 ? '早安！今天也請多指教'
          : h >= 11 && h < 14 ? '午安！吃飽了嗎'
          : h >= 14 && h < 18 ? '下午好！加油加油'
          : h >= 18 && h < 23 ? '辛苦了！今天也很棒'
          : '還在忙嗎？記得休息';
    return t + tail;
  }

  /* ---------- 啟動 ---------- */
  /* 先讓畫面上的那張圖載入，其餘角色與姿勢圖等頁面載完、瀏覽器閒下來再預載，避免搶頻寬 */
  function arm(){ if(armed) return; armed = true; updateMenuHead(); syncPose(); if(document.readyState === 'complete') whenIdle(); else window.addEventListener('load', whenIdle); }
  var introDone = false;
  function intro(){
    introDone = true;
    if(!get(K.seen)) ring.classList.add('on');                         // 第一次來：光圈提示可以點
    setTimeout(function(){ say(greeting(), 3500); }, 700);            // 招呼語
    if(awayMs === null) setTimeout(function(){ if(!menuOpen && !modal) say('點我開選單，玩遊戲、摸摸都能增加友好值', 4800); }, 4600);   // 第一次使用：教怎麼互動
  }
  function warm(){ CHARS.forEach(function(c){ new Image().src = c.img; }); preloadPoses(); }
  function whenIdle(){ (window.requestIdleCallback || function(f){ setTimeout(f, 1500); })(warm, {timeout: 4000}); }
  renderMood(); touchLast();
  var isPhone = window.matchMedia && matchMedia('(max-width:700px)').matches;
  /* 手機預設收起（點 🐾 才展開、圖片也不載入，讓首頁更快）；電腦預設展開。同一次瀏覽內以使用者最後的選擇為準 */
  var startHidden = isPhone ? getHid() !== '0' : getHid() === '1';
  if(startHidden){ pet.style.display = 'none'; tab.style.display = 'block'; }
  else { arm(); loadPos(); intro(); }
})();
