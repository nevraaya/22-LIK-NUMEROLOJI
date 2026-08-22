/* ============================================================
   UYANIŞ · 10+22 — istemci render mantığı (herkese açık)
   ------------------------------------------------------------
   Bu dosyada GİZLİ / PREMİUM METİN YOKTUR. Yalnızca çizim ve
   render fonksiyonları bulunur. Yorum metinleri sunucu tarafında
   (api/uyanis-numeroloji.js) kademeye göre window.SAYI / window.KONUM
   içine enjekte edilir; doğru kademe açılmadan tarayıcıya inmez.

   Kademe (window.KADEME):
     0 = Ücretsiz  → sadece hesap (sayılar + adlar + ağaç + tablolar)
     1 = Temel Özet → ana hatlar (öz cümleleri, kısa okuma)
     2 = Premium   → tüm ayrıntı (hücre okumaları, matris, tam kartlar)
   ============================================================ */
(function () {
  'use strict';

  var SAYI = window.SAYI || {};
  var KONUM = window.KONUM || [];
  var KADEME = window.KADEME || 0;

  /* ---- yapısal veriler (gizli değil, burada durabilir) ---- */
  var KENAR = {
    1: [1, 3], 2: [1, 6], 3: [2, 3], 4: [2, 6], 5: [2, 4], 6: [3, 6],
    7: [3, 5], 8: [5, 6], 9: [4, 6], 10: [4, 7], 11: [4, 5], 12: [5, 8],
    13: [6, 7], 14: [6, 9], 15: [6, 8], 16: [7, 8], 17: [7, 9], 18: [7, 10],
    19: [8, 9], 20: [8, 10], 21: [9, 10], 22: [1, 2]
  };
  var KURE = KONUM.filter(function (k) { return k.tip === 'küre'; });
  var YOL = KONUM.filter(function (k) { return k.tip === 'yol'; });
  var KAD = function (i) { return (KURE[i - 1] || {}).ad || ('#' + i); };
  var SUTUN = { 'Merhamet': [2, 4, 7], 'Denge': [1, 6, 9, 10], 'Şiddet': [3, 5, 8] };

  /* ---- motor ---- */
  var ds = function (n) {
    return String(Math.abs(n)).split('').reduce(function (a, c) { return a + (+c); }, 0);
  };
  function R(n, y) { while (n > 22) n = (y === '2') ? n - 22 : ds(n); return n; }
  function hesapKure(g, a, yl, y, ego) {
    var r = function (n) { return R(n, y); };
    var K1 = r(a), K5 = r(g), K4 = r(yl);
    var K10 = r(K1 + K5 + K4), K6 = r(K1 + K5 + K4 + K10);
    var K3 = r(K1 + K5), K2 = r(K1 + K4), K8 = r(K10 + K5), K7 = r(K10 + K4);
    var K9 = (ego === 'b') ? r(K6 + K10) : r(K8 + K7);
    return { 1: K1, 2: K2, 3: K3, 4: K4, 5: K5, 6: K6, 7: K7, 8: K8, 9: K9, 10: K10 };
  }
  function hesapYol(kv, y) {
    var o = {};
    for (var n = 1; n <= 22; n++) { var e = KENAR[n]; o[n] = R(kv[e[0]] + kv[e[1]], y); }
    return o;
  }

  /* ---- hücre kompozisyonu (yalnızca KADEME 2'de anlamlı) ---- */
  function hucre(k, v) {
    var s = SAYI[v] || {};
    return {
      okuma: '<strong>' + (k.tam || k.ad) + '</strong> ' + (k.fiil || '') + '. Buraya düşen <strong>' + v + ' · ' + s.ad + '</strong>, bu işleyişe ' + (s.etki || '') + '. Bu alan artık ' + (s.bicim || '') + ' çalışır.',
      golge: 'Bu konumun kendi riski: ' + (k.golge || '') + '. ' + v + ' · ' + s.ad + ' bunun üzerine ' + (s.golge || '') + ' ekler. ' + (s.sinav || ''),
      oneri: (k.baglam || '') + ' ' + (s.oneri || ''),
      sembol: (k.astro === s.astro)
        ? 'Konumun ve sayının astrolojik karşılığı aynı: ' + k.astro + ' (' + (k.astroNot || '') + '). Sembolik katman da bu noktanın saflığını doğruluyor.'
        : (k.astro || '') + ' (' + (k.astroNot || '') + ') üzerinde ' + (s.astro || '') + ' etkisi.'
    };
  }

  /* ---- ağaç ---- */
  var P = {
    1: [310, 55], 2: [490, 150], 3: [130, 150], 4: [490, 310], 5: [130, 310],
    6: [310, 395], 7: [490, 480], 8: [130, 480], 9: [310, 565], 10: [310, 690]
  };
  var T = { 2: .42, 3: .30, 11: .30, 14: .30, 16: .30 };
  var LBL = {
    1: [310, 14, 'middle'], 2: [558, 155, 'start'], 3: [62, 155, 'end'],
    4: [558, 315, 'start'], 5: [62, 315, 'end'], 6: [310, 347, 'middle'],
    7: [558, 485, 'start'], 8: [62, 485, 'end'], 9: [310, 517, 'middle'],
    10: [310, 748, 'middle']
  };
  function cizAgac(kv, yv) {
    var sv = document.getElementById('d-tree'); if (!sv) return;
    var h = '', n, e, x, y, key, i;
    for (n = 1; n <= 22; n++) {
      e = KENAR[n];
      h += '<line class="edge" x1="' + P[e[0]][0] + '" y1="' + P[e[0]][1] + '" x2="' + P[e[1]][0] + '" y2="' + P[e[1]][1] + '"/>';
    }
    for (n = 1; n <= 22; n++) {
      e = KENAR[n]; var t = T[n] || .5;
      x = P[e[0]][0] + (P[e[1]][0] - P[e[0]][0]) * t;
      y = P[e[0]][1] + (P[e[1]][1] - P[e[0]][1]) * t;
      key = (yv[n] === n) ? ' key' : '';
      h += '<g class="hit" data-t="yol" data-n="' + n + '" role="button" tabindex="0"><title>' + n + ' · ' + (YOL[n - 1] || {}).ad + ' = ' + yv[n] + '</title>'
        + '<rect class="pbadge' + key + '" x="' + (x - 21) + '" y="' + (y - 9.5) + '" width="42" height="19" rx="9.5"/>'
        + '<text class="ptext" x="' + x + '" y="' + (y + 3.1) + '">' + n + ' / ' + yv[n] + '</text></g>';
    }
    for (i = 1; i <= 10; i++) {
      x = P[i][0]; y = P[i][1]; key = (kv[i] === i) ? ' key' : '';
      var lb = LBL[i];
      h += '<g class="hit" data-t="küre" data-n="' + i + '" role="button" tabindex="0"><title>' + i + ' · ' + KAD(i) + ' = ' + kv[i] + '</title>'
        + '<circle class="sef' + key + '" cx="' + x + '" cy="' + y + '" r="33"/>'
        + '<text class="sefnum" x="' + x + '" y="' + (y + 7) + '">' + kv[i] + '</text>'
        + '<text class="sefname" x="' + lb[0] + '" y="' + lb[1] + '" text-anchor="' + lb[2] + '">' + i + ' · ' + KAD(i) + '</text></g>';
    }
    sv.innerHTML = h;
  }

  /* ---- ana hesap (HERKESE AÇIK) ---- */
  var CUR = null;
  function calistir() {
    var g = +g_.value || 1, a = +a_.value || 1, yl = +y_.value || 1;
    var ym = ym_.value, eg = eg_.value;
    var kv = hesapKure(g, a, yl, ym, eg), yv = hesapYol(kv, ym);
    CUR = { kv: kv, yv: yv, g: g, a: a, yl: yl };
    try {
      localStorage.setItem('uyanis-dt', JSON.stringify({ g: g, a: a, yl: yl, ym: ym, eg: eg }));
    } catch (e) {}
    cizAgac(kv, yv);

    document.getElementById('d-kureler').innerHTML = KURE.map(function (k) {
      var v = kv[k.no], key = v === k.no;
      return '<tr class="clickable' + (key ? ' keyrow' : '') + '" data-t="küre" data-n="' + k.no + '"><td class="mono">' + k.no + '</td>'
        + '<td>' + k.ad + (key ? '<span class="pill">kilit</span>' : '') + '</td><td class="num">' + v + '</td>'
        + '<td>' + (SAYI[v] || {}).ad + '</td><td style="color:var(--ink3)">' + k.astro + '</td></tr>';
    }).join('');

    document.getElementById('d-yollar').innerHTML = YOL.map(function (k) {
      var v = yv[k.no], key = v === k.no, e = k.baglar;
      return '<tr class="clickable' + (key ? ' keyrow' : '') + '" data-t="yol" data-n="' + k.no + '"><td class="mono">' + k.no + '</td>'
        + '<td>' + k.ad + (key ? '<span class="pill">kilit</span>' : '') + '</td><td class="num">' + v + '</td>'
        + '<td>' + (SAYI[v] || {}).ad + '</td><td style="color:var(--ink3);font-size:13px">' + KAD(e[0]) + ' ↔ ' + KAD(e[1]) + '</td>'
        + '<td style="color:var(--ink3)">' + k.astro + '</td></tr>';
    }).join('');

    var hepsi = Object.values(kv).concat(Object.values(yv));
    var say = {}; hepsi.forEach(function (v) { say[v] = (say[v] || 0) + 1; });
    var sirali = Object.entries(say).map(function (p) { return [+p[0], p[1]]; })
      .sort(function (x, z) { return z[1] - x[1] || x[0] - z[0]; });
    var bos = []; for (var i = 1; i <= 22; i++) if (!say[i]) bos.push(i);
    var kilit = KURE.filter(function (k) { return kv[k.no] === k.no; }).map(function (k) { return k.ad + ' (' + k.no + ')'; })
      .concat(YOL.filter(function (k) { return yv[k.no] === k.no; }).map(function (k) { return k.no + '. yol · ' + k.ad; }));
    var bv = sirali[0][0], bc = sirali[0][1];

    document.getElementById('d-stats').innerHTML =
      '<div class="stat"><div class="k">Baskın sayı</div><div class="v">' + bv + '</div><div class="d">' + (SAYI[bv] || {}).ad + ' &middot; ' + bc + ' kez geçiyor</div></div>'
      + '<div class="stat"><div class="k">Kilit nokta</div><div class="v">' + kilit.length + '</div><div class="d">' + (kilit.length ? kilit.join(', ') : 'Bu haritada kilit nokta yok') + '</div></div>'
      + '<div class="stat"><div class="k">Kullanılan sayı</div><div class="v">' + (22 - bos.length) + ' / 22</div><div class="d">' + bos.length + ' sayı hiç geçmiyor</div></div>';

    var st = Object.entries(SUTUN).map(function (p) {
      return [p[0], p[1].reduce(function (t, i) { return t + kv[i]; }, 0)];
    });
    var mx = Math.max.apply(null, st.map(function (x) { return x[1]; }));
    document.getElementById('d-bars').innerHTML = st.map(function (p) {
      return '<div class="bar"><div class="t">' + p[0] + '</div><div class="track"><div class="fill" style="width:' + Math.round(p[1] / mx * 100) + '%"></div></div><div class="n">' + p[1] + '</div></div>';
    }).join('');
    document.getElementById('d-bosluk').innerHTML = bos.length
      ? '<strong>Hiç geçmeyen sayılar:</strong> ' + bos.map(function (i) { return i + ' · ' + (SAYI[i] || {}).ad; }).join(' &middot; ') + '. Bunlar eksiklik değil, dışarıdan öğrenilecek dersler olarak okunur.'
      : 'Yirmi iki sayının tamamı bu haritada geçiyor — çok ender bir dağılım.';

    yorumCiz();
  }

  /* ---- YORUM: kişiye özel okuma (kademeye göre) ---- */
  function satirOzet(k, v) {
    var s = SAYI[v] || {};
    var kilit = (v === k.no);
    return '<div class="orow"><div class="oh"><span class="on">' + v + '</span>'
      + '<span class="ot">' + (k.tip === 'küre' ? k.no + ' · ' + k.ad : k.no + '. yol · ' + k.ad)
      + (kilit ? '<span class="pill">kilit</span>' : '') + '</span>'
      + '<span class="os">' + s.ad + '</span></div>'
      + '<p>' + (k.ozet || '') + ' <strong>' + s.ad + ':</strong> ' + (s.oz || '') + '</p></div>';
  }
  function satirTam(k, v) {
    var c = hucre(k, v);
    var kilit = (v === k.no);
    var bil = '';
    if (k.tip === 'yol' && CUR) {
      var e = k.baglar, ham = CUR.kv[e[0]] + CUR.kv[e[1]];
      bil = '<p class="lbl">Sayının bileşimi</p><div class="formula">' + v + ' = ' + CUR.kv[e[0]] + ' + ' + CUR.kv[e[1]] + (ham > 22 ? '   (' + ham + ' → ' + v + ')' : '') + '\n'
        + CUR.kv[e[0]] + ' · ' + (SAYI[CUR.kv[e[0]]] || {}).ad + '   —  ' + KAD(e[0]) + '\n'
        + CUR.kv[e[1]] + ' · ' + (SAYI[CUR.kv[e[1]]] || {}).ad + '   —  ' + KAD(e[1]) + '</div>';
    }
    return '<article class="mrow"><div class="mh"><span class="mn">' + v + '</span>'
      + '<span class="mt">' + (k.tip === 'küre' ? k.no + ' · ' + k.ad : k.no + '. yol · ' + k.ad) + '</span>'
      + '<span class="ms">' + s_ad(v) + (kilit ? ' · kilit nokta' : '') + '</span></div>'
      + bil
      + '<p>' + c.okuma + '</p><p class="g">' + c.golge + '</p><p class="o">' + c.oneri + '</p>'
      + '<p class="ms" style="margin:0">' + c.sembol + '</p></article>';
  }
  function s_ad(v) { return v + ' · ' + ((SAYI[v] || {}).ad || ''); }

  function yorumOzetMetni() {
    var kv = CUR.kv, yv = CUR.yv;
    var hepsi = Object.values(kv).concat(Object.values(yv));
    var say = {}; hepsi.forEach(function (v) { say[v] = (say[v] || 0) + 1; });
    var sirali = Object.entries(say).map(function (p) { return [+p[0], p[1]]; })
      .sort(function (x, z) { return z[1] - x[1] || x[0] - z[0]; });
    var bv = sirali[0][0];
    var st = Object.entries(SUTUN).map(function (p) {
      return [p[0], p[1].reduce(function (t, i) { return t + kv[i]; }, 0)];
    }).sort(function (a, b) { return b[1] - a[1]; });
    var kilit = KURE.filter(function (k) { return kv[k.no] === k.no; }).map(function (k) { return k.ad; })
      .concat(YOL.filter(function (k) { return yv[k.no] === k.no; }).map(function (k) { return k.ad + ' yolu'; }));
    var h = '<div class="callout"><p class="eyebrow">Ana hatlar</p><p>';
    h += 'Haritanın baskın sayısı <strong>' + bv + ' · ' + (SAYI[bv] || {}).ad + '</strong> — ' + ((SAYI[bv] || {}).oz || '') + ' ';
    h += 'En ağır sütun <strong>' + st[0][0] + '</strong>, en hafif sütun <strong>' + st[st.length - 1][0] + '</strong>: ';
    h += st[0][0] === 'Merhamet' ? 'verme ve genişleme tarafın güçlü. '
      : st[0][0] === 'Şiddet' ? 'sınır koyma ve odaklanma tarafın güçlü. '
      : 'taşıyıcı eksenin, dengen güçlü. ';
    h += 'En hafif olan ' + st[st.length - 1][0] + ' sütunu çalışılacak alanın. ';
    h += kilit.length ? 'Kilit noktan var: <strong>' + kilit.join(', ') + '</strong> — saf, iki kat güçlü ve dengesiz enerji.' : 'Bu haritada kilit nokta yok; enerjin dengeli dağılmış.';
    h += '</p></div>';
    return h;
  }

  function yorumCiz() {
    var box = document.getElementById('yorum-icerik'); if (!box) return;
    if (!CUR) { box.innerHTML = ''; return; }
    if (KADEME < 1) { box.innerHTML = kilitKarti(1); return; }

    var h = yorumOzetMetni();
    if (KADEME === 1) {
      h += '<h3 class="sub">On küre — ana hatlar</h3><div class="olist">'
        + KURE.map(function (k) { return satirOzet(k, CUR.kv[k.no]); }).join('') + '</div>';
      h += '<h3 class="sub">Yirmi iki yol — ana hatlar</h3><div class="olist">'
        + YOL.map(function (k) { return satirOzet(k, CUR.yv[k.no]); }).join('') + '</div>';
      h += kilitKarti(2);
    } else { /* KADEME 2 */
      h += '<h3 class="sub">On küre — tam analiz</h3>'
        + KURE.map(function (k) { return satirTam(k, CUR.kv[k.no]); }).join('');
      h += '<h3 class="sub">Yirmi iki yol — tam analiz</h3>'
        + YOL.map(function (k) { return satirTam(k, CUR.yv[k.no]); }).join('');
    }
    box.innerHTML = h;
  }

  /* ---- kilit kartı (kademe yükseltme çağrısı) ---- */
  function kilitKarti(tier) {
    var baslik = tier === 1 ? 'Yorumu görmek için Kademe 1' : 'Tüm ayrıntı için Kademe 2 — Premium';
    var aciklama = tier === 1
      ? 'Haritanın ana hatları: baskın sayı, sütun dengesi, kilit noktalar ve her küre/yol için kısa öz okuma.'
      : 'Her konum için tam analiz: okuma, gölge, öneri ve sembolik katman; sayının bileşimi; 704 birleşimlik matris kütüphanesi.';
    return '<div class="kilit"><span class="klock">🔒</span>'
      + '<h3>' + baslik + '</h3><p>' + aciklama + '</p>'
      + '<button class="go klbtn" type="button" data-tier="' + tier + '">Kademe ' + tier + ' kilidini aç</button></div>';
  }

  /* ---- detay çekmecesi (kademeye göre) ---- */
  function ac(tip, no) {
    var k = KONUM.find(function (x) { return x.tip === tip && x.no === no; });
    if (!k) return;
    var v = CUR ? (tip === 'küre' ? CUR.kv[no] : CUR.yv[no]) : null;
    var key = v === no;
    var head =
      '<button class="dclose" type="button" data-close="1">Kapat</button>'
      + '<p class="eyebrow">' + (tip === 'küre' ? 'Küre' : 'Yol') + ' ' + no + (v ? ' &middot; sayı ' + v : '') + '</p>'
      + '<h3>' + (k.tam || k.ad) + (key ? '<span class="pill">kilit nokta</span>' : '') + '</h3>'
      + '<p class="ms mono" style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink3);margin-bottom:16px">'
      + k.astro + ' &middot; ' + (k.astroNot || '') + (k.baglar ? ' &middot; ' + KAD(k.baglar[0]) + ' ↔ ' + KAD(k.baglar[1]) : ' &middot; ' + (k.sutun || '') + ' sütunu') + '</p>';

    var body;
    if (KADEME < 1) {
      body = '<p style="font-size:16px;margin-bottom:16px">' + (SAYI[v] ? (SAYI[v].ad + ' sayısı bu konuma düştü.') : 'Bu konumun okuması kilitli.') + '</p>' + kilitKarti(1);
    } else if (KADEME === 1) {
      body = '<p style="font-size:16px;margin-bottom:16px">' + (k.ozet || '') + '</p>';
      if (k.soru) body += '<p class="lbl">Sorduğu sorular</p><p style="color:var(--ink2);font-size:14.5px;margin-bottom:16px">' + k.soru + '</p>';
      if (v && SAYI[v] && SAYI[v].oz) {
        body += '<hr class="rulebar" style="margin:18px 0"><p class="lbl">Buraya düşen sayı</p>'
          + '<p style="margin-bottom:8px"><strong>' + v + ' · ' + SAYI[v].ad + '</strong> — ' + SAYI[v].oz + '</p>';
      }
      body += kilitKarti(2);
    } else {
      var bil = '';
      if (v && tip === 'yol' && CUR) {
        var e = k.baglar, ham = CUR.kv[e[0]] + CUR.kv[e[1]];
        bil = '<p class="lbl">Sayının bileşimi</p><div class="formula">' + v + ' = ' + CUR.kv[e[0]] + ' + ' + CUR.kv[e[1]] + (ham > 22 ? '   (' + ham + ' → ' + v + ')' : '') + '\n'
          + CUR.kv[e[0]] + ' · ' + (SAYI[CUR.kv[e[0]]] || {}).ad + '   —  ' + KAD(e[0]) + '\n'
          + CUR.kv[e[1]] + ' · ' + (SAYI[CUR.kv[e[1]]] || {}).ad + '   —  ' + KAD(e[1]) + '</div>';
      }
      body = '<p style="font-size:16px;margin-bottom:16px">' + (k.ozet || '') + '</p>'
        + '<p class="lbl">Kapsamı</p><ul style="margin:4px 0 18px;padding-left:18px;color:var(--ink2);font-size:14.5px;line-height:1.55">'
        + (k.kapsam || []).map(function (x) { return '<li style="margin-bottom:5px">' + x + '</li>'; }).join('') + '</ul>'
        + '<p class="lbl">Sorduğu sorular</p><p style="color:var(--ink2);font-size:14.5px;margin-bottom:20px">' + (k.soru || '') + '</p>';
      if (v) {
        var c = hucre(k, v);
        body += '<hr class="rulebar" style="margin:20px 0">' + bil
          + '<p class="lbl">Okuma</p><p style="margin-bottom:14px">' + c.okuma + '</p>'
          + '<p class="lbl">Gölge</p><p style="color:var(--ink2);margin-bottom:14px">' + c.golge + '</p>'
          + '<p class="lbl">Öneri</p><p style="color:var(--accent-ink);border-left:2px solid var(--accent);padding-left:12px;margin-bottom:14px">' + c.oneri + '</p>'
          + '<p class="lbl">Sembolik katman</p><p style="color:var(--ink2)">' + c.sembol + '</p>';
      } else {
        body += '<p class="note">Bir sayı okuması görmek için önce harita hesapla.</p>';
      }
    }
    document.getElementById('dpanel').innerHTML = head + body;
    document.getElementById('drawer').classList.add('on');
  }
  function kapat() { document.getElementById('drawer').classList.remove('on'); }

  /* ---- referans listeleri (22 Sayı / 32 Konum) ---- */
  function refKartOzet(k) {
    return '<div class="ref"><div class="hd"><span class="no">' + k.no + '</span><span class="nm">' + k.ad + '</span></div>'
      + '<p class="as">' + k.astro + ' &middot; ' + (k.astroNot || '') + (k.baglar ? ' &middot; ' + KAD(k.baglar[0]) + ' ↔ ' + KAD(k.baglar[1]) : ' &middot; ' + (k.sutun || '')) + '</p>'
      + '<p class="oz">' + (k.ozet || '') + '</p></div>';
  }
  function refKartTam(k) {
    return '<div class="ref"><div class="hd"><span class="no">' + k.no + '</span><span class="nm">' + k.ad + '</span></div>'
      + '<p class="as">' + k.astro + ' &middot; ' + (k.astroNot || '') + (k.baglar ? ' &middot; ' + KAD(k.baglar[0]) + ' ↔ ' + KAD(k.baglar[1]) : ' &middot; ' + (k.sutun || '')) + '</p>'
      + '<p class="oz">' + (k.ozet || '') + '</p>'
      + '<dl><div><dt>Kapsamı</dt><dd><ul>' + (k.kapsam || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></dd></div>'
      + '<div><dt>Sorduğu sorular</dt><dd>' + (k.soru || '') + '</dd></div>'
      + '<div><dt>Kendi riski</dt><dd>' + capit(k.golge) + '.</dd></div></dl></div>';
  }
  function capit(s) { return s ? (s[0].toUpperCase() + s.slice(1)) : ''; }

  function kur() {
    var sList = document.getElementById('s-list');
    var kKure = document.getElementById('k-kure');
    var kYol = document.getElementById('k-yol');

    if (KADEME < 1) {
      if (sList) sList.innerHTML = kilitKarti(1);
      if (kKure) kKure.innerHTML = kilitKarti(1);
      if (kYol) kYol.innerHTML = '';
      return;
    }

    if (sList) {
      sList.innerHTML = Object.values(SAYI).map(function (s) {
        var extra = '';
        if (KADEME >= 2) {
          extra = '<dl><div><dt>Güçlü yanı</dt><dd>' + (s.arti || '') + '</dd></div>'
            + '<div><dt>Bir konuma düştüğünde</dt><dd>Bu işleyişe ' + (s.etki || '') + '; alan artık ' + (s.bicim || '') + ' çalışır.</dd></div>'
            + '<div><dt>Gölgesi</dt><dd>' + capit(s.golge) + '.</dd></div>'
            + '<div><dt>Sınavı</dt><dd>' + (s.sinav || '') + '</dd></div>'
            + '<div><dt>Önerisi</dt><dd>' + capit(s.oneri) + '</dd></div></dl>';
        } else {
          extra = '<dl><div><dt>Güçlü yanı</dt><dd>' + (s.arti || '') + '</dd></div></dl>';
        }
        return '<div class="ref"><div class="hd"><span class="no">' + s.no + '</span><span class="nm">' + s.ad + '</span></div>'
          + '<p class="as">' + s.astro + '</p><p class="oz">' + (s.oz || '') + '</p>' + extra + '</div>';
      }).join('');
      if (KADEME < 2) sList.insertAdjacentHTML('beforeend', kilitKarti(2));
    }
    var kartFn = KADEME >= 2 ? refKartTam : refKartOzet;
    if (kKure) kKure.innerHTML = KURE.map(kartFn).join('');
    if (kYol) kYol.innerHTML = YOL.map(kartFn).join('') + (KADEME < 2 ? kilitKarti(2) : '');

    // Sistem tablosu (sembolik katman) — herkese açık kısımlar
    var sg = document.getElementById('s-kuregez');
    if (sg) sg.innerHTML = KURE.map(function (k) {
      return '<tr><td>' + k.no + ' · ' + k.ad + '</td><td>' + k.astro + ' <span style="color:var(--ink3)">— ' + (k.astroNot || '') + '</span></td><td style="color:var(--ink3)">' + (k.sutun || '') + '</td></tr>';
    }).join('');
    var yb = document.getElementById('s-yolburc');
    if (yb) yb.innerHTML = YOL.map(function (k) {
      return '<tr><td>' + k.no + ' · ' + k.ad + '</td><td>' + k.astro + ' <span style="color:var(--ink3)">— ' + (k.astroNot || '') + '</span></td></tr>';
    }).join('');

    // matris seçicileri
    if (mk_) mk_.innerHTML = KONUM.map(function (k, i) { return '<option value="' + i + '">' + (k.tip === 'küre' ? 'Küre' : 'Yol') + ' ' + k.no + ' · ' + k.ad + '</option>'; }).join('');
    if (ms_) ms_.innerHTML = Object.values(SAYI).map(function (s) { return '<option value="' + s.no + '">' + s.no + ' · ' + s.ad + '</option>'; }).join('');
  }

  /* ---- sembolik katman tabloları (Sistem sekmesi, herkese açık) ---- */
  function sistemTablo() {
    var sg = document.getElementById('s-kuregez');
    if (sg && !sg.innerHTML) sg.innerHTML = KURE.map(function (k) {
      return '<tr><td>' + k.no + ' · ' + k.ad + '</td><td>' + k.astro + ' <span style="color:var(--ink3)">— ' + (k.astroNot || '') + '</span></td><td style="color:var(--ink3)">' + (k.sutun || '') + '</td></tr>';
    }).join('');
    var yb = document.getElementById('s-yolburc');
    if (yb && !yb.innerHTML) yb.innerHTML = YOL.map(function (k) {
      return '<tr><td>' + k.no + ' · ' + k.ad + '</td><td>' + k.astro + ' <span style="color:var(--ink3)">— ' + (k.astroNot || '') + '</span></td></tr>';
    }).join('');
  }

  /* ---- matris (yalnızca KADEME 2) ---- */
  function satirMatris(k, v, mod) {
    var c = hucre(k, v);
    var bas = mod === 'k' ? '<span class="mn">' + v + '</span><span class="mt">' + (SAYI[v] || {}).ad + '</span>'
      : '<span class="mn">' + v + '</span><span class="mt">' + (k.tam || k.ad) + '</span>';
    return '<article class="mrow"><div class="mh">' + bas + '<span class="ms">' + (mod === 'k' ? (SAYI[v] || {}).astro : k.astro) + '</span></div>'
      + '<p>' + c.okuma + '</p><p class="g">' + c.golge + '</p><p class="o">' + c.oneri + '</p>'
      + '<p class="ms" style="margin:0">' + c.sembol + '</p></article>';
  }
  function matris() {
    var out = document.getElementById('m-out'), cntEl = document.getElementById('m-count');
    if (!out) return;
    if (KADEME < 2) {
      if (cntEl) cntEl.innerHTML = '';
      out.innerHTML = kilitKarti(2);
      var ctl = document.getElementById('m-ctl'); if (ctl) ctl.style.display = 'none';
      return;
    }
    var mod = mm_.value;
    mkw_.style.display = mod === 'k' ? '' : 'none';
    msw_.style.display = mod === 's' ? '' : 'none';
    var o = '', cnt = '';
    if (mod === 'k') {
      var kk = KONUM[+mk_.value];
      cnt = '<strong>' + (kk.tam || kk.ad) + '</strong> — bu konuma düşebilecek 22 sayının tamamı.';
      for (var v = 1; v <= 22; v++) o += satirMatris(kk, v, 'k');
    } else {
      var vv = +ms_.value;
      cnt = '<strong>' + vv + ' · ' + (SAYI[vv] || {}).ad + '</strong> — bu sayının 32 konumdaki davranışı.';
      KONUM.forEach(function (k) { o += satirMatris(k, vv, 's'); });
    }
    cntEl.innerHTML = cnt;
    out.innerHTML = o;
  }

  /* ---- kilit modal ---- */
  function acModal(tier) {
    var m = document.getElementById('kilitModal'); if (!m) return;
    var t = document.getElementById('km-title');
    if (t) t.textContent = tier ? ('Kademe ' + tier + ' kilidini aç') : 'Kademe kilidini aç';
    document.getElementById('km-err').textContent = '';
    m.classList.add('on');
    setTimeout(function () { var i = document.getElementById('km-sifre'); if (i) i.focus(); }, 30);
  }
  function kapatModal() { var m = document.getElementById('kilitModal'); if (m) m.classList.remove('on'); }
  async function gonderSifre() {
    var inp = document.getElementById('km-sifre');
    var err = document.getElementById('km-err');
    var s = (inp.value || '').trim();
    if (!s) { err.textContent = 'Şifre girin.'; return; }
    err.textContent = 'Kontrol ediliyor…';
    try {
      var r = await fetch(location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: 'sifre=' + encodeURIComponent(s)
      });
      var j = await r.json().catch(function () { return {}; });
      if (j && j.ok) { location.reload(); return; }
      err.textContent = 'Şifre hatalı, tekrar deneyin.';
    } catch (e) {
      err.textContent = 'Bağlantı hatası, tekrar deneyin.';
    }
  }

  /* ---- bağlama ---- */
  var $ = function (id) { return document.getElementById(id); };
  var g_ = $('d-gun'), a_ = $('d-ay'), y_ = $('d-yil'), ym_ = $('d-yontem'), eg_ = $('d-ego');
  var mm_ = $('m-mod'), mk_ = $('m-k'), ms_ = $('m-s'), mkw_ = $('m-kwrap'), msw_ = $('m-swrap');

  // doğum tarihini geri yükle
  try {
    var saved = JSON.parse(localStorage.getItem('uyanis-dt') || 'null');
    if (saved) {
      if (saved.g) g_.value = saved.g; if (saved.a) a_.value = saved.a; if (saved.yl) y_.value = saved.yl;
      if (saved.ym) ym_.value = saved.ym; if (saved.eg) eg_.value = saved.eg;
    }
  } catch (e) {}

  if ($('d-go')) $('d-go').addEventListener('click', calistir);
  [g_, a_, y_, ym_, eg_].forEach(function (el) { if (el) el.addEventListener('change', calistir); });
  [mm_, mk_, ms_].forEach(function (el) { if (el) el.addEventListener('change', matris); });

  document.addEventListener('click', function (e) {
    var kb = e.target.closest ? e.target.closest('.klbtn') : null;
    if (kb) { acModal(+kb.dataset.tier); return; }
    if (e.target.id === 'km-gonder') { gonderSifre(); return; }
    if (e.target.id === 'km-kapat' || e.target.id === 'kilitModal') { kapatModal(); return; }
    if (e.target.dataset && e.target.dataset.close) { kapat(); return; }
    var t = e.target.closest ? e.target.closest('[data-t]') : null;
    if (t) { ac(t.dataset.t, +t.dataset.n); return; }
    if (e.target.id === 'drawer') { kapat(); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { kapat(); kapatModal(); }
    if (e.key === 'Enter' && document.getElementById('kilitModal').classList.contains('on')) { gonderSifre(); }
    if (e.key === 'Enter' || e.key === ' ') {
      var t = e.target.closest && e.target.closest('g[data-t]');
      if (t) { e.preventDefault(); ac(t.dataset.t, +t.dataset.n); }
    }
  });

  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + b.dataset.p); });
      window.scrollTo({ top: 0 });
    });
  });

  var tb = $('themebtn');
  if (tb) tb.addEventListener('click', function () {
    var r = document.documentElement;
    var cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    r.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
  });

  /* ---- init ---- */
  sistemTablo();
  kur();
  calistir();
  matris();

})();
