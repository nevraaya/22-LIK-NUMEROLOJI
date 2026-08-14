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
  table.hane .val{font-family:'Cinzel',serif;font-size:1.15rem;color:var(--gold-lt);}
  table.hane tbody tr:hover td, table.hane tr:hover td{background:var(--brand-soft);}
  table.hane tr.og-aktif-donem td{background:var(--brand-soft);box-shadow:inset 0 0 0 1px var(--gold);}
  table.hane tr.og-aktif-donem td:first-child{font-weight:700;color:var(--ink);}
  table.hane tr.og-aktif-donem .val{color:var(--gold);font-weight:700;}
  .note{font-size:.82rem;color:var(--ink-soft);background:var(--brand-soft);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 10px 10px 0;margin-top:6px;}
  .og-yillik-merdiven-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
  @media (max-width:760px){ .og-yillik-merdiven-grid{grid-template-columns:1fr;} }
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
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;">
        <button class="btn" type="button" id="hesaplaBtn">Hesapla</button>
        <button class="btn" type="button" id="kisiKaydetBtn" style="background:transparent;border:1px solid var(--line);color:var(--ink);">Kişiyi Kaydet</button>
        <button class="btn" type="button" id="formTemizleBtn" style="background:transparent;border:1px solid var(--line);color:var(--ink-soft);">Temizle / Yeni Kişi</button>
        <span id="kisiKayitMesaj" style="font-size:.85rem;font-weight:600;"></span>
      </div>
    </div>

    <div class="calc-card" style="padding:22px 28px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;" id="kisilerToggle">
        <h3 style="margin:0;font-size:1.05rem;color:var(--brand-dark);">Kayıtlı Kişiler <span id="kisiSayisi" style="color:var(--ink-soft);font-weight:400;">(0)</span></h3>
        <span id="kisilerOk" style="color:var(--gold);font-size:1.1rem;transition:transform .2s;">▾</span>
      </div>
      <div id="kisilerIcerik" style="display:none;margin-top:18px;">
        <input type="text" id="kisiAra" placeholder="Ad, soyad veya doğum tarihiyle ara…" style="width:100%;font-size:1rem;padding:12px 14px;min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--paper-alt);color:var(--ink);margin-bottom:14px;box-sizing:border-box;">
        <div id="kisiListe" style="max-height:420px;overflow-y:auto;"></div>
      </div>
    </div>

    <div id="calcOut" class="results"></div>

    <div style="margin-top:56px;padding-top:32px;border-top:2px dashed var(--line);">
      <span class="eyebrow" style="color:var(--gold);">Bağımsız Modül</span>
      <h2 style="font-size:1.5rem;margin-bottom:6px;">🔮 Öngörü / Yorumlama</h2>
      <p style="color:var(--ink-soft);font-size:.88rem;max-width:680px;margin-bottom:24px;">
        "22'lik Numerolojide Öngörü Hesaplama ve Yorumlama Kılavuzu" belgesine göre hesaplanır.
        Yukarıdaki hesap motorundan tamamen bağımsızdır; yukarıdaki isim/doğum tarihi alanlarını kullanır,
        kendi ayrı bir mantıkla çalışır.
      </p>
      <div class="calc-card">
        <div class="grid2" style="grid-template-columns:1fr 1fr 1fr;">
          <div class="field">
            <label for="ogYil">İncelenecek Yıl *</label>
            <input type="number" id="ogYil" placeholder="Örn: 2027" step="1">
          </div>
          <div class="field">
            <label for="ogAy">Ay (isteğe bağlı)</label>
            <select id="ogAy">
              <option value="">Seçiniz</option>
              <option value="1">Ocak</option>
              <option value="2">Şubat</option>
              <option value="3">Mart</option>
              <option value="4">Nisan</option>
              <option value="5">Mayıs</option>
              <option value="6">Haziran</option>
              <option value="7">Temmuz</option>
              <option value="8">Ağustos</option>
              <option value="9">Eylül</option>
              <option value="10">Ekim</option>
              <option value="11">Kasım</option>
              <option value="12">Aralık</option>
            </select>
          </div>
          <div class="field">
            <label for="ogGun">Gün (isteğe bağlı)</label>
            <select id="ogGun" disabled>
              <option value="">Önce ay seçin</option>
            </select>
          </div>
        </div>
        <div class="hint">En az yılı girin. Ay eklenirse aylık; gün de eklenirse günlük enerjiler hesaplanır. Boş bırakılan dönemler otomatik olarak hesaplanmaz.</div>
        <button class="btn" type="button" id="ogBtn">Öngör</button>
      </div>
      <div id="ogOut" class="results"></div>
    </div>
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

  // ÇAKRA MERDİVENİ — KİŞİSEL YIL PİRAMİDİ, "22 BAZLI" (kisiselYilPiramit'in BİREBİR aynı
  // hücre ilişkileri/toplama sırası; tek fark rs() yerine rs22() kullanılması — dogumPiramit22'nin
  // dogumPiramit'i aynı şekilde ayna aldığı yöntemin devamı. Mevcut kisiselYilPiramit hiç
  // değiştirilmedi; bu yalnızca EKLENEN, bağımsız bir ikinci sonuçtur.)
  var k2C37=rs22(bGun), k2D37=rs22(k2C37);
  var k2C38=rs22(bAy), k2D38=rs22(k2C38);
  var k2C39=rs22(D14), k2D39=rs22(k2C39);
  var k2B40=k2C37+k2C38+k2C39, k2C40=rs22(k2B40), k2D40=rs22(k2C40);
  var k2B41=k2D37+k2D40, k2C41=rs22(k2B41), k2D41=rs22(k2C41);
  var k2B42=k2D37+k2D38, k2C42=rs22(k2B42), k2D42=rs22(k2C42);
  var k2B43=k2D38+k2D39, k2C43=rs22(k2B43), k2D43=rs22(k2C43);
  var k2B44=k2D42+k2D43, k2C44=rs22(k2B44), k2D44=rs22(k2C44);
  var k2B45=k2D37+k2D38+k2D39+k2D40+k2D41+k2D42+k2D43+k2D44, k2C45=rs22(k2B45), k2D45=rs22(k2C45);
  var k2B46=k2D39+k2D40, k2C46=rs22(k2B46), k2D46=rs22(k2C46);
  var k2B47=k2D40+k2D41, k2C47=rs22(k2B47), k2D47=rs22(k2C47);
  var k2B48=k2D46+k2D47, k2C48=rs22(k2B48), k2D48=rs22(k2C48);
  var k2B49=k2D37+k2D38+k2D39+k2D40+k2D41+k2D46+k2D47+k2D48, k2C49=rs22(k2B49), k2D49=rs22(k2C49);
  var kisiselYilPiramit22 = [k2D37,k2D38,k2D39,k2D40,k2D41,k2D42,k2D43,k2D44,k2D45,k2D46,k2D47,k2D48,k2D49];

  return {
    yas: yas,
    kisiselYil: kisiselYil,
    enerjiKlasik: enerjiKlasik,
    enerjiArketip: enerjiArketip,
    dogumPiramit: dogumPiramit,
    dogumPiramit22: dogumPiramit22,
    kisiselYilPiramit: kisiselYilPiramit,
    kisiselYilPiramit22: kisiselYilPiramit22
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
// kullanılır: Hane12 = Hane10 + Hane11). Satır3/sütun5 hücresi Hane5'i gösterir
// (Hane5 = Hane1 + Hane4, ilgili sistemin kendi indirgeme kuralıyla) — Hane10 zaten
// satır2/sütun4'te ayrıca gösteriliyor.
var CAKRA_AGACI_IZGARA = [
  // [hane_no, satır(1-6), sütun(1-5)]
  [13,1,1], [12,1,5],
  [10,2,4], [11,2,5],
  [1,3,1], [2,3,2], [3,3,3], [4,3,4], [5,3,5],
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

// ============================================================
// KİŞİ KAYIT VE ARAMA SİSTEMİ (localStorage, mevcut hesaplama
// motoruna dokunmaz — yalnızca Ad, Soyad, Doğum günü/ay/yıl saklar)
// ============================================================
var KISI_DEPO_ANAHTARI = 'numeroloji_kayitli_kisiler';

function kisiListesiGetir(){
  try{
    var ham = localStorage.getItem(KISI_DEPO_ANAHTARI);
    var arr = ham ? JSON.parse(ham) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function kisiListesiKaydet(arr){
  try{ localStorage.setItem(KISI_DEPO_ANAHTARI, JSON.stringify(arr)); }catch(e){}
}
function kisiTr(s){ return (s||'').toLocaleUpperCase('tr-TR').trim(); }
function kisiTarihMetni(g,a,y){
  return String(g).padStart(2,'0')+'.'+String(a).padStart(2,'0')+'.'+y;
}
function kisiAyniMi(k, ad, soyad, g, a, y){
  return kisiTr(k.ad)===kisiTr(ad) && kisiTr(k.soyad)===kisiTr(soyad) &&
         Number(k.g)===Number(g) && Number(k.a)===Number(a) && Number(k.y)===Number(y);
}
function kisiKaydet(ad, soyad, g, a, y){
  ad = (ad||'').trim(); soyad = (soyad||'').trim();
  if(!ad || !g || !a || !y) return {basarili:false, zatenVar:false, eksik:true};
  var liste = kisiListesiGetir();
  var varMi = liste.some(function(k){ return kisiAyniMi(k, ad, soyad, g, a, y); });
  if(varMi) return {basarili:false, zatenVar:true};
  liste.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,8), ad:ad, soyad:soyad, g:Number(g), a:Number(a), y:Number(y)});
  kisiListesiKaydet(liste);
  kisiListesiRenderla();
  return {basarili:true, zatenVar:false};
}
function kisiSil(id){
  var liste = kisiListesiGetir().filter(function(k){ return k.id!==id; });
  kisiListesiKaydet(liste);
  kisiListesiRenderla();
}
function kisiFormdanOku(){
  var dStr = document.getElementById('dtarih').value;
  var ad = document.getElementById('ad1').value;
  var soyad = document.getElementById('soyad').value;
  if(!dStr) return null;
  var p = dStr.split('-');
  return {ad:ad, soyad:soyad, y:Number(p[0]), a:Number(p[1]), g:Number(p[2])};
}
function kisiMesajGoster(msg, renk){
  var el = document.getElementById('kisiKayitMesaj');
  el.textContent = msg;
  el.style.color = renk || 'var(--gold-lt)';
  if(msg) setTimeout(function(){ if(el.textContent===msg) el.textContent=''; }, 4000);
}
function kisiListesiRenderla(){
  var liste = kisiListesiGetir();
  var arama = kisiTr(document.getElementById('kisiAra').value);
  var filtreli = liste.filter(function(k){
    if(!arama) return true;
    var tarih = kisiTarihMetni(k.g,k.a,k.y);
    var adSoyad = kisiTr(k.ad+' '+k.soyad);
    return kisiTr(k.ad).indexOf(arama)>-1 || kisiTr(k.soyad).indexOf(arama)>-1 ||
           adSoyad.indexOf(arama)>-1 || tarih.indexOf(arama)>-1;
  }).sort(function(x,y){ return kisiTr(x.ad+' '+x.soyad).localeCompare(kisiTr(y.ad+' '+y.soyad), 'tr'); });

  document.getElementById('kisiSayisi').textContent = '('+liste.length+')';

  var kutu = document.getElementById('kisiListe');
  if(!filtreli.length){
    kutu.innerHTML = '<p style="color:var(--ink-soft);font-size:.85rem;padding:8px 0;">'+
      (liste.length ? 'Aramayla eşleşen kişi bulunamadı.' : 'Henüz kayıtlı kişi yok.')+'</p>';
    return;
  }
  kutu.innerHTML = filtreli.map(function(k){
    return '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 4px;border-bottom:1px solid var(--line);">'+
      '<div><strong style="color:var(--ink);">'+k.ad+' '+k.soyad+'</strong>'+
      '<div style="font-size:.8rem;color:var(--ink-soft);">'+kisiTarihMetni(k.g,k.a,k.y)+'</div></div>'+
      '<div style="display:flex;gap:8px;flex-shrink:0;">'+
      '<button type="button" class="kisi-sec-btn" data-id="'+k.id+'" style="padding:8px 16px;min-height:36px;border-radius:999px;font-weight:700;font-size:.82rem;border:1px solid var(--line);background:transparent;color:var(--brand-text);cursor:pointer;">Seç</button>'+
      '<button type="button" class="kisi-sil-btn" data-id="'+k.id+'" style="padding:8px 16px;min-height:36px;border-radius:999px;font-weight:700;font-size:.82rem;border:1px solid var(--line);background:transparent;color:#c0453f;cursor:pointer;">Sil</button>'+
      '</div></div>';
  }).join('');

  kutu.querySelectorAll('.kisi-sec-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var k = kisiListesiGetir().find(function(x){ return x.id===btn.getAttribute('data-id'); });
      if(!k) return;
      document.getElementById('ad1').value = k.ad;
      document.getElementById('soyad').value = k.soyad;
      document.getElementById('dtarih').value = k.y+'-'+String(k.a).padStart(2,'0')+'-'+String(k.g).padStart(2,'0');
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
  kutu.querySelectorAll('.kisi-sil-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var k = kisiListesiGetir().find(function(x){ return x.id===btn.getAttribute('data-id'); });
      if(!k) return;
      if(window.confirm('Bu kişiyi kayıtlı kişiler listesinden silmek istediğinizden emin misiniz?\\n\\n'+k.ad+' '+k.soyad+' — '+kisiTarihMetni(k.g,k.a,k.y))){
        kisiSil(k.id);
      }
    });
  });
}

