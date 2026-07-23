import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

async function extractPageTitle(page){
  const content = await page.getTextContent();
  const items = content.items;
  if(items.length === 0) return '';
  // 標題行是 y 座標最大（頁面最上方，pdf.js 座標原點在左下角）的那些文字項目
  // 誤差容許值需夠寬：標題列裡的圓點符號「•」跟文字本身的基準線常有 2~3pt 落差（不同字型渲染高度不同）
  const maxY = Math.max(...items.map(it => it.transform[5]));
  const titleItems = items
    .filter(it => Math.abs(it.transform[5] - maxY) < 5)
    .sort((a, b) => a.transform[4] - b.transform[4]);
  return titleItems.map(it => it.str).join('').trim();
}

async function renderPageToImage(page, maxWidth, quality){
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2, maxWidth / baseViewport.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/jpeg', quality);
}

export async function extractPagesFromPdf(file, maxWidth, quality){
  maxWidth = maxWidth || 1600;
  quality = quality || 0.82;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for(let i = 1; i <= pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const title = await extractPageTitle(page);
    const imageDataUrl = await renderPageToImage(page, maxWidth, quality);
    pages.push({ pageNum: i, title, imageDataUrl });
  }
  return pages;
}

// 第1頁固定是「整體配置總覽」陳列圖（一律保留）；第2頁起，只要標題文字與第1頁完全相同，
// 代表是零件清單/說明頁（要略過），標題不同即代表進入陳列圖頁面，該頁標題文字本身就是櫃位名稱
export function groupPagesByZone(pages){
  if(pages.length === 0) return [];
  const coverTitle = pages[0].title;
  const overview = { zoneName: '整體配置總覽', pageNum: pages[0].pageNum, imageDataUrl: pages[0].imageDataUrl };
  const zones = pages
    .slice(1)
    .filter(p => p.title !== coverTitle)
    .map(p => ({ zoneName: p.title, pageNum: p.pageNum, imageDataUrl: p.imageDataUrl }));
  return [overview, ...zones];
}
