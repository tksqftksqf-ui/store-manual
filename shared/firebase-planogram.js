import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCaeYnq8jW1Tw12leHgRO7POENf8DKXIWs",
  authDomain: "store-manual-5eafb.firebaseapp.com",
  projectId: "store-manual-5eafb",
  storageBucket: "store-manual-5eafb.firebasestorage.app",
  messagingSenderId: "66117956268",
  appId: "1:66117956268:web:755a34ba71facd6a902509"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const UPLOAD_PASSWORD = "TaiwanCES";

export const STORE_NAMES = ['新光華','五甲店','自由店','華榮店','岡山店','右昌店','台南永華二店','台南中華店','斗六店','全國電子屏東店','全國電子民族店'];

function todayStr(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function checkPassword(pw){
  return pw === UPLOAD_PASSWORD;
}

// Firestore 文件ID不能含「/」，其餘符號（•、空白、+）皆合法；仍做保守轉換避免過長或特殊字元問題，
// 顯示用文字另存 label 欄位保留原始櫃位名稱
export function zoneNameToDocId(zoneName){
  return zoneName.replace(/\//g, '-').slice(0, 300);
}

// 每間店的資料拆成：主文件只放 updateDate，圖片各自存成子集合 pages/{櫃位名稱} 的獨立文件
// 原因：Firestore 單一文件上限 1MB，一間店多張圖加總常超過此限制，拆開後每張圖各自獨立不受影響

export async function loadStoreMeta(){
  const snap = await getDocs(collection(db, 'planograms'));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
}

export async function loadStorePages(storeName){
  const q = query(collection(db, 'planograms', storeName, 'pages'), orderBy('order'));
  const snap = await getDocs(q);
  const pages = [];
  snap.forEach(d => { pages.push({ label: d.data().label || d.id, src: d.data().src }); });
  return pages;
}

export async function clearStorePages(storeName){
  const snap = await getDocs(collection(db, 'planograms', storeName, 'pages'));
  const deletions = [];
  snap.forEach(d => { deletions.push(deleteDoc(d.ref)); });
  await Promise.all(deletions);
}

export async function uploadPlanogramPage(storeName, zoneName, base64Str, order){
  await setDoc(doc(db, 'planograms', storeName), { updateDate: todayStr() }, { merge: true });
  await setDoc(doc(db, 'planograms', storeName, 'pages', zoneNameToDocId(zoneName)), { label: zoneName, src: base64Str, order });
}

export function compressImage(file, maxWidth, quality){
  maxWidth = maxWidth || 1600;
  quality = quality || 0.82;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