document.getElementById('kisilerToggle').addEventListener('click', function(){
  var icerik = document.getElementById('kisilerIcerik');
  var ok = document.getElementById('kisilerOk');
  var acik = icerik.style.display !== 'none';
  icerik.style.display = acik ? 'none' : 'block';
  ok.style.transform = acik ? 'rotate(0deg)' : 'rotate(180deg)';
});
document.getElementById('kisiAra').addEventListener('input', kisiListesiRenderla);
document.getElementById('kisiKaydetBtn').addEventListener('click', function(){
  var veri = kisiFormdanOku();
  if(!veri || !veri.ad){
    kisiMesajGoster('⚠️ Ad ve Doğum Tarihi alanlarını doldurun.', '#c0453f');
    return;
  }
  var sonuc = kisiKaydet(veri.ad, veri.soyad, veri.g, veri.a, veri.y);
  if(sonuc.zatenVar) kisiMesajGoster('Bu kişi zaten kayıtlı.', 'var(--ink-soft)');
  else if(sonuc.basarili) kisiMesajGoster('✅ Kişi kaydedildi.', 'var(--gold-lt)');
});
document.getElementById('formTemizleBtn').addEventListener('click', function(){
  ['ad1','ad2','soyad','esSoyad','dtarih','hesapYili'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('calcOut').classList.remove('show');
  document.getElementById('calcOut').innerHTML = '';
  kisiMesajGoster('');
});
kisiListesiRenderla();

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

  html += '<div class="mod"><h3>Çakra Merdiveni</h3>';
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

  // Hesaplama yapıldığında kişi otomatik olarak kayıtlı kişiler listesine eklenir
  // (zaten kayıtlıysa sessizce atlanır — kişiKaydetBtn'deki mesajları burada tekrar göstermiyoruz).
  if(ad1) kisiKaydet(ad1, soyad, dogum.getDate(), dogum.getMonth()+1, dogum.getFullYear());
});
// ============================================================
// ONGORU MODULU VERI TABLOLARI ("22'lik Numerolojide Ongoru
// Hesaplama ve Yorumlama Kilavuzu" belgesinden birebir alinmistir)
// ============================================================
var OG_EK_A = [
  {no:1,baslik:"Başlatma, görünür olma, atılım",anaTema:"Yeni başlangıç, inisiyatif, “Ben yaparım” modu.",hediye:"Yeni iş/yan proje kurmak, parlak fikir, eğitim ve beceri sıçraması.",strateji:"Öne çıkmak, görünür olmak, network kurmak, fırsat kovalamak.",iyiGelir:"Kurslar/sertifikalar, sınavlar, eğitim başvuruları, yarışmalar.",dikkat:"Benmerkezcilik, aşırı hırs, gurur; özgüven eksikliği yüzünden planları sabote etmek.",saglikOdagi:"Omurga–kemik–bacaklar–bel; spor + düzenli yaşam; duygu yönetimi.",isPara:"Sonuç almak için başlatman şart; “ellerinle üretme/kurma” yılı.",iliskiler:"Hedef netse seviye atlatır; pasif kalma."},
  {no:2,baslik:"Sezgi, iç dünya, akışa güven",anaTema:"Gizli olanı fark etme, sezgi, iç rehberlik.",hediye:"“Doğru zamanda doğru yerde olma”, gizli yeteneklerin uyanması.",strateji:"Zorlamadan ilerlemek; işaretleri okumak; doğru an gelince hareket.",iyiGelir:"Psikoloji/astroloji/numeroloji gibi içgörü çalışmaları; meditasyon; doğa.",iliskiTemasi:"Anne/ailenin kadınlarıyla bağları iyileştirme; eskiyle helalleşme.",dikkat:"Maske takmak, duyguları saklamak, dedikodu/entrika, kararsızlıkta kaybolmak.",saglikOdagi:"Yıllık kontroller; terapist/uzman ziyareti planı.",isPara:"İlişkiler fayda getirir ama acele yok; iç ses “tamam” deyince hamle.",iliskiler:"Derin bağ, ruh eşi hissi, “yarım kelime” anlaşma."},
  {no:3,baslik:"Bereket, üretkenlik, dişil yaratım",anaTema:"Somut sonuçlar, büyüme, üretkenlik, yaratıcı doğuş.",hediye:"Uzun zamandır düşündüğün şeylerin forma girmesi; “meyve toplama”.",yaraticilik:"Sanat–müzik–edebiyat–üretim alanları açılır; proje doğurur.",dengeDersi:"İş–aile–keyif arasında denge; “ya hep ya hiç” değil.",dikkat:"Dişil enerji düşüklüğü → agresyon/kontrol/histeri; ya da sadece dış görünüşe takılma.",saglikOdagi:"Cinsel sağlık; uzman kontrolleri; doğum kontrol bilgisini güncelle.",isPara:"Enerji güçlü; çaba sonuç getirir; büyüme/yenilik/canlanma.",iliskiler:"Yeni sayfa ya da mevcut ilişkide “yeni doğum” etkisi."},
  {no:4,baslik:"Disiplin, gerçekçilik, yapı kurma",anaTema:"Planların “gerçeklik testi”, sorumluluk, yapılandırma.",hediye:"Terfi/otorite, iş kurma, ciddi adımlar, gayrimenkul/satın alma olasılığı.",strateji:"Öz disiplin + sabır + diplomasi; hedefe düzenli yürümek.",iliskiTemasi:"Güven veren ciddi biriyle karşılaşma ihtimali; sağlamlık arayışı.",dikkatBaglar:"Baba/erkek akrabalar/eski partnerle çözülmemiş meseleler tıkar.",dikkat:"“Eril enerjiye fazla kaçıp” yumuşak tarafı unutmak; sertleşmek.",saglikOdagi:"Genel olarak güçlü; ama baş ağrısı/canlılık düşüşü ve hareketsizlik riski.",isPara:"Anlaşma–sözleşme için iyi; fakat emek şart, kolay para yok.",iliskiler:"Güçlenme olur; ama aşırı “güvenlik” ilişkide sıkışma yaratabilir."},
  {no:5,baslik:"Değerler, aile, resmiyet ve düzen",anaTema:"“Anlam” arayışı; değerleri güncelleme; resmileştirme.",hediye:"Dünya görüşü yenilenir; aile/evlilik/çocuk teması güçlenir.",strateji:"Önceliklendirme, sistem kurma, zaman yönetimi, evrak işlerinde titizlik.",iyiGelir:"Eğitim almak + öğrendiklerini paylaşmak (öğretmen/mentor rolü).",kritikDers:"“Baba figürünü kabul/çalışma” bu enerjiyi artıya çevirir (metnin vurgusu bu).",dikkat:"Kanun/otorite/baba temalı gerilim; ilişkilerde bozulma; aşırı ahlakçılık.",saglikOdagi:"Kronikler + kötü alışkanlıklar; psikolojik yük; fazla bilgi → migren; dinlenme şart.",isPara:"Etik testler; kurallara uy; dolandırıcılık/şaibeli işlere girme.",iliskiler:"İdealleştirme + büyüme; evlilik niyeti/hamilelik göstergesi olabilir."},
  {no:6,baslik:"Aşk, seçim, uyum ve sosyal dönem",anaTema:"Duygular yükselir; ilişki/uyum/güzellik/kalpten seçim.",hediye:"Aşk, keyif, sosyal çevre, etkinlikler; “güzel dönem” etkisi.",strateji:"Duyguları bastırma; açık konuş; ihtiyaçlarını net söyle.",iyiGelir:"Estetik düzenleme, hobiler, yaratıcı uğraşlar; içsel uyum çalışmaları.",dikkat:"Karşılıksız sevgi, kararsızlık, düşük özdeğer; aşırı idealizm → hayal kırıklığı.",saglikOdagi:"Hormon kontrolü; duygusal dalgalanma; cilt/estetik hassasiyet.",isPara:"Yön değişimi, yeni görevler; ortaklıkla kazanç ihtimali.",iliskiler:"“Seçim” yılı: bir şeyden vazgeçip gönüllü bağ kurunca mutluluk açılır."},
  {no:7,baslik:"Sıçrama, hareket, zafer ve liderlik",anaTema:"Hızlanma; hedefe kilitlenme; ilerleme ve başarı.",hediye:"Yeni başlangıçlar, taşınma/seyahat, liderlik, iş büyütme.",strateji:"Net hedef + plan + disiplinli ilerleme; ekip kurmaktan korkma.",iyiGelir:"Mobil olmak; yeni çevre; ortak projeler; finansal okuryazarlık çalışmaları.",dikkat:"Kibir, acelecilik, “ne pahasına olursa olsun”; hedef yanlışsa taktik değiştir.",saglikOdagi:"Spor/ulaşım kazalarına dikkat (bisiklet, araç, kaykay vb.).",isPara:"Daha büyük sorumluluk; yeni alana cesur giriş; kapılar açılır.",iliskiler:"Yeni ilişki başlangıcı; ilk adımı atma teması."},
  {no:8,baslik:"Karma, adalet, hesap kapatma",anaTema:"“Ne ektiysen onu biçersin”; denge; sorumluluk.",hediye:"Emeklerin karşılığı; belgeler–kayıtlar–pasaport/iş/eğitim kayıtları gibi süreçler.",strateji:"Dürüstlük, borç kapatma, düzen, sözünde durma.",dikkat:"Dengesizlik; öfkeyle “adalet savaşına” girip kendini yakmak; hileyle kazanma çabası.",saglikOdagi:"Metabolizma/vitamin eksikliği; psikosomatik kökler.",isPara:"Adil karşılık alırsın; ama hile/aldatma varsa “başarısızlık garanti” teması.",iliskiler:"Karşılıklılık ve saygı; nasıl davranırsan öyle döner."},
  {no:9,baslik:"İçsel yol, bilgelik, sadeleşme",anaTema:"Kendini tanıma, hayatın anlamı, içe dönüş.",hediye:"Derin kavrayış; bir alanda uzmanlaşma; rehber/mentorlarla temas.",strateji:"Yalnızlık ihtiyacını suçlama; doğa, okuma, terapi/koçluk, derin çalışma.",dikkat:"İzolasyonun depresyona kayması; insanları yargılama; enerji düşüşü.",saglikOdagi:"Aşırı yük → yorgunluk/uykusuzluk/ton düşüşü; enerji koruma.",isPara:"“Başarı/para/tanınma” tanımını yeniden yazma; gerçek hedefi bulma.",iliskiler:"Egoist isteklerden olgun sevgiye geçiş; ilişkiyi korumak için bilinçli seçim."},
  {no:10,baslik:"Kader Çarkı, şans, dönüm noktası",anaTema:"Kadersel değişim, fırsat, akışa girme.",hediye:"Beklenmedik şans, doğru insanlar, açılan kapılar, kader karşılaşmaları.",strateji:"Akışa güven, aktif ol, sosyal ol, çevreye karış, işaretleri fark et.",iyiGelir:"Yeni projeler, çevre genişletme, PR–iletişim, seyahat, görünürlük.",dikkat:"Pasiflik, tembellik, amaç kaybı, fırsatı fark etmeme.",riskliTaraf:"Yanlış çevre → şans kapanır; aşırı kontrol → akış durur.",saglikOdagi:"Ruh hali dalgalanması; enerji iniş–çıkış döngüsü.",isPara:"Beklenmedik kazanç, yön değişimi, kariyerde sürpriz rota.",iliskiler:"Kadersel tanışma; doğru zamanda doğru yerde olma teması."},
  {no:11,baslik:"Güç, tutku, yüksek enerji",anaTema:"Güç patlaması, irade, yoğun üretim.",hediye:"Büyük çalışma kapasitesi, etki alanı büyümesi, yaratıcı sıçrama.",strateji:"Enerjiyi disipline et, spora yönlendir, ritim kur.",iyiGelir:"Büyük projeler, liderlik, yaratıcı işler, performans gerektiren alanlar.",dikkat:"Aşırı çalışma, öfke, baskıcılık, tükenme.",riskliTaraf:"Enerji boşalmazsa agresyon ve hastalık üretir.",saglikOdagi:"Aşırı yüklenme, ateş, bağışıklık düşüşü riski.",isPara:"Yaratıcı zirve, yoğun üretimle finansal sıçrama.",iliskiler:"Tutkulu ama sınavlı ilişkiler; duygu kontrolü şart."},
  {no:12,baslik:"Askıda kalma, bakış açısı değişimi",anaTema:"Durma, yeniden değerlendirme, yön değiştirme.",hediye:"Bilgelik, perspektif değişimi, içsel dönüşüm.",strateji:"Yavaşla, gözlemle, fedakârlık–öz değer dengesini kur.",iyiGelir:"Eğitim, içsel çalışma, terapi, manevi gelişim.",dikkat:"Kurban rolü, kendini feda etme, bedavacılık.",riskliTaraf:"Başkalarının yükünü taşıma, sömürülme.",saglikOdagi:"Kronik konular, fonksiyonel dengesizlikler.",isPara:"Yavaşlama; yeniden eğitim ve yön ayarı gerekir.",iliskiler:"Durgunluk; ilişkiyi yeniden yapılandırma sınavı."},
  {no:13,baslik:"Dönüşüm, bitiş ve yeniden doğuş",anaTema:"Radikal değişim, kapanış ve yeniden başlama.",hediye:"Eski yüklerden kurtulma, kimlik yenilenmesi, temiz sayfa.",strateji:"Biteni bırak, direnmeyi bırak, hızlı uyum sağla.",iyiGelir:"Detoks, sadeleşme, taşınma, iş/alan değişimi, alışkanlık bırakma.",dikkat:"Geçmişe tutunma, kararsızlık, sorumluluktan kaçış.",riskliTaraf:"Kaos, sert kopuşlar, agresif tepkiler.",saglikOdagi:"Yaşam tarzı değişimi ihtiyacı; kötü alışkanlıkları bırakma.",isPara:"Mevcut işin kapanışı veya köklü yön değişimi.",iliskiler:"Bir döngü tamamlanır; ayrılık veya ilişki form değiştirir."},
  {no:14,baslik:"Denge, uyum ve şifa",anaTema:"Ilımlılık, denge, iç huzur kurma.",hediye:"Ruhsal ve duygusal şifa, sakin ama sağlam ilerleme.",strateji:"Sabır, ölçülülük, yavaş ve bilinçli ilerleme.",iyiGelir:"Yaratıcılık, sanat, terapi, içsel gelişim, şifa çalışmaları.",dikkat:"Aşırılıklar, erteleme, enerji dağıtma.",riskliTaraf:"Süreçleri gereksiz uzatma, kararsız bekleme hali.",saglikOdagi:"Böbrekler, sıvı dengesi, doğal destekler.",isPara:"Dengeli bütçe, sakin ve plansız stresten uzak çalışma.",iliskiler:"Yumuşak, güvenli, dostluk temelli bağlar."},
  {no:15,baslik:"Gölge, ayartma ve güç testi",anaTema:"Nefs, arzu, güç ve para sınavı.",hediye:"Büyük maddi fırsatlar, etki ve çekim gücü artışı.",strateji:"Dürüst kal, arzuları yönet, bilinçli seçim yap.",iyiGelir:"Büyük anlaşmalar, ticaret, maddi büyüme fırsatları.",dikkat:"Açgözlülük, kıskançlık, manipülasyon, bağımlılıklar.",riskliTaraf:"Kolay para tuzakları, etik dışı kazanç yolları.",saglikOdagi:"Bağımlılık riski, aşırılığa bağlı yıpranma.",isPara:"Büyük kazanç potansiyeli var; ahlaki test içerir.",iliskiler:"Yoğun tutku, kışkırtıcı çekim; sınır koymak şart."},
  {no:16,baslik:"Yıkım, kriz ve uyanış",anaTema:"Yanlış yapıların çöküşü, ego kırılması.",hediye:"Özgürleşme, gerçeklerle yüzleşme, bilinç sıçraması.",strateji:"Direnme, bırak, yeniden kurmaya razı ol.",iyiGelir:"İnanç sistemi güncelleme, köklü hayat temizliği.",dikkat:"İnada tutunma, kibir, çatışmacı tutum.",riskliTaraf:"Ani kopuşlar, iş/ilişki yıkımı, sert krizler.",saglikOdagi:"Onarım dönemi; diş, kemik, yapısal kontroller.",isPara:"İşten ayrılma veya plan çöküşü; sonrası özgürleşme.",iliskiler:"Dayanıksız bağlar yıkılır, gerçek bağ kalır."},
  {no:17,baslik:"Yıldız, parlamak ve görünürlük",anaTema:"Umut, ilham, görünür olma.",hediye:"Tanınma, popülerlik, yeteneklerin açılması.",strateji:"Kendini göster, üret, sahneye çık, paylaş.",iyiGelir:"Yaratıcı işler, medya, sosyal ağlar, sanat projeleri.",dikkat:"Özgüven düşüşü, içine kapanma, fırsat kaçırma.",riskliTaraf:"Kibir veya tam tersi kendini saklama.",saglikOdagi:"Enerji toparlanması; alerjik hassasiyetler.",isPara:"Yeni kariyer kapısı, uzun vadeli şanslı projeler.",iliskiler:"Önemsiz görünen tanışmalar kader bağlantısına dönebilir."},
  {no:18,baslik:"Ay, bilinçaltı ve sezgi",anaTema:"Belirsizlik, sezgi, bilinçaltı çalışması.",hediye:"Sezgisel güç, yaratıcı vizyon, iç dünyayı tanıma.",strateji:"Yavaş ilerle, sezgiyi dinle, riskleri ölç.",iyiGelir:"Sanat, psikoloji, terapi, bilinçaltı çalışmaları.",dikkat:"Korkular, kuruntu, aldanma, hayal dünyasına kaçış.",riskliTaraf:"Yanılsama, gizli gündemler, aldatılma.",saglikOdagi:"Uyku, psikoloji, bağımlılık eğilimleri.",isPara:"Belirsiz süreçler, yeniden yapılanma dönemleri.",iliskiler:"Gizlilik, net olmayan niyetler; şeffaflık arayın."},
  {no:19,baslik:"Güneş, başarı ve canlılık",anaTema:"Açık başarı, neşe, yaşam enerjisi.",hediye:"Bolluk, görünür sonuçlar, mutluluk ve sıcak ilişkiler.",strateji:"Paylaş, açık ol, üret ve keyifle ilerle.",iyiGelir:"Öğretmek, bilgi paylaşmak, ekip işleri, yaratıcı üretim.",dikkat:"Kibir, aşırı özgüven, kendini yakma (tükenme).",riskliTaraf:"Takıntı, aşırı kontrol → psikosomatik stres.",saglikOdagi:"Yüksek enerji; aşırı çalışmaya ve yanmaya dikkat.",isPara:"İşte başarı, ekip uyumu, verimli dönem.",iliskiler:"Sıcak, cömert, destekleyici bağlar."},
  {no:20,baslik:"Uyanış, çağrı ve kökler",anaTema:"Karmik uyanış, köklerle yüzleşme.",hediye:"Kayıp görünen değeri geri kazanma, hayat amacı netleşmesi.",strateji:"Aile bağlarını onar, affet, geçmişi temizle.",iyiGelir:"Soy–aile çalışmaları, kök araştırması, büyük projeler.",dikkat:"Sürekli eleştiri, hayatı reddetme, küskünlük.",riskliTaraf:"Akrabalarla çatışma → fırsat kapanması.",saglikOdagi:"Genel kontroller, planlı muayene.",isPara:"Büyük yön değişimi; gerçek mesleğe geçiş.",iliskiler:"Derin birliktelik; “gerçek eş” teması."},
  {no:21,baslik:"Dünya, tamamlanma ve bütünlük",anaTema:"Tamamlanma, bütünleşme, yeni seviye.",hediye:"Hayat alanlarının birleşmesi, yerini bulma.",strateji:"Ufku genişlet, hareket et, dünyaya açıl.",iyiGelir:"Seyahat, uluslararası işler, medya, ağ kurma.",dikkat:"Borçlanma, finansal dikkatsizlik.",riskliTaraf:"Dünya ile kavga, sert ideolojik tutum.",saglikOdagi:"Bağışıklık ve genel beden hareketliliği.",isPara:"Başarılı projeler, yabancı bağlantılar.",iliskiler:"Kalıcı birlik, evlilik veya uzun vadeli ortaklık."},
  {no:22,baslik:"Yeni döngü, özgürlük ve sıfırlama",anaTema:"Sıfırdan başlangıç, özgürlük, keşif.",hediye:"Yeni yol, yeni deneyimler, sürpriz fırsatlar.",strateji:"Hafifle, dene, hareket et, akışta kal.",iyiGelir:"Seyahat, yeni girişimler, deneysel projeler.",dikkat:"Dağınıklık, sorumsuzluk, sınır aşımı.",riskliTaraf:"Kumar, bağımlılık, hayal dünyasına kaçış.",saglikOdagi:"Sinir sistemi, zihinsel denge.",isPara:"İş/pozisyon değişimi, finansal özgürleşme.",iliskiler:"İlişki formatı değişir; daha özgür model."},
];
var OG_ZIRVE_TEMEL = {"1": ["Aktivite ve değişim fırsatı", "Bireyselleşme ve bağımsızlık", "Baskıyı reddetme"], "2": ["Güçten çok işbirliği", "Uyum ve ortaklık", "Diplomasi geliştirme"], "3": ["Neşe ve keyifli gelişmeler", "Yaratıcılık ve sanat", "Yetenekleri ortaya çıkarma"], "4": ["Yavaş ama sağlam ilerleme", "Gelecek inşası", "Sabır ve hizmet bilinci"], "5": ["Sürekli değişim ve deneyim", "Yeni insanlara ve ortamlara açılma", "Eskiyi bırakma, yeniyi kabul"], "6": ["Sorumluluk ve aile konuları", "Sevgi ve görevler", "Uyum ve hizmet"], "7": ["Felsefe ve derin düşünce", "Analiz ve içe dönüş", "Bilgi arayışı ve sabır"], "8": ["Güç ve otorite", "Başarı ve tanınma", "Cesaret ve büyüme"], "9": ["Tamamlanma ve genişleme", "Evrensel başarı", "Bireysel hayal kırıklıklarından öğrenme", "Empati ve şefkat"], "11": ["Ruhsal açılım", "Aydınlanma ve ün", "Yüksek hassasiyet", "İdeallere bağlanma"], "22": ["Dünya ve uluslararası konular", "Büyük ölçekli düşünme", "Bilinç genişlemesi"]};
var OG_ZIRVE_DONEM = {"1": {"baslik": "Liderlik Dönemi", "maddeler": ["Bağımsızlık ve özgüven artar", "Kendi yolunu çizme isteği", "Liderlik fırsatları doğar", "Yeni iş veya proje başlatmak için uygun zaman", "Başkalarını memnun etmekten çok kendine yönelme"]}, "2": {"baslik": "İlişki ve İşbirliği Dönemi", "maddeler": ["Uyumlu ilişkiler ön planda", "Sezgiler güçlenir", "İnsanları daha iyi anlama", "Yardım ve destek teması", "Uygun alanlar:", "Danışmanlık", "Şifacılık", "Sanat", "Müzik", "Sağlık çalışmaları"]}, "3": {"baslik": "İfade ve Yaratıcılık Dönemi", "maddeler": ["Kendini ifade etme artar", "İletişim güçlenir", "Çok çalışma ve düzen kurma zamanı", "Sanatsal üretim desteklenir", "Uygun ifade yolları:", "Yazmak", "Konuşmak", "Sahne / gösteri", "Şarkı söylemek", "Tasarlamak", "Odak ve disiplinle başarı ve mutluluk potansiyeli yükselir"]}, "4": {"baslik": "Disiplin ve Kuruluş Dönemi", "maddeler": ["İstikrar kurma zamanı", "Gelecek için sağlam temel atma", "Direnme ve sorunlarla yüzleşme gücü gelişir", "Düzenli ve planlı çalışma desteklenir", "Disiplin ve odak artar", "Başladığını bitirme enerjisi verir", "Çok çalışma + etik duruş = başarı potansiyeli"]}, "5": {"baslik": "Değişim ve Deneyim Dönemi", "maddeler": ["Hareket ve değişim artar", "Yeni deneyimler ve yeni insanlar", "İletişim becerileri gelişir", "Keşif ve öğrenme dönemi", "Kişisel tanıtım / görünürlük fırsatı", "Değişime uyum öğrenilir", "Öz disiplin ve ölçülülük dersi getirir", "Esneklik ve uyum gücü kazandırır"]}, "6": {"baslik": "Aile ve Hizmet Dönemi", "maddeler": ["Sorumluluk artışı", "Aile ve yakın çevre ön planda", "Verme–alma dengesi öğrenilir", "Ev ve iş yaşamı dengesi kurulur", "Uygun temalar:", "Evlilik / nişan", "Çocuk", "Aileyle ilgilenme", "Hizmet alanları", "Evden çalışma", "Şefkat ve sahiplenme duygusu güçlenir"]}, "7": {"baslik": "İçsel Gelişim ve Uzmanlık Dönemi", "maddeler": ["Araştırma ve derin öğrenme zamanı", "Uzmanlaşma fırsatı", "Kişisel gelişim hızlanır", "Spiritüel farkındalık artar", "Yaşamın anlamını sorgulama", "Sezgiler güçlenir", "İç gözlem ve içe dönüş desteklenir", "Bilinçli uygulamalar benimsenir"]}, "8": {"baslik": "Güç, Para ve Kariyer Dönemi", "maddeler": ["Maddi fırsatlar artar", "Kariyer ilerlemesi mümkündür", "Yönetim ve liderlik şansı", "Kendi işini kurma potansiyeli", "Doğru karar verme önemlidir", "Dürüstlük ve çalışma disiplini şarttır", "Ego kontrolü öğrenilir", "Para ile sağlıklı ilişki geliştirme süreci"]}, "9": {"baslik": "Şefkat ve Tamamlama Dönemi", "maddeler": ["Açık fikirlilik gelişir", "Karşılıksız yardım eğilimi artar", "Empati ve anlayış büyür", "Geçmişi bırakma süreci", "Affetme ve kabullenme", "Bitenleri doğal görmek", "İnsanlık bilinci güçlenir", "Başkalarının ihtiyaçlarını gözetme"]}};
var OG_MUCADELE = {"0": {"baslik": "Seçim ve Özgür İrade", "maddeler": ["Özel bir mücadele teması yoktur", "Seçenekler fazladır", "Tercihler tamamen size bağlıdır", "Özgür irade vurgusu yüksektir", "Yönü sizin kararlarınız belirler"]}, "1": {"baslik": "Bağımsızlık ve Özgüven", "maddeler": ["Kendini savunmayı öğrenme", "Daha iddialı olma gerekliliği", "Bağımsız hareket etme dersi", "Başkalarının düşüncelerine daha az takılma", "Özgüven geliştirme", "Kendi yolunda yürümeye zorlanma"]}, "2": {"baslik": "Duygusal Denge", "maddeler": ["Hassasiyet artar", "Duyguları dengeleme ihtiyacı", "Aşırı tepkiyi kontrol etme", "Her şeyi kişisel almamayı öğrenme", "Özgüven geliştirme", "Kıyas yapmayı azaltma"]}, "3": {"baslik": "İfade ve Odak", "maddeler": ["Kendini doğru ifade etme sınavı", "İletişimi yapıcı kullanma", "Şunlardan uzak durma dersi:", "Abartı", "Dedikodu", "Sürekli şikayet", "Kelimeleri ilham ve umut için kullanma", "Dağılmak yerine odaklanma", "Duyguları söze dökmede zorlanma"]}, "4": {"baslik": "Disiplin ve Dayanıklılık", "maddeler": ["Düzen kurma zorunluluğu", "Disiplin geliştirme", "Vazgeçme eğilimiyle yüzleşme", "Sorunlardan kaçmama", "Sabırla yapı kurma", "Yavaş ama sağlam ilerleme", "Zor dönemlerde olumlu kalma sınavı"]}, "5": {"baslik": "Kontrol ve Sorumluluk", "maddeler": ["Aşırılıklara karşı sınav", "Bağımlılık eğilimlerini kontrol", "Fiziksel hazlarda ölçü", "Sorumluluk almada zorlanma", "Taahhüt verme dersi", "Disiplinli kalma ihtiyacı"]}, "6": {"baslik": "Kabul ve Gerçekçilik", "maddeler": ["Aşırı idealizmi bırakma", "Kusurları kabul etme", "Kendini ve başkalarını kabullenme", "Yargılamayı azaltma", "Esneklik geliştirme", "“Mükemmel değil ama değerli” anlayışı"]}, "7": {"baslik": "İçsel Güven ve Derinlik", "maddeler": ["Yaşamın derin anlamını arama", "İçsel dönüşüm süreci", "Öz farkındalık artışı", "İçe dönüş ve yalnız kalma ihtiyacı", "İnanç ve güven geliştirme", "Mutluluğun içten geldiğini öğrenme"]}, "8": {"baslik": "Ego ve Güç Dengesi", "maddeler": ["Güç ve kontrol isteğiyle sınav", "Ego yönetimi", "Maddiyat–maneviyat dengesi", "Para ile sağlıklı ilişki kurma", "Başkalarını kontrol etme isteğini azaltma", "Kişisel gücü olgunlaştırma", "❗ Not", "Mücadele sayısı 9 yoktur."]}};
var OG_BYD = {"1": {"baslik": "Bağımsızlık ve Liderlik", "maddeler": ["Bağımsız olmayı öğretir", "Kendi ayakların üzerinde durma", "Liderlik yeteneklerini ortaya çıkarma", "Kararlarına güven geliştirme", "Kendi yolunu çizme", "Cesaret ve içsel güç kazanımı", "Özgüven artışı", "Başkalarını memnun etmek için kendinden ödün vermemeyi öğrenme", "Olası gelişmeler:", "İş kurma", "Yeni proje başlatma", "Kariyer ilerletme", "Liderlik rolü alma", "İmaj değişikliği", "Yenilik / icat"]}, "2": {"baslik": "Yardım ve Denge", "maddeler": ["Yardımseverlik ve merhamet gelişir", "Uzlaşma becerisi artar", "Duygusal farkındalık büyür", "Yaşam dengesi kurmayı öğretir", "Sezgi güçlenir", "Hassasiyet artar", "Psişik/sezgisel algı açılabilir", "Olası gelişmeler:", "Ortaklık kurma", "İlişki başlatma", "Evlilik", "Aile kurma", "Sanat ve müzikle ilgilenme", "Başkalarına destek olma"]}, "3": {"baslik": "İfade ve Yaratıcılık", "maddeler": ["Yaratıcılığı zorlar ve açar", "Kendini olumlu ifade etmeyi öğretir", "Sözel ve sanatsal ifade gelişir", "Entelektüel üretim artar", "Duygusal ifade güçlenir", "Olası gelişmeler:", "Kitap yazma", "Enstrüman çalma", "Sanatsal faaliyet", "Eğitim / öğretmenlik", "Sahne ve anlatım işleri"]}, "4": {"baslik": "Disiplin ve İnşa", "maddeler": ["Çok çalışma dönemi", "Sağlam temel kurma", "Düzen ve disiplin geliştirme", "Sabır öğrenme", "Zorluklara direnme", "Emeklerin somut sonuç vermesi", "Olası gelişmeler:", "Kariyer kurma", "İş kurma", "Ev yapma / yenileme", "Para biriktirme", "Nişan / evlilik"]}, "5": {"baslik": "Değişim ve Deneyim", "maddeler": ["Değişime uyum dersi", "Özgürlük ihtiyacı artar", "Akışa uyum öğrenilir", "Çok sayıda yeni deneyim", "Yeni insanlar ve fırsatlar", "İletişim becerisi gelişir", "Kendini tanıtma / görünürlük artar", "Olası gelişmeler:", "Seyahat", "Taşınma", "Yaşam tarzı değişimi", "Yeni deneyimler", "Köklü kararlar"]}, "6": {"baslik": "Aile ve Sorumluluk", "maddeler": ["Aile ve ilişkiler öncelik olur", "Sorumluluk alma artar", "Hizmet bilinci gelişir", "Sevgi teması güçlenir", "Alma–verme dengesi öğrenilir", "Kişisel sınırlar tanımlanır", "Olası gelişmeler:", "Evlilik", "Çocuk", "Aileye adanma", "Hizmet sektörü işi"]}, "7": {"baslik": "Uzmanlaşma ve Spiritüel Gelişim", "maddeler": ["Derin düşünme ve araştırma", "Yüzeyin ötesini görme", "Uzmanlaşma süreci", "İçsel gelişim artışı", "Spiritüel farkındalık", "Yalnız kalabilme becerisi", "Sezgi gelişimi", "Olası gelişmeler:", "Spiritüel pratikler", "Alternatif yöntemler", "Kişisel gelişim çalışmaları", "Derin eğitim / araştırma"]}, "8": {"baslik": "Güç ve Kariyer", "maddeler": ["Kişisel güç teması", "Finans ve kariyer odaklı dönem", "Liderlik pozisyonu fırsatı", "Terfi ve yönetim rolleri", "Büyük yatırımlar", "İnanç kalıplarını dönüştürme", "Para ve başarı algısını yeniden kurma", "Hukuki ve resmi işler gündeme gelebilir"]}, "9": {"baslik": "Şefkat ve Dönüşüm", "maddeler": ["Hoşgörü ve anlayış gelişir", "Şefkat artar", "Evrensel bakış açısı", "Geçmişi iyileştirme", "Affetme süreci", "Topluma katkı isteği", "Olası gelişmeler:", "Sosyal projeler", "Yardım faaliyetleri", "Sanatsal üretim", "Aile ilişkilerini onarma", "Eski yaraları kapatma"]}, "11/2": {"baslik": "Aydınlanma ve İlham", "maddeler": ["Spiritüel farkındalık artışı", "İçsel dönüşüm", "Başkalarına ilham verme", "Moral ve motivasyon kaynağı olma", "Sezgi ve psişik algı gelişimi", "Şifa / danışmanlık eğilimi", "Olası gelişmeler:", "Spiritüel eğitim", "Danışmanlık", "Şifacılık", "Psikoloji alanı", "Hizmet çalışmaları", "(2 sayısının temaları da geçerlidir)"]}, "22/4": {"baslik": "Büyük Kurucu Enerji", "maddeler": ["İnsanlığa hizmet teması", "Büyük ölçekli projeler", "Sistem kurma ve yapılandırma", "Köprü kuran çalışmalar", "Yüksek sorumluluk", "Güçlü odak ve disiplin", "Olası gelişmeler:", "Toplumsal projeler", "Küresel roller", "Organizasyon kurma", "Uzun vadeli yapı kurma", "(4 sayısının temaları da geçerlidir)"]}};
var OG_EK_C = {"0": ["Sonsuz potansiyel", "tüm rakamların potansiyeli", "hem bir döngünün başlangıcı hem de sonu", "sonsuz olası sonuçlar ve eş zamanlı tamamlanmalar", "sezgiler", "inandığını çeker", "yüksek yaratım gücü"], "1": ["başlama", "adım atma", "yeni durum", "eril", "emin başlangıç", "cesur", "öne çıkma"], "2": [". 1de başaldığını besleme,büyütme", "Hassas ve belirsiz zamanlar", "kaygılı zamanlar", "duygusallık hakim", "ikili ilişkiler", "anne çocuk konuları"], "3": ["egonun ortaya çıkışı", "hakkını savunma", "cesur korkusuz", "öngörülmeyen olaylar karşısında savaş enerjisi", "yeni bir organizasyon,taşınma", "duygunun ifadesi", "eser yaratma", "emir verme", "çocuklar,aile", "dağılmış olanı düzenleme", "pratik çözümler", "çok çalışma"], "4": ["değişim dönüşüm", "sınav sonrası farkındalık", "istikrar ve düzen", "daha azla yetinme", "sadeleşmen gereken konular", "yeni kurallar ve sınırlar", "taşınma", "tadilat", "ameliyat", "ev alma"], "5": ["yenilikler", "hareket", "sabırsızlık", "hızlanma", "özgürlük", "sosyallik", "yeni şeyler öğrenme", "stres", "çözümler", "yıldızlaşma"], "6": ["denge", "aile ve sorumluluk", "lüks ve rahatlık", "aşk", "sorumluluk", "kutlama", "estetik", "aldatma  aldatılma", "kıskançlık", "sağlık"], "7": ["ruhsal  dersler ve sonrası ruhsal büyüme", "hastalık", "inziva", "sessizlik", "maddi manevi hesap", "hayatta yön bulma ve hedef belirleme"], "8": ["sorumlu olmak", "iş bitirme", "sonuçlanma", "maddi kazanç", "alma satma", "statü değişimi", "mahkeme", "emeklilik,evlilik,boşanma,terfi", "büyük çatılar,kamu"], "9": ["çocuk,yaşlı,hamilelik", "sonlanma ve şifalanma", "kapanma ve kabul", "gereksiz şeylerden kurtulma", "hastalık ve şifa", "sürprizler", "eğitim", "yeni tohumlar ve 1 e hazırlık"], "10": ["sezgisel bir liderlik,adım atma", "insanlarda iyiyi görme", "daha büyük iyilikler için cesaret ve başlangıç"], "11": ["aydınlanma", "aydınlanmış başlangıç ve bağımsızlık", "empati ve diplomasi ile gelen ideallerin ortaya konuşu"]};
var OG_EK_D_SINIF = {"A": {"sinif": "olumlu", "aciklama": "Her alanda ilerleme. Etkinliklerin gelişmesi. İkamet değişikliği. Yeni başlangıç. Kadınlar için duygusal bir karşılaşma."}, "B": {"sinif": "olumsuz", "aciklama": "Duygusal güçlükler. İlişkinin ve sağlığın bozulma tehlikesi. Maddi istikrar tehlikede. Boşanmaya ilişkin titreşim."}, "C-Ç": {"sinif": "olumlu", "aciklama": "Başarı söz konusu. Mutlu, dengeli bir duygusal yaşam. Büyük olasılıkla yer değiştirme (yolculuklar). Maddi başarı."}, "D": {"sinif": "olumsuz", "aciklama": "Ailede ve duygusal yaşamda karışıklık. Sağlık sorunları. İş açısından olumlu olabilir.Ancak umduğunu, bulamama tehlikesi."}, "E": {"sinif": "olumlu", "aciklama": "Tüm-alanlar korunaklı ve bir önceki olumsuz yılın kötülüklerinden iz kalmamış durumda."}, "F": {"sinif": "olumsuz", "aciklama": "Aile ön planda, sağlık tehlikede, Özellikle duygusal alanda çeşitli dertler. İlişki. Çeşitli dilekler. Birleşme ya da boşanma."}, "G-Ğ": {"sinif": "olumlu", "aciklama": "Eğer başarı maddi dengeyi ve meslek yaşamını kamçılayacak olursa, duygusal yaşam gergin bir hal alacaktır."}, "H": {"sinif": "olumsuz", "aciklama": "Manevi konularda şüphe tereddütler yaşayacağınız dengesizlikler hissedebilirsiniz. Kendinizi bütünün bir parçası ya da bütünden ayrı hissedebileceğiniz konular yaşanabilir. Maddi konularda dikkatli olunması gerekebilir yanılmalar yaşanabilir."}, "I-İ": {"sinif": "olumsuz", "aciklama": "Gergin bir duygusal yaşam: Kopma ya da boşanma olasılığı. Sağlığın bozulma olasılığı. Etkinlikler yavaşlama dönemine girecek. Kaza, geçirilebilir."}, "J": {"sinif": "olumlu", "aciklama": "Tüm. Alanlar, korunaklı."}, "K": {"sinif": "olumlu", "aciklama": "Başarı ve hedeflerin sonuca varması. Mutlu bir duygusal yaşam."}, "L": {"sinif": "olumlu", "aciklama": "Tüm alanlar korunaklı."}, "M": {"sinif": "olumsuz", "aciklama": "Gergin ve kargaşalı bir duygusal, yaşam. Maddi alanda sorunlar. Ailede düzensizlik ve sağlık tehlikede."}, "N": {"sinif": "olumlu", "aciklama": "Olumlu değişiklikler ile duygusal ya da dostane karşılaşmalar sayesinde sağlanan"}, "O-Ö": {"sinif": "olumlu", "aciklama": "Duygusal yaşam birinci planda ve korunaklı durumda, Evlilik, uzun süreli birliktelik, mutluluk."}, "P": {"sinif": "olumsuz", "aciklama": ", her alanda. Gizli tutulan duygusal yaşam çok yüzeysel."}, "R": {"sinif": "olumsuz", "aciklama": "Sağlık, yaşam, mali durum, duygular gibi temel dengelerin tehlikede olduğu kötü bir yıl. Evlilik için pek elverişli değil."}, "S-Ş": {"sinif": "olumlu", "aciklama": ", her alanda, olası kaygılara ve güçlüklere rağmen. Duygusal karışıklıklar söz konusu,"}, "T": {"sinif": "olumlu", "aciklama": "; her alanda. Duygusal yaşam iyi durumda. Evliliğe ya da uzun süreli bir ilişkiye elverişli bir yıl. Konut değişikliği ve hareketlilik (yolculuklar, yer değiştirmeler, etkinlikler...)"}, "Ü-Ü": {"sinif": "olumsuz", "aciklama": "Duygusal ve maddi güçlükler. Kısıtlama yılı."}, "V": {"sinif": "olumlu", "aciklama": "Tüm alanlar korunaklı. Başarı, mutluluk, sağlık."}, "Y": {"sinif": "notr", "aciklama": "Her durumda değişim ve seçim. İstikrarsız ve çalkantılı duygusal yaşam."}, "Z": {"sinif": "olumlu", "aciklama": "Maddi alanda başarı. Duygusal yaşam tehlikede, ancak evlilikte uzlaşma olasılığı. Aksi halde boşanma ya da kopma tehlikesi."}};
var OG_EK_D_DETAY = {"A": ["Pratik konular ön planda olur", "Bize bağımsızlık katar, liderlik katar", "Risk almamız lazım, hareket etmemiz lazım", "Değişim vardır,aktivite vardır,atılım yapmamız gerekir", "Kendine güvenme derslerini öğrenmenin ve kendi çabalarınızla ilerlemek için kararlılığınızı ikiye katlamanın zamanıdır.", "Bir sağlık göstergesi olarak a, akciğerlere veya solunum sistemi hastalıklarına dikkat etmek anlamına gelir."], "B": ["Duygusallık ve utangaçlık hakimdir", "Sinir sistemi ile ilgili sağlık problemlerine dikkat etmek gerekir, daha duyarlıyız, insanlara karşı daha duyarlı ve diplomatik oluruz, insanlarla ilişkimizde duygusal tepkilerimiz ortaya çıkar,", "İnsanlar bize yardımcı olmak isteyebilir veya biz insanlara yardımcı oluruz,", "Güçlü sevgi bağları kurabiliriz, ama sağlık sorunlarına dikkat etmek gerekir", "Ortaklıklar veya evlilik için güçlü bir arzu getirir.", "Ders sabır, sakinlik ve zihin dinginliği ile ilgilidir.", "Kararlar başkalarına bırakılmalıdır. Bu, başkaları tarafından fark edilmeyebilecek bir gizli gelişim döngüsüdür.", "Bir sağlık faktörü olarak B, sinirliliğe, baş ağrısına ve duygusal rahatsızlıklara neden olabilir."], "C": ["Kendimizi ifade edeceğimiz, daha konuşkan olacağımız, daha yaratıcı olacağımız bir dönem", "Daha etkin olabiliriz kendimizi tanıtabiliriz", "Sanatsal, politik veya ticari başarıyı destekler.", "Kendini ifade etme, üretkenlik ve büyüme için iyidir.", "Zengin duygusal deneyimler, refah ve mutluluk olmalı. Bu güçlü bir evlilik titreşimidir.", "Bir sağlık faktörü olarak C, boğaz, tiroid ve ses telleri ile ilgili endişelere neden olabilir."], "D": ["Fiziksel özellik sağlık mevzu bahistir,", "Beslenmemize diyetimize fiziksel sağlığımıza dikkat etmemiz gerekir,", "Duygularımız konusunda bize destek olacak insanlar arayabiliriz, fiziksel sağlık;", "İstikrar düzen kuracağımız bir zaman", "Gelecek için sağlam bir temel oluşturma çabasını temsil eder.", "Geçici gecikmeler mümkündür, ancak sabır konusunda değerli dersler çıkarılabilir.", "Spekülasyondan kaçınılmalı ve muhafazakarlık uygulanmalıdır.", "Seyahat mümkündür."], "E": ["Evlilik olabilir", "Kariyerle ilgili değişimler olabilir", "Yaşadığımız yerle ilgili değişim veya taşınma olabilir", "Bu taşınmanın kaynağı da ya iştir ya da evliliktir", "Aynı zamanda entelektüelliği de temsil ettiği için yeni ortamlara girip yeni fikirler yeni bilgiler yeni eğitimler ediniriz", "Aynı zamanda e harfi 5 duyudur", "Giyim kuşamdır bunlarla ilgili yani hayat tarzımızda ilgili değişimler de olabilir", "Bir sağlık faktörü olarak iyi bir sağlık göstergesidir. Kalp kendini özgür hisseder, ancak dürtüsellik kontrol edilmelidir.", "Değişim için birçok şans arasından seçim yapmak zorunda kalacak.", "Sürekli aktivite, yeni insanlar ve yeni durumlar olacak.", "Bekarsanız, şimdi evlilik için fırsat var, ancak bunun duygusal dürtüden ziyade gerçek aşk olduğundan emin olmalısınız.", "Bir sağlık faktörü olarak iyi bir sağlık göstergesidir. Kalp kendini özgür hisseder, ancak dürtüsellik kontrol edilmelidir."], "F": ["Büyümeyle ilgili bir dönem", "Hem evde hem hem iş hayatında daha fazla çalışma ve sorumluluk alma", "Daha duyarlı olmak", "Ama net olacağımız hayattan ne istediğimizi bildiğimiz bir dönem fedakarlık yapmaya açık olduğumuz dönemler", "Bu dönemlerde kurban psikolojisine girmemeye çalışmalı fazla fedakarlık yapmamalıyız", "Dikkatinizi evli olsun ya da olmasın, sevdiklerinizle bağlantılı aile meselelerine ve görevlere odaklar.", "İstekli hizmetin anlamını öğrenmenin zamanı geldi, çünkü alternatifler hayal kırıklığı yaratabilir. Akıllıca seçimler gereklidir.", "Bir sağlık faktörü olarak F, kalbin sinir koşulları da dahil olmak üzere sorunu gösterir."], "G": ["Maddi kazanç vardır", "Hem zihinsel hem ruhsal bir harf olduğu için başarıyla derinleşmeyle alakalı bir dönem", "Birçok kez yalnız hisseder içimize dönmek isteriz", "Çok konuşmak istemeyeceğiz", "Çünkü daha düşünerek konuşmaya başlayacağız", "Daha verimli bir ifade tarzı yakalayacağız k", "Endimizi daha basit ve dengeli bir şekilde ifade edeceğiz düşünmeden hareket etmeyeceğiz", "İçsel bir çatışma ve içsel bir dönüşüm de yaşayabiliriz", "Genişleme, üretkenlik ve maddi başarı zamanıdır.", "Sanat, müzik, drama veya edebiyat için uygundur.", "Bir sağlık faktörü olarak G her zaman iyidir. Hastalık ortaya çıkarsa, iyileşmeye yönelik yardım vardır."], "H": ["Gücü elimizde bulunduracağız ve daha dayanıklı olacağız.", "Öz disiplin ve başarılı odaklı olma dönemi,", "Mücadeleci ve iddialı olacağız,", "Statü artışı veya değişim mümkün,", "Evlenme boşanma terfi istifa kovulma", "Yaşam yoluna açılan bir kapı, bir bariyer veya bir açıklık olabilen bir kapı görevi görür. Bu, kozmik yasaların karmanın tamamlanması için çalıştığı bir zamandır. Mali veya yasal işlerle ve yaşamın fiziksel ve maddi yönüyle ilgili endişeler vardır.", "Bir sağlık faktörü olarak H kişisel gerginlik getirebilir."], "I": ["Daha gergin ve strese karşı savunmasız olacağız", "Kazalara eğilim olduğu için daha merkezde ve sakin kalmayı denemeliyiz", "Ruh halimizin değişkenlerine karşı kendimizi kontrol etmemiz gerek", "Miras ile alakalı konular gündeme gelebilir", "Bir iniş ve çıkışlar zamanı.", "İnançlarınıza sıkı sıkıya bağlı kalarak, büyük ilham verir. Tereddüt, servette dalgalanmalar getirecek ve yeni başlangıçlara neden olacaktır.", "Bu, kişisel duyguların çok önemli olduğu bir dönemdir; duyarlılık, sempati ve sezgi yüksektir.", "Bir sağlık faktörü olarak, muhtemelen aşırı efordan kaynaklanan gerginlik getiriyorum.", "Yoğun duygular yorgunluğa neden olabilir."], "J": ["Kişisel insiyatif alacağımız belki kariyer ile ilgili yönümüzü değiştireceğimiz bir dönem", "Kazancımızı arttırmamız için fırsatlarla karşılaşacağız sorumluluklar girecek hayatımıza", "Neredeyse her zaman bir şekilde kazanç ve avantaj anlamına gelir.", "Daha az şanslı olanlara yardım eli uzatmalı", "İyi şansın tadını çıkarmak istiyorsa moralini yüksek tutmalı", "Liderlik pozisyonuna getirilecek veya terfi alacaktır.", "Neredeyse her zaman bir şekilde kazanç ve avantaj sağlar."], "K": ["Sezgisellik artacak,", "Kendimize ruhi atılımlar yapacağız,", "Yeni insanlarla yeni iş alanlarıyla ilgilenmeye başlayacağız, yaratıcılığımızı kullanmamız lazım ve her zamankinden daha fazla mücadele etmemiz lazım", "Çünkü daha fazla sorumluluk alacağız", "Yüzden işbirliği yapabilmeyi becermemiz lazım,", "Tüm sorumluluğu kendi üstümüze alırsak sinir sistemimiz zarar görebilir", "Abartılar sahtekarlıklar düşüncesizlikler kendini gösterebilir", "Yaratıcı ilham ve idealizm olumlu bir hedefe yönlendirilmelidir, aksi takdirde bu döngü çatışmaya neden olabilir.", "Ya yoğun romantik deneyim ya da ruhsal yüceltme için büyük bir duygusal güç vardır.", "Seyahat ve değişim getirir ve dikkatli olunursa başarı getirebilir.", "Bir sağlık faktörü olarak K, aşırı aktiviteden kaynaklanabilecek sinirliliği gösterir. Ancak güç ve dayanıklılık veren iyi bir güçtür."], "M": ["Konuşmanın az", "Sıkı çalışmanın çok olduğu dönemler", "Yakınlarımızla daha mesafeli olacağız", "Duyguları ifade etmemiz lazım yoksa bedensel olarak sıkıntılar yaşayabiliriz", "İstikrarlı ilişkiler kurmak için güzel bir dönem olacaktır", "Hiç şey için acele etmemek lazım", "Daha iyilerine yer açmak için eski fikirlerin süpürüldüğü bir yeniden yapılanma dönemidir.", "Beklenmedik değişiklikler şimdi meydana gelebilir ve bunlar yeni bir mutluluk aşamasının açılacağı ilerlemeye açılan bir kapı olarak kabul edilmelidir.", "Bir sağlık faktörü olarak M, öfkeyi gösterebilir, kızarıklık davranışına ve baş ağrısına neden olabilir.", "Ciddi değişiklik potansiyeli nedeniyle, dikkatli bir şekilde ele alınmadığı sürece birden fazla M tehlikeli olabilir. Herhangi bir harften ikisi etkilerini ikiye katlar."], "N": ["Ufkumuzu geliştirecek yeni fırsatlar önümüzde çıkacak", "Seyahatlere çıkabilir", "Evimizi değiştirebiliriz", "Mali konular fiziksel egzersizler önemli olacak", "Şehvetli hissetme ihtimalimiz de fazla olur", "Çeşitlilik, değişim ve deneyimler getirir. Ticari veya siyasi girişimler için elverişlidir ve çok fazla rekabet içerebilir.", "Bir sağlık faktörü olarak N, evlilik düşüncelerinin getirdiği duygusal rahatsızlıklar nedeniyle sinirliliğe neden olabilir."], "O": ["Daha güçlü duygusal bir dönem", "Kendimizi fazla endişelendirmemiz gerek", "Üzerimize fazla sorumluluk almamalıyız", "Etrafımızdakilere çok müdahale etmeyeceğiz", "Mevcut sınırlamalardan kurtulmaya izin vererek ilerleme için bir fırsat sunar.", "Bakış açısında radikal bir değişiklik meydana gelebilir ve korkular silinebilir.", "O bir sağlık faktörü olarak, olumsuz tarafına cevap veriyorsanız endişe ve depresyona neden olabilir. Yavaşlamak kalp düzensizliklerini ve umutsuzlukları önleyebilir. O, dini konularla uyumludur; Bu nedenle, dua yardımcı olabilir ve ilham verebilir."], "P": ["Gereksiz riskler almayacağız çünkü reflekslerimiz iyi olmayacak", "Daha düşünceli daha takıntılı olabiliriz", "Manevi ve içsel büyümeyle ilgili bir dönem", "Finansal açıdan çok büyüme göremeyebiliriz", "Bir işe zihinsel olarak odaklanabilecek bir dönem", "Kendimizi daha az kontrol edebiliriz", "Bu yüzden gereksiz riskler almamalıyız çünkü  dönemlerde beklenmedik olaylar vuku bulabilir", "Gelecek için parlak beklentiler sunar. Yaratıcı yetenekleriniz sayesinde, iyi şans kapıda. Akıllıca plan yapın ve bu döngü sırasında geleceği hedefleyin.", "Bir sağlık faktörü olarak P, fazla çalışmamanız gerektiğini gösterir."], "R": ["Genel olarak odaklanabileceğimiz  plan yapıp adım atacağımız bir dönem", "En iyiyi ve en kötüyü görebileceğimiz dönemler", "Çevreyi iyi gözlemleyerek yaptığımız işlerde ve attığımız adımlarda dikkatli olmamız gerek", "Yeni planlar ve fikirler için bir açılım sağlar ve yaşamda yeni bir meslek çağrısında bulunur. Bu süre boyunca statü elde etmeye karar verin.", "Tempo hızlı, biraz yavaşlamaya ihtiyaç var.", "Bir sağlık faktörü olarak R, dikkatsizlik nedeniyle kazalar meydana gelebilir ve bu da hastalığa neden olabilir."], "S": ["Duygular derinleşir farkındalık artar yükselir", "O yüzden kişiliğimizin gizli yönleri daha çok açığa çıkabilir", "Kendimizin de fark etmediğimiz özellikleri fark etmeye başlayabiliriz", "Keşifler özgürlük daha gerçekçi olmak bunlar önemli hale gelebilir", "Rüyalar daha canlı olmaya başlar", "O dönemde irademizin test edilecek ve bununla alakalı yine gücümüzle alakalı yüzleşmeler yaşayacağız", "Sürprizlerle dolu ,seyahati, sürprizlerle dolu bir dönemi temsil edecek", "Pozitif olunmadığında duygusal çalkantılar, başarısızlık ve kontrolsüz dürtülere dikkat etmek gerekir.", "S, bir hastalığı keskinleştirebilir, ancak aynı zamanda iyileşme sağlama ve sorunu azaltma eğilimindedir, böylece daha iyi koşullar yaratır."], "T": ["Gerginlikle alakalı yine duyguların ön planda olduğu bir dönem olacak,", "Feda etmek veya yüklerinizi taşımak yani onlarla mücadele etmek ,onları bırakmamak, takıntılı olmak", "Yalnızlık dönemleri olabilir, kişi içine dönebilir,", "T lerin olduğu dönemler iç dünyasına döndüğü dönemler , kendisiyle barışmayı öğrendiği dönemler", "Bilgi için açlık çekeceğimiz, yeni bilgi kaynaklarıyla tanışa bileceğiniz dönemler", "Yeni aktiviteler arayabiliriz, yeni bir şeyler öğrenmeye hevesli olabiliriz, o yüzden hem iş için hem yeni ortaklıklar için yeni ilişkiler için  açık bir dönem", "Gezme fırsatları olabilir , gezip görüp keşfedebiliriz", "Yeniden yapılanma zamanıdır.", "Bu etki, fikirler insanlığa fayda sağlayabilecek pratik faaliyetlerle ifade edilmedikçe bir huzursuzluk duygusu yaratır. Zaman boşa harcanmamalı, tembelliğe müsamaha gösterilmemelidir.", "Bu, daha iyi dünya koşulları için çalışma zamanıdır. Aynı zamanda ruhsal gelişim zamanıdır."], "U": ["Stres hissedeceğimiz dönemler,", "Daha sezgisel daha hassas olacağımız dönemler", "Burada motivasyon önemli olacak, çünkü bu dönem motivasyonun inisiyatifin eksik olabileceği dönemler", "Eskiden unuttuğumuz ya da üzerinden zaman geçmiş duygusal problemler su yüzüne çıkabilir, ön plana gelebilirler", "Uzun zamandır haber almadığınız kişiler bizimle iletişime geçebilir", "O dönemde akrabalar aileler o konularda çabalamamız gerekebilir", "Çok fazla kendimizi ifade etmeye veya yeni çözümler bulmaya çözüm üretmeye aç olduğumuz", "Kendimizi yine bu dönemde tanıtabiliriz gösterebiliriz", "Bilinçaltı gelişim için bir zamanı gösterir.", "Şimdi gecikmeler ve kısıtlamalar olabilir ve aile sorumlulukları artabilir, ancak artan bir güvenlik ve koruma duygusu var.", "Evlilik aktive edilir. Bir U altında dikkatli olun, çünkü işler genellikle bir fırsatı gözden kaçırmak ve bir fırsatı yakalamayı ihmal etmek gibi kişisel bir hata nedeniyle kayıp gitme eğilimindedir.", "Konular dikkatlice incelenmeli ve iş anlaşmalarında bir avukata danışılmalıdır.", "Bir sağlık faktörü olarak U, kayıp ve kaygı getirme eğilimindedir. Endişeler, yüksek tansiyon gibi başka hastalıklara neden olur. İçinizde sakin ve huzurlu kalmaya çalışın."], "V": ["Kollarını yukarıya açmış bir harf düşünün, o yüzden yatırım fırsatlarıyla alakalı gelecek vadeden  ya da kendimizi daha büyük işler yapabilecek daha ilham alabilecek daha iç dünyamızı zenginleştirecek fırsatlarla karşılaşabiliriz", "Bu yüzden yalnız kalmayı da tercih edebiliriz yani daha büyük idealler daha büyük fikirler böyle küresel çapta bir şeyler düşünebiliriz", "O yüzden hem kendinizdeki bireysel reformlar dönüşümler hem de geleceğe dair önemli projelere başlayacağımız bir dönem düşünebiliriz", "Çok fazla cömertlik veya savurganlık ile birleştiğinde yolculuk tutkusu potansiyeline sahiptir.", "Bir sağlık faktörü olarak V, aşırı aktivite nedeniyle sinirsel ve duygusal çöküntülere neden olabilir. İçinizde barışı geliştirin."], "Y": ["Yine sentezleyici zihin çalışacağı için sezgisellik, ruhsal büyüme ön plana çıkacak", "Yön duygumuz bulanacak yani neyi seçelim (y nin ucundaki çataldan kaynaklı) bir kendimizi incelemek, geliştirmek, hayatın önümüze çıkardığı 7 rakamından kaynaklı sorunlarla mücadele etmek ve ruhsal olarak olgunlaşma ve gelişmeyle alakalı", "Bazı entelektüel ihtiyaçları olan bakıma ihtiyacı olan arkadaşlarla bağlantılar kurabiliriz yeni insanlar tanıyabiliriz", "Ufak tefek sağlık sorunları da olabilir burada o yüzden beslenmeye dikkat etmek gerekir", "Ani bir değişim getirir, çünkü bu bir dallanma döngüsü olduğu için hızlı kararlar gereklidir. Kesin olarak karar verin ve geriye bakmayı veya geçmişe pişmanlık duymayı reddedin. Seçim yapıldıktan sonra her şeyin en iyisini yapın.", "Bir sağlık faktörü olarak Y,  esenlik ve koruma hissi verir"], "Z": ["Biraz daha zikzak çizmek, sınırların üstesinde üstesinden gelmek,", "Sınırlamaları ortadan kaldırmak için çabalamak, inancımızı ortaya koymak için çabalamak,", "Plan yapmamak biraz daha rahat olmaya çalışmak,", "Finansal olarak büyümeye yatkın olduğumuz bir dönem olarak düşünebiliriz", "Burada kişi daha çok sezgilerine göre karar verecektir, yeni ilişkiler kurmak ama farklı ilişkiler kurmak için de yine önemli bir dönem olacaktır", "İlişkilerle alakalı değişiklikleri düşünebiliriz, süreçlerle alakalı bitişler değişiklikler yine burada kendini gösterecektir", "Ama finansal olarak gelişmeye açık bir dönem 8 rakamından kaynaklı", "Statünün değişebileceği bir dönem", "Gizli ilerleme döngüsünde zikzak bir rota çizer. Aksilikler olsa da, daha yüksek bir seviyeye ilerliyorsunuz. Bu dönemde sabrı ve ödüllerini öğrenin.", "Bir sağlık faktörü olarak Z, hastalık üzerinde kontrol sağlar."], "X": ["Savunmasızlıkla alakalı olacak, duygusal kargaşaya eğilimiyle alakalı", "Kişinin alışılmadık yerlerden kaçınması gerekecek yani yeni gruplardan yeni alanlardan yeni fikirlerden biraz daha  temkinli gitmeli", "Ayakları yere basmalı ve görene kadar beklemesi gerekecek", "Hızlı karar vermemesi gerekecek çünkü fedakarlıkla alakalı durumlar ortaya çıkarabilir ya da işte veya aşk hayatında kendini çok fazla sorunun içinde bulabilecek", "Geçmişi bırakmalı"], "W": ["Değişime kollarını açmakla alakalı bir dönem ,m harfinin tersi m’de ne kadar 4 ayağınız sabitleniyorsa w de 5 rakamı o kadar ayaklar havada", "Emekle alakalı, özgür olmakla alakalı bir ortam çıkaracak ama bu da yüzeysellik  düzensizliği farklılığı , yani öngörülemez olayları çekebilir,kaosu ortaya çıkarabilir", "Bu yüzden kontrol önemli öz disiplin önemli", "Sağlık için de ayrıca dikkat etmeleri gerekecektir"], "Q": ["Sezgiler ve zeka ön plana çıkacak", "Orijinal fikirler üretecekler hatta yeni bir şeyler icat etme de olabilir", "Problem çözme becerileri artacak", "Zeki ama karmaşanın olduğu dönem", "Daha dengesiz daha düzensiz sıra dışı insanları kendine çektiği bir dönem olacak", "Tabii sekizden kaynaklı statü değişimleri ,mfinansal değişimler finansal fırsatlara da dikkat edeceğiz", "Özellikle çalışma ortamındaki değişiklikler"]};

