// ============================================================
// /api/22lik-numeroloji -- sunucu tarafinda sifre korumali sayfa
// ============================================================
// Bu Vercel Serverless Function (Node.js) hem sifre ekranini hem de
// hesap uygulamasinin kendisini SUNUCUDA render eder. Uygulamanin HTML
// icerigi bu dosyanin ICINDE (bir sabit dize olarak) tutulur; ayri bir
// statik dosya olarak sitede DURMAZ, dolayisiyla sifre dogrulanmadan
// dogrudan bir URL ile cekilemez.
//
// Sifre process.env.NUMEROLOJI_SIFRE degiskeninden okunur. Bu degisken
// Vercel proje ayarlarindan (Project -> Settings -> Environment
// Variables) tanimlanmalidir. Degisken tanimli degilse gelistirme
// sirasinda sayfanin calismaya devam etmesi icin "338" varsayilani
// kullanilir -- Vercel'de env var tanimlanir tanimlanmaz o deger
// otomatik olarak devreye girer ve bu dosyadaki hicbir acik sifre
// tarayiciya ASLA gonderilmez (yalnizca sunucu tarafinda karsilastirilir).
const crypto = require('crypto');

const SIFRE = process.env.NUMEROLOJI_SIFRE || '338';
const SECRET = process.env.NUMEROLOJI_SESSION_SECRET || 'nevraaya-22lik-numeroloji-oturum-anahtari-2026';
const COOKIE_NAME = 'numeroloji_oturum';
const GUVENLI_OTURUM_SURESI_MS = 12 * 60 * 60 * 1000; // 12 saat (sunucu tarafli azami sinir)

