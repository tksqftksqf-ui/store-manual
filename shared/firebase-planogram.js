import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

export const PAGE_DEFS = [
  { page: 1, label: '第 1 頁 · 門市整體配置總覽' },
  { page: 5, label: '第 5 頁 · Table 3 · Desktops + Notebooks Planogram' },
  { page: 6, label: '第 6 頁 · Table 1 · iPhone + Watch Planogram' },
  { page: 7, label: '第 7 頁 · Table 2 · iPad + HomePod Planogram' },
  { page: 8, label: '第 8 頁 · Flex Bar · iPad + iPhone + Glass Case Planogram' },
  { page: 9, label: '第 9 頁 · Flex Wall (左) · Mac + Glass Case Planogram' },
  { page: 10, label: '第 10 頁 · Flex Wall (右) · Apple TV + Glass Case Planogram' },
];

export const STORE_NAMES = ['新光華','五甲店','自由店','華榮店','岡山店','右昌店','台南永華二店','台南中華店','斗六店','全國電子屏東店','全國電子民族店'];

function todayStr(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function checkPassword(pw){
  return pw === UPLOAD_PASSWORD;
}

export async function loadAllPlanograms(){
  const snap = await getDocs(collection(db, 'planograms'));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
}

export async function uploadPlanogramPage(storeName, pageNum, base64Str){
  const ref = doc(db, 'planograms', storeName);
  const existing = await getDoc(ref);
  const pages = existing.exists() ? Object.assign({}, existing.data().pages) : {};
  pages[String(pageNum)] = base64Str;
  await setDoc(ref, { updateDate: todayStr(), pages });
}

export async function migrateStoreData(storeName, updateDate, pages){
  await setDoc(doc(db, 'planograms', storeName), { updateDate, pages });
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