/* ============================================================
   ÖNGÖRÜ / YORUMLAMA MODÜLÜ
   Kaynak: "22'lik Numerolojide Öngörü Hesaplama ve Yorumlama Kılavuzu"
   (2026 derlemesi) + kullanıcının ayrıca yüklediği Dürtü (6/7 haneli)
   ve Harf–Çakra eşleme tabloları.
   Bu modül, sayfadaki MEVCUT hesap motorundan (Hayat Amacı, Kulvar,
   Çakra Merdiveni/Ağacı) TAMAMEN BAĞIMSIZDIR — hiçbir mevcut
   fonksiyonu çağırmaz, hiçbir mevcut değişkeni paylaşmaz. Tüm
   fonksiyon/değişken adları "og" öneki taşır.
   ============================================================ */

// ---------- indirgeme fonksiyonları (Kılavuz Bölüm 1) ----------
function ogDigitSum(n){ return String(Math.abs(n)).split('').reduce(function(a,d){return a+Number(d);},0); }
function ogReduceA(n){ while(n>9) n = ogDigitSum(n); return n; }                              // Mod A: klasik tek hane
function ogReduceB(n){ while(n>9 && n!==11 && n!==22 && n!==33) n = ogDigitSum(n); return n; } // Mod B: 11/22 korumalı klasik
function ogReduceC(n){ while(n>22) n = ogDigitSum(n); return n; }                              // Mod C: 22 arketip
function ogTarihRakamToplami(gun, ay, yil){
  var s = String(gun).padStart(2,'0') + String(ay).padStart(2,'0') + String(yil).padStart(4,'0');
  return s.split('').reduce(function(a,d){ return a+Number(d); }, 0);
}
function ogYas(dogum, incelenen){
  var yasRaw = incelenen.getFullYear() - dogum.getFullYear();
  var ayFark = (incelenen.getMonth()+1) - (dogum.getMonth()+1);
  var gunFark = incelenen.getDate() - dogum.getDate();
  return (ayFark===0 && gunFark<0) ? yasRaw-1 : (ayFark<0 ? yasRaw-1 : yasRaw);
}