function imzala(payload) {
  const h = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + h;
}
function dogrula(token) {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const imza = token.slice(idx + 1);
  const beklenen = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(imza);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const parcalar = payload.split(':');
  const bitis = parseInt(parcalar[1], 10);
  return Number.isFinite(bitis) && Date.now() < bitis;
}
function cerezleriOku(header) {
  const out = {};
  (header || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function girisSayfasi(hata) {
  return LOGIN_HTML.replace('__HATA__', hata ? hata : '');
}

module.exports = async (req, res) => {
  const search = (function () { try { return new URL(req.url, 'http://x').searchParams; } catch (e) { return new URLSearchParams(); } })();
  const cerezler = cerezleriOku(req.headers.cookie);

  // Cikis Yap
  if (search.get('logout') === '1') {
    res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=/22lik-numeroloji; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    res.statusCode = 302;
    res.setHeader('Location', '/22lik-numeroloji');
    return res.end();
  }

  // Sifre gonderimi
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(body);
    const girilenSifre = params.get('sifre') || '';
    const a = Buffer.from(girilenSifre);
    const b = Buffer.from(SIFRE);
    const dogruMu = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (dogruMu) {
      const bitis = Date.now() + GUVENLI_OTURUM_SURESI_MS;
      const token = imzala('s:' + bitis);
      // Max-Age YOK => tarayici KAPANINCA cerez otomatik silinir (oturum cerezi).
      // Ayrica sunucu tarafinda 12 saatlik azami sure de HMAC imzali damga ile denetlenir.
      res.setHeader('Set-Cookie', COOKIE_NAME + '=' + encodeURIComponent(token) + '; Path=/22lik-numeroloji; HttpOnly; Secure; SameSite=Lax');
      res.statusCode = 302;
      res.setHeader('Location', '/22lik-numeroloji');
      return res.end();
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(girisSayfasi('Sifre hatali, lutfen tekrar deneyin.'));
  }

  // Normal GET: gecerli oturum var mi?
  const oturumGecerli = dogrula(cerezler[COOKIE_NAME]);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (oturumGecerli) {
    return res.end(APP_HTML);
  }
  return res.end(girisSayfasi(''));
};

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>22'lik Numeroloji Hesaplama Uygulamasi</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/assets/sistem-logosu.png" type="image/png">
<script>
  (function(){
    var saved = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#F3EAE0; --ink-soft:#CFC2E0; --paper:#140A1E; --paper-alt:#1B0F2A;
    --card:#221336; --line:#3A2050; --brand:#6B3FA0; --brand-dark:#E4D4F5;
    --brand-text:#C9A6EA; --gold:#E4A848; --gold-lt:#F5D89C; --radius:16px;
    --shadow:0 24px 60px -24px rgba(0,0,0,.7); font-size:16px;
  }
  :root[data-theme="light"]{
    --ink:#2b2420; --ink-soft:#5c5248; --paper:#faf7f1; --paper-alt:#f1ebdf;
    --card:#ffffff; --line:#e5dcc9; --brand:#5b3a7a; --brand-dark:#402a58;
    --brand-text:#5b3a7a; --gold:#b8863b; --gold-lt:#e4a848;
    --radius:14px; --shadow:0 10px 30px -12px rgba(43,36,32,.18);
  }
  *{box-sizing:border-box;}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--paper);color:var(--ink);font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  .box{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:40px;max-width:380px;width:100%;text-align:center;}
  .box img{width:48px;height:48px;border-radius:12px;margin-bottom:14px;}
  h1{font-family:'Cinzel',Georgia,serif;font-size:1.25rem;margin:0 0 6px;color:var(--ink);}
  p{color:var(--ink-soft);font-size:.9rem;margin:0 0 22px;}
  input{width:100%;font-size:1.1rem;letter-spacing:.1em;text-align:center;padding:14px;border-radius:10px;border:1px solid var(--line);background:var(--paper-alt);color:var(--ink);margin-bottom:14px;box-sizing:border-box;}
  button{width:100%;padding:14px;border-radius:999px;border:none;background:var(--brand);color:#fff;font-weight:700;font-size:1rem;cursor:pointer;font-family:inherit;}
  button:hover{background:#54307F;}
  .err{color:#e07a5f;font-size:.85rem;min-height:18px;margin-top:14px;}
</style>
</head>
<body>
  <form class="box" method="POST" action="/22lik-numeroloji">
    <img src="/assets/sistem-logosu.png" alt="">
    <h1>Numeroloji Hesaplama Uygulamasi</h1>
    <p>Bu sayfaya yalnizca sifreyi bilenler erisebilir.</p>
    <input type="password" name="sifre" placeholder="Sifre" inputmode="numeric" autocomplete="off" autofocus>
    <button type="submit">Giris Yap</button>
    <div class="err">__HATA__</div>
  </form>
</body>
</html>`;

const APP_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>22'lik Numeroloji Hesaplama Uygulaması</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="assets/sistem-logosu.png" type="image/png">
<script>
  (function(){
    var saved = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#F3EAE0; --ink-soft:#CFC2E0; --paper:#140A1E; --paper-alt:#1B0F2A;
    --card:#221336; --line:#3A2050; --brand:#6B3FA0; --brand-dark:#E4D4F5;
    --brand-text:#C9A6EA; --brand-soft:rgba(124,79,176,.16);
    --gold:#E4A848; --gold-lt:#F5D89C; --radius:16px;
    --shadow:0 24px 60px -24px rgba(0,0,0,.7); font-size:16px;
  }
  :root[data-theme="light"]{
    --ink:#2b2420; --ink-soft:#5c5248; --paper:#faf7f1; --paper-alt:#f1ebdf;
    --card:#ffffff; --line:#e5dcc9; --brand:#5b3a7a; --brand-dark:#402a58;
    --brand-text:#5b3a7a; --brand-soft:#efe7f5; --gold:#b8863b; --gold-lt:#e4a848;
    --radius:14px; --shadow:0 10px 30px -12px rgba(43,36,32,.18);
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.6;}
  h1,h2,h3,h4{font-family:'Cinzel',Georgia,serif;font-weight:600;color:var(--ink);margin:0 0 .5em;letter-spacing:.01em;}
  a{color:inherit;}
  .wrap{max-width:1080px;margin:0 auto;padding:0 24px;}
  .eyebrow{display:inline-block;font-family:'Cinzel',serif;font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;color:var(--brand-text);font-weight:600;margin-bottom:12px;}

  header.site{position:sticky;top:0;z-index:50;background:color-mix(in srgb, var(--paper) 92%, transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:12px 0;gap:16px;}
  .nav .brand{display:flex;align-items:center;gap:10px;font-family:'Cinzel',serif;font-weight:700;font-size:1.1rem;color:var(--brand-text);text-decoration:none;}
  .nav .brand img{width:32px;height:32px;object-fit:contain;border-radius:8px;}
  .theme-toggle{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gold);}
  .theme-toggle svg{width:18px;height:18px;}
  .theme-toggle .moon{display:none;}
  :root[data-theme="light"] .theme-toggle .sun{display:none;}
  :root[data-theme="light"] .theme-toggle .moon{display:block;}

  main{padding:48px 0 90px;}

  .logout-btn{background:transparent;border:1px solid var(--line);color:var(--ink-soft);border-radius:999px;padding:8px 16px;font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;}
  .logout-btn:hover{color:var(--ink);border-color:var(--gold);}

  .calc-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:32px;box-shadow:var(--shadow);margin-bottom:32px;}
  .grid2{display:grid;grid-template-columns:1fr;gap:18px;}
  @media(min-width:640px){.grid2{grid-template-columns:1fr 1fr;}}
  .field label{display:block;font-size:.8rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;}
  .field .hint{font-size:.78rem;color:var(--ink-soft);margin-top:4px;}
  input[type="text"],input[type="date"]{width:100%;font-size:1rem;padding:12px 14px;min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--paper-alt);color:var(--ink);}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;min-height:44px;border-radius:999px;font-weight:700;font-size:.95rem;text-decoration:none;border:1px solid transparent;cursor:pointer;background:var(--brand);color:#fff;margin-top:22px;}
  .btn:hover{background:#54307F;}

  .results{margin-top:8px;}
  .mod{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:26px;margin-bottom:22px;}
  .mod h3{font-size:1.05rem;color:var(--brand-dark);border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:16px;}
  .kv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;}
  .kv{background:var(--paper-alt);border:1px solid var(--line);border-radius:10px;padding:14px 16px;}
  .kv .lab{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);margin-bottom:6px;}
  .kv .val{font-family:'Cinzel',serif;font-size:1.3rem;color:var(--gold-lt);}
  table.hane{width:100%;border-collapse:collapse;font-size:.86rem;}
  table.hane th,table.hane td{border:1px solid var(--line);padding:8px 6px;text-align:center;}
  table.hane th{background:var(--paper-alt);color:var(--ink-soft);font-weight:700;}
  .tbl-wrap{overflow-x:auto;}
  .note{font-size:.82rem;color:var(--ink-soft);background:var(--brand-soft);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 10px 10px 0;margin-top:6px;}
  #calcOut{display:none;}
  #calcOut.show{display:block;}
</style>
</head>
<body>

<div id="app">
<header class="site">
  <div class="wrap nav">
    <a href="index.html" class="brand">
      <picture><source srcset="assets/sistem-logosu.webp" type="image/webp"><img src="assets/sistem-logosu.png" alt="" width="1254" height="1254"></picture>
      22'lik Numeroloji
    </a>
    <div style="display:flex;align-items:center;gap:10px;">
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Açık/koyu tema değiştir">
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="moon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7A8 8 0 019.3 3.6a8.5 8.5 0 1011.1 11.1z"/></svg>
      </button>
      <a class="logout-btn" href="/22lik-numeroloji?logout=1">Çıkış Yap</a>
    </div>
  </div>
</header>

<main>
  <div class="wrap">
    <span class="eyebrow">Dahili Araç</span>
    <h1 style="margin-bottom:32px;">22'lik Numeroloji Hesaplama Uygulaması</h1>

    <div class="calc-card">
      <div class="grid2">
        <div class="field">
          <label for="ad1">1. İsim</label>
          <input type="text" id="ad1" placeholder="Örn: NEVRA">
        </div>
        <div class="field">
          <label for="ad2">2. İsim (varsa)</label>
          <input type="text" id="ad2" placeholder="Örn: EMİNE">
        </div>
        <div class="field">
          <label for="soyad">Öz Soyadı</label>
          <input type="text" id="soyad" placeholder="Örn: AYA">
        </div>
        <div class="field">
          <label for="esSoyad">Eş Soyadı (varsa)</label>
          <input type="text" id="esSoyad" placeholder="Evlilik sonrası soyadı">
        </div>
        <div class="field" style="grid-column:1/-1;">
          <label for="dtarih">Doğum Tarihi</label>
          <input type="date" id="dtarih">
          <div class="hint">Yalnızca Türk alfabesi harfleri (A-Z, Ç, Ğ, İ, Ö, Ş, Ü) hesaba katılır; boşluk ve diğer karakterler yok sayılır.</div>
        </div>
        <div class="field">
          <label for="hesapYili">Hesap Yılı</label>
          <input type="number" id="hesapYili" placeholder="Örn: 2026" step="1">
          <div class="hint">Yaş, Kişisel Yıl ve Yıllık Enerjiler bu yıl için hesaplanır. Boş bırakılırsa içinde bulunduğunuz yıl kullanılır.</div>
        </div>
      </div>
      <button class="btn" type="button" id="hesaplaBtn">Hesapla</button>
    </div>

    <div id="calcOut" class="results"></div>
  </div>
</main>

<footer style="border-top:1px solid var(--line);padding:28px 0;">
  <div class="wrap" style="text-align:center;font-size:.8rem;color:var(--ink-soft);">
    22'lik Numeroloji — şifre korumalı hesaplama uygulaması.
  </div>
</footer>
</div>

<script>
/* ---------- THEME TOGGLE ---------- */
var themeBtn = document.getElementById('themeToggle');
if(themeBtn){
  themeBtn.addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

/* ============================================================
   NUMEROLOJİ HESAP MOTORU
   Kaynak: "HESAP TABLOSU son son.xlsx"
     - FORMÜL SAYFA1  : harf->sayı tabloları (Klasik + 22'lik), sesli/sessiz listeleri
     - FORMÜL SAYFASI2: Hayat Amacı, isim harf değerleri
     - FORMÜL SAYFASI3: Ana/Yan/Tam Kulvar indirgemeleri
     - ZAMAN ANALİZİ  : Kişisel Yıl, Yıllık Enerji, Yaş, Çakra Merdiveni ("HANE")
   ============================================================ */

// FORMÜL SAYFA1 A:B ve D:E sütunları — harf sırası ve klasik (1-9 döngüsel) değerler
var HARF_SIRA = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','Q','R','S','Ş','T','U','Ü','V','W','X','Y','Z'];
var KLASIK_DEGER = [1,2,3,3,4,5,6,7,7,8,9,9,1,2,3,4,5,6,6,7,8,9,1,1,2,3,3,4,5,6,7,8];
var SESLI = ['A','E','I','İ','O','Ö','U','Ü'];

function classicValue(ch){
  var i = HARF_SIRA.indexOf(ch);
  return i === -1 ? 0 : KLASIK_DEGER[i];
}
function isVowel(ch){ return SESLI.indexOf(ch) !== -1; }

function cleanLetters(str){
  if(!str) return [];
  var up = str.toLocaleUpperCase('tr-TR');
  var out = [];
  for(var i=0;i<up.length;i++){
    if(HARF_SIRA.indexOf(up[i]) !== -1) out.push(up[i]);
  }
  return out;
}

function digitSum(n){
  return String(Math.abs(n)).split('').reduce(function(a,d){ return a+Number(d); }, 0);
}
// Tek adım indirgeme, master sayıları (11/22/33) koruyarak — FORMÜL SAYFASI3 C/D sütunları
function stepReduceMaster(n){
  if(n===11||n===22||n===33) return n;
  if(n>9) return digitSum(n);
  return n;
}
// Basit tek-adım indirgeme, master koruması YOK — ZAMAN ANALİZİ ve Hayat Amacı modülünde kullanılan tip
function stepReduceSimple(n){
  return n>9 ? digitSum(n) : n;
}
function loopReduceSimple(n){
  while(n>9) n = digitSum(n);
  return n;
}
function loopReduce22(n){
  while(n>22) n = digitSum(n);
  return n;
}

// ANA KULVAR (sesli harfler toplamı) / YAN KULVAR (sessiz harfler toplamı) — ham toplam
function vowelSum(letters){
  return letters.reduce(function(a,ch){ return a + (isVowel(ch)?classicValue(ch):0); },0);
}
function consonantSum(letters){
  return letters.reduce(function(a,ch){ return a + (!isVowel(ch)?classicValue(ch):0); },0);
}

// FORMÜL SAYFASI3 mantığı: ham toplamdan "X/Y" gösterim string'i üretir
function kulvarPair(raw){
  var isMaster = function(n){ return n===11||n===22||n===33; };
  var C = stepReduceMaster(raw);
  var D = stepReduceMaster(C);
  var display;
  if(isMaster(raw)) display = String(raw);
  else if(isMaster(C)) display = String(C);
  else if(raw<23) display = raw + '/' + D;
  else display = C + '/' + D;
  return {raw:raw, reduced:D, display:display};
}
function kulvarOfLetters(letters){
  var ana = kulvarPair(vowelSum(letters));
  var yan = kulvarPair(consonantSum(letters));
  var tamRaw = vowelSum(letters) + consonantSum(letters);
  var tam = kulvarPair(tamRaw);
  return {ana:ana, yan:yan, tam:tam};
}
// Birleşik isim (Tam İsim) kulvarı: FORMÜL SAYFASI3 satır 22/29/36 mantığı —
// her kişinin ZATEN İNDİRGENMİŞ (tek hane / master) kulvar değerleri toplanıp yeniden indirgenir.
// (Ham harflerden yeniden toplama YAPILMAZ; Excel'in gerçek yöntemi budur.)
function kulvarBirlesik(kisiler){
  var anaToplam = kisiler.reduce(function(a,k){ return a + (k?k.ana.reduced:0); },0);
  var yanToplam = kisiler.reduce(function(a,k){ return a + (k?k.yan.reduced:0); },0);
  var tamToplam = kisiler.reduce(function(a,k){ return a + (k?k.tam.reduced:0); },0);
  return {ana:kulvarPair(anaToplam), yan:kulvarPair(yanToplam), tam:kulvarPair(tamToplam)};
}
// "Kullanılan TAM İSİM" kuralı: yalnız öz soyadı→isimler+öz; yalnız eş soyadı→isimler+eş;
// ikisi de doluysa→isimler+öz+eş (öz soyadı ASLA eş soyadıyla değiştirilmez, ikisi de dahil
// edilir); ikisi de boşsa→yalnızca isimler. kulvarBirlesik zaten null parçaları 0 sayar, bu
// yüzden dört parçayı (kAd1,kAd2,kSoyad,kEsSoyad) doğrudan geçmek yeterli.
function tamIsimKulvar(kAd1, kAd2, kSoyad, kEsSoyad){
  return kulvarBirlesik([kAd1, kAd2, kSoyad, kEsSoyad]);
}

// ---- HAYAT AMACI (FORMÜL SAYFASI2 satır 8-13) ----
function hayatAmaciHesapla(gun, ay, yil){
  var dayTens = gun>9 ? Math.floor(gun/10) : 0;
  var dayUnits = gun>9 ? gun%10 : gun;
  var monTens = ay>9 ? Math.floor(ay/10) : 0;
  var monUnits = ay>9 ? ay%10 : ay;
  var yilStr = String(yil).padStart(4,'0');
  var yd = yilStr.split('').map(Number);

  // 1. HAYAT AMACI
  var raw1 = dayTens+dayUnits+monTens+monUnits+yd[0]+yd[1]+yd[2]+yd[3];
  var first1 = stepReduceSimple(raw1);
  var final1 = first1>=10 ? stepReduceSimple(first1) : null;

  // 2. HAYAT AMACI = raw1 - 2*(day tens varsa) yoksa 2*(day units)
  var raw2 = dayTens>0 ? (raw1 - dayTens*2) : (raw1 - dayUnits*2);
  var first2 = raw2<10 ? raw2 : stepReduceSimple(raw2);
  var final2 = first2>=10 ? stepReduceSimple(first2) : null;

  // 3. HAYAT AMACI: gün/ay/yıl birim hanesi 0 ise +10 (Excel metin/sayı karşılaştırma tuhaflığı nedeniyle her zaman toplanır)
  var e = dayUnits===0 ? 10 : 0;
  var f = monUnits===0 ? 10 : 0;
  var g = yd[3]===0 ? 10 : 0;
  var raw3 = e+f+g+raw1;
  var first3 = raw3<10 ? raw3 : stepReduceSimple(raw3);
  var final3 = first3>=10 ? stepReduceSimple(first3) : null;
  var goster3 = (raw3 === raw1) ? null : {raw:raw3, first:first3, final:final3};

  return {
    ha1:{raw:raw1, first:first1, final:final1},
    ha2:{raw:raw2, first:first2, final:final2},
    ha3: goster3
  };
}

// ---- KİŞİSEL YIL / YILLIK ENERJİ / YAŞ / ÇAKRA MERDİVENİ (ZAMAN ANALİZİ) ----
function zamanAnaliziHesapla(dogumTarih, bugun, hesapYili){
  var bGun = dogumTarih.getDate(), bAy = dogumTarih.getMonth()+1, bYil = dogumTarih.getFullYear();
  var tGun = bugun.getDate(), tAy = bugun.getMonth()+1;
  // "tYil" artık sabit bugünün yılı değil, kullanıcının seçtiği hesap yılı — ay/gün karşılaştırması
  // (doğum günü bu yıl geçti mi) yine GERÇEK bugünün ay/gününe göre yapılır, sadece yıl değişkeni
  // kullanıcı girdisiyle değiştirilir. Bu sayede 1978 gibi geçmiş bir yıl girilince o yıldaki yaş/
  // enerjiler hesaplanır; 2026 sabit değeri veya sistem saati asla doğrudan kullanılmaz.
  var tYil = hesapYili;

  // YAŞ (F21)
  var yasRaw = tYil - bYil;
  var ayFark = tAy - bAy;
  var gunFark = tGun - bGun;
  var yas = (ayFark===0 && gunFark<0) ? yasRaw-1 : (ayFark<0 ? yasRaw-1 : yasRaw);

  // Doğum günü/ay/yıl indirgemeleri (C6:F8)
  var D6 = bGun>22 ? digitSum(bGun) : bGun;           // gün, 22'lik sınır
  var E6 = D6>22 ? digitSum(D6) : D6;
  var F6 = E6>9 ? digitSum(E6) : E6;                  // gün, tek hane final
  var D7 = bAy>22 ? digitSum(bAy) : bAy;
  var E7 = D7>22 ? digitSum(D7) : D7;
  var F7 = E7>9 ? digitSum(E7) : E7;
  var yilBasamakToplam = digitSum(bYil);
  var D8 = yilBasamakToplam;
  var E8 = D8>22 ? digitSum(D8) : D8;
  var F8 = E8>9 ? digitSum(E8) : E8;

  // "Kişisel Yıl" için referans yıl (bu yıl doğum günü henüz gelmediyse geçen yıl kullanılır)
  var kisiselYilYili = (tYil - bYil > yas) ? tYil-1 : tYil;
  var D14 = digitSum(kisiselYilYili);

  var D11 = D6, E11 = D11>22?digitSum(D11):D11, F11 = E11>9?digitSum(E11):E11;
  var D12 = D7, E12 = D12>22?digitSum(D12):D12, F12 = E12>9?digitSum(E12):E12;
  var D13 = digitSum(tYil), E13 = D13>22?digitSum(D13):D13, F13 = E13>9?digitSum(E13):E13;

  var G12 = D11+D12+D14;
  var H12 = G12>9 ? digitSum(G12) : G12;
  var kisiselYil = {raw:G12, final:H12, display:G12+'/'+H12};

  // 2. Yıllık Enerji — Klasik
  var B16 = F11+F12+F13;
  var C16 = B16>9 ? digitSum(B16) : B16;
  var day2xTensPart = bGun>9 ? Math.floor(bGun/10) : 0; // G6 karşılığı
  var D16 = C16 - (2*day2xTensPart);
  var enerjiKlasik = {raw:B16, reduced:C16, display: D16>0 ? (C16+'-'+D16) : String(C16)};

  // 2. Yıllık Enerji — Arketip
  var B17 = E11+E12+E13;
  var C17 = B17>22 ? digitSum(B17) : B17;
  var D17 = E11*2;
  var E17b = D17>22 ? digitSum(D17) : D17;
  var F17 = C17 - E17b;
  var enerjiArketip = {raw:B17, reduced:C17, display: F17>0 ? (C17+'-'+F17) : String(C17)};

  // ÇAKRA MERDİVENİ — DOĞUM TARİHİ PİRAMİDİ (satır 23-35)
  function rs(n){ return n>9 ? digitSum(n) : n; }
  var bD23=D6, bC23=rs(bD23), bDD23=rs(bC23);
  var bD24=D7, bC24=rs(bD24), bDD24=rs(bC24);
  var bD25=D8, bC25=rs(bD25), bDD25=rs(bC25);
  var bB26=bDD23+bDD24+bDD25, bC26=rs(bB26), bDD26=rs(bC26);
  var bB27=bDD23+bDD26, bC27=rs(bB27), bDD27=rs(bC27);
  var bB28=bDD23+bDD24, bC28=rs(bB28), bDD28=rs(bC28);
  var bB29=bDD24+bDD25, bC29=rs(bB29), bDD29=rs(bC29);
  var bB30=bDD28+bDD29, bC30=rs(bB30), bDD30=rs(bC30);
  var bB31=bDD23+bDD24+bDD25+bDD26+bDD27+bDD28+bDD29+bDD30, bC31=rs(bB31), bDD31=rs(bC31);
  var bB32=bDD25+bDD26, bC32=rs(bB32), bDD32=rs(bC32);
  var bB33=bDD26+bDD27, bC33=rs(bB33), bDD33=rs(bC33);
  var bB34=bDD32+bDD33, bC34=rs(bB34), bDD34=rs(bC34);
  var bB35=bDD23+bDD24+bDD25+bDD26+bDD27+bDD32+bDD33+bDD34, bC35=rs(bB35), bDD35=rs(bC35);
  var dogumPiramit = [bDD23,bDD24,bDD25,bDD26,bDD27,bDD28,bDD29,bDD30,bDD31,bDD32,bDD33,bDD34,bDD35];

  // ÇAKRA MERDİVENİ — DOĞUM TARİHİ PİRAMİDİ, "22 BAZLI" (aynı basamak yapısı, ama her adımda
  // tek haneye değil sadece >22 ise indirgeniyor — Kulvar modülündeki klasik/22'lik ayrımıyla
  // birebir aynı mantık: rs()=">9 ise indirgene", rs22()=">22 ise indirgene")
  function rs22(n){ return n>22 ? digitSum(n) : n; }
  var b2D23=D6, b2C23=rs22(b2D23), b2DD23=rs22(b2C23);
  var b2D24=D7, b2C24=rs22(b2D24), b2DD24=rs22(b2C24);
  var b2D25=D8, b2C25=rs22(b2D25), b2DD25=rs22(b2C25);
  var b2B26=b2DD23+b2DD24+b2DD25, b2C26=rs22(b2B26), b2DD26=rs22(b2C26);
  var b2B27=b2DD23+b2DD26, b2C27=rs22(b2B27), b2DD27=rs22(b2C27);
  var b2B28=b2DD23+b2DD24, b2C28=rs22(b2B28), b2DD28=rs22(b2C28);
  var b2B29=b2DD24+b2DD25, b2C29=rs22(b2B29), b2DD29=rs22(b2C29);
  var b2B30=b2DD28+b2DD29, b2C30=rs22(b2B30), b2DD30=rs22(b2C30);
  var b2B31=b2DD23+b2DD24+b2DD25+b2DD26+b2DD27+b2DD28+b2DD29+b2DD30, b2C31=rs22(b2B31), b2DD31=rs22(b2C31);
  var b2B32=b2DD25+b2DD26, b2C32=rs22(b2B32), b2DD32=rs22(b2C32);
  var b2B33=b2DD26+b2DD27, b2C33=rs22(b2B33), b2DD33=rs22(b2C33);
  var b2B34=b2DD32+b2DD33, b2C34=rs22(b2B34), b2DD34=rs22(b2C34);
  var b2B35=b2DD23+b2DD24+b2DD25+b2DD26+b2DD27+b2DD32+b2DD33+b2DD34, b2C35=rs22(b2B35), b2DD35=rs22(b2C35);
  var dogumPiramit22 = [b2DD23,b2DD24,b2DD25,b2DD26,b2DD27,b2DD28,b2DD29,b2DD30,b2DD31,b2DD32,b2DD33,b2DD34,b2DD35];

  // ÇAKRA MERDİVENİ — KİŞİSEL YIL PİRAMİDİ (satır 37-49)
  var kC37=rs(bGun), kD37=rs(kC37);
  var kC38=rs(bAy), kD38=rs(kC38);
  var kC39=rs(D14), kD39=rs(kC39);
  var kB40=kC37+kC38+kC39, kC40=rs(kB40), kD40=rs(kC40);
  var kB41=kD37+kD40, kC41=rs(kB41), kD41=rs(kC41);
  var kB42=kD37+kD38, kC42=rs(kB42), kD42=rs(kC42);
  var kB43=kD38+kD39, kC43=rs(kB43), kD43=rs(kC43);
  var kB44=kD42+kD43, kC44=rs(kB44), kD44=rs(kC44);
  var kB45=kD37+kD38+kD39+kD40+kD41+kD42+kD43+kD44, kC45=rs(kB45), kD45=rs(kC45);
  var kB46=kD39+kD40, kC46=rs(kB46), kD46=rs(kC46);
  var kB47=kD40+kD41, kC47=rs(kB47), kD47=rs(kC47);
  var kB48=kD46+kD47, kC48=rs(kB48), kD48=rs(kC48);
  var kB49=kD37+kD38+kD39+kD40+kD41+kD46+kD47+kD48, kC49=rs(kB49), kD49=rs(kC49);
  var kisiselYilPiramit = [kD37,kD38,kD39,kD40,kD41,kD42,kD43,kD44,kD45,kD46,kD47,kD48,kD49];

  return {
    yas: yas,
    kisiselYil: kisiselYil,
    enerjiKlasik: enerjiKlasik,
    enerjiArketip: enerjiArketip,
    dogumPiramit: dogumPiramit,
    dogumPiramit22: dogumPiramit22,
    kisiselYilPiramit: kisiselYilPiramit
  };
}

/* ============================================================
   ÇAKRA MATRİSİ (A16:M29) — YÜKSEK GÖREV / TOPLAM-EŞ-GÖREV /
   İSİM LİYAKAT / ATA SOYU / EŞ LİYAKAT / KLASİK AÇILIM /
   22 BAZLI / GÖLGE / ŞİFA / KARMİK BORÇ
   Kaynak: 'NUMEROLOJİ HESAP TABLOSU'!A16:M29
     -> 'FORMÜL SAYFASI2'!AD/AG/AH/AI/AK/AM/AN/AR/AZ 32-59 ("ÇAKRA AĞACI")
     -> 'FORMÜL SAYFA1'!P:AA (COUNTIF/SUM/VLOOKUP) ve AE:AM (yüksek görev)
   Excel'in metin/sayı karşılaştırma davranışı (metin > her sayı),
   SUM'ın metni yok sayması ve COUNTIF'in sayısal metni eşleştirmesi
   aşağıdaki yardımcılarla birebir taklit edilmiştir.
   ============================================================ */

function xIsText(v){ return typeof v === 'string'; }
function xLt(a,b){ if(xIsText(a)) return false; if(a===null||a===undefined) a=0; return a<b; }
function xGt(a,b){ if(xIsText(a)) return true; if(a===null||a===undefined) a=0; return a>b; }
function xStr(v){ return (v===null||v===undefined) ? '' : String(v); }
function xLeftCh(v){ return xStr(v).charAt(0); }
function xRightCh(v){ var s=xStr(v); return s.charAt(s.length-1); }
// VALUE(LEFT(x)+RIGHT(x)) deseni
function xLR(v){ return Number(xLeftCh(v)) + Number(xRightCh(v)); }
function xMid(v,start){ var s=xStr(v); return start<=s.length ? s.charAt(start-1) : ''; }
// SUM: metinleri yok sayar
function xSum(){
  var t=0;
  for(var i=0;i<arguments.length;i++){
    var v=arguments[i];
    if(Object.prototype.toString.call(v)==='[object Array]'){
      for(var j=0;j<v.length;j++) if(typeof v[j]==='number') t+=v[j];
    } else if(typeof v==='number') t+=v;
  }
  return t;
}
function xDigitSum3(v){ var s=xStr(v), t=0; for(var i=0;i<s.length && i<3;i++){ var d=Number(s.charAt(i)); if(!isNaN(d)) t+=d; } return t; }
// COUNTIF(range, sayı) — sayısal metin ("7") de eşleşir
function xCountIf(list,n){
  var c=0;
  for(var i=0;i<list.length;i++){
    var v=list[i];
    if(v===null||v===undefined) continue;
    if(typeof v==='number'){ if(v===n) c++; }
    else if(typeof v==='string'){ if(v!=='' && Number(v)===n) c++; }
  }
  return c;
}
function xMaster(x){ return (x===11||x===22||x===33) ? x : 0; }
// FORMÜL SAYFA1 M1:N11 sembol tablosu (10 -> 'X', orijinal dosyada böyle)
var GOREV_SEMBOL = ['-','X','XX','XXX','XXXX','XXXXX','XXXXXX','XXXXXXX','XXXXXXXX','XXXXXXXXX','X'];
function sembol10(n){ return (n>=0 && n<=9)  ? GOREV_SEMBOL[n] : ''; }  // VLOOKUP M1:N10
function sembol11(n){ return (n>=0 && n<=10) ? GOREV_SEMBOL[n] : ''; }  // VLOOKUP M1:N11

function matrisHesapla(gun, ay, yil, ad1, ad2, soyad, esSoyad){
  /* --- ZAMAN ANALİZİ G7:N7 -> FORMÜL SAYFASI2 B8:I8 --- */
  var B8 = gun>9 ? Math.floor(gun/10) : 0, C8 = gun%10;
  var D8 = ay>9  ? Math.floor(ay/10)  : 0, E8 = ay%10;
  var ys = String(yil);
  var F8=Number(ys.charAt(0)), G8=Number(ys.charAt(1)), H8=Number(ys.charAt(2)), I8=Number(ys.charAt(3));
  var J8 = ''+B8+C8;
  var M8 = Number(J8), N8 = Number(''+D8+E8);

  /* --- HAYAT AMACI (FORMÜL SAYFASI2 satır 10-13) --- */
  var B10 = xSum(B8,C8,D8,E8,F8,G8,H8,I8);
  var C10 = xLt(B10,10) ? B10 : xLR(B10);
  var D10 = xLt(C10,10) ? '' : xLR(C10);
  var F10 = xMid(B10,1), G10 = xMid(B10,2), H10 = C10;
  var B11 = xGt(B8,0) ? (B10 - B8*2) : (B10 - C8*2);
  var C11 = xLt(B11,10) ? B11 : xLR(B11);
  var F11 = xMid(B11,1), G11 = xMid(B11,2), H11 = C11;
  var E12 = (C8===0) ? 10 : '';
  var F12 = (E8===0) ? 10 : '';
  var G12 = (I8===0) ? 10 : '';
  var H12 = xGt(E12,0) ? xSum(G12,F12,E12,B10) : '';   // "" > 0 => Excel'de DOĞRU
  var H13 = xSum(E12,F12,G12);
  var B12 = (B10===H12) ? '' : H12;
  var C12 = xLt(B12,10) ? B12 : xLR(B12);
  var D12 = xLt(C12,10) ? '' : xLR(C12);

  /* --- HARF DEĞER IZGARALARI (FORMÜL SAYFASI2 B14:P21) --- */
  function anaRow(L){ var r=[],i,c; for(i=0;i<15;i++){ c=L[i]; r.push(c && isVowel(c) ? classicValue(c) : 0); } return r; }
  function yanRow(L){ var r=[],i,c; for(i=0;i<15;i++){ c=L[i]; r.push(c && !isVowel(c) ? classicValue(c) : 0); } return r; }
  var L1=cleanLetters(ad1), L2=cleanLetters(ad2), L3=cleanLetters(soyad), L4=cleanLetters(esSoyad);
  var r14=anaRow(L1), r15=yanRow(L1), r16=anaRow(L2), r17=yanRow(L2),
      r18=anaRow(L3), r19=yanRow(L3), r20=anaRow(L4), r21=yanRow(L4);

  /* --- KULVAR SATIRLARI 25/26/27 --- */
  function trip(raw){
    var B=raw;
    var C = xLt(B,10) ? B : xLR(B);
    var D = xLt(C,10) ? C : xLR(C);
    var E = xGt(B,C) ? (B+' / '+C) : (C!==D ? (B+' / '+C+' / '+D) : B);
    return [B,C,D,E];
  }
  function mkRow(rawN1, rawN2, rawSy, rawEs, aiUsesV){
    var a=trip(rawN1), b=trip(rawN2), c=trip(rawSy), d=trip(rawEs);
    var o = {B:a[0],C:a[1],D:a[2],E:a[3], H:b[0],I:b[1],J:b[2],K:b[3],
             N:c[0],O:c[1],P:c[2],Q:c[3], T:d[0],U:d[1],V:d[2],W:d[3]};
    o.X  = xLt(o.W,10) ? '' : xLR(o.W);
    o.Z  = xSum(o.V,o.P,o.J,o.D);
    o.AA = (o.Z===11||o.Z===22||o.Z===33) ? '' : (xLt(o.Z,10) ? o.Z : xLR(o.Z));
    o.AB = xLt(o.AA,10) ? Number(o.AA) : '';
    o.AC = o.Z===11?11 : o.Z===22?22 : o.Z===33?33 : (o.AA===o.Z ? o.Z : (o.Z+'/'+o.AA));
    o.AD = xMaster(o.D+o.J); o.AE = o.AD>0 ? xSum(o.P,o.V) : '';
    o.AF = xMaster(o.J+o.P); o.AG = o.AF>0 ? xSum(o.D,o.V) : '';
    o.AH = xMaster(o.D+o.P); o.AI = o.AH>0 ? (aiUsesV ? xSum(o.J,o.V) : o.J) : '';
    o.AK = xMaster(o.D+o.J+o.P);
    o.AL = xMaster(o.B); o.AM = o.AL>1 ? xSum(o.J,o.P,o.V) : '';
    o.AN = o.AL>0 ? (o.AL+' +'+o.AM) : '';
    o.AO = xMaster(o.H); o.AP = o.AO>1 ? xSum(o.D,o.P,o.V) : '';
    o.AQ = o.AO>0 ? (o.AO+' +'+o.AP) : '';
    o.AR = xMaster(o.N); o.AS = o.AR>1 ? xSum(o.D,o.J,o.V) : '';
    o.AT = o.AR>0 ? (o.AR+' +'+o.AS) : '';
    o.AU = o.B>0 ? xSum(o.B,o.H,o.N,o.T) : false;
    o.AX = o.AD>0?o.AD : o.AF>0?o.AF : o.AH>0?o.AH : o.AK>0?o.AK : o.AL>0?o.AL : o.AO>0?o.AO : o.AR>0?o.AR : '';
    o.AY = o.AD>0?o.AD : o.AF>0?o.AF : o.AH>0?o.AH : o.AK>0?o.AK : o.AL>0?o.AN : o.AO>0?o.AQ : o.AR>0?o.AT : '';
    o.AZ = xSum(o.AE,o.AG,o.AI,o.AM);
    o.BA = xSum(o.B,o.H,o.N,o.T);
    o.BB = o.BA>22 ? xMid(o.BA,1) : 0;
    o.BC = o.BA>22 ? xMid(o.BA,2) : 0;
    o.BD = o.BA>22 ? xMid(o.BA,3) : 0;
    o.BE = Number(o.BB); o.BF = Number(o.BC);
    o.BG = (o.BD===''||isNaN(Number(o.BD))) ? 0 : Number(o.BD);
    o.BH = o.BA>22 ? xSum(o.BE,o.BF,o.BG) : o.BA;
    o.BI = (o.BH===o.AB) ? '' : o.BH;
    o.BJ = xSum(o.B,o.H,o.N,o.T);
    o.BK = xSum(o.C,o.I,o.O,o.U);
    o.BL = o.BK>22 ? xMid(o.BK,1) : 0;
    o.BM = o.BK>22 ? xMid(o.BK,2) : 0;
    o.BP = o.BK>22 ? xMid(o.BK,3) : 0;
    o.BQ = Number(o.BL); o.BR = Number(o.BM);
    o.BS = (o.BP===''||isNaN(Number(o.BP))) ? 0 : Number(o.BP);
    o.BT = (o.BJ===33||o.BJ===44||o.BJ===22) ? o.BJ : o.BK;
    o.BU = o.BK>0 ? o.BT : xSum(o.BQ,o.BR,o.BS);
    o.BV = (o.BU===o.AB) ? '' : (o.BU===o.BT ? o.BT : false);
    return o;
  }
  function gridSum(rows){ var t=0,i; for(i=0;i<rows.length;i++) t+=xSum(rows[i]); return t; }
  var R25 = mkRow(gridSum([r14]), gridSum([r16]), gridSum([r18]), gridSum([r20]), true);
  var R26 = mkRow(gridSum([r15]), gridSum([r17]), gridSum([r19]), gridSum([r21]), false);
  var R27 = mkRow(gridSum([r14,r15]), gridSum([r16,r17]), gridSum([r18,r19]), gridSum([r20,r21]), false);

  /* --- satır 28 (eş soyadsız ana kulvar türevi) --- */
  var R28 = {};
  R28.N  = xSum(R27.B,R27.H,R27.N,R27.N,R27.T);
  R28.O  = xMid(R28.N,1); R28.P = xMid(R28.N,2); R28.Q = xMid(R28.N,3); R28.S = '';
  R28.Z  = xSum(R25.P,R25.J,R25.D);
  R28.AA = (R28.Z===11||R28.Z===22||R28.Z===33) ? '' : (xLt(R28.Z,10)?R28.Z:xLR(R28.Z));
  R28.AB = xLt(R28.AA,10) ? Number(R28.AA) : '';
  R28.AC = R28.Z===11?11:R28.Z===22?22:R28.Z===33?33:(R28.AA===R28.Z?R28.Z:(R28.Z+'/'+R28.AA));
  R28.AD = xMaster(R25.D+R25.J); R28.AE = R28.AD>0 ? R25.P : '';
  R28.AF = xMaster(R25.J+R25.P); R28.AG = R28.AF>0 ? R25.D : '';
  R28.AH = xMaster(R25.D+R25.P); R28.AI = R28.AH>0 ? R25.J : '';
  R28.AK = xMaster(R25.D+R25.J+R25.P);
  R28.AL = xMaster(R25.B); R28.AM = R28.AL>1 ? xSum(R25.J,R25.P) : '';
  R28.AN = R28.AL>0 ? (R28.AL+' +'+R28.AM) : '';
  R28.AO = xMaster(R25.H); R28.AP = R28.AO>1 ? xSum(R25.D,R25.P) : '';
  R28.AQ = R28.AO>0 ? (R28.AO+' +'+R28.AP) : '';
  R28.AR = xMaster(R25.N); R28.AS = R28.AR>1 ? xSum(R25.D,R25.J) : '';
  R28.AT = R28.AR>0 ? (R28.AR+' +'+R28.AS) : '';
  R28.AU = R25.B>0 ? xSum(R25.B,R25.H,R25.N) : false;
  R28.AX = R28.AD>0?R28.AD:R28.AF>0?R28.AF:R28.AH>0?R28.AH:R28.AK>0?R28.AK:R28.AL>0?R28.AL:R28.AO>0?R28.AO:R28.AR>0?R28.AR:'';
  R28.AY = R28.AD>0?R28.AD:R28.AF>0?R28.AF:R28.AH>0?R28.AH:R28.AK>0?R28.AK:R28.AL>0?R28.AN:R28.AO>0?R28.AQ:R28.AR>0?R28.AT:'';
  R28.AZ = xSum(R28.AE,R28.AG,R28.AI,R28.AM);
  R28.BA = xSum(R25.B,R25.H,R25.N);
  R28.BB = R28.BA>22 ? xMid(R28.BA,1) : 0;
  R28.BC = R28.BA>22 ? xMid(R28.BA,2) : 0;

  /* --- ÇAKRA AĞACI: 2. piramit (satır 39-45, ham gün/ay/yıl) --- */
  var I35 = xSum(F8,G8,H8,I8);                     // yıl basamak toplamı
  var B42 = (M8>22) ? xSum(B8,C8) : M8;
  var C42 = N8;
  var D42 = xLt(I35,23) ? I35 : xLR(I35);
  var J42 = xSum(B42,C42,D42);
  var E42 = xLt(J42,23) ? xSum(B42,C42,D42) : xLR(J42);
  var K42 = xSum(E42,B42);
  var F42 = xLt(K42,23) ? K42 : xLR(K42);
  var J41 = xSum(D42,E42), E41 = xLt(J41,23) ? J41 : xLR(J41);
  var K41 = xSum(E42,F42), F41 = xLt(K41,23) ? K41 : xLR(K41);
  var K40 = xSum(E41,F41), F40 = xLt(K40,23) ? K40 : xLR(K40);
  var G39 = xSum(F40,E41,F41,B42,C42,D42,E42,F42);
  var B39 = xLt(G39,23) ? G39 : xDigitSum3(G39);
  var H43 = xSum(B42,C42), C43 = xLt(H43,23) ? H43 : xLR(H43);
  var I43 = xSum(C42,D42), D43 = xLt(I43,23) ? I43 : xLR(I43);
  var I44 = xSum(C43,D43), D44 = xLt(I44,23) ? I44 : xLR(I44);
  var K45 = xSum(B42,C42,D42,E42,F42,C43,D43,D44);
  var F45 = xLt(K45,23) ? K45 : xDigitSum3(K45);

  /* --- ÇAKRA AĞACI: 3. piramit (satır 46-52, tek haneye indirgenmiş) --- */
  var G49 = xLt(B42,10)?B42:xLR(B42);
  var H49 = xLt(C42,10)?C42:xLR(C42);
  var I49 = xLt(D42,10)?D42:xLR(D42);
  var B49 = xLt(B42,10)?B42:xLR(B42);
  var C49 = xLt(C42,10)?C42:xLR(C42);
  var A49 = xLt(I49,10)?I49:xLR(I49);
  var D49 = xLt(A49,10)?A49:xLR(A49);
  var J49 = xSum(G49,H49,I49);
  var L49 = xLt(J49,10)?J49:xLR(J49);
  var E49 = xLt(L49,10)?L49:xLR(L49);
  var K49 = xSum(B49,E49);
  var N49 = xLt(K49,10)?K49:xLR(K49);
  var F49 = xLt(N49,10)?N49:xLR(N49);
  var G50 = xSum(B49,C49), C50 = xLt(G50,10)?G50:xLR(G50);
  var H50 = xSum(C49,D49), D50 = xLt(H50,10)?H50:xLR(H50);
  var H51 = xSum(C50,D50), D51 = xLt(H51,10)?H51:xLR(H51);
  // F52: orijinal dosyada L52/M52 sehven K52 yerine K45'e bakar — birebir korunuyor
  var k45c3 = xMid(K45,3);
  var R52 = Number(xMid(K45,1)||0) + Number(xMid(K45,2)||0) + (k45c3===''?0:Number(k45c3));
  var Y52 = Number(xMid(R52,1)||0) + Number(xMid(R52,2)||0) + (k45c3===''?0:Number(k45c3));
  var F52 = xLt(R52,10) ? R52 : Y52;
  var J48 = xSum(D49,E49), E48 = xLt(J48,10)?J48:xLR(J48);
  var K48 = xSum(E49,F49), F48 = xLt(K48,10)?K48:xLR(K48);
  var K47 = xSum(E48,F48), F47 = xLt(K47,10)?K47:xLR(K47);
  var G46 = xSum(F47,E48,F48,B49,C49,D49,E49,F49);
  var L46 = xLt(G46,10)?G46:xLR(G46);
  var B46 = xLt(L46,10)?L46:xLR(L46);

  var K10 = xSum(B49,C49,D49);   // hayat amacından çıkan karmik borç tabanı

  /* --- 22'lik ana kulvar (BO33/34/35/53) --- */
  function bo22(raw){ var bj=xMaster(raw)||raw; var bn=bj>22?xLR(bj):bj; return bn>22?xLR(bn):bn; }
  var BO33=bo22(R25.B), BO34=bo22(R25.H), BO35=bo22(R25.N), BO53=bo22(R25.T);

  /* --- A sütunu: YÜKSEK GÖREV --- */
  var rngB46F48 = [B46, F47, E48, F48];
  var AY26_27 = [R26.AY, R27.AY];
  var BI25_27 = [R25.BI, R26.BI, R27.BI];
  var BV25_27 = [R25.BV, R26.BV, R27.BV];
  var B10_B12 = [B10, B11, B12];
  var B10_E12 = [B10,C10,D10,'', B11,C11,'','', B12,C12,D12,E12];
  function ygMaster(o){
    return xCountIf(AY26_27,o) + xCountIf(BI25_27,o) + xCountIf(BV25_27,o)
         + xCountIf(B10_B12,o) + xCountIf([K10],o);
  }
  var AK11=ygMaster(11), AK12=ygMaster(22), AK13=ygMaster(33);
  var AK14 = xCountIf(AY26_27,10) + xCountIf(BI25_27,10) + xCountIf(BV25_27,10)
           + xCountIf(B10_E12,10) + xCountIf([K10],10) + (xGt(H13,0)?1:0);
  var yuksek = ['', sembol11(AK13), sembol11(AK12), sembol11(AK11+AK14)];  // çakra 13,12,11,10
  for(var oi=9; oi>=1; oi--) yuksek.push(sembol11(xCountIf(rngB46F48, oi)));

  /* --- B/D sütunları: TOPLAM GÖREV / GÖREV ---
     Excel'in orijinal formülü: TOPLAM GÖREV=P+Q+R+S+T (herkes), GÖREV=P+Q+R+S (öz soyadı ile,
     eş soyadı HARİÇ). Bunlar tarih bazlı (P,Q) ve ad1/ad2 bazlı (R) terimleri de içerir; bu
     köken orijinal dosyadaki gerçek formüldür ve DEĞİŞTİRİLMEDİ. */
  var rngB49F52 = [B49,C49,D49,E49,F49, C50,D50, D51, F52];
  var rngF10H11 = [F10,G10,H10, F11,G11,H11];
  var gorevler = [];   // çakra 9..1
  for(var oj=9; oj>=1; oj--){
    var P=xCountIf(rngB49F52,oj), Q=xCountIf(rngF10H11,oj),
        R=xCountIf([BO33,BO34],oj), S=xCountIf([BO35],oj), T=xCountIf([BO53],oj);
    // U = COUNTIF(AB33:AB35, ...) — kaynak hücreler orijinalde daima boş
    gorevler.push({ toplam: sembol11(P+Q+R+S+T), gorev: sembol11(P+Q+R+S) });
  }

  /* --- C sütunu: EŞ GÖREV — YENİDEN TANIMLANDI (kullanıcı talebi) ---
     Bu sütun artık P/Q/R/S/T karışımından (TOPLAM2) DEĞİL, yalnızca iki somut sonuçtan besleniyor:
       (1) Eş soyadının KENDİ Ana Kulvar'ının indirgenmiş değeri
       (2) "Kullanılan TAM İSİM"in (1.İsim+2.İsim + varsa Öz Soyadı + varsa Eş Soyadı) TOPLAM Ana
           Kulvar'ının indirgenmiş değeri — öz soyadı da doluysa mutlaka dahil edilir, eş soyadıyla
           yer değiştirmez (bkz. tamIsimKulvar()).
     Bu iki sonuç hangi çakra numarasına (1-9) denk geliyorsa o satıra X konur; ikisi de aynı
     satıra denk gelirse XX. Kişinin öz soyadından gelen GÖREV/TOPLAM GÖREV işaretleri hiç
     karıştırılmaz. Eş soyadı boşsa (L4 boş) her iki sonuç da null olur, sütun tamamen boş kalır. */
  var kEsIcin = L4.length ? kulvarOfLetters(L4) : null;
  var kAd1Icin = L1.length ? kulvarOfLetters(L1) : null;
  var kAd2Icin = L2.length ? kulvarOfLetters(L2) : null;
  var kSoyadIcin = L3.length ? kulvarOfLetters(L3) : null;
  var esAnaTek = kEsIcin ? kEsIcin.ana.reduced : null;
  var esTamAna = kEsIcin ? tamIsimKulvar(kAd1Icin, kAd2Icin, kSoyadIcin, kEsIcin).ana.reduced : null;
  var esGorevler = [];  // çakra 9..1
  for(var ol=9; ol>=1; ol--){
    var sayac = (esAnaTek===ol?1:0) + (esTamAna===ol?1:0);
    esGorevler.push(sayac===0 ? '' : (sayac===1 ? 'X' : 'XX'));
  }

  /* --- F/G/H sütunları: İSİM LİYAKAT / ATA SOYU / EŞ LİYAKAT --- */
  var rngB14P17 = r14.concat(r15,r16,r17);
  var rngB18P19 = r18.concat(r19);
  var rngB20P21 = r20.concat(r21);
  var liyakatlar = [];  // çakra 9..1
  for(var ok=9; ok>=1; ok--){
    liyakatlar.push({
      isim: sembol10(xCountIf(rngB14P17, ok)),
      ata:  sembol10(xCountIf(rngB18P19, ok)),
      es:   sembol10(xCountIf(rngB20P21, ok))
    });
  }
  // Çakra 12/11/10 için istisnalar (AG33 / AG34 / AG50)
  var liyakat12 = sembol10(xCountIf([R25.AX], 33));
  var liyakat11 = sembol10(xCountIf([R25.AX], 22));
  var liyakat10 = sembol10(0);   // COUNTIF(BN44:BP44,11) — kaynak aralık daima boş

  /* --- I/J/K/L sütunları --- */
  var AI_list = [B39,F40,F41,E41,F45,D44,D43,C43,F42,E42,D42,C42,B42];  // 22 bazlı orta değer
  var AL_list = [B46,F47,F48,E48,F52,D51,D50,C50,F49,E49,D49,C49,B49];  // klasik açılım orta değer

  /* --- M sütunu: KARMİK BORÇ --- */
  function pick(row, list){ var out=[],i; for(i=0;i<list.length;i++) out.push(row[list[i]]); return out; }
  var COLS_B_BA = ['B','C','D','E','H','I','J','K','N','O','P','Q','T','U','V','W','X','Z','AA','AB','AC',
                   'AD','AE','AF','AG','AH','AI','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AX','AY','AZ','BA'];
  var COLS_B_BC = COLS_B_BA.concat(['BB','BC']);
  var COLS_28   = ['N','O','P','Q','S','Z','AA','AB','AC','AD','AE','AF','AG','AH','AI','AK','AL','AM','AN','AO','AP',
                   'AQ','AR','AS','AT','AU','AX','AY','AZ','BA','BB','BC'];
  var rngB25BA27 = pick(R25,COLS_B_BA).concat(pick(R26,COLS_B_BA), pick(R27,COLS_B_BA));
  var rngB26BC28 = pick(R26,COLS_B_BC).concat(pick(R27,COLS_B_BC), pick(R28,COLS_28));
  function kbSay(n){ return xCountIf(rngB25BA27,n) + xCountIf([K10],n) + xCountIf([M8],n); }
  var c19  = kbSay(19);
  var c16  = kbSay(16);   // klasik karmik borç sayısı 16 (13/14/19 ile AYNI havuz, aynı sayım mantığı)
  var c14  = kbSay(14);
  var c13  = kbSay(13);
  var karmik = ['','','','',
    (c19>0 ? '19/1' : ''),                                  // çakra 9
    '',                                                     // çakra 8  (AX37 boş)
    (c16>0 ? '16/7' : ''),                                  // çakra 7
    (c16>0 ? '16/7' : ''),                                  // çakra 6
    (c14>0 ? '14/5' : ''),                                  // çakra 5
    (c13>0?'13/4':'') + ' - ' + (c14>0?'14/5':''),           // çakra 4 (BB41 daima metin)
    (c13>0 ? '13/4' : ''),                                  // çakra 3
    '',                                                     // çakra 2  (AX43 boş)
    (c19>0 ? '19/1' : '')                                   // çakra 1
  ];

  /* --- 13 satırı birleştir (çakra 13 -> 1) --- */
  var out = [];
  for(var i=0;i<13;i++){
    var cak = 13-i;
    var g  = (i>=4) ? gorevler[i-4]   : null;
    var ly = (i>=4) ? liyakatlar[i-4] : null;
    var AI = AI_list[i], AL = AL_list[i], golge = 9 - AL;
    // KLASİK AÇILIM üçüncü sayı: büyüklüğüne bakılmaksızın HER ZAMAN tek haneye kadar indirgenir
    var klasikUcuncu = loopReduceSimple(cak + AL);
    // 22 BAZLI üçüncü sayı: yalnızca 22'den büyükse rakamları toplanarak indirgenir (tek geçiş),
    // 22 ve altındaki toplamlara dokunulmaz
    var toplam22 = cak + AI;
    var bazliUcuncu = toplam22 > 22 ? digitSum(toplam22) : toplam22;
    // ŞİFA: 1) çakra no aynen, 2) Klasik Açılım'ın 2. sayısının gölgesi (9-AL, GÖLGE sütunuyla aynı),
    // 3) ilk iki şifa sayısının toplamı tek haneye indirgenir
    var sifaUcuncu = loopReduceSimple(cak + golge);
    out.push({
      cakra: cak,
      yuksekGorev: yuksek[i],
      toplamGorev: g ? g.toplam : '',
      esGorev:     (i>=4) ? esGorevler[i-4] : '',
      gorev:       g ? g.gorev  : '',
      isimLiyakat: ly ? ly.isim : (cak===12?liyakat12 : cak===11?liyakat11 : cak===10?liyakat10 : ''),
      ataSoyu:     ly ? ly.ata  : '',
      esLiyakat:   ly ? ly.es   : '',
      klasikAcilim: cak + '-' + AL + '-' + klasikUcuncu,
      bazli22:      cak + '-' + AI + '-' + bazliUcuncu,
      golge: golge,
      sifa:  cak + '-' + golge + '-' + sifaUcuncu,
      karmikBorc: karmik[i]
    });
  }
  return out;
}

/* ---------- ARAYÜZ ---------- */
// Excel'deki A16:M29 renk şeması: başlık turkuaz (Karmik Borç sarı), Çakra sütunu
// 13'ten 1'e klasik çakra renk skalası, diğer sütunlar kendi pastel tonu.
var CAKRA_RENK = {
  13:{bg:'#111111', fg:'#FFFFFF'},
  12:{bg:'#6FCF97', fg:'#0F3324'},
  11:{bg:'#4F7942', fg:'#FFFFFF'},
  10:{bg:'#4A6FA5', fg:'#FFFFFF'},
   9:{bg:'#D9D9D9', fg:'#222222'},
   8:{bg:'#E37FC0', fg:'#3A0F2C'},
   7:{bg:'#7B4FA6', fg:'#FFFFFF'},
   6:{bg:'#4472C4', fg:'#FFFFFF'},
   5:{bg:'#A6A6A6', fg:'#222222'},
   4:{bg:'#9ACD32', fg:'#26330A'},
   3:{bg:'#FFD400', fg:'#3A2E00'},
   2:{bg:'#F4A100', fg:'#3A1E00'},
   1:{bg:'#E4402A', fg:'#FFFFFF'}
};
var MATRIS_KOLONLAR = [
  {key:'yuksekGorev', head:'YÜKSEK GÖREV', bg:'#FBE0CE', fg:'#5A2C00'},
  {key:'toplamGorev', head:'TOPLAM GÖREV', bg:'#DCEEF9', fg:'#0F2E45'},
  {key:'esGorev',     head:'EŞ GÖREV',     bg:'#DCEEF9', fg:'#0F2E45'},
  {key:'gorev',       head:'GÖREV',        bg:'#DCEEF9', fg:'#0F2E45'},
  {key:'cakra',       head:'ÇAKRA',        bg:null,      fg:null}, // renk satıra göre CAKRA_RENK'ten gelir
  {key:'isimLiyakat', head:'İSİM LİYAKAT', bg:'#FBD9EA', fg:'#5A1638'},
  {key:'ataSoyu',     head:'ATA SOYU',     bg:'#FBD9EA', fg:'#5A1638'},
  {key:'esLiyakat',   head:'EŞ LİYAKAT',   bg:'#FBD9EA', fg:'#5A1638'},
  {key:'klasikAcilim',head:'KLASİK AÇILIM',bg:'#E3E7F7', fg:'#20264F'},
  {key:'bazli22',     head:'22 BAZLI',     bg:'#E3E7F7', fg:'#20264F'},
  {key:'golge',       head:'GÖLGE',        bg:'#F7D9E6', fg:'#5A1638'},
  {key:'sifa',        head:'ŞİFA',         bg:'#F7D9E6', fg:'#5A1638'},
  {key:'karmikBorc',  head:'KARMİK BORÇ',  bg:'#FFF6D9', fg:'#8A4B00'}
];
function matrisTablo(rows){
  // Sütun genişlikleri YÜZDE olarak (toplam %100) — table-layout:fixed ile birlikte
  // tablo HER ZAMAN kapsayıcı genişliğe (width:100%) sığar, asla taşmaz, yatay kaydırma
  // gerekmez. Kısa sütunlar (Çakra/Gölge/Şifa) dar, uzun başlıklı sütunlar (Yüksek Görev,
  // Toplam Görev, Klasik Açılım, 22 Bazlı, Karmik Borç) biraz daha geniş pay alır.
  var COLW = {yuksekGorev:9, toplamGorev:9, esGorev:8, gorev:7, cakra:5,
              isimLiyakat:8, ataSoyu:7, esLiyakat:8, klasikAcilim:10,
              bazli22:10, golge:5, sifa:5, karmikBorc:9};
  // Ekran genişliğine göre akıcı küçülen yazı boyutu ve hücre boşluğu (clamp: min, tercih, max)
  var FS  = 'clamp(9px, 0.85vw, 13px)';
  var PAD = 'clamp(2px, 0.5vw, 8px) clamp(1px, 0.35vw, 6px)';
  var thHtml = MATRIS_KOLONLAR.map(function(c){
    var isKarmik = c.key==='karmikBorc';
    var style = 'background:'+(isKarmik?'#FFD966':'#1FC8C3')+';color:#111;font-weight:700;'+
                'border:1px solid #F2A93C;white-space:normal;word-break:normal;overflow-wrap:break-word;'+
                'width:'+COLW[c.key]+'%;padding:'+PAD+';font-size:'+FS+';line-height:1.15;';
    return '<th style="'+style+'">'+c.head+'</th>';
  }).join('');
  var html = '<div class="tbl-wrap" style="overflow-x:hidden;width:100%;">'+
             '<table class="matris" style="border-collapse:collapse;width:100%;table-layout:fixed;">'+
             '<tr>'+thHtml+'</tr>';
  rows.forEach(function(r){
    html += '<tr>' + MATRIS_KOLONLAR.map(function(c){
      var v = r[c.key];
      var txt = (v===''||v===null||v===undefined) ? '' : String(v);
      var bg, fg;
      if(c.key==='cakra'){
        var ck = CAKRA_RENK[r.cakra];
        bg = ck.bg; fg = ck.fg;
      } else {
        bg = c.bg; fg = c.fg;
      }
      var style = 'padding:'+PAD+';text-align:center;white-space:normal;word-break:normal;overflow-wrap:break-word;'+
                  'border:1px solid #F2A93C;background:'+bg+';color:'+fg+';width:'+COLW[c.key]+'%;font-size:'+FS+';'+
                  (c.key==='cakra' ? 'font-family:\\'Cinzel\\',serif;font-weight:700;' : 'font-weight:600;');
      return '<td style="'+style+'">'+txt+'</td>';
    }).join('') + '</tr>';
  });
  return html + '</table></div>';
}

function haneRow(title, arr){
  var labels = ['1.HANE','2.HANE','3.HANE','4.HANE','5.HANE','6.HANE','7.HANE','8.HANE','9.HANE','10.HANE','11.HANE','12.HANE','13.HANE'];
  var th = labels.map(function(l){return '<th>'+l+'</th>';}).join('');
  var td = arr.map(function(v){return '<td>'+v+'</td>';}).join('');
  return '<h4 style="margin:18px 0 8px;font-size:.9rem;color:var(--ink-soft);">'+title+'</h4>'+
    '<div class="tbl-wrap"><table class="hane"><tr>'+th+'</tr><tr>'+td+'</tr></table></div>';
}

// ÇAKRA AĞACI DİYAGRAMI — orijinal Excel'deki geometrik (çapraz/piramit) yerleşimin birebir
// karşılığı. 13 hane, 5 sütun x 6 satırlık sabit bir ızgarada, HER ZAMAN aynı hücrede,
// HER ZAMAN aynı renkte durur (renk = Hane numarasına bağlı sabit kimlik, CAKRA_RENK'ten).
// Kutu içindeki sayı ise o hane için o an hesaplanmış DEĞERDİR — kullanıcıya göre değişir.
// Hane10, hem "taban sırasında" (satır3) hem "üst sağ" bölümde (satır2) iki kez görünür;
// bu, orijinal diyagramın kendisinde de böyledir (Hane10, Hane12'nin hesaplanışında tekrar
// kullanılır: Hane12 = Hane10 + Hane11).
var CAKRA_AGACI_IZGARA = [
  // [hane_no, satır(1-6), sütun(1-5)]
  [13,1,1], [12,1,5],
  [10,2,4], [11,2,5],
  [1,3,1], [2,3,2], [3,3,3], [4,3,4], [10,3,5],
  [6,4,2], [7,4,3],
  [8,5,3],
  [9,6,5]
];
function cakraAgaciPaneli(title, arr){
  var hucreler = CAKRA_AGACI_IZGARA.map(function(hucre){
    var haneNo = hucre[0], satir = hucre[1], sutun = hucre[2];
    var deger = arr[haneNo-1];
    var renk = CAKRA_RENK[haneNo] || {bg:'#999', fg:'#111'};
    return '<div style="grid-row:'+satir+';grid-column:'+sutun+';display:flex;align-items:center;justify-content:center;'+
           'background:'+renk.bg+';color:'+renk.fg+';border:1px solid #00000055;font-family:\\'Cinzel\\',serif;'+
           'font-weight:700;font-size:clamp(11px,2.6vw,1.05rem);min-height:0;">'+deger+'</div>';
  }).join('');
  return '<div style="margin-bottom:20px;background:#E4A848;border-radius:8px;padding:10px;">'+
    '<div style="background:linear-gradient(180deg,#4a3510,#0d0803);border-radius:5px;padding:8px 14px;'+
    'text-align:center;margin-bottom:8px;">'+
    '<span style="font-family:\\'Cinzel\\',serif;font-weight:700;color:var(--gold-lt);letter-spacing:.08em;font-size:.85rem;">'+
    title+'</span></div>'+
    '<div style="background:#D9D9D9;border:2px solid #000;border-radius:4px;padding:6px;">'+
    '<div style="display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(6,clamp(28px,7vw,46px));'+
    'gap:2px;width:100%;max-width:520px;margin:0 auto;">'+hucreler+'</div>'+
    '</div></div>';
}

function kv(label, val){
  return '<div class="kv"><div class="lab">'+label+'</div><div class="val">'+val+'</div></div>';
}

document.getElementById('hesaplaBtn').addEventListener('click', function(){
  var ad1 = document.getElementById('ad1').value;
  var ad2 = document.getElementById('ad2').value;
  var soyad = document.getElementById('soyad').value;
  var esSoyad = document.getElementById('esSoyad').value;
  var dStr = document.getElementById('dtarih').value;
  var yilStr = document.getElementById('hesapYili').value;
  var out = document.getElementById('calcOut');

  if(!dStr || !ad1){
    out.classList.remove('show');
    alert('Lütfen en az 1. İsim ve Doğum Tarihi alanlarını doldurun.');
    return;
  }
  var parts = dStr.split('-');
  var dogum = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
  var bugun = new Date();
  // Hesap Yılı: kullanıcı boş bırakırsa içinde bulunulan yıl kullanılır; doğum yılından
  // önceki bir yıl girilmesine izin verilmez (yaş negatif olamaz).
  var hesapYili = yilStr ? Number(yilStr) : bugun.getFullYear();
  if(hesapYili < dogum.getFullYear()){
    out.classList.remove('show');
    alert('Hesap Yılı, doğum yılından ('+dogum.getFullYear()+') önce olamaz.');
    return;
  }

  var l1 = cleanLetters(ad1), l2 = cleanLetters(ad2), l3 = cleanLetters(soyad), l4 = cleanLetters(esSoyad);
  var kAd1 = l1.length ? kulvarOfLetters(l1) : null;
  var kAd2 = l2.length ? kulvarOfLetters(l2) : null;
  var kSoyad = l3.length ? kulvarOfLetters(l3) : null;
  var kEsSoyad = l4.length ? kulvarOfLetters(l4) : null;
  // "Kullanılan Tam İsim": öz soyadı VE eş soyadı ikisi de doluysa ikisi de dahil edilir
  // (öz soyadı eş soyadıyla değiştirilmez); yalnız biri doluysa o kullanılır; ikisi de
  // boşsa yalnızca isimler kullanılır.
  var kTamBirlesik = kAd1 ? tamIsimKulvar(kAd1, kAd2, kSoyad, kEsSoyad) : null;
  var tamIsimBaslik = (kSoyad && kEsSoyad) ? 'Tam İsim (Öz + Eş Soyadı ile)'
                     : kSoyad ? 'Tam İsim (Öz Soyadı ile)'
                     : kEsSoyad ? 'Tam İsim (Eş Soyadı ile)'
                     : 'Tam İsim';

  var ha = hayatAmaciHesapla(dogum.getDate(), dogum.getMonth()+1, dogum.getFullYear());
  var za = zamanAnaliziHesapla(dogum, bugun, hesapYili);

  var html = '';

  html += '<div class="mod"><h3>Hayat Amacı</h3><div class="kv-grid">';
  html += kv('1. Hayat Amacı', ha.ha1.final!=null ? (ha.ha1.raw+' → '+ha.ha1.first+' → '+ha.ha1.final) : (ha.ha1.raw+' → '+ha.ha1.first));
  html += kv('2. Hayat Amacı', ha.ha2.final!=null ? (ha.ha2.raw+' → '+ha.ha2.first+' → '+ha.ha2.final) : (ha.ha2.raw+' → '+ha.ha2.first));
  if(ha.ha3) html += kv('3. Hayat Amacı', ha.ha3.final!=null ? (ha.ha3.raw+' → '+ha.ha3.first+' → '+ha.ha3.final) : (ha.ha3.raw+' → '+ha.ha3.first));
  html += '</div></div>';

  html += '<div class="mod"><h3>Kişisel Yıl · Yıllık Enerji · Yaş</h3><div class="kv-grid">';
  html += kv('Yaş', za.yas);
  html += kv('Kişisel Yıl', za.kisiselYil.display);
  html += kv('Yıllık Klasik Enerji', za.enerjiKlasik.display);
  html += kv('Arketipsel Yıllık Enerjiler', za.enerjiArketip.display);
  html += '</div></div>';

  html += '<div class="mod"><h3>Ana Kulvar · Yan Kulvar · Tam Kulvar</h3>';
  function kulvarBlok(baslik, k){
    if(!k) return '';
    return '<h4 style="margin:14px 0 8px;font-size:.9rem;color:var(--ink-soft);">'+baslik+'</h4><div class="kv-grid">'+
      kv('Ana Kulvar', k.ana.display) + kv('Yan Kulvar', k.yan.display) + kv('Tam Kulvar', k.tam.display) + '</div>';
  }
  html += kulvarBlok('1. İsim: '+ad1.toLocaleUpperCase('tr-TR'), kAd1);
  html += kulvarBlok('2. İsim: '+ad2.toLocaleUpperCase('tr-TR'), kAd2);
  html += kulvarBlok('Öz Soyadı: '+soyad.toLocaleUpperCase('tr-TR'), kSoyad);
  html += kulvarBlok('Eş Soyadı: '+esSoyad.toLocaleUpperCase('tr-TR'), kEsSoyad);
  html += kulvarBlok(tamIsimBaslik, kTamBirlesik);
  html += '</div>';

  html += '<div class="mod"><h3>Çakra Ağacı</h3>';
  html += cakraAgaciPaneli('KLASİK SİSTEM', za.dogumPiramit);
  html += cakraAgaciPaneli('22 BAZLI', za.dogumPiramit22);
  html += cakraAgaciPaneli('KİŞİSEL YIL ÇAKRA ANALİZİ', za.kisiselYilPiramit);
  html += '</div>';

  var matris = matrisHesapla(dogum.getDate(), dogum.getMonth()+1, dogum.getFullYear(), ad1, ad2, soyad, esSoyad);
  // "EŞ GÖREV" ve "EŞ LİYAKAT" sütunları yalnızca eş soyadı girildiyse gösterilir —
  // girilmediyse hücreler tamamen boş bırakılır (sembol/çizgi/0 yazılmaz), sütun yeri korunur.
  var esVarMi = l4.length > 0;
  if(!esVarMi){
    matris.forEach(function(r){ r.esGorev = ''; r.esLiyakat = ''; });
  }
  html += '<div class="mod"><h3>Çakra Ağacı — Görev · Liyakat · Açılım · Karmik Borç</h3>';
  html += matrisTablo(matris);
  html += '</div>';

  out.innerHTML = html;
  out.classList.add('show');
});
</script>
</body>
</html>
`;