// ---------- harf–çakra eşlemesi (kullanıcının yüklediği tablo) ----------
var OG_SAYI_CAKRA_HARF = {1:['A','S','Ş','J'],2:['B','K','T'],3:['U','Ü','C','Ç','L'],4:['D','M','V'],5:['E','N'],6:['O','Ö','F'],7:['G','Ğ','P','Y'],8:['H','Z'],9:['I','İ','R']};
var OG_HARF_SAYI = {};
Object.keys(OG_SAYI_CAKRA_HARF).forEach(function(no){
  OG_SAYI_CAKRA_HARF[no].forEach(function(h){ OG_HARF_SAYI[h] = Number(no); });
});
function ogHarfSayisi(h){ return OG_HARF_SAYI[h] || null; }
function ogHarfleriTemizle(str){
  if(!str) return [];
  var up = str.toLocaleUpperCase('tr-TR');
  var out = [];
  for(var i=0;i<up.length;i++){ if(OG_HARF_SAYI[up[i]]) out.push(up[i]); }
  return out;
}

// ---------- Çakra Döngüsü teması (Kılavuz Bölüm 8) — 9 yıllık dönemler ----------
var OG_CAKRA_TEMA = {
  1:'Hayata uyanış, öğrenme, iletişim, temel ihtiyaçlar',
  2:'Sevgi, aşk, empati',
  3:'Tutku, ego, kendini ifade, mücadele',
  4:'Kök salma, yuva, güvence, para',
  5:'Değişim, deneyim, özgürlük, çözüm, heyecan',
  6:'Yeniden aşk, zevkler, sorumluluk, hayaller',
  7:'İçe dönüş, muhasebe, yalnızlaşma, ruhsallık',
  8:'Manevi hırsın bitişi, maddi güven, emeklilik, bereket',
  9:'Olgunluk, bilgelik, tamamlanma'
};
// Kullanıcı onayıyla netleşen kural: her döngü 9 yıl (1–9, 10–18, 19–27 … 73–81);
// 82 yaşından itibaren yeniden 1. döngüye dönülür.
function ogCakraDongusu(yas){
  var dongu = yas<=0 ? 1 : Math.ceil(yas/9);
  var tema = dongu<=9 ? dongu : ((dongu-1)%9)+1;
  var baslangic = (dongu-1)*9+1;
  var bitis = dongu*9;
  return {dongu:dongu, tema:tema, baslangic:baslangic, bitis:bitis, aciklama:OG_CAKRA_TEMA[tema]};
}

// ---------- Zirve/Mücadele dönem sınırları (Kılavuz Tablo 11, HA 1–9'a göre) ----------
var OG_HA_DONEM = {
  1:[[0,35],[36,44],[45,53],[54,999]],
  2:[[0,34],[35,43],[44,52],[53,999]],
  3:[[0,33],[34,42],[43,51],[52,999]],
  4:[[0,32],[33,41],[42,50],[51,999]],
  5:[[0,31],[32,40],[41,49],[50,999]],
  6:[[0,30],[31,39],[40,48],[49,999]],
  7:[[0,29],[30,38],[39,47],[48,999]],
  8:[[0,28],[29,37],[38,46],[47,999]],
  9:[[0,27],[28,36],[37,45],[46,999]]
};

// ---------- Büyük Yaşam Döngüsü — kendi 3 döngülük yaş sınırları (Zirve/Mücadele
// tablosuyla KARIŞTIRILMAZ; kullanıcının verdiği ayrı tablo, HA/Yaşam Yolu 1-9'a göre;
// 11→2'nin, 22→4'ün, 33→6'nın tablosuyla aynı aralıkları kullanır — bu eşleme zaten
// ogHayatAmaci()'nin tabloDegeri alanında yapılıyor) ----------
var OG_BYD_DONEM = {
  1:[[0,26],[27,53],[54,999]],
  2:[[0,25],[26,52],[53,999]],
  3:[[0,33],[34,60],[61,999]],
  4:[[0,32],[33,59],[60,999]],
  5:[[0,31],[32,58],[59,999]],
  6:[[0,30],[31,57],[58,999]],
  7:[[0,29],[30,56],[57,999]],
  8:[[0,28],[29,55],[56,999]],
  9:[[0,27],[28,54],[55,999]]
};

/* ============================================================
   1) KİŞİSEL YIL · AY · GÜN ENERJİLERİ  (Kılavuz Bölüm 3-4)
   ============================================================ */
function ogKisiselYilAyGun(DG,DA,DY,Y,M,G){
  // M ve/veya G null/undefined olabilir — kullanıcı yalnızca yıl (M,G yok) ya da
  // yıl+ay (G yok) girmiş olabilir. Bu durumda ilgili alt sonuçlar null döner ve
  // ekranda hiç gösterilmez; "bugünün ay/günü" ASLA yerine konmaz.
  var kyHam = DG + DA + ogDigitSum(Y);
  var kyKok = ogReduceA(kyHam);
  var ky22 = ogReduceC(kyHam);

  var result = {
    kisiselYil: {ham:kyHam, kok:kyKok},
    kisiselYil22: {ham:kyHam, deger:ky22},
    klasikAy: null, yy22Ay: null, gunY1: null, gunY2: null
  };

  if(!M) return result;

  var klasikAyHam = kyKok + M;
  var klasikAyKok = ogReduceA(klasikAyHam);
  var yy22AyHam = ky22 + M;
  var yy22Ay = ogReduceC(yy22AyHam);
  result.klasikAy = {ham:klasikAyHam, kok:klasikAyKok};
  result.yy22Ay = {ham:yy22AyHam, deger:yy22Ay};

  if(!G) return result;

  // Gün — Yöntem 1 (Klasik): Klasik Ay'ın KÖK sayısı + gün, tam indirgeme (Mod A).
  var gunY1KlasikHam = klasikAyKok + G;
  var gunY1Klasik = ogReduceA(gunY1KlasikHam);

  // Gün — Yöntem 1 (22'lik): Klasik Ay'ın BİLEŞİK (ham) değeri + gün, 22 arketip
  // indirgemesiyle (Mod C: 1-22 aynen korunur, >22 ise rakamları toplanarak indirilir).
  // NOT: Mod A (tek haneye indirme) ile KARIŞTIRILMAZ — 22 kendi başına geçerli bir
  // esas sonuçtur, 4'e indirgenmez.
  var gunY1BilesikHam = klasikAyHam + G;
  var gunY1BilesikDeger = ogReduceC(gunY1BilesikHam);
  var gunY1BilesikKok = ogReduceA(gunY1BilesikDeger);

  // Gün — Yöntem 2 (Klasik Ay/kişisel ay hesabından tamamen bağımsız):
  // A) Doğum tarihindeki tüm rakamlar toplanır; sonuç >9 ise rakamları YALNIZCA
  //    BİR KEZ daha toplanır (ör. 38→11; 11 iki haneli kalsa da tekrar indirgenmez).
  // B) İncelenen tarihteki tüm rakamlar toplanır; bu toplam HİÇ indirgenmeden bırakılır.
  // C) A ve B toplanır, nihai sonuç tam indirgemeyle (Mod A) bulunur.
  var dogumToplam = ogTarihRakamToplami(DG,DA,DY);
  var dogumToplamGosterim = dogumToplam>9 ? ogDigitSum(dogumToplam) : dogumToplam;
  var incelenenToplam = ogTarihRakamToplami(G,M,Y);
  var gunY2Toplam = dogumToplamGosterim + incelenenToplam;
  var gunY2Sonuc = ogReduceA(gunY2Toplam);

  result.gunY1 = {
    klasikHam:gunY1KlasikHam, klasik:gunY1Klasik,
    bilesikHam:gunY1BilesikHam, bilesikDeger:gunY1BilesikDeger, bilesikKok:gunY1BilesikKok
  };
  result.gunY2 = {dogumToplam:dogumToplam, dogumToplamGosterim:dogumToplamGosterim, incelenenToplam:incelenenToplam, toplam:gunY2Toplam, sonuc:gunY2Sonuc};
  return result;
}

/* ============================================================
   2) YILLIK ÖNGÖRÜ VE 22'LİK ENERJİ YORUMU  (Ek A)
   ============================================================ */
function ogEkABul(no){
  for(var i=0;i<OG_EK_A.length;i++){ if(OG_EK_A[i].no===no) return OG_EK_A[i]; }
  return null;
}

/* ============================================================
   3) DÜRTÜ HESABI VE AKTİF DÖNEM  (Kılavuz Bölüm 7 + yüklenen tablolar)
   Tablo mekanik olarak 18 yaşından başlayıp sıralı ilerliyor;
   basamak_no = yaş − 17 formülüyle üretiliyor (tablo verisiyle
   birebir örtüşüyor, ayrıca satır satır kodlamaya gerek yok).
   ============================================================ */
function ogDurtuHesapla(DG,DA,DY,yas){
  // Kılavuz örneği: 03.03 → 303 (gün baştaki sıfırı atılır, ay HER ZAMAN 2 haneli kalır: "3"+"03")
  var dgda = Number(String(DG) + String(DA).padStart(2,'0'));
  var urun = dgda * DY;
  var haneler = String(urun).split('');
  if(yas < 18){
    return {gecersiz:true, sebep:'Dürtü tablosu daima 18 yaşından başlar; incelenen yaş 18’in altında olduğu için hesaplanamaz.', urun:urun, haneSayisi:haneler.length};
  }
  // Yüklenen 6/7 haneli tablolar 18 yaşından başlayıp düzinelerce yaşı kapsıyor; ürünün hane
  // sayısı (6 veya 7) kadar bir DÖNGÜ oluşturup baştan tekrarlıyor. Doğrulama: 03.03.1970 için
  // ürün 303×1970=596910 (6 hane); kaynak "53 yaşında 0 dürtüsünde" diyor.
  // index = (53-18) mod 6 = 5 → haneler[5] = '0' ✓ kaynakla birebir eşleşti.
  var index = (yas - 18) % haneler.length;
  var basamakNo = index + 1;
  var rakam = Number(haneler[index]);
  var turNo = Math.floor((yas-18)/haneler.length) + 1;
  return {gecersiz:false, urun:urun, haneSayisi:haneler.length, basamakNo:basamakNo, turNo:turNo, rakam:rakam, anlam:OG_EK_C[String(rakam)]};
}

/* ============================================================
   4) HARF YANKISI VE AKTİF HARF DÖNEMİ
   Kural: 1. yaştan başlar; bitiş=başlangıç+değer−1; sonraki
   harf bitiş+1'de başlar; harfler biterse başa dönülür.
   ============================================================ */
function ogAktifHarf(harfler, yas){
  if(!harfler.length) return {aktif:null, tumDizi:[]};
  var dizi = [];
  var baslangic = 1;
  var bulunan = null;
  var guard = 0;
  var maxGuard = harfler.length * 40; // yeterince tur (en az birkaç yüz yıl kapsar)
  outer:
  while(guard < maxGuard){
    for(var i=0;i<harfler.length;i++){
      var h = harfler[i];
      var deger = ogHarfSayisi(h);
      var bitis = baslangic + deger - 1;
      var kayit = {harf:h, deger:deger, baslangic:baslangic, bitis:bitis, cakraNo:deger};
      dizi.push(kayit);
      if(yas>=baslangic && yas<=bitis && !bulunan) bulunan = kayit;
      baslangic = bitis + 1;
      guard++;
      if(bulunan && dizi.length > harfler.length) break outer; // bulunca bir tur daha tamamlayıp çık
    }
    if(bulunan) break;
  }
  return {aktif:bulunan, tumDizi:dizi};
}

/* ============================================================
   6) ZİRVE VE MÜCADELE  (Kılavuz Bölüm 10) — Klasik (Mod B) + 22 Arketip (Mod C)
   Doğrulama: 03.03.1970 için klasik zirve 6,11,8,11 / mücadele 0,5,5,5;
   22 arketip zirve 6,20,8,20 / mücadele 0,14,14,14 — kaynak örneğiyle birebir eşleşti.
   ============================================================ */
function ogHayatAmaci(DG,DA,DY){
  var ham = ogTarihRakamToplami(DG,DA,DY);
  var kok = ogReduceB(ham);
  var tabloDegeri = kok===11?2:(kok===22?4:(kok===33?6:kok));
  return {ham:ham, kok:kok, tabloDegeri:tabloDegeri};
}
function ogAktifDonemIndeksi(tabloDegeri, yas){
  var sinirlar = OG_HA_DONEM[tabloDegeri] || OG_HA_DONEM[ogReduceA(tabloDegeri)] || OG_HA_DONEM[1];
  for(var i=0;i<sinirlar.length;i++){
    if(yas>=sinirlar[i][0] && yas<=sinirlar[i][1]) return {index:i+1, aralik:sinirlar[i]};
  }
  return {index:4, aralik:sinirlar[3]};
}
function ogZirveMucadele(DG,DA,DY){
  var dyDigitSum = ogDigitSum(DY);
  // KLASİK
  var dyKokB = ogReduceB(dyDigitSum);
  var dgKokB = ogReduceB(DG);
  var daKokB = ogReduceB(DA);
  var Z1 = ogReduceB(dgKokB + daKokB);
  var Z2 = ogReduceB(dgKokB + dyKokB);
  var Z3 = ogReduceB(Z1 + Z2);
  var Z4 = ogReduceB(daKokB + dyKokB);

  var dgA = ogReduceA(DG), daA = ogReduceA(DA), dyA = ogReduceA(dyDigitSum);
  var M1 = Math.abs(dgA - daA);
  var M2 = Math.abs(dgA - dyA);
  var M3 = Math.abs(M1 - M2);
  var M4 = Math.abs(daA - dyA);

  // 22 ARKETİP
  var dyC = ogReduceC(dyDigitSum);
  var dgC = ogReduceC(DG);
  var daC = ogReduceC(DA);
  var Z1c = ogReduceC(dgC + daC);
  var Z2c = ogReduceC(dgC + dyC);
  var Z3c = ogReduceC(Z1c + Z2c);
  var Z4c = ogReduceC(daC + dyC);

  var M1c = Math.abs(dgC - daC);
  var M2c = Math.abs(dgC - dyC);
  var M3c = Math.abs(M1c - M2c);
  var M4c = Math.abs(daC - dyC);

  return {
    klasik: {Z:[Z1,Z2,Z3,Z4], M:[M1,M2,M3,M4]},
    arketip: {Z:[Z1c,Z2c,Z3c,Z4c], M:[M1c,M2c,M3c,M4c]}
  };
}

/* ============================================================
   7) BÜYÜK YAŞAM DÖNGÜSÜ  (Kılavuz Bölüm 11)
   Doğrulama: 03.03.1970 klasik 3/3/8, 22 arketip 3/3/17 — kaynakla birebir eşleşti.
   Aktif döngü, Yaşam Yolu/Hayat Amacı sayısına göre AYRI bir 3'lü yaş aralığı
   tablosuyla (OG_BYD_DONEM) belirlenir — Zirve/Mücadele'nin 4'lü OG_HA_DONEM
   tablosuyla KARIŞTIRILMAZ. 1.Döngü→Gençlik (doğum ayı), 2.Döngü→Erişkinlik
   (doğum günü), 3.Döngü→Bilgelik (doğum yılı rakam toplamı).
   ============================================================ */
function ogBuyukYasamDongusu(DG,DA,DY){
  var dyDigitSum = ogDigitSum(DY);
  return {
    klasik: {genclik:ogReduceB(DA), eriskinlik:ogReduceB(DG), bilgelik:ogReduceB(dyDigitSum)},
    arketip: {genclik:ogReduceC(DA), eriskinlik:ogReduceC(DG), bilgelik:ogReduceC(dyDigitSum)}
  };
}
function ogAktifBydAlani(donemIndex){
  return donemIndex===1 ? 'genclik' : (donemIndex===2 ? 'eriskinlik' : 'bilgelik');
}
// Büyük Yaşam Döngüsü'nün KENDİ 3'lü yaş aralığı tablosundan aktif döngüyü bulur.
// tabloDegeri: ogHayatAmaci().tabloDegeri (11→2, 22→4, 33→6 eşlemesi zaten yapılmış).
function ogAktifBydDonemi(tabloDegeri, yas){
  var sinirlar = OG_BYD_DONEM[tabloDegeri] || OG_BYD_DONEM[ogReduceA(tabloDegeri)] || OG_BYD_DONEM[1];
  for(var i=0;i<sinirlar.length;i++){
    if(yas>=sinirlar[i][0] && yas<=sinirlar[i][1]) return {index:i+1, aralik:sinirlar[i]};
  }
  return {index:3, aralik:sinirlar[2]};
}

/* ============================================================
   ANA HESAPLAMA — tüm alt bölümleri birleştirir
   ============================================================ */
function ogHesapla(DG,DA,DY,Y,M,G,harfler){
  // Y HER ZAMAN dolu (zorunlu). M ve/veya G null olabilir.
  // ayVar: kişisel ay / klasik ay gibi AYA ÖZGÜ sonuçlar için.
  // gunVar: gün yöntem 1/2 gibi GÜNE ÖZGÜ sonuçlar için (ay da gerektirir).
  var ayVar = !!M;
  var gunVar = !!(M && G);

  var bolum1 = ogKisiselYilAyGun(DG,DA,DY,Y,M,G);
  var ekAKarti = ogEkABul(bolum1.kisiselYil22.deger);

  // YILLIK ÇAKRA MERDİVENİ (klasik + 22 bazlı) — ana uygulamanın ÇALIŞAN
  // zamanAnaliziHesapla() fonksiyonu, seçilen "İncelenecek Yıl" (Y) ile birebir
  // aynı şekilde çağrılıyor (hiçbir formül yeniden yazılmadı). Ay/gün bu sonucu
  // ETKİLEMEZ — yalnızca Y kullanılır, tam tarih (M/G) girilse de girilmese de
  // aynı sonuç çıkar. Doğum merdiveni (klasik/22) de aynı çağrıdan gelir; bu
  // sayede kişinin doğum merdiveniyle seçilen yılın merdiveni karşılaştırılabilir.
  var yillikZA = zamanAnaliziHesapla(new Date(DY,DA-1,DG), new Date(), Y);

  // Yaş: Dürtü, Harf Yankısı, Çakra Döngüsü, Zirve/Mücadele, Büyük Yaşam
  // Döngüsü gibi bölümler AYIN/GÜNÜN kendisine değil, YAŞA bağlıdır — bu
  // yüzden bu bölümler yalnızca yıl girildiğinde de hesaplanabilir. Tam
  // tarih (Y+M+G) varsa doğum gününe göre TAM yaş kullanılır; yalnızca yıl
  // (M ve/veya G eksik) girildiyse "o yıl içinde ulaşılan yaş" (Y-DY)
  // kullanılır — ay/gün bilgisi olmadığından doğum günü sınırı uygulanamaz,
  // bu yaklaşık değer bu bölümlerin gösterilebilmesi için yeterlidir.
  var yas = gunVar ? ogYas(new Date(DY, DA-1, DG), new Date(Y, M-1, G)) : (Y - DY);

  var durtu = ogDurtuHesapla(DG,DA,DY,yas);
  var harfSonuc = ogAktifHarf(harfler, yas);
  var cakraDongu = ogCakraDongusu(yas);
  var ha = ogHayatAmaci(DG,DA,DY);
  var donem = ogAktifDonemIndeksi(ha.tabloDegeri, yas);
  var zm = ogZirveMucadele(DG,DA,DY);
  var byd = ogBuyukYasamDongusu(DG,DA,DY);
  // BYD'nin aktif döngüsü KENDİ 3'lü yaş tablosundan belirlenir (Zirve/Mücadele'nin
  // 4'lü dönem tablosuyla karıştırılmaz — bkz. ogAktifBydDonemi).
  var bydDonem = ogAktifBydDonemi(ha.tabloDegeri, yas);
  var bydAlan = ogAktifBydAlani(bydDonem.index);

  var aktifZ = zm.klasik.Z[donem.index-1];
  var aktifM = zm.klasik.M[donem.index-1];
  var aktifZc = zm.arketip.Z[donem.index-1];
  var aktifMc = zm.arketip.M[donem.index-1];
  var aktifByd = byd.klasik[bydAlan];
  var aktifBydC = byd.arketip[bydAlan];

  // 8) SENTEZ — tekrar eden kök sayılar. Ay/gün'e özgü kalemler yalnızca
  // ilgili veri varsa listeye eklenir; eksik veri sentezi engellemez.
  var sayilar = [
    {deger:bolum1.kisiselYil.kok, kaynak:'Kişisel Yıl'},
    {deger:cakraDongu.tema, kaynak:'Çakra Döngüsü teması'},
    {deger:ogReduceA(aktifZ), kaynak:'Aktif Zirve (kök)'},
    {deger:aktifM, kaynak:'Aktif Mücadele'},
    {deger:ogReduceA(aktifByd), kaynak:'Büyük Yaşam Döngüsü (kök)'}
  ];
  if(bolum1.klasikAy) sayilar.push({deger:bolum1.klasikAy.kok, kaynak:'Klasik Ay'});
  if(bolum1.gunY1) sayilar.push({deger:bolum1.gunY1.klasik, kaynak:'Gün (Yöntem 1, klasik)'});
  if(bolum1.gunY2) sayilar.push({deger:bolum1.gunY2.sonuc, kaynak:'Gün (Yöntem 2)'});
  if(!durtu.gecersiz) sayilar.push({deger:durtu.rakam, kaynak:'Dürtü'});
  if(harfSonuc.aktif) sayilar.push({deger:harfSonuc.aktif.cakraNo, kaynak:'Harf Yankısı çakrası'});

  var frekans = {};
  sayilar.forEach(function(s){
    var k = String(s.deger);
    if(!frekans[k]) frekans[k] = {deger:s.deger, adet:0, kaynaklar:[]};
    frekans[k].adet++;
    frekans[k].kaynaklar.push(s.kaynak);
  });
  var sentez = Object.keys(frekans).map(function(k){ return frekans[k]; })
    .filter(function(f){ return f.adet>=2; })
    .sort(function(a,b){ return b.adet-a.adet; });

  return {
    ayVar:ayVar, gunVar:gunVar, yas:yas, DG:DG, DA:DA, DY:DY, Y:Y, M:M, G:G,
    bolum1:bolum1, ekAKarti:ekAKarti, yillikZA:yillikZA, durtu:durtu, harfSonuc:harfSonuc,
    cakraDongu:cakraDongu, ha:ha, donem:donem, zm:zm, byd:byd, bydAlan:bydAlan, bydDonem:bydDonem,
    aktifZ:aktifZ, aktifM:aktifM, aktifZc:aktifZc, aktifMc:aktifMc,
    aktifByd:aktifByd, aktifBydC:aktifBydC, sentez:sentez
  };
}

/* ============================================================
   GÖRÜNTÜLEME
   ============================================================ */
function ogKv(label, val){
  return '<div class="kv"><div class="lab">'+label+'</div><div class="val">'+val+'</div></div>';
}
function ogMadList(arr){
  return '<ul style="margin:8px 0 0;padding-left:18px;color:var(--ink-soft);font-size:.88rem;">'+
    arr.map(function(m){ return '<li style="margin-bottom:4px;">'+m+'</li>'; }).join('') + '</ul>';
}
function ogRenderEkA(kart){
  if(!kart) return '<p style="color:var(--ink-soft);">Kaynakta bu değere ait kayıt bulunamadı.</p>';
  var satirlar = [
    ['Ana tema', kart.anaTema], ['Yılın hediyesi', kart.hediye], ['En doğru strateji', kart.strateji],
    ['İyi gelir', kart.iyiGelir], ['Yaratıcılık', kart.yaraticilik], ['Denge dersi', kart.dengeDersi],
    ['İlişki teması', kart.iliskiTemasi], ['Dikkat edilmesi gereken bağlar', kart.dikkatBaglar],
    ['Kritik ders', kart.kritikDers], ['Dikkat', kart.dikkat], ['Riskli taraf', kart.riskliTaraf],
    ['Sağlık odağı', kart.saglikOdagi], ['İş/para', kart.isPara], ['İlişkiler', kart.iliskiler]
  ].filter(function(p){ return p[1]; });
  return '<h4 style="margin:0 0 10px;color:var(--gold-lt);">'+kart.no+'. Enerji — '+kart.baslik+'</h4>'+
    '<div style="display:grid;gap:6px;font-size:.9rem;">'+
    satirlar.map(function(p){ return '<div><strong style="color:var(--ink-soft);">'+p[0]+':</strong> '+p[1]+'</div>'; }).join('') +
    '</div>';
}

function ogRenderCiktisi(r){
  var html = '';

  // 1) Kişisel Yıl/Ay/Gün
  html += '<div class="mod"><h3>1. Kişisel Yıl'+(r.bolum1.klasikAy?' · Ay':'')+(r.bolum1.gunY1?' · Gün':'')+' Enerjileri</h3><div class="kv-grid">';
  html += ogKv('Kişisel Yıl (Mod A)', r.bolum1.kisiselYil.ham+' / '+r.bolum1.kisiselYil.kok);
  html += ogKv('Kişisel Yıl 22\\'lik (Mod C)', r.bolum1.kisiselYil22.deger);
  if(r.bolum1.klasikAy){
    html += ogKv('Klasik Ay (Mod A)', r.bolum1.klasikAy.ham+' / '+r.bolum1.klasikAy.kok);
    html += ogKv('22\\'lik Ay (Mod C)', r.bolum1.yy22Ay.deger);
  }
  html += '</div>';
  if(!r.bolum1.klasikAy){
    html += '<div class="note" style="margin-top:14px;">ℹ️ Bu hesaplama için ay gereklidir.</div>';
  } else if(!r.bolum1.gunY1){
    html += '<div class="note" style="margin-top:14px;">ℹ️ Bu hesaplama için gün gereklidir.</div>';
  } else {
    html += '<h4 style="margin-top:18px;margin-bottom:10px;font-size:.85rem;color:var(--ink-soft);letter-spacing:.06em;text-align:center;">GÜNLÜK ENERJİLER</h4>';
    html += '<div class="tbl-wrap"><table class="hane">'+
      '<tr><th>Hesaplama Sistemi</th><th>Kullanılan İşlem</th><th>Sonuç</th></tr>'+
      '<tr><td>Klasik Gün — Yöntem 1</td><td>Ayın kökü + gün</td><td><span class="val">'+r.bolum1.gunY1.klasikHam+'/'+r.bolum1.gunY1.klasik+'</span></td></tr>'+
      '<tr><td>22\\'lik Gün — Yöntem 1</td><td>Ayın bileşik değeri + gün</td><td><span class="val">'+r.bolum1.gunY1.bilesikDeger+'/'+r.bolum1.gunY1.bilesikKok+'</span></td></tr>'+
      '<tr><td>Gün — Yöntem 2</td><td>Doğum tarihi değeri + incelenen tarih toplamı</td><td><span class="val">'+r.bolum1.gunY2.toplam+'/'+r.bolum1.gunY2.sonuc+'</span></td></tr>'+
      '</table></div>';
    html += '<details style="margin-top:10px;">'+
      '<summary style="cursor:pointer;font-size:.8rem;color:var(--ink-soft);">Hesaplama adımlarını göster</summary>'+
      '<div class="note" style="margin-top:8px;">'+
      '<strong>Klasik Gün — Yöntem 1:</strong> Klasik Ay kökü ('+r.bolum1.klasikAy.kok+') + gün = '+r.bolum1.gunY1.klasikHam+' → <strong>'+r.bolum1.gunY1.klasik+'</strong><br>'+
      '<strong>22\\'lik Gün — Yöntem 1:</strong> Klasik Ay bileşiği ('+r.bolum1.klasikAy.ham+') + gün = '+r.bolum1.gunY1.bilesikHam+' → <strong>'+r.bolum1.gunY1.bilesikDeger+'</strong>'+
      (r.bolum1.gunY1.bilesikDeger!==r.bolum1.gunY1.bilesikKok ? ' (kök: '+r.bolum1.gunY1.bilesikKok+')' : '')+'<br>'+
      '<strong>Gün — Yöntem 2:</strong> doğum tarihi değeri='+r.bolum1.gunY2.dogumToplamGosterim+' + incelenen tarih toplamı='+r.bolum1.gunY2.incelenenToplam+' = '+r.bolum1.gunY2.toplam+' → <strong>'+r.bolum1.gunY2.sonuc+'</strong>'+
      '</div></details>';
  }
  html += '</div>';

  // 2) Yıllık Öngörü
  html += '<div class="mod"><h3>2. Yıllık Öngörü ve 22\\'lik Enerji Yorumu</h3>';
  html += ogRenderEkA(r.ekAKarti);
  html += '</div>';

  // 3) Yıllık Çakra Merdiveni (Klasik + 22'lik) — İncelenecek Yıl'a göre, ana uygulamanın
  // çalışan zamanAnaliziHesapla() sonucundan; ay/gün bu bölümü etkilemez.
  html += '<div class="mod"><h3>3. '+r.Y+' Yıllık Çakra Merdiveni</h3>';
  html += '<div class="og-yillik-merdiven-grid">'+
    cakraAgaciPaneli(r.Y+' KLASİK YILLIK ÇAKRA MERDİVENİ', r.yillikZA.kisiselYilPiramit)+
    cakraAgaciPaneli(r.Y+' 22\\'LİK YILLIK ÇAKRA MERDİVENİ', r.yillikZA.kisiselYilPiramit22)+
    '</div>';
  html += '</div>';

  // 4) Dürtü
  html += '<div class="mod"><h3>4. Dürtü Hesabı ve Aktif Dönem</h3>';
  if(r.durtu.gecersiz){
    html += '<div class="note">⚠️ '+r.durtu.sebep+'</div>';
  } else {
    html += '<div class="kv-grid">';
    html += ogKv('Döngü Dürtü Kodu', r.durtu.urun);
    html += ogKv('Döngü Sayısı', r.durtu.turNo);
    html += ogKv('Dürtü Sayısı', r.durtu.rakam);
    html += '</div>';
    if(r.durtu.anlam) html += ogMadList(r.durtu.anlam);
  }
  html += '</div>';

  // 4) Harf Yankısı
  html += '<div class="mod"><h3>5. Harf Yankısı ve Aktif Harf Dönemi</h3>';
  if(!r.harfSonuc.aktif){
    html += '<div class="note">⚠️ Ad/soyad alanlarında harf-çakra tablosuyla eşleşen harf bulunamadı.</div>';
  } else {
    var a = r.harfSonuc.aktif;
    html += '<div class="kv-grid">';
    html += ogKv('Aktif Harf', a.harf);
    html += ogKv('Çakra No / Değer', a.cakraNo);
    html += ogKv('Etkili Yaş Aralığı', a.baslangic+'–'+a.bitis);
    html += '</div>';
    var sinifBilgi = OG_EK_D_SINIF[a.harf] || OG_EK_D_SINIF[a.harf+'-'+a.harf];
    var grupAnahtar = Object.keys(OG_EK_D_SINIF).find(function(k){ return k.split('-').indexOf(a.harf)>-1; });
    if(grupAnahtar) sinifBilgi = OG_EK_D_SINIF[grupAnahtar];
    if(sinifBilgi){
      html += '<p style="margin-top:12px;"><strong style="color:var(--gold-lt);">'+
        (sinifBilgi.sinif==='olumlu'?'Olumlu harf':sinifBilgi.sinif==='olumsuz'?'Olumsuz harf':'Nötr harf')+
        ':</strong> '+sinifBilgi.aciklama+'</p>';
    }
    var detayHarf = a.harf==='İ'?'I':(a.harf==='Ç'?'C':(a.harf==='Ğ'?'G':(a.harf==='Ö'?'O':(a.harf==='Ş'?'S':(a.harf==='Ü'?'U':a.harf)))));
    var detay = OG_EK_D_DETAY[detayHarf];
    if(detay) html += ogMadList(detay);
    html += '<h4 style="margin-top:18px;font-size:.85rem;color:var(--ink-soft);">Ad/Soyaddaki Tüm Harflerin Yaş Aralığı</h4>';
    html += '<div class="tbl-wrap"><table class="hane"><tr><th>Harf</th><th>Değer</th><th>Yaş Aralığı</th></tr>'+
      r.harfSonuc.tumDizi.map(function(d){
        var aktifMi = d===a;
        return '<tr'+(aktifMi?' style="background:var(--brand-soft);"':'')+'><td>'+d.harf+'</td><td>'+d.deger+'</td><td>'+d.baslangic+'–'+d.bitis+'</td></tr>';
      }).join('') + '</table></div>';
  }
  html += '</div>';

  // 5) Çakra Döngüsü
  html += '<div class="mod"><h3>6. Çakra Döngüsü</h3><div class="kv-grid">';
  html += ogKv('Döngü No', r.cakraDongu.dongu);
  html += ogKv('Yaş Aralığı', r.cakraDongu.baslangic+'–'+r.cakraDongu.bitis);
  html += ogKv('Çakra Teması', r.cakraDongu.tema);
  html += '</div><p style="margin-top:12px;color:var(--ink-soft);">'+r.cakraDongu.aciklama+'</p></div>';

  // 6) Zirve ve Mücadele
  html += '<div class="mod"><h3>7. Zirve ve Mücadele Dönemi</h3>';
  html += '<div class="kv-grid">';
  html += ogKv('Hayat Amacı (ham/kök)', r.ha.ham+' / '+r.ha.kok);
  html += ogKv('Aktif Dönem', r.donem.index+'. dönem ('+(r.donem.aralik[1]===999 ? r.donem.aralik[0]+'+' : r.donem.aralik[0]+'–'+r.donem.aralik[1])+' yaş)');
  html += '</div>';
  html += '<h4 style="margin-top:18px;margin-bottom:10px;font-size:.85rem;color:var(--ink-soft);letter-spacing:.06em;text-align:center;">AKTİF ZİRVE VE MÜCADELE DÖNEMİ</h4>';
  html += '<div class="tbl-wrap"><table class="hane">'+
    '<tr><th>Sistem</th><th>Aktif Zirve</th><th>Aktif Mücadele</th></tr>'+
    '<tr><td>Klasik Sistem</td><td><span class="val">'+r.aktifZ+'</span></td><td><span class="val">'+r.aktifM+'</span></td></tr>'+
    '<tr><td>22 Arketip Sistemi</td><td><span class="val">'+r.aktifZc+'</span></td><td><span class="val">'+r.aktifMc+'</span></td></tr>'+
    '</table></div>';
  html += '<h4 style="margin-top:22px;margin-bottom:10px;font-size:.85rem;color:var(--ink-soft);letter-spacing:.06em;text-align:center;">TÜM ZİRVE VE MÜCADELE DÖNEMLERİ</h4>';
  html += '<div class="tbl-wrap"><table class="hane">'+
    '<tr><th>Dönem</th><th>Klasik Zirve</th><th>Klasik Mücadele</th><th>22 Arketip Zirve</th><th>22 Arketip Mücadele</th></tr>'+
    [0,1,2,3].map(function(i){
      var aktifMi = (i+1)===r.donem.index;
      return '<tr'+(aktifMi?' class="og-aktif-donem"':'')+'><td>'+(i+1)+'. Dönem</td>'+
        '<td><span class="val">'+r.zm.klasik.Z[i]+'</span></td>'+
        '<td><span class="val">'+r.zm.klasik.M[i]+'</span></td>'+
        '<td><span class="val">'+r.zm.arketip.Z[i]+'</span></td>'+
        '<td><span class="val">'+r.zm.arketip.M[i]+'</span></td></tr>';
    }).join('') +
    '</table></div>';
  var zTemel = OG_ZIRVE_TEMEL[String(r.aktifZ)];
  var zDonem = OG_ZIRVE_DONEM[String(ogReduceA(r.aktifZ))];
  var mDonem = OG_MUCADELE[String(r.aktifM)];
  if(zTemel){ html += '<h4 style="margin-top:16px;font-size:.9rem;color:var(--gold-lt);">Zirve '+r.aktifZ+' — Temel Anlamlar</h4>'+ogMadList(zTemel); }
  if(zDonem){ html += '<h4 style="margin-top:16px;font-size:.9rem;color:var(--gold-lt);">Zirve Dönemi — '+zDonem.baslik+'</h4>'+ogMadList(zDonem.maddeler); }
  if(mDonem){ html += '<h4 style="margin-top:16px;font-size:.9rem;color:var(--gold-lt);">Mücadele '+r.aktifM+' — '+mDonem.baslik+'</h4>'+ogMadList(mDonem.maddeler); }
  html += '</div>';

  // 7) Büyük Yaşam Döngüsü — kendi 3'lü yaş aralığı tablosu (Zirve/Mücadele'den bağımsız)
  var bydDonemAdlari = ['Gençlik Döngüsü','Erişkinlik Döngüsü','Bilgelik Döngüsü'];
  var bydAlanEtiket = {genclik:'Gençlik Döngüsü', eriskinlik:'Erişkinlik Döngüsü', bilgelik:'Bilgelik Döngüsü'}[r.bydAlan];
  var bydSinirlar = OG_BYD_DONEM[r.ha.tabloDegeri] || OG_BYD_DONEM[ogReduceA(r.ha.tabloDegeri)] || OG_BYD_DONEM[1];
  var bydDegerler = [
    {klasik:r.byd.klasik.genclik, arketip:r.byd.arketip.genclik},
    {klasik:r.byd.klasik.eriskinlik, arketip:r.byd.arketip.eriskinlik},
    {klasik:r.byd.klasik.bilgelik, arketip:r.byd.arketip.bilgelik}
  ];
  html += '<div class="mod"><h3>8. Büyük Yaşam Döngüsü</h3><div class="kv-grid">';
  html += ogKv('Yaşam Yolu / Hayat Amacı', r.ha.ham+'/'+r.ha.kok);
  html += ogKv('İncelenen Tarihteki Yaş', r.yas);
  html += ogKv('Aktif Yaşam Döngüsü', r.bydDonem.index+'. Döngü — '+bydAlanEtiket);
  html += ogKv('Aktif Döngü Sayısı (Klasik/22)', r.aktifByd+' / '+r.aktifBydC);
  html += '</div>';
  html += '<h4 style="margin-top:22px;margin-bottom:10px;font-size:.85rem;color:var(--ink-soft);letter-spacing:.06em;text-align:center;">BÜYÜK YAŞAM DÖNGÜLERİ</h4>';
  html += '<div class="tbl-wrap"><table class="hane">'+
    '<tr><th>Döngü</th><th>Yaş Aralığı</th><th>Döngü Sayısı (Klasik)</th><th>Döngü Sayısı (22 Arketip)</th><th>Dönemin Adı</th><th>Durum</th></tr>'+
    [0,1,2].map(function(i){
      var aktifMi = (i+1)===r.bydDonem.index;
      var aralik = bydSinirlar[i][1]===999 ? bydSinirlar[i][0]+'+ yaş' : bydSinirlar[i][0]+'–'+bydSinirlar[i][1]+' yaş';
      return '<tr'+(aktifMi?' class="og-aktif-donem"':'')+'><td>'+(i+1)+'. Döngü</td><td>'+aralik+'</td>'+
        '<td><span class="val">'+bydDegerler[i].klasik+'</span></td>'+
        '<td><span class="val">'+bydDegerler[i].arketip+'</span></td>'+
        '<td>'+bydDonemAdlari[i]+'</td><td>'+(aktifMi?'Aktif':'Pasif')+'</td></tr>';
    }).join('') +
    '</table></div>';
  var bydTemel = OG_BYD[String(r.aktifByd)];
  if(bydTemel){ html += '<h4 style="margin-top:16px;font-size:.9rem;color:var(--gold-lt);">'+r.aktifByd+' — '+bydTemel.baslik+' (Aktif Döngünün Yorumu)</h4>'+ogMadList(bydTemel.maddeler); }
  html += '</div>';

  // 8) Sentez
  html += '<div class="mod"><h3>9. Tekrar Eden Sayıların Sentezi</h3>';
  if(!r.sentez.length){
    html += '<p style="color:var(--ink-soft);">Bu katmanlar arasında 2 veya daha fazla tekrar eden bir sayı bulunmadı.</p>';
  } else {
    html += r.sentez.map(function(f){
      var etiket = f.adet>=3 ? 'ANA VURGU' : 'DESTEK';
      var renk = f.adet>=3 ? 'var(--gold-lt)' : 'var(--ink-soft)';
      return '<div class="sonuc-box" style="margin-bottom:10px;"><h4 style="color:'+renk+';">'+etiket+' — Sayı '+f.deger+' ('+f.adet+' katmanda)</h4>'+
        '<p style="font-size:.85rem;">'+f.kaynaklar.join(' · ')+'</p></div>';
    }).join('');
  }
  html += '</div>';

  return html;
}

// Ay seçildiğinde/değiştiğinde Gün seçeneklerini (28/29/30/31) yeniden kur.
// Yıl bilgisi Şubat'ın gün sayısını (artık yıl) doğru belirlemek için kullanılır.
function ogGunSecenekleriniGuncelle(){
  var ay = document.getElementById('ogAy').value;
  var gunSel = document.getElementById('ogGun');
  var oncekiDeger = gunSel.value;
  if(!ay){
    gunSel.disabled = true;
    gunSel.innerHTML = '<option value="">Önce ay seçin</option>';
    return;
  }
  var yilStr = document.getElementById('ogYil').value;
  var yil = yilStr ? Number(yilStr) : new Date().getFullYear();
  var gunSayisi = new Date(yil, Number(ay), 0).getDate();
  var html = '<option value="">Seçiniz</option>';
  for(var g=1; g<=gunSayisi; g++){ html += '<option value="'+g+'">'+g+'</option>'; }
  gunSel.innerHTML = html;
  gunSel.disabled = false;
  if(oncekiDeger && Number(oncekiDeger)<=gunSayisi) gunSel.value = oncekiDeger;
}
document.getElementById('ogAy').addEventListener('change', ogGunSecenekleriniGuncelle);
document.getElementById('ogYil').addEventListener('input', function(){
  if(document.getElementById('ogAy').value) ogGunSecenekleriniGuncelle();
});

document.getElementById('ogBtn').addEventListener('click', function(){
  var ad1 = document.getElementById('ad1').value;
  var ad2 = document.getElementById('ad2').value;
  var soyad = document.getElementById('soyad').value;
  var esSoyad = document.getElementById('esSoyad').value;
  var dStr = document.getElementById('dtarih').value;
  var yilStr = document.getElementById('ogYil').value;
  var ayStr = document.getElementById('ogAy').value;
  var gunStr = document.getElementById('ogGun').value;
  var out = document.getElementById('ogOut');

  if(!dStr){
    out.classList.remove('show');
    alert('Öngörü için yukarıdaki "Doğum Tarihi" alanını doldurun.');
    return;
  }
  if(!yilStr){
    out.classList.remove('show');
    alert('Lütfen en az incelenecek yılı yazın');
    return;
  }
  var dParts = dStr.split('-');
  var DY = Number(dParts[0]), DA = Number(dParts[1]), DG = Number(dParts[2]);
  var Y = Number(yilStr);
  var M = ayStr ? Number(ayStr) : null;
  var G = (ayStr && gunStr) ? Number(gunStr) : null;

  if(Y < DY){
    out.classList.remove('show');
    alert('İncelenecek yıl, doğum yılından önce olamaz.');
    return;
  }
  if(M && G && new Date(Y,M-1,G) < new Date(DY,DA-1,DG)){
    out.classList.remove('show');
    alert('İncelenecek tarih, doğum tarihinden önce olamaz.');
    return;
  }

  var harfler = ogHarfleriTemizle((ad1||'')+(ad2||'')+(soyad||'')+(esSoyad||''));
  var sonuc = ogHesapla(DG,DA,DY,Y,M,G,harfler);

  out.innerHTML = ogRenderCiktisi(sonuc);
  out.classList.add('show');
});

</script>
</body>
</html>
`;
