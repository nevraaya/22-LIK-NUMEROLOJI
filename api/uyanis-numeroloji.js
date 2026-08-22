// ============================================================
// /api/uyanis-numeroloji — UYANIŞ · 10+22 Hayat Ağacı Sayı Sistemi
// ------------------------------------------------------------
// HESAPLAMA HERKESE AÇIK. Yorum içeriği KADEMELİ ve ŞİFRE korumalı:
//   Kademe 0 (Ücretsiz) : sayılar + adlar + ağaç + tablolar
//   Kademe 1 (Temel Özet): ana hatlar / kısa öz okumalar
//   Kademe 2 (Premium)   : tüm ayrıntı — hücre okumaları, matris, tam kartlar
//
// Premium metin, doğru kademe HMAC imzalı çerezle doğrulanmadan
// tarayıcıya HİÇ gönderilmez: sunucu, tam veriyi kademeye göre kırpar.
// Şifreler ortam değişkeninden okunur (Vercel > Settings > Env Vars):
//   UYANIS_SIFRE_1, UYANIS_SIFRE_2, UYANIS_SESSION_SECRET
// ============================================================
const crypto = require('crypto');

const SIFRE1 = process.env.UYANIS_SIFRE_1 || '111';
const SIFRE2 = process.env.UYANIS_SIFRE_2 || '222';
const SECRET = process.env.UYANIS_SESSION_SECRET || 'nevraaya-uyanis-10-22-oturum-anahtari-2026';
const COOKIE_NAME = 'uyanis_oturum';
const YOL = '/uyanis-numeroloji';
const OTURUM_SURESI_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

function imzala(payload) {
  const h = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + h;
}
// Geçerli token'dan kademeyi döndürür (0 = geçersiz/yok)
function kademeCoz(token) {
  if (!token) return 0;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return 0;
  const payload = token.slice(0, idx);
  const imza = token.slice(idx + 1);
  const beklenen = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(imza), b = Buffer.from(beklenen);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return 0;
  const p = payload.split(':'); // "k:<tier>:<bitis>"
  if (p[0] !== 'k') return 0;
  const tier = parseInt(p[1], 10);
  const bitis = parseInt(p[2], 10);
  if (!Number.isFinite(bitis) || Date.now() >= bitis) return 0;
  return (tier === 1 || tier === 2) ? tier : 0;
}
function esitMi(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function cerezleriOku(header) {
  const out = {};
  (header || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  const search = (function () { try { return new URL(req.url, 'http://x').searchParams; } catch (e) { return new URLSearchParams(); } })();
  const cerezler = cerezleriOku(req.headers.cookie);
  const mevcutKademe = kademeCoz(cerezler[COOKIE_NAME]);

  // Çıkış
  if (search.get('logout') === '1') {
    res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=' + YOL + '; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    res.statusCode = 302; res.setHeader('Location', YOL); return res.end();
  }

  // Şifre gönderimi
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(body);
    const girilen = params.get('sifre') || '';
    let yeni = 0;
    if (esitMi(girilen, SIFRE2)) yeni = 2;
    else if (esitMi(girilen, SIFRE1)) yeni = 1;
    const jsonIster = (req.headers.accept || '').indexOf('application/json') > -1;

    if (yeni > 0) {
      const kademe = Math.max(yeni, mevcutKademe);
      const bitis = Date.now() + OTURUM_SURESI_MS;
      const token = imzala('k:' + kademe + ':' + bitis);
      res.setHeader('Set-Cookie', COOKIE_NAME + '=' + encodeURIComponent(token) + '; Path=' + YOL + '; HttpOnly; Secure; SameSite=Lax; Max-Age=' + Math.floor(OTURUM_SURESI_MS / 1000));
      if (jsonIster) {
        res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
        return res.end(JSON.stringify({ ok: true, kademe: kademe }));
      }
      res.statusCode = 302; res.setHeader('Location', YOL); return res.end();
    }
    if (jsonIster) {
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
      return res.end(JSON.stringify({ ok: false }));
    }
    res.statusCode = 302; res.setHeader('Location', YOL); return res.end();
  }

  // GET — sayfa herkese açık, kademeye göre veri enjekte edilir
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(sayfaUret(mevcutKademe));
};

// ============================================================
// VERİ (sunucu tarafı kaynak) — kademeye göre kırpılır
// ============================================================
const SAYI = {
  "1": { no: 1, ad: "Büyücü", astro: "Merkür", oz: "İradenin ve niyetin harekete geçtiği ilk kıvılcım.", arti: "Öncülük, mucitlik, sözün ve düşüncenin yaratıcı gücü. Kendi işini kendi kuran, talimat sevmeyen, her şeyi kendi öğrenen tip. Özgürlük hayati önemdedir.", etki: "başlatma gücü, irade ve sözün yaratıcılığını getirir", bicim: "kendi başına başlatarak ve söze dökerek", golge: "yalnız kendi önemini görme ya da tam tersi, kendine hiç inanmama", sinav: "Sınav, düşünceyi kontrol etmek ve başladığını bitirmektir.", oneri: "bir şeyi başlatmayı bekleme; küçük de olsa ilk adımı bugün at." },
  "2": { no: 2, ad: "Azize", astro: "Ay", oz: "Sessiz sezgi ve adanmışlık; kişisel iyiliğin ötesine geçen sevgi.", arti: "Arabulucu ve diplomat. Çevresindekinin ruh hâlini, gizli isteğini hisseder. Perde arkasından yönlendirir, öne çıkmaz. Doğadan ve hayvanlardan enerji alır.", etki: "sessiz sezgi, bekleme ve konuşmadan bilme niteliği katar", bicim: "sezerek ve acele etmeden", golge: "kararsızlık, kapalılık ve pasiflik", sinav: "Sınav, sezgiye güvenmek ve maskeyi çıkarmaktır.", oneri: "cevabı dışarıda aramadan önce bir süre sus ve içeriden geleni bekle." },
  "3": { no: 3, ad: "İmparatoriçe", astro: "Venüs", oz: "İlişki ve doğurganlık; soyut olanın bir bağ içinde biçime kavuşması.", arti: "Yüksek etkinlik ve doğurganlık, güzellik, duyusallık, maneviyat. Annelikle ve kadınsı güçle yakından bağlantılı. Düzen ve uyum arar, çoğu zaman kendi işini kurar.", etki: "doğurganlık, bereket ve biçim verme gücü kazandırır", bicim: "üreterek ve besleyerek", golge: "sahiplenme, aşırı kontrol ve insanları maddi ölçüyle değerlendirme", sinav: "Sınav, ne geçmişe ne geleceğe tutunmaktır.", oneri: "bir şey üret — ve ürettiğini bırakabildiğinden emin ol." },
  "4": { no: 4, ad: "İmparator", astro: "Koç", oz: "Otorite, düzen ve yasa; iradenin yapıya dönüşmesi.", arti: "Net fikir, kararlılık, disiplin ve sağlamlaştırma gücü. Kozmik düzeni ve evrensel yasayı kavrama kapasitesi. Kurduğu yapı ayakta kalır.", etki: "otorite, düzen ve yasa boyutu ekler", bicim: "kural koyarak ve sağlamlaştırarak", golge: "katılık, dayatma ve itaat ile isyan arasında salınma", sinav: "Sınav, ne zaman emredip ne zaman uyacağını bilmektir.", oneri: "yazılı olmayan kuralı yazılı hâle getir; belirsizlik burada güç kaybettirir." },
  "5": { no: 5, ad: "Aziz", astro: "Boğa", oz: "Üstün bilgiyle hayatı iyileştirmek; öğretmek ve oyunu hatırlamak.", arti: "Hayatta düzen ve ilke işler. Yüksek bilgiye erişim ve ömür boyu öğrenme. Doğuştan hatip; bilgiyi sözlü ya da yazılı aktarır. Işık yayan, doğal bilgeliği olan tip.", etki: "öğreti, ilke ve aktarma yükümlülüğü getirir", bicim: "öğrenerek ve öğreterek", golge: "eskimiş görüşe tutunma ve bilgiyi biriktirip paylaşmama", sinav: "Sınav, dinlemeyi öğrenmek ve kendi kuralını gözden geçirmektir.", oneri: "öğrendiğini birine anlat; anlatılmayan bilgi burada ağırlaşır." },
  "6": { no: 6, ad: "Âşıklar", astro: "İkizler", oz: "Özgür irade ve seçim; kalbi dinleyerek karar verme.", arti: "Koşulsuz sevgi ve bağ kurma kapasitesi. Yaramayandan uzaklaşabilme, yanılmaktan korkmadan karar alabilme. Her seçim aynı zamanda bir vazgeçiştir.", etki: "seçim ve kalpten karar verme zorunluluğu getirir", bicim: "seçerek — ve seçtiği için bir şeyi bırakarak", golge: "kararsızlık, ideal arayışı ve başkasının onayına bağımlılık", sinav: "Sınav, yanılmaktan korkmadan kendi kararını almaktır.", oneri: "iki iyi seçenek arasında kaldığında hangisini bıraktığına bak; asıl karar orada." },
  "7": { no: 7, ad: "Araba", astro: "Yengeç", oz: "Misyon, sorumluluk ve yön; iradenin çalışmaya dönüşmesi.", arti: "Bağımsız, sonuç odaklı, hareketi seven, cesur. Hedefini net bilir. Hareket temel ilkesidir; durgunluk ölümcüldür. İlginç ve olaylı bir kader verir.", etki: "misyon, sorumluluk ve harekete geçme yönü katar", bicim: "hareket ederek ve yön tutarak", golge: "hedefsizlik, dağınık eylem ve işleri bitirememe", sinav: "Sınav, hedef koymak ve durgunluğa düşmemektir.", oneri: "tıkandığında daha çok düşünme; fiziksel olarak yer değiştir." },
  "8": { no: 8, ad: "Adalet", astro: "Terazi", oz: "Denge kurma ve doğruyu tespit etme; aklın ve kalbin ortak kararı.", arti: "Sorumlu ve adil. Evrenin yasasını anlar, yüksek adalete inanır. Güçlü akıl ve sezgi; her şeyin dibine iner. Zayıfın yanında yer alır. Gerçekten çalışkandır.", etki: "tartı, karşılık ve neden–sonuç ölçüsü getirir", bicim: "ölçerek ve karşılığını arayarak", golge: "yargılama, küskünlük ve sebebi hep başkasında arama", sinav: "Sınav, tekrar eden olayları tesadüf saymamaktır.", oneri: "tekrar eden durumları not et; üçüncü tekrarda mesele karşı taraf değildir." },
  "9": { no: 9, ad: "Ermiş", astro: "Başak", oz: "Yalnızlıkta bulunan cevaplar; öz-yeterlilik ve kendine dönen sevgi.", arti: "Kendine yeten, Evrensel Bilgelikle bağlantılı. İnsanlar ona akıl danışmaya gelir. İyileştirme yeteneği vardır. Yalnızlıktan korkmaz. Derinlemesine yaklaşır, doğru tavsiye verir.", etki: "içe çekilme, süzme ve bilgeliğe dönüştürme niteliği katar", bicim: "yalnız kalıp süzerek", golge: "izolasyon, bilgiyi saklama ve bedeni, evi, görünüşü ihmal etme", sinav: "Sınav, çekilmeyi bir dönem olarak yaşayıp sığınağa çevirmemektir.", oneri: "yalnızlığı programa al; ama orada topladığını belli aralıklarla dışarı çıkar." },
  "10": { no: 10, ad: "Kader Çarkı", astro: "Jüpiter", oz: "Hayal, hareket ve değişim; arzunun gerçeğe dönüşme oranı.", arti: "Şanslı, kaderin gözdesi. Dilekler çabasız gerçekleşir. Girişken, sosyal, ilerici zihin. Kaderi parlak bir olay kaleydoskobudur. Evren düzenli olarak işaret gönderir.", etki: "akış, döngü ve zamanlama duygusu getirir", bicim: "işaretleri okuyarak ve döngüye uyarak", golge: "pasiflik, işaret bekleyip hareket etmeme ve geçmişe tutunma", sinav: "Sınav, çarkın kendiliğinden dönmediğini kabul etmektir.", oneri: "işareti beklerken küçük bir adım at; çark ancak itilirse döner." },
  "11": { no: 11, ad: "Güç", astro: "Aslan", oz: "Gücü şiddetsiz gösterme sanatı; özdenetimle taşınan kudret.", arti: "Güçlü enerji potansiyeli, büyük çalışma kapasitesi, dayanıklılık. Akım ve topluluk kurar. Adaletsizliğe tahammül etmez. Yenilgiye dirençli, asil.", etki: "dayanıklılık, özdenetim ve şiddetsiz kudret katar", bicim: "zorlamadan ve sabırla", golge: "dayatma, aşırı kontrol ve kendine dinlenme hakkı tanımama", sinav: "Sınav, gücü nazikçe taşımak ve pasifliğe düşmemektir.", oneri: "tepki ile cevap arasına bir gece koy; gücün orada birikir." },
  "12": { no: 12, ad: "Asılan Adam", astro: "Su", oz: "Değiştirilemeyeni kabul etmek; bakışı tersine çevirerek arınmak.", arti: "Sevgi, iyilik ve merhametle dolu. Bir misyonla hizmet eder. Yenilikçi, yaratıcı, çoğu zaman müzikal. Hayata daha çok merhamet getirme görevi taşır.", etki: "hizmet, teslimiyet ve bakışı tersine çevirme boyutu ekler", bicim: "bekleyerek ve açıyı değiştirerek", golge: "kurban rolü, hayır diyememe ve emeğinin karşılığını almayı reddetme", sinav: "Sınav, önce kendine vermeyi öğrenmektir.", oneri: "bir kez 'hayır' de ve ne olduğunu izle." },
  "13": { no: 13, ad: "Ölüm", astro: "Akrep", oz: "Bırakmak, affetmek ve duygunun döneminin bitmesi.", arti: "Çarpıcı değişimleri tetikler. Eski şeylere yeni hayat verir. Bilgelik, güç, zengin iç dünya ve hayal gücü. Sıklıkla gelişmiş sezgi. Uzun süre aynı durumda kalamaz.", etki: "bırakma, kapanış ve yeniden doğuş gücü getirir", bicim: "dönemi dolanı keserek", golge: "hem geçmişe hem geleceğe aynı anda tutunma", sinav: "Sınav, bırakışı zamanında ve öfkesiz yapmaktır.", oneri: "taşıdığın ölü bir yük varsa adını koy; adı konan yük hafifler." },
  "14": { no: 14, ad: "Denge", astro: "Yay", oz: "Duyguyu dengeleyip huzura ulaşmak; esneklik ve ölçü.", arti: "Aşırılıkları törpüler, dağınık gücü odaklı yaşama gücüne çevirir. İç disiplin kurar: ritim, ölçü, sabır, özdenetim. Şifa ve arınma süreçlerini yönetir.", etki: "ölçü, esneklik ve orta yol arayışı katar", bicim: "aşırıyı törpüleyerek ve ritim tutturarak", golge: "ölçüyü kaçırma, taşkınlık ile donukluk arasında salınma", sinav: "Sınav, sabırla ve süreç odaklı ilerlemektir.", oneri: "'hemen sonuç' baskısını bırak; küçük ve düzenli tekrar daha çok iş görür." },
  "15": { no: 15, ad: "Şeytan", astro: "Oğlak", oz: "Karanlık yanla yüzleşmek; bilinçdışını temizleyerek özgürleşmek.", arti: "Ham enerjiyi bilinçli güce çevirir. Maddeyi düşman değil araç olarak anlamayı öğretir. Yanılsamayı gerçekten ayırma kapasitesi. Zincirler fark edildiğinde çözülür.", etki: "gölgeyle yüzleşme ve bağımlılığı fark etme zorunluluğu getirir", bicim: "yanılsamayı gerçekten ayırarak", golge: "bağımlılık, takıntı ve zincirin gerçek olduğuna inanma", sinav: "Sınav, karanlığı bastırmak yerine görmektir.", oneri: "seni en çok rahatsız eden kişiye bak; orada kendi bakmadığın bir yanın var." },
  "16": { no: 16, ad: "Yıkılan Kule", astro: "Mars", oz: "Maskelerin düşmesi; krizlerle büyüyen kişilik.", arti: "Ruhsal liderlik, karizma, sözün gücü. Eski dünyanın yıkımı yoluyla uyanış. Sınavlar ruhu çelikleştirir; yıkımdan sonra dayanıklılık yeniden doğar.", etki: "sarsıntı, maskelerin düşmesi ve krizle büyüme getirir", bicim: "eskiyi yıkıp yeniden kurarak", golge: "kaotik eylem, pervasız risk ve enkaza tutunma", sinav: "Sınav, alanı kriz gelmeden temizlemektir.", oneri: "yapay bir şey taşıyorsan kendin bırak; bırakmazsan bir olay bıraktırır." },
  "17": { no: 17, ad: "Yıldız", astro: "Kova", oz: "Arzunun peşinden gitmek; yalnız çalışarak iyileşmek.", arti: "Bireysel yaratıcılık ve yalnız çalışabilme becerisi. İçeriden gelen ilham, iyileştirici vizyon. Kimsenin bakmadığı yerde üretebilme. Umudu şifaya çevirir.", etki: "umut, ilham ve iyileştirici bir vizyon katar", bicim: "yalnız çalışıp içeriden beslenerek", golge: "hayalcilik, gerçeklikten kopma ve istemekten utanma", sinav: "Sınav, umudu somut bir adımla beslemektir.", oneri: "ne istediğini yaz; adı konmamış arzu enerjiyi dağıtır." },
  "18": { no: 18, ad: "Ay", astro: "Balık", oz: "Sözsüz ifade ve ince enerjiler; arınması gereken korkular.", arti: "Derin iç dünya, canlı hayal gücü, imgesel hafıza. Doğuştan psikolog ve sezgisel. İnce enerjilere karşı hassasiyet. İmgelerle düşünme ve alanı maddileştirme yeteneği.", etki: "sezgi, ince enerjilere duyarlılık ve sözsüz algı getirir", bicim: "hissederek ve imgelerle düşünerek", golge: "korkular, yanılsama ve gerçek olmayan bir dünyaya kaçış", sinav: "Sınav, tekrar eden bir durumla sonuna kadar yüzleşmektir.", oneri: "bir his geldiğinde sor: bu bana mı ait, yoksa ortamdan mı aldım?" },
  "19": { no: 19, ad: "Güneş", astro: "Güneş", oz: "Dürüst iletişim ve birlikte çalışma; yansıtmanın ardındaki kendi gölgesi.", arti: "Berraklık, neşe ve canlılık. Zıtlıklar uyumlandığında ortaya çıkan açıklık. Kolektif içinde doğal bir merkez. İyileşmiş ve görünür hâle gelmiş benlik.", etki: "berraklık, dürüst iletişim ve neşe katar", bicim: "açıkça göstererek ve paylaşarak", golge: "ön yargı, gösteriş ve zıtlıkları uyumlayamama", sinav: "Sınav, başkası hakkındaki yargında kendi gölgeni görmektir.", oneri: "saklamaya çalıştığın şeyi bir kişiye söyle; ışık paylaşınca artıyor." },
  "20": { no: 20, ad: "Mahkeme", astro: "Ateş", oz: "İfade ve karmanın çözülmesi; beklenmedik olayla temiz sayfa açmak.", arti: "Duyular üstü algı ve soy hattının desteği. Bir kişinin ya da nesnenin enerjisini onarabilir. Denge, sakinlik, insan sevgisi ve yüksek yasaları kavrama.", etki: "uyanış, ifade ve karmanın çözülmesi boyutu ekler", bicim: "fark edip ifade ederek", golge: "kategorik yargı, aileye takıntı ya da köklerden tümüyle kopuş", sinav: "Sınav, duyduğun çağrıya zamanında cevap vermektir.", oneri: "ertelediğin bir cümle varsa söyle; ertelenen çağrı bir sonrakinde daha sert gelir." },
  "21": { no: 21, ad: "Dünya", astro: "Satürn", oz: "Dünyada neyi deneyimlemeye geldiğin; kendini gerçekleştirme.", arti: "Genişleme, barış ve yerleşiklik. Potansiyelin fiiliyata dönüşmesi. Tamamlanma ve bütünlük duygusu. Soyut olanın nihayet elle tutulur hâle gelmesi.", etki: "tamamlanma, maddi gerçekleşme ve yerleşiklik getirir", bicim: "sonuna kadar götürüp somutlaştırarak", golge: "tamamlanmayı sürekli erteleme ve genişleyememe", sinav: "Sınav, neye gerçekten ihtiyacın olduğunu dürüstçe saymaktır.", oneri: "yarım kalmış bir şeyi bitir; bütünlük ancak bitirmekle geliyor." },
  "22": { no: 22, ad: "Joker", astro: "Hava", oz: "Sezgi ve teslimiyetle ulaşılan yüce amaç; bırakmanın özgürlüğü.", arti: "Bağsızlık: hiçbir forma, role ya da sonuca yapışmama. Buna rağmen amacı gerçekleştirme özgürlüğü. Sıfır noktası — her şeyin yeniden başlayabileceği saf potansiyel.", etki: "özgürlük, bağsızlık ve sıfır noktasına dönebilme getirir", bicim: "hiçbir forma yapışmadan", golge: "dağınıklık, yönsüzlük ve hiçbir şeye ait olamama", sinav: "Sınav, bırakırken öğrenmeyi sürdürmektir.", oneri: "bir şeyi bıraktıktan sonra sor: bundan ne öğrendim?" }
};

const KONUM = [
  { tip: "küre", no: 1, ad: "İLAHİLİK", astro: "Neptün", astroNot: "ilahi bağ, sezgi, çözülme", sutun: "Denge", ozet: "Her şeyin çıktığı kaynak; henüz hiçbir şeye ayrışmamış saf potansiyel.", fiil: "kaynakla temas kurar ve hayatın en yüksek yönünü belirler", alan: "kader ve öz-ışık alanı", soru: "İlahi olanla bağını nereden kuruyorsun? Hayatının yönünü hangi görünmez pusula belirliyor?", golge: "bağ koptuğunda boşluğu değersizlikle karıştırma", baglam: "Manevi bağını kurarken", kapsam: ["Zamanın ve mekânın öncesinde duran bütünlük; her şey burada tohum hâlinde bekler.", "Kişinin Bütün'le kurduğu doğrudan bağ — mistik algının ve açıklanamayan bilmenin kapısı.", "Ruhun büyük planı: “Kim olmam gerekiyor?” sorusunun cevabı burada saklıdır.", "Kişiliğin altındaki değişmeyen çekirdek."], tam: "İLAHİLİK KÜRESİ", kisa: "İLAHİLİK" },
  { tip: "küre", no: 2, ad: "BİLGELİK", astro: "Uranüs", astroNot: "ani kavrayış, uyanış, özgünlük", sutun: "Merhamet", ozet: "İlk ayrışma; kaynağın belirsizliğinden çıkan berrak, özgün kavrayış.", fiil: "ani kavrayışla bilir ve özgün fikri getirir", alan: "sezgi ve özgünlük alanı", soru: "Öğrenmeden bildiğin şey ne? Kavrayışın nereden geliyor?", golge: "kavrayışı ifade etmeyip içeride biriktirme", baglam: "Kavrayışını kurarken", kapsam: ["Varlıklar arasındaki bağları görebilen bilinç — parçaları değil ilişkileri okur.", "Bağımsızlık ve özgünlük merkezi; ödünç fikirle yaşayamama hâli buradan gelir.", "Öğrenilmeden bilinen şey: ani kavrayış, kıvılcım, “nereden bildiğimi bilmiyorum” anları.", "Atalardan devralınan davranış kodu ve atılım gücü."], tam: "BİLGELİK KÜRESİ", kisa: "BİLGELİK" },
  { tip: "küre", no: 3, ad: "YARATICILIK", astro: "Satürn", astroNot: "yapı, zaman, sınır, kader", sutun: "Şiddet", ozet: "Sınırlayarak yaratan güç; biçimsiz olanı biçime sokan dişil zekâ.", fiil: "sınırlayarak yaratır ve biçimsiz olana form verir", alan: "yapı kurma alanı", soru: "Neyi biçime sokmaya geldin? Neyi dışarıda bırakman gerekiyor?", golge: "kurduğun yapıya fazla bağlanma ve devredememe", baglam: "Bir yapı kurarken", kapsam: ["Sınırlama burada engel değil, yaratıcı bir eylemdir: kaynağın sonsuzluğu daraltılmadan gerçeklik kurulamaz.", "Sabır ve zamanla olgunlaşan yapı.", "Anne hattından gelen dersler ve devralınan biçim verme biçimi.", "Bir şeyin ne zaman yeterince olgunlaştığını bilme kapasitesi."], tam: "YARATICILIK KÜRESİ", kisa: "YARATICILIK" },
  { tip: "küre", no: 4, ad: "SEVGİ", astro: "Jüpiter", astroNot: "genişleme, bereket, lütuf", sutun: "Merhamet", ozet: "Karşılıksız genişleme; kapsayan, büyüten ve merhamet eden güç.", fiil: "genişler, verir ve kapsar", alan: "cömertlik ve büyüme alanı", soru: "Neyi karşılıksız verebiliyorsun? Nerede genişliyorsun?", golge: "ölçüsüz verip kendi kabını boşaltma", baglam: "Verirken ve genişlerken", kapsam: ["Koşulsuz kabul ve merhamet; hesaba girmeden verebilme.", "İnanç, şans ve ruhsal genişleme kapasitesi.", "Bir şeyi büyütme, besleme ve alan açma gücü.", "Bolluğun kaynağı — ama ölçüsü olmayan bir bolluk kişiyi tüketir."], tam: "SEVGİ KÜRESİ", kisa: "SEVGİ" },
  { tip: "küre", no: 5, ad: "GÜÇ", astro: "Mars", astroNot: "irade, mücadele, arınma", sutun: "Şiddet", ozet: "Kesen, sınırlayan ve gereksizi ayıklayan irade.", fiil: "keser, sınırlar ve gereksizi ayıklar", alan: "irade ve sınır alanı", soru: "Neye hayır diyebiliyorsun? Gücünü nasıl kullanıyorsun?", golge: "gücü ya bastırma ya da sertlikle kullanma", baglam: "Sınırını çizerken", kapsam: ["Adaletin sert yüzü: fazlanın kesilmesi, yanlışın durdurulması.", "Cesaret, kararlılık ve gereğinde çatışabilme kapasitesi.", "Arınma — işe yaramayanın hayattan çıkarılması.", "Bu küre zayıfsa kişi sınır koyamaz; aşırıysa etrafını yakar."], tam: "GÜÇ KÜRESİ", kisa: "GÜÇ" },
  { tip: "küre", no: 6, ad: "BENLİK", astro: "Güneş", astroNot: "kimlik, kalp, hayat amacı", sutun: "Denge", ozet: "Ağacın merkezi; tüm yolların birleştiği kalp ve öz.", fiil: "her şeyi bir merkeze bağlar ve kimliği taşır", alan: "öz ve kimlik alanı", soru: "Sen kimsin? Hayatın neyin etrafında dönüyor?", golge: "merkezi dışarıya, başkasının onayına kaptırma", baglam: "Kendini ortaya koyarken", kapsam: ["Denge, öz, hakikat ve kalp bilinci — ruhun kendini tanıdığı yer.", "Sekiz yol buraya bağlanır; ağaçtaki en bağlantılı nokta budur.", "Hayat amacının ve kişisel bütünlüğün merkezi.", "Burası zayıfsa kişi kendini başkalarının gözünden tanımaya çalışır."], tam: "BENLİK KÜRESİ", kisa: "BENLİK" },
  { tip: "küre", no: 7, ad: "DUYGULAR", astro: "Venüs", astroNot: "aşk, çekim, estetik, değer", sutun: "Merhamet", ozet: "Arzu ve duyusal yaşamın alanı; çeken, isteyen ve güzelde karar kılan güç.", fiil: "ister, çeker ve hisseder", alan: "arzu ve çekim alanı", soru: "Neye çekiliyorsun? Neyi güzel buluyorsun ve neye değer veriyorsun?", golge: "hoşa gitme isteğiyle gerçeği yumuşatma", baglam: "Hissederken ve bağ kurarken", kapsam: ["Kişiyi istediğine doğru çeken tutku ve bedensel hazza açıklık.", "Estetik algı ve güzellik ihtiyacı — burada güzellik süs değil, bakımdır.", "Bağ kurma, değer verme ve seçici sevgi.", "Zafer: arzunun peşinden gidip onu gerçekleştirebilme."], tam: "DUYGULAR KÜRESİ", kisa: "DUYGULAR" },
  { tip: "küre", no: 8, ad: "ZİHİN", astro: "Merkür", astroNot: "akıl, analiz, iletişim", sutun: "Şiddet", ozet: "Düşünen, ayrıştıran ve dile döken akıl.", fiil: "düşünür, ayrıştırır ve dile döker", alan: "analiz ve iletişim alanı", soru: "Nasıl düşünüyorsun ve nasıl anlatıyorsun?", golge: "aşırı düşünme ve kararı sürekli erteleme", baglam: "Düşünme ve anlatma süreçlerinde", kapsam: ["Analiz, sınıflandırma ve kavramlaştırma kapasitesi.", "İletişim: yazı, konuşma, öğretme ve tartışma.", "Öğrenme biçimi ve bilgiyi işleme hızı.", "İhtişam: aklın kendi düzenini kurduğunda ortaya çıkan berraklık."], tam: "ZİHİN KÜRESİ", kisa: "ZİHİN" },
  { tip: "küre", no: 9, ad: "EGO", astro: "Ay", astroNot: "bilinçaltı, alışkanlık, imge", sutun: "Denge", ozet: "Bilinçaltının ve alışkanlıkların deposu; ruhla madde arasındaki köprü.", fiil: "hayal kurar, alışkanlık üretir ve gerçekliğe köprü olur", alan: "bilinçaltı ve alışkanlık alanı", soru: "Hangi alışkanlık seni yönetiyor? İç dünyanda ne dönüyor?", golge: "alışkanlığı kimlik sanma ve tekrarın içinde kalma", baglam: "Alışkanlıklarını ve iç dünyanı düzenlerken", kapsam: ["Vakıf, temel: üstteki her şey buraya yaslanır.", "Rüyalar, imgeler, içsel hafıza ve otomatik tepkiler.", "Kişinin dışarıya gösterdiği yüz ile içeride olan arasındaki geçiş.", "Burada temizlenmemiş bir kalıp, Beden küresinde olay olarak çıkar."], tam: "EGO KÜRESİ", kisa: "EGO" },
  { tip: "küre", no: 10, ad: "BEDEN", astro: "Dünya", astroNot: "madde, deneyim, kader sahnesi", sutun: "Denge", ozet: "Her şeyin maddeye indiği ve gerçek hayatta sınandığı yer.", fiil: "her şeyi maddeye indirir ve gerçek hayatta sınar", alan: "günlük hayat ve beden alanı", soru: "Bütün bunlar hayatında somut olarak nasıl görünüyor?", golge: "bildiğini hayata geçirmeden biriktirme", baglam: "Günlük hayatta ve bedeninde", kapsam: ["Krallık: fikrin, duygunun ve niyetin fiilen gerçekleştiği alan.", "Beden, sağlık, iş, para ve günlük düzen.", "Diğer dokuz kürenin sınav yeri — burada görünmeyen şey gerçekleşmemiş sayılır.", "Kaderin sahnesi: hayat burada olur."], tam: "BEDEN KÜRESİ", kisa: "BEDEN" },
  { tip: "yol", no: 1, ad: "BÜYÜCÜ", astro: "Merkür", astroNot: "iletişim, hız, zekâ", baglar: [1, 3], ozet: "İradenin ve niyetin harekete geçtiği ilk kıvılcım.", fiil: "niyeti harekete geçirir ve sezgiyle doğan fikri söze çevirir", alan: "başlatma ve yaratıcı söz alanı", soru: "Neyi başlatmaya niyetlisin? İçinden çıkan özgün fikir hangi konuda?", golge: "fikri hep içeride tutup hiç başlatmama", baglam: "Bir şeyi başlatırken", kapsam: ["İnisiyatif alma: bir şeyi başlatma cesareti ve o başlangıcı taşıyacak irade.", "Sözün yaratıcı gücü — düşüncenin dile, dilin gerçekliğe dönüşmesi.", "Yaratıcı kaynakla temas kurulduğunda içeriden çıkan özgün fikir.", "Bu fikir mantıkla değil sezgiyle gelir; akıl onu sonradan düzenler."], tam: "BÜYÜCÜ YOLU", kisa: "BÜYÜCÜ" },
  { tip: "yol", no: 2, ad: "AZİZE", astro: "Ay", astroNot: "döngü, sezgi, değişim", baglar: [1, 6], ozet: "Sessiz sezgi ve adanmışlık; kişisel iyiliğin ötesine geçen sevgi.", fiil: "konuşmadan bilir ve içindeki görülmeyen değeri taşır", alan: "sessiz sezgi ve adanmışlık alanı", soru: "Sezgini hangi enerji uyandırıyor? Kendi değerini nasıl fark edeceksin?", golge: "bildiğini söylemeyip içeride biriktirme", baglam: "Sezgini dinlerken", kapsam: ["Konuşmadan bilme hâli: bilginin sezgi yoluyla gelmesi.", "Evrensel sevgi — kendi çıkarını aşan, ortak iyiliğe yönelen bakış.", "Kendi değerini fark etme: içeride taşınan ama görülmeyen hazine.", "Birliğe dönme özlemi; ayrı düşmüşlük duygusunun uyandırdığı arayış."], tam: "AZİZE YOLU", kisa: "AZİZE" },
  { tip: "yol", no: 3, ad: "İMPARATORİÇE", astro: "Venüs", astroNot: "aşk, estetik, birlik", baglar: [2, 3], ozet: "İlişki ve doğurganlık; soyut olanın bir bağ içinde biçime kavuşması.", fiil: "soyut olanı bir bağ içinde doğurur", alan: "ilişki ve doğurganlık alanı", soru: "İlişkilerin hangi kalıptan besleniyor? Karşıt tarafları nasıl yönetiyorsun?", golge: "ilişki kalıbını sorgulamadan tekrarlama", baglam: "İlişki kurarken ve bir şey doğururken", kapsam: ["Fikrin, duygunun ya da projenin forma bürünmesi — soyut olanın doğması.", "Soyut zekâ: henüz görünmeyeni zihinde kurabilme kapasitesi.", "Anne babadan devralınan ilişki modeli — sevgiyi ve bağı nasıl kurduğumuz oradan gelir.", "Karşıt grupları, zıt tarafları bir arada tutma ve yönetme biçimi."], tam: "İMPARATORİÇE YOLU", kisa: "İMPARATORİÇE" },
  { tip: "yol", no: 4, ad: "İMPARATOR", astro: "Koç", astroNot: "irade, atılım, öncülük", baglar: [2, 6], ozet: "Otorite, düzen ve yasa; iradenin yapıya dönüşmesi.", fiil: "otorite kurar ve düzeni yasaya bağlar", alan: "otorite ve düzen alanı", soru: "Otoriteyle, babayla, erkek figürlerle bağın nasıl? Nereye hükmediyorsun?", golge: "otoriteyle ya çatışma ya da tümüyle teslim olma", baglam: "Otoriteyle ilişkinde", kapsam: ["Otoriteyle, babayla ve eril figürlerle kurulan bağ — hem dıştaki hem içteki otorite.", "Net fikir sahibi olunan, söz sahibi olunan alanlar.", "İtaat etme ile emir verme arasındaki denge; hangisinin ne zaman doğru olduğu.", "Kozmik düzenin ve evrensel yasaların nasıl algılandığı; disiplin ve sağlamlaştırma sınavı."], tam: "İMPARATOR YOLU", kisa: "İMPARATOR" },
  { tip: "yol", no: 5, ad: "AZİZ", astro: "Boğa", astroNot: "değer, süreklilik, beden", baglar: [2, 4], ozet: "Üstün bilgiyle hayatı iyileştirmek; öğretmek ve aynı zamanda oyunu hatırlamak.", fiil: "üstün bilgiyle hayatı iyileştirir ve öğretir", alan: "öğretmenlik ve kadim bilgi alanı", soru: "Üstün bilgiyle hayatı nasıl iyileştireceksin? Ne öğreteceksin?", golge: "öğretiyi ağırlaştırıp oyunu ve hafifliği kaybetme", baglam: "Öğrenirken ve öğretirken", kapsam: ["Elde edilen yüksek bilgiyle hayatı fiilen iyileştirme kapasitesi.", "Neyi öğreteceğimiz ve öğretinin ahlakla birlikte taşınması.", "Maskesiz doğa: rolleri bırakıp olduğu gibi görünebildiği alan.", "Eğlence, oyun ve ritüel — bilgiyi bedene ve hayata yerleştiren hafiflik."], tam: "AZİZ YOLU", kisa: "AZİZ" },
  { tip: "yol", no: 6, ad: "ÂŞIKLAR", astro: "İkizler", astroNot: "seçim, ikilik, bağlantı", baglar: [3, 6], ozet: "Özgür irade ve seçim; kalbi dinleyerek karar verme.", fiil: "kalbi dinleyerek seçer ve seçtiği için bir şeyi bırakır", alan: "özgür irade ve seçim alanı", soru: "Bir şeyi seçerken neyi bırakabiliyorsun? Sana yaramayandan uzaklaşabiliyor musun?", golge: "seçimi erteleyip her iki kapıyı açık tutma", baglam: "Seçim yaparken", kapsam: ["Kalbinden geçeni dinleyerek özgür iradeni hayata geçirme biçimi.", "Her seçimin bir vazgeçiş olduğu gerçeği: bir şeyi seçerken bir şeyi bırakma.", "Yaramayan şeyden uzaklaşabilme kapasitesi — bağlılıkları çözebilme.", "Yanılmaktan korkmadan kendi kararını alabilme becerisi."], tam: "ÂŞIKLAR YOLU", kisa: "ÂŞIKLAR" },
  { tip: "yol", no: 7, ad: "ARABA", astro: "Yengeç", astroNot: "koruma, taşıma, aidiyet", baglar: [3, 5], ozet: "Misyon, sorumluluk ve yön; iradenin çalışmaya dönüşmesi.", fiil: "misyonu üstlenir ve hız içinde iç sükûneti korur", alan: "misyon ve sorumluluk alanı", soru: "Misyonun ne? Hangi konuda harekete geçeceksin? Liderlik alanın nerede?", golge: "sorumluluğu tek başına taşımakta ısrar etme", baglam: "Sorumluluğunu taşırken", kapsam: ["Kişinin misyonu: taşımaya geldiği görev.", "Hedeflere ulaşmak için üstlenilen sorumluluk ve emek.", "Liderlik alanı: hangi konuda yönetmeye ve önden gitmeye çağrıldığı.", "Hız içinde iç sükûneti koruma; duyguyu kontrol ederek ilerleme."], tam: "ARABA YOLU", kisa: "ARABA" },
  { tip: "yol", no: 8, ad: "ADALET", astro: "Terazi", astroNot: "denge, ilişki, ölçü", baglar: [5, 6], ozet: "Denge kurma ve doğruyu tespit etme; aklın ve kalbin ortak kararı.", fiil: "aklı ve kalbi birlikte tartarak dengeyi kurar", alan: "adalet ve ölçü alanı", soru: "Adaleti nasıl sağlıyorsun? Hangi konuyu dengelemelisin?", golge: "adaleti yalnız kendi lehine tartma", baglam: "Dengeyi kurarken", kapsam: ["Adaletin nasıl sağlandığı — hem kendine hem başkasına karşı.", "Hangi konunun dengelenmesi gerektiği: fazlanın kesilip eksiğin tamamlanacağı yer.", "Doğruyu tespit etmek için akla başvurma yöntemi; basiret ve ölçü.", "Karma ilkesi: ekilenin biçildiği alan."], tam: "ADALET YOLU", kisa: "ADALET" },
  { tip: "yol", no: 9, ad: "ERMİŞ", astro: "Başak", astroNot: "ayıklama, hizmet, arınma", baglar: [4, 6], ozet: "Yalnızlıkta bulunan cevaplar; öz-yeterlilik ve kendine dönen sevgi.", fiil: "yalnızlıkta cevabı bulur ve kendine dönen sevgiyi öğrenir", alan: "yalnızlık ve öz-yeterlilik alanı", soru: "Yalnızlıkta hangi yanıtları buluyorsun? Kendini nasıl seveceksin?", golge: "yalnızlığı geçici bir dönem değil kalıcı sığınak yapma", baglam: "Yalnız kaldığın dönemlerde", kapsam: ["Yalnız kalındığında içeride bulunan yanıtlar — kalabalıkta duyulmayan ses.", "Kişiyi içeri baktıran olaylar: dış kapıların kapandığı, içerinin açıldığı dönemler.", "Kendini sevmeyi öğrenme; onay ihtiyacını içeriden karşılama.", "Bireysellik ve öz-yeterlilik: kimseye yaslanmadan durabilme."], tam: "ERMİŞ YOLU", kisa: "ERMİŞ" },
  { tip: "yol", no: 10, ad: "KADER ÇARKI", astro: "Jüpiter", astroNot: "genişleme, lütuf, şans", baglar: [4, 7], ozet: "Hayal, hareket ve değişim; arzunun gerçeğe dönüşme oranı.", fiil: "hayali harekete çevirir ve döngülere uyar", alan: "değişim ve zamanlama alanı", soru: "Neyi hayal ediyorsun ve onu ne kadar hissederek hayal ediyorsun?", golge: "işaret bekleyip hiç hareket etmeme", baglam: "Değişim ve hareket dönemlerinde", kapsam: ["Hayal edilen şey ve onu ne kadar hissederek hayal ettiğimiz — duygu yoğunluğu başarıyı belirler.", "Dış dünyadaki tüm hareket: seyahatler, yer değiştirmeler, ortam değişiklikleri.", "Döngüler ve zamanlama: kapının açıldığı ve kapandığı anlar.", "Gelecek yönü — kaderin nereye doğru döndüğü."], tam: "KADER ÇARKI YOLU", kisa: "KADER ÇARKI" },
  { tip: "yol", no: 11, ad: "GÜÇ", astro: "Aslan", astroNot: "kalp-kudret, cesaret", baglar: [4, 5], ozet: "Gücü şiddetsiz gösterme sanatı; özdenetimle taşınan kudret.", fiil: "ham içgüdüyü kalple terbiye eder ve gücü şiddetsiz gösterir", alan: "özdenetim ve şiddetsiz güç alanı", soru: "Nasıl sınır koyup gücünü gösteriyorsun? Durup düşünebiliyor musun?", golge: "harekete geçmeden önce durup düşünmeyi atlama", baglam: "Gücünü kullanırken", kapsam: ["Sınır koyma ve gücü ortaya koyma biçimi.", "Harekete geçmeden önce durup düşünme disiplini — tepki ile cevap arasındaki fark.", "Barışçıl ve şiddetten uzak bir güç gösterimi: bastırmadan, ezmeden hâkim olma.", "Ham içgüdünün kalp tarafından terbiye edilmesi."], tam: "GÜÇ YOLU", kisa: "GÜÇ" },
  { tip: "yol", no: 12, ad: "ASILAN ADAM", astro: "Su", astroNot: "arınma, teslimiyet, akış", baglar: [5, 8], ozet: "Değiştirilemeyeni kabul etmek; bakışı tersine çevirerek arınmak.", fiil: "değiştirilemeyeni kabul eder ve bakışı tersine çevirir", alan: "kabul ve arınma alanı", soru: "Geçmişte değiştiremeyeceğin ama arındırabileceğin ne var?", golge: "değişmeyecek bir şeyi değiştirmek için yıllar harcama", baglam: "Beklemek zorunda kaldığın yerde", kapsam: ["Geçmişten gelen ve değiştirilemeyecek olanlar — olmuş bitmiş olan.", "Onlarla yüzleşerek acı olayları arındırma imkânı: geçmiş silinmez ama temizlenir.", "Bakış açısını değiştirme zorunluluğu — aynı olaya baş aşağı bakabilme.", "Hangi konuda adanmak ve belirli dönemlerde beklemeyi seçmek gerektiği."], tam: "ASILAN ADAM YOLU", kisa: "ASILAN ADAM" },
  { tip: "yol", no: 13, ad: "ÖLÜM", astro: "Akrep", astroNot: "dönüşüm, derinlik, bitiş", baglar: [6, 7], ozet: "Bırakmak, affetmek ve duygunun döneminin bitmesi.", fiil: "işe yaramayanı bırakır ve duygunun dönemini kapatır", alan: "bırakma ve duygusal kapanış alanı", soru: "Neyi bırakman gerekiyor? Hangi kusurunu kabul edip kimi affedeceksin?", golge: "bırakışı erteleyip ölü yükü taşımaya devam etme", baglam: "Bir şeyi bırakırken", kapsam: ["İşe yaramayan ve bırakılması gereken şeyler — taşınmaya devam edilen ölü yükler.", "Buradaki kusurun kabul edilmesi: kendini haklı çıkarmadan görme.", "Hem başkalarını hem kendini affetme — bağışlama olmadan dönüşüm tamamlanmaz.", "Duyguların da bir dönemi vardır: değişirler ve sona ererler. Bu bir kayıp değil, doğal bir kapanıştır."], tam: "ÖLÜM YOLU", kisa: "ÖLÜM" },
  { tip: "yol", no: 14, ad: "DENGE", astro: "Yay", astroNot: "ölçü, vizyon, genişleme", baglar: [6, 9], ozet: "Duyguyu dengeleyip huzura ulaşmak; esneklik ve ölçü.", fiil: "duyguyu dengeler, kaygıyı yatıştırır ve esner", alan: "ölçü ve huzur alanı", soru: "Duygularını nasıl dengeliyorsun? Kaygıların hangi yönde?", golge: "dengeyi duyguyu bastırarak kurmaya çalışma", baglam: "Duygunu dengelerken", kapsam: ["Duyguların nasıl dengelendiği — taşkınla donukluk arasındaki orta yol.", "Kaygıların yönü ve onları yatıştırma yöntemi.", "Kaygıyı yatıştırınca benlikle kurulan bağ ve gelen huzur.", "Hangi durumda esnek olmak gerektiği: kırılmadan bükülebilme."], tam: "DENGE YOLU", kisa: "DENGE" },
  { tip: "yol", no: 15, ad: "ŞEYTAN", astro: "Oğlak", astroNot: "madde, yapı, sınav", baglar: [6, 8], ozet: "Karanlık yanla yüzleşmek; bilinçdışını temizleyerek özgürleşmek.", fiil: "karanlık yanla yüzleşir ve bilinçdışını temizler", alan: "gölge ve özgürleşme alanı", soru: "Karanlık yanların neler? Bağımlılıkların nerede?", golge: "gölgeyi başkasına yansıtıp kendinde görmeme", baglam: "Gölgenle yüzleşirken", kapsam: ["Hangi konuda dünyaya nesnel bakmak gerektiği — yanılsamayı gerçekten ayırma.", "Karanlık yanların ne olduğu: bastırılan, inkâr edilen, başkasına yansıtılan.", "Bilinçdışını fark etme ve temizleme süreci — önce görmek, sonra arıtmak.", "Bağımlılıklar: reddedildikçe büyüyen, kabul edildikçe küçülen bağlar."], tam: "ŞEYTAN YOLU", kisa: "ŞEYTAN" },
  { tip: "yol", no: 16, ad: "YIKILAN KULE", astro: "Mars", astroNot: "sarsıntı, arınma, ateş", baglar: [7, 8], ozet: "Maskelerin düşmesi; krizlerle büyüyen kişilik.", fiil: "maskeyi düşürür ve krizle büyütür", alan: "sarsıntı ve hakikat alanı", soru: "İlişkilerde hangi maskeleri takıyorsun? Nerede krizlerle büyüyeceksin?", golge: "yıkımı beklemek için gerçek olmayan bir yapıyı sürdürme", baglam: "Kriz ve sarsıntı dönemlerinde", kapsam: ["Başkalarıyla ilişkide takılan maskeler — hangi yüzün kime gösterildiği.", "Hangi konuda kendini olduğun gibi kabul etmen gerektiği.", "Hangi alanda krizlerle büyüyeceğin: sarsıntının öğretici olduğu bölge.", "Yapay kişilik inşası ve o yapı çöktüğünde ortaya çıkan hakikat."], tam: "YIKILAN KULE YOLU", kisa: "YIKILAN KULE" },
  { tip: "yol", no: 17, ad: "YILDIZ", astro: "Kova", astroNot: "özgünlük, vizyon, yenilik", baglar: [7, 9], ozet: "Arzunun peşinden gitmek; yalnız çalışarak iyileşmek.", fiil: "arzunun peşinden gider ve yalnız çalışarak iyileşir", alan: "arzu ve şifa alanı", soru: "Arzularının peşinden nasıl gitmelisin? Seni gerçekten ne iyileştiriyor?", golge: "istemekten utanıp arzuyu adlandırmama", baglam: "Arzunun peşinden giderken", kapsam: ["Arzuların peşinden nasıl gidileceği — istemekten utanmama.", "Bireysel yaratıcılık ve yalnız çalışabilme becerisi.", "Fazla hayalci olunmaması gereken konular — umudun gerçeklikten kopma riski.", "Kişiyi gerçekten iyileştiren konular: şifanın hangi kapıdan geldiği."], tam: "YILDIZ YOLU", kisa: "YILDIZ" },
  { tip: "yol", no: 18, ad: "AY", astro: "Balık", astroNot: "sezgi, çözülme, geçirgenlik", baglar: [7, 10], ozet: "Sözsüz ifade ve ince enerjiler; arınması gereken korkular.", fiil: "hissettiğini sözsüz dışa vurur ve ince enerjileri okur", alan: "sezgi ve arınma alanı", soru: "Hissettiklerini sözsüz nasıl dışa vuruyorsun? Hangi korkulardan arınmalısın?", golge: "başkasının yükünü kendi duygusu sanma", baglam: "Sezgin açıkken", kapsam: ["Hissedilenin sözsüz dışa vurumu: beden dili, bakış, sessizlik, atmosfer.", "İnce enerjilere karşı hassasiyet — ortamı, kişileri, niyetleri hissedebilme.", "Arınması gereken korkular; taşınan ama sahip olunmayan yükler.", "İyileştirici, koruyucu ve dönüştürücü niyet gücü."], tam: "AY YOLU", kisa: "AY" },
  { tip: "yol", no: 19, ad: "GÜNEŞ", astro: "Güneş", astroNot: "kimlik, berraklık, canlılık", baglar: [8, 9], ozet: "Dürüst iletişim ve birlikte çalışma; yansıtmanın ardındaki kendi gölgesi.", fiil: "dürüst iletişim kurar ve zıtlıkları uyumlar", alan: "iletişim ve ortak çalışma alanı", soru: "Çevrenle nasıl dürüst iletişim kuruyorsun? Ön yargın sana neyi gösteriyor?", golge: "söylenmesi gerekeni söylemeyip bedelini sonra ödeme", baglam: "İletişim ve ortak çalışmada", kapsam: ["Çevreyle dürüst iletişim kurma biçimi — söylenmeyenlerin bedeli.", "Kolektif çalışma tarzı: ekip içinde nasıl var olunduğu.", "Yakın ilişki kurma biçimi; zıtlıkların bir arada uyumlanması.", "Başkaları hakkındaki ön yargıların aslında kendi karanlık yanının yansıması olduğu."], tam: "GÜNEŞ YOLU", kisa: "GÜNEŞ" },
  { tip: "yol", no: 20, ad: "MAHKEME", astro: "Ateş", astroNot: "uyanış, ruh, kıvılcım", baglar: [8, 10], ozet: "İfade ve karmanın çözülmesi; beklenmedik olayla temiz sayfa açmak.", fiil: "ifade eder, karmayı çözer ve temiz sayfa açar", alan: "ifade ve yeni sayfa alanı", soru: "Sözlü ve yazılı olarak neyi, nasıl ifade ediyorsun?", golge: "çağrıyı duyup cevabı yıllara yayma", baglam: "Kendini ifade ederken", kapsam: ["Sözlü, yazılı ve bilimsel olarak neyi ve nasıl ifade ettiğimiz.", "İletişim şeklinin bütünü: kime, hangi dille, hangi mesafeden.", "Beklenmedik olaylara verilen tepki ve onlardan çıkarılan ders.", "Yeni bir temiz sayfa açma kapasitesi ve bununla karmanın çözülmesi."], tam: "MAHKEME YOLU", kisa: "MAHKEME" },
  { tip: "yol", no: 21, ad: "DÜNYA", astro: "Satürn", astroNot: "form, karma, tamamlanma", baglar: [9, 10], ozet: "Dünyada neyi deneyimlemeye geldiğin; kendini gerçekleştirme.", fiil: "kendini gerçekleştirir ve soyut olanı elle tutulur hâle getirir", alan: "deneyim ve tamamlanma alanı", soru: "Dünya üzerinde neyi deneyimlemeye geldin? Var olabilmek için neye ihtiyacın var?", golge: "tamamlanmayı hep bir sonraki şarta erteleme", baglam: "Bir şeyi tamamlarken", kapsam: ["Bu hayatta deneyimlemeye gelinen asıl konu.", "Kendini gerçekleştirme yolu — potansiyelin fiiliyata dönüşmesi.", "Dünyada var olabilmek için gerçekten neye ihtiyaç duyulduğu.", "Tamamlanma ve bütünlük duygusu; maddi gerçekleşme."], tam: "DÜNYA YOLU", kisa: "DÜNYA" },
  { tip: "yol", no: 22, ad: "JOKER", astro: "Hava", astroNot: "nefes, potansiyel, sıfır", baglar: [1, 2], ozet: "Sezgi ve teslimiyetle ulaşılan yüce amaç; bırakmanın özgürlüğü.", fiil: "sezgi ve teslimiyetle yüce amaca yönelir", alan: "teslimiyet ve özgürlük alanı", soru: "Ulaşman gereken yüce amaç ne? Neyi ilahi yasalara bırakmalısın?", golge: "teslimiyeti kaçışla karıştırma", baglam: "Bırakman gereken yerde", kapsam: ["Sezgi ve teslimiyetle ulaşılması gereken yüce hizmet ve amaç.", "Sabırla ilahi yasalara bırakılması gereken konular — zorlamanın işe yaramadığı alanlar.", "Bağsızlık: hiçbir forma, role ya da sonuca yapışmama hâli.", "Sıfır noktası: her şeyin yeniden başlayabileceği saf potansiyel."], tam: "JOKER YOLU", kisa: "JOKER" }
];

// Kademeye göre veri kırpma — premium alanlar yalnızca izin verilen kademede gider
function sayiKademe(tier) {
  const o = {};
  Object.keys(SAYI).forEach(function (k) {
    const s = SAYI[k];
    const e = { no: s.no, ad: s.ad, astro: s.astro };
    if (tier >= 1) { e.oz = s.oz; e.arti = s.arti; }
    if (tier >= 2) { e.etki = s.etki; e.bicim = s.bicim; e.golge = s.golge; e.sinav = s.sinav; e.oneri = s.oneri; }
    o[k] = e;
  });
  return o;
}
function konumKademe(tier) {
  return KONUM.map(function (k) {
    const e = { tip: k.tip, no: k.no, ad: k.ad, astro: k.astro, astroNot: k.astroNot };
    if (k.sutun) e.sutun = k.sutun;
    if (k.baglar) e.baglar = k.baglar;
    if (tier >= 1) { e.ozet = k.ozet; e.soru = k.soru; }
    if (tier >= 2) { e.fiil = k.fiil; e.alan = k.alan; e.golge = k.golge; e.baglam = k.baglam; e.kapsam = k.kapsam; e.tam = k.tam; e.kisa = k.kisa; }
    return e;
  });
}

// ============================================================
// SAYFA (kabuk) — CSS + HTML + veri enjeksiyonu
// ============================================================
function sayfaUret(tier) {
  const erisim = tier === 2 ? 'Premium (Kademe 2)' : tier === 1 ? 'Temel Özet (Kademe 1)' : 'Ücretsiz';
  const dataScript = '<script>window.SAYI=' + JSON.stringify(sayiKademe(tier))
    + ';window.KONUM=' + JSON.stringify(konumKademe(tier))
    + ';window.KADEME=' + tier + ';<\/script>';
  const cikisBtn = tier > 0 ? '<a class="hbtn" href="' + YOL + '?logout=1">Çıkış</a>' : '';
  const yukseltBtn = tier < 2 ? '<button class="hbtn hbtn-a klbtn" type="button" data-tier="' + (tier < 1 ? 1 : 2) + '">Kademe yükselt</button>' : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UYANIŞ · 10+22 — Hayat Ağacı Sayı Sistemi</title>
<meta name="description" content="Doğum tarihinden Hayat Ağacı haritası: on küre, yirmi iki yol, yirmi iki sayı. Hesaplama herkese açık; yorum kademeli.">
<link rel="icon" href="/assets/sistem-logosu.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#E8EBE7; --surface:#F4F6F2; --sunken:#DEE3DC;
  --ink:#161D18; --ink2:#4F5C54; --ink3:#7A877F;
  --rule:#C4CCC4; --rule2:#D6DCD5;
  --accent:#2C6E5B; --accent-ink:#1E5044; --accent-soft:#DAE6E0;
  --brass:#8A6620; --brass-soft:#F0E5CA;
  --shadow:0 1px 2px rgba(22,29,24,.06),0 8px 24px rgba(22,29,24,.06);
  --display:"Fraunces",Georgia,serif;
  --sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",monospace;
  --maxw:1180px; --prose:66ch;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#111614; --surface:#19201C; --sunken:#0C100E;
    --ink:#DFE6DF; --ink2:#9BA89F; --ink3:#74817A;
    --rule:#2A332E; --rule2:#222A25;
    --accent:#63BC9E; --accent-ink:#8FD4BC; --accent-soft:#1B2F28;
    --brass:#D2A652; --brass-soft:#2F2717;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.3);
  }
}
:root[data-theme="dark"]{
  --paper:#111614; --surface:#19201C; --sunken:#0C100E;
  --ink:#DFE6DF; --ink2:#9BA89F; --ink3:#74817A;
  --rule:#2A332E; --rule2:#222A25;
  --accent:#63BC9E; --accent-ink:#8FD4BC; --accent-soft:#1B2F28;
  --brass:#D2A652; --brass-soft:#2F2717;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.3);
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:var(--display);font-weight:600;text-wrap:balance;margin:0;line-height:1.18;font-variation-settings:"SOFT" 0,"WONK" 1,"opsz" 40}
p{margin:0}
a{color:var(--accent-ink)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px}
.prose{max-width:var(--prose)}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}

/* header */
header.top{border-bottom:1px solid var(--rule);background:var(--surface)}
.top-in{max-width:var(--maxw);margin:0 auto;padding:26px 24px 22px;display:flex;gap:24px;align-items:center;flex-wrap:wrap;justify-content:space-between}
.brand h1{font-size:clamp(24px,3.6vw,38px);letter-spacing:-.015em}
.brand .sub{color:var(--ink2);font-size:14px;margin-top:6px;max-width:54ch}
.hact{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.chip{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-ink);background:var(--accent-soft);border:1px solid var(--accent);border-radius:999px;padding:5px 11px}
.hbtn{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:none;border:1px solid var(--rule);color:var(--ink2);padding:8px 13px;border-radius:999px;cursor:pointer;text-decoration:none;display:inline-flex}
.hbtn:hover{border-color:var(--accent);color:var(--accent-ink)}
.hbtn-a{background:var(--brass);border-color:var(--brass);color:#fff}
:root[data-theme="dark"] .hbtn-a,:root:not([data-theme="light"]) .hbtn-a{color:#1a1405}
.hbtn-a:hover{color:#fff}

/* hero */
.hero{border-bottom:1px solid var(--rule);background:var(--surface)}
.hero img{display:block;width:100%;max-width:var(--maxw);margin:0 auto;height:auto}

/* nav */
nav.tabs{position:sticky;top:0;z-index:30;background:var(--paper);border-bottom:1px solid var(--rule)}
.tabs-in{max-width:var(--maxw);margin:0 auto;padding:0 24px;display:flex;gap:2px;overflow-x:auto;scrollbar-width:thin}
.tab{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;background:none;border:0;border-bottom:2px solid transparent;color:var(--ink3);padding:15px 14px;cursor:pointer;white-space:nowrap}
.tab:hover{color:var(--ink)}
.tab[aria-selected="true"]{color:var(--accent-ink);border-bottom-color:var(--accent)}
.tab .lk{color:var(--brass);margin-left:5px;font-size:10px}

section.panel{display:none;padding:44px 0 88px}
section.panel.on{display:block}
.lede{font-size:19px;line-height:1.6;color:var(--ink2);max-width:62ch}
h2.sec{font-size:clamp(24px,3vw,32px);margin-bottom:14px}
h3.sub{font-size:20px;margin:34px 0 10px}
.rulebar{height:1px;background:var(--rule);border:0;margin:34px 0}

/* calculator */
.calc{display:grid;grid-template-columns:minmax(300px,380px) 1fr;gap:34px;align-items:start}
@media(max-width:900px){.calc{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--rule);border-radius:4px;padding:22px}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.field label{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.dob{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px}
input[type=number],input[type=password],select{font-family:var(--mono);font-size:15px;padding:10px 11px;background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:3px;width:100%}
input:focus,select:focus{border-color:var(--accent)}
.go{width:100%;font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;background:var(--accent);color:#fff;border:0;padding:13px;border-radius:3px;cursor:pointer;margin-top:4px}
:root[data-theme="dark"] .go,:root:not([data-theme="light"]) .go{color:#0C130F}
@media(prefers-color-scheme:light){:root:not([data-theme="dark"]) .go{color:#fff}}
.go:hover{background:var(--accent-ink)}
.note{font-size:13px;color:var(--ink3);line-height:1.5;margin-top:14px}

/* tree */
.treebox{background:var(--surface);border:1px solid var(--rule);border-radius:4px;padding:10px;overflow-x:auto}
svg.tree{display:block;width:100%;height:auto;min-width:420px}
.edge{stroke:var(--rule);stroke-width:1.4}
.sef{fill:var(--surface);stroke:var(--accent);stroke-width:1.6}
.sef.key{fill:var(--brass-soft);stroke:var(--brass);stroke-width:2.4}
.sefnum{font-family:var(--display);font-size:19px;font-weight:600;fill:var(--ink);text-anchor:middle}
.sefname{font-family:var(--mono);font-size:9.6px;letter-spacing:.05em;fill:var(--ink2);text-anchor:middle}
.pbadge{fill:var(--paper);stroke:var(--rule);stroke-width:1}
.pbadge.key{fill:var(--brass-soft);stroke:var(--brass);stroke-width:1.8}
.ptext{font-family:var(--mono);font-size:9px;fill:var(--ink2);text-anchor:middle;font-variant-numeric:tabular-nums}
.hit{cursor:pointer}
.hit:hover .sef{stroke-width:3}
.hit:hover .pbadge{stroke:var(--accent);stroke-width:2}

/* tables */
.tablewrap{overflow-x:auto;border:1px solid var(--rule);border-radius:4px;background:var(--surface)}
table{border-collapse:collapse;width:100%;font-size:14.5px}
th,td{text-align:left;padding:10px 13px;border-bottom:1px solid var(--rule2)}
th{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);font-weight:500;background:var(--sunken);position:sticky;top:0}
tbody tr:last-child td{border-bottom:0}
tbody tr.clickable{cursor:pointer}
tbody tr.clickable:hover{background:var(--accent-soft)}
td.num{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:600;color:var(--accent-ink)}
tr.keyrow td.num{color:var(--brass)}
.pill{display:inline-block;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:999px;border:1px solid var(--brass);color:var(--brass);background:var(--brass-soft);margin-left:7px}

/* stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:22px 0}
.stat{background:var(--surface);border:1px solid var(--rule);border-radius:4px;padding:14px 16px}
.stat .k{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.stat .v{font-family:var(--display);font-size:30px;font-weight:600;margin-top:2px;line-height:1.05}
.stat .d{font-size:12.5px;color:var(--ink2);margin-top:2px;line-height:1.4}
.bars{display:flex;flex-direction:column;gap:9px;margin-top:8px}
.bar{display:grid;grid-template-columns:96px 1fr 44px;gap:11px;align-items:center;font-size:13.5px}
.bar .t{color:var(--ink2)}
.bar .track{height:9px;background:var(--sunken);border-radius:999px;overflow:hidden}
.bar .fill{height:100%;background:var(--accent);border-radius:999px}
.bar .n{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;color:var(--ink2)}

/* reference cards */
.grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
.ref{background:var(--surface);border:1px solid var(--rule);border-radius:4px;padding:18px 20px}
.ref .hd{display:flex;align-items:baseline;gap:10px;margin-bottom:3px}
.ref .no{font-family:var(--display);font-size:30px;font-weight:600;color:var(--accent);line-height:1}
.ref .nm{font-family:var(--display);font-size:19px;font-weight:600}
.ref .as{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);margin-bottom:11px}
.ref .oz{font-size:14.5px;color:var(--ink);margin-bottom:11px}
.ref dl{margin:0;display:flex;flex-direction:column;gap:8px}
.ref dt{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.ref dd{margin:2px 0 0;font-size:14px;color:var(--ink2);line-height:1.52}
.ref ul{margin:6px 0 0;padding-left:17px;font-size:14px;color:var(--ink2);line-height:1.55}
.ref li{margin-bottom:4px}

/* matrix + tam analiz */
.mctl{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:20px}
.mctl .field{margin:0;min-width:190px}
.mrow{border:1px solid var(--rule);border-radius:4px;background:var(--surface);padding:16px 18px;margin-bottom:11px}
.mrow .mh{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:9px}
.mrow .mn{font-family:var(--display);font-size:22px;font-weight:600;color:var(--accent);line-height:1}
.mrow .mt{font-family:var(--display);font-size:16px;font-weight:600}
.mrow .ms{font-family:var(--mono);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink3)}
.mrow p{font-size:14.5px;line-height:1.58;margin-bottom:7px;color:var(--ink)}
.mrow p.g{color:var(--ink2)}
.mrow p.o{color:var(--accent-ink);border-left:2px solid var(--accent);padding-left:11px}
.mrow strong{font-weight:600}
.lbl{font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--ink3);display:block;margin-bottom:1px}
.count{font-family:var(--mono);font-size:12px;color:var(--ink3);margin-bottom:14px}

/* özet satırları (kademe 1) */
.olist{display:flex;flex-direction:column;gap:9px}
.orow{border:1px solid var(--rule);border-radius:4px;background:var(--surface);padding:13px 16px}
.orow .oh{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:5px}
.orow .on{font-family:var(--display);font-size:20px;font-weight:600;color:var(--accent);line-height:1}
.orow .ot{font-family:var(--display);font-size:15px;font-weight:600}
.orow .os{font-family:var(--mono);font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink3)}
.orow p{font-size:14px;color:var(--ink2);line-height:1.55}

/* kilit kartı */
.kilit{border:1px dashed var(--brass);background:var(--brass-soft);border-radius:6px;padding:26px 22px;text-align:center;margin:22px 0}
.kilit .klock{font-size:26px;display:block;margin-bottom:8px}
.kilit h3{font-size:19px;margin-bottom:8px}
.kilit p{color:var(--ink2);font-size:14.5px;max-width:52ch;margin:0 auto 16px}
.kilit .go{width:auto;display:inline-block;padding:12px 22px}

/* drawer */
.drawer{position:fixed;inset:0;z-index:60;display:none;background:rgba(10,16,12,.42)}
.drawer.on{display:block}
.dpanel{position:absolute;top:0;right:0;height:100%;width:min(560px,100%);background:var(--paper);border-left:1px solid var(--rule);overflow-y:auto;padding:26px 28px 60px}
.dclose{float:right;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;background:none;border:1px solid var(--rule);color:var(--ink2);padding:6px 12px;border-radius:999px;cursor:pointer}
.dpanel h3{font-size:25px;margin:6px 0 3px}

/* modal */
.modal{position:fixed;inset:0;z-index:80;display:none;background:rgba(10,16,12,.5);align-items:center;justify-content:center;padding:20px}
.modal.on{display:flex}
.mbox{background:var(--paper);border:1px solid var(--rule);border-radius:8px;box-shadow:var(--shadow);padding:28px;max-width:380px;width:100%;text-align:center}
.mbox h3{font-size:20px;margin-bottom:6px}
.mbox p{color:var(--ink2);font-size:13.5px;margin-bottom:16px}
.mbox input{text-align:center;letter-spacing:.12em;margin-bottom:12px}
.mbox .go{margin-top:0}
.merr{color:#c0533b;font-size:12.5px;min-height:18px;margin-top:10px}
.mbox .mkapat{margin-top:12px;font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;background:none;border:0;color:var(--ink3);cursor:pointer}

/* prose */
.prose h3.sub:first-child{margin-top:0}
.prose p{margin-bottom:14px;color:var(--ink2)}
.prose p strong,.prose li strong{color:var(--ink);font-weight:600}
.prose ul,.prose ol{color:var(--ink2);padding-left:20px;margin:0 0 16px}
.prose li{margin-bottom:7px}
.formula{font-family:var(--mono);font-size:13.5px;background:var(--sunken);border:1px solid var(--rule);border-radius:4px;padding:15px 17px;margin:0 0 16px;overflow-x:auto;white-space:pre;line-height:1.75;color:var(--ink)}
.callout{border-left:3px solid var(--brass);background:var(--brass-soft);padding:14px 18px;border-radius:0 4px 4px 0;margin:0 0 18px}
.callout p{color:var(--ink);margin:0}
.callout .eyebrow{margin-bottom:5px;color:var(--brass)}
footer{border-top:1px solid var(--rule);padding:26px 0 46px;color:var(--ink3);font-size:13px}
@media(prefers-reduced-motion:no-preference){.mrow,.ref{transition:border-color .15s}}
</style>
</head>
<body>

<header class="top">
  <div class="top-in">
    <div class="brand">
      <p class="eyebrow">Nevra Sistem &middot; 10 Küre + 22 Yol</p>
      <h1>UYANIŞ · 10+22 Numeroloji</h1>
      <p class="sub">Doğum tarihinden Hayat Ağacı haritası. Hesaplama herkese açık; yorum kademeli.</p>
    </div>
    <div class="hact">
      <span class="chip">Erişim: ${erisim}</span>
      ${yukseltBtn}
      ${cikisBtn}
      <button class="hbtn" id="themebtn" type="button">Tema</button>
    </div>
  </div>
</header>

<div class="hero"><img src="/assets/uyanis-banner.png" alt="Hayat Ağacı Sayı Sistemi" loading="eager" onerror="this.parentNode.style.display='none'"></div>

<nav class="tabs">
  <div class="tabs-in" role="tablist">
    <button class="tab" role="tab" data-p="hesapla" aria-selected="true">Harita hesapla</button>
    <button class="tab" role="tab" data-p="yorum" aria-selected="false">Yorum<span class="lk">${tier < 2 ? '🔒' : ''}</span></button>
    <button class="tab" role="tab" data-p="sistem" aria-selected="false">Sistem</button>
    <button class="tab" role="tab" data-p="sayilar" aria-selected="false">22 Sayı<span class="lk">${tier < 1 ? '🔒' : ''}</span></button>
    <button class="tab" role="tab" data-p="konumlar" aria-selected="false">32 Konum<span class="lk">${tier < 1 ? '🔒' : ''}</span></button>
    <button class="tab" role="tab" data-p="matris" aria-selected="false">Matris &middot; 704<span class="lk">${tier < 2 ? '🔒' : ''}</span></button>
    <button class="tab" role="tab" data-p="kokenler" aria-selected="false">Kökenler</button>
  </div>
</nav>

<!-- HESAPLA -->
<section class="panel on" id="p-hesapla">
  <div class="wrap">
    <h2 class="sec">Harita hesapla</h2>
    <p class="lede">Doğum tarihini gir; on kürenin ve yirmi iki yolun sayıları hesaplansın. Ağaçtaki ya da tablodaki herhangi bir konuma tıklayarak o birleşimin okumasını aç.</p>
    <div class="calc" style="margin-top:28px">
      <div>
        <div class="card">
          <div class="field">
            <label for="d-gun">Doğum tarihi</label>
            <div class="dob">
              <input type="number" id="d-gun" min="1" max="31" value="12" aria-label="Gün" placeholder="Gün">
              <input type="number" id="d-ay" min="1" max="12" value="5" aria-label="Ay" placeholder="Ay">
              <input type="number" id="d-yil" min="1" max="2999" value="2004" aria-label="Yıl" placeholder="Yıl">
            </div>
          </div>
          <div class="field">
            <label for="d-yontem">İndirgeme yöntemi</label>
            <select id="d-yontem">
              <option value="1">Yöntem 1 &mdash; rakamları topla</option>
              <option value="2">Yöntem 2 &mdash; 22 çıkar</option>
            </select>
          </div>
          <div class="field">
            <label for="d-ego">Ego küresinin formülü</label>
            <select id="d-ego">
              <option value="b" selected>Benlik + Beden</option>
              <option value="a">Zihin + Duygular</option>
            </select>
          </div>
          <button class="go" id="d-go" type="button">Haritayı çıkar</button>
          <p class="note">Sayılar 22'ye kadar olduğu gibi kalır. 22'yi aşarsa seçtiğin yöntemle indirgenir. Konum numarası ile sayı aynı olduğunda o nokta <strong>kilit nokta</strong> sayılır.</p>
        </div>
        <div class="stats" id="d-stats"></div>
        <div class="card" style="margin-top:12px">
          <p class="eyebrow" style="margin-bottom:10px">Sütun dengesi</p>
          <div class="bars" id="d-bars"></div>
          <p class="note" id="d-bosluk"></p>
        </div>
      </div>
      <div>
        <div class="treebox"><svg class="tree" id="d-tree" viewBox="-120 -4 860 796" role="img" aria-label="Hayat Ağacı haritası"></svg></div>
        <h3 class="sub">On küre</h3>
        <div class="tablewrap">
          <table><thead><tr><th>#</th><th>Küre</th><th>Sayı</th><th>Arketip</th><th>Gezegen</th></tr></thead>
          <tbody id="d-kureler"></tbody></table>
        </div>
        <h3 class="sub">Yirmi iki yol</h3>
        <div class="tablewrap">
          <table><thead><tr><th>#</th><th>Yol</th><th>Sayı</th><th>Arketip</th><th>Bağladığı</th><th>Burç</th></tr></thead>
          <tbody id="d-yollar"></tbody></table>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- YORUM -->
<section class="panel" id="p-yorum">
  <div class="wrap">
    <h2 class="sec">Haritanın yorumu</h2>
    <p class="lede">Girdiğin doğum tarihine göre kişiye özel okuma. Kademe 1 ana hatları, Kademe 2 tüm ayrıntıyı açar.</p>
    <div id="yorum-icerik" style="margin-top:26px"></div>
  </div>
</section>

<!-- SİSTEM -->
<section class="panel" id="p-sistem">
  <div class="wrap"><div class="prose">
    <h2 class="sec">Sistem nasıl çalışır</h2>
    <p class="lede" style="margin-bottom:30px">Hesabın tamamı üç sayıdan türer: doğum günü, doğum ayı ve doğum yılı. Geri kalan her şey bu üçünün toplamlarıdır.</p>
    <h3 class="sub">1 &middot; Üç kaynak sayı</h3>
    <p>Ağaçtaki on küreden yalnızca üçü doğrudan verilir; bunlar hesaplanmaz, alınır:</p>
    <div class="formula">İLAHİLİK  =  doğum ayı
GÜÇ       =  doğum günü
SEVGİ     =  doğum yılı</div>
    <p>Bu üç küre haritanın <strong>ham</strong> noktalarıdır; en güçlü ama yönlendirilmesi en zor kuvvetlerdir.</p>
    <h3 class="sub">2 &middot; Türetilen yedi küre</h3>
    <div class="formula">BEDEN        =  İlahilik + Güç + Sevgi
BENLİK       =  İlahilik + Güç + Sevgi + Beden
YARATICILIK  =  İlahilik + Güç
BİLGELİK     =  İlahilik + Sevgi
ZİHİN        =  Beden + Güç
DUYGULAR     =  Beden + Sevgi
EGO          =  Zihin + Duygular</div>
    <p>Beden üçlünün toplamı; Benlik dördünün toplamı — merkez, kendinden önceki her şeyi toplar.</p>
    <h3 class="sub">3 &middot; Yirmi iki yol</h3>
    <p>Her yol iki küreyi bağlar ve <strong>bağladığı iki kürenin sayılarının toplamını</strong> taşır. Gösterim <span class="mono">yol numarası / değer</span> biçimindedir.</p>
    <h3 class="sub">4 &middot; İndirgeme</h3>
    <p>Yirmi ikiye kadar sayılar aynı kalır; aşarsa iki yöntemden biriyle indirgenir:</p>
    <div class="formula">Yöntem 1 — rakamları topla   37 → 3+7 = 10   (varsayılan)
Yöntem 2 — 22 çıkar          37 → 37−22 = 15</div>
    <h3 class="sub">5 &middot; Kilit nokta</h3>
    <p>Bir kürenin ya da yolun <strong>numarası ile taşıdığı sayı aynıysa</strong> orası kilit noktadır: saf, iki kat güçlü ama dengesiz enerji.</p>
    <h3 class="sub">6 &middot; Üç sütun</h3>
    <ul>
      <li><strong>Merhamet sütunu</strong> — Bilgelik, Sevgi, Duygular. Verme, genişleme.</li>
      <li><strong>Denge sütunu</strong> — İlahilik, Benlik, Ego, Beden. Taşıyıcı eksen.</li>
      <li><strong>Şiddet sütunu</strong> — Yaratıcılık, Güç, Zihin. Sınırlama, kesme.</li>
    </ul>
    <h3 class="sub">7 &middot; Sembolik katman</h3>
    <p>Her kürenin bir gezegeni, her yolun bir burcu/gezegeni/elementi vardır (Altın Şafak karşılıkları).</p>
    <div class="tablewrap" style="margin-bottom:18px">
      <table><thead><tr><th>Küre</th><th>Gezegen</th><th>Sütun</th></tr></thead><tbody id="s-kuregez"></tbody></table>
    </div>
    <div class="tablewrap">
      <table><thead><tr><th>Yol</th><th>Burç / gezegen / element</th></tr></thead><tbody id="s-yolburc"></tbody></table>
    </div>
  </div></div>
</section>

<!-- 22 SAYI -->
<section class="panel" id="p-sayilar">
  <div class="wrap">
    <h2 class="sec">Yirmi iki sayı</h2>
    <p class="lede">Sistemin alfabesi. Her sayı bir arketiptir; bir konuma düştüğünde o konumun işleyişini kendi niteliğine göre değiştirir.</p>
    <div class="grid2" id="s-list" style="margin-top:28px"></div>
  </div>
</section>

<!-- 32 KONUM -->
<section class="panel" id="p-konumlar">
  <div class="wrap">
    <h2 class="sec">Otuz iki konum</h2>
    <p class="lede">On küre ve yirmi iki yol. Küreler <em>ne olduğunu</em>, yollar <em>iki şey arasında ne olduğunu</em> anlatır.</p>
    <h3 class="sub">On küre</h3>
    <div class="grid2" id="k-kure"></div>
    <h3 class="sub">Yirmi iki yol</h3>
    <div class="grid2" id="k-yol"></div>
  </div>
</section>

<!-- MATRİS -->
<section class="panel" id="p-matris">
  <div class="wrap">
    <h2 class="sec">Birleşim matrisi</h2>
    <p class="lede">Otuz iki konum çarpı yirmi iki sayı: <strong>704 birleşim.</strong> Bir konum seçip ona düşebilecek bütün sayıları, ya da bir sayı seçip onun bütün konumlardaki davranışını okuyabilirsin.</p>
    <div class="mctl" id="m-ctl" style="margin-top:26px">
      <div class="field">
        <label for="m-mod">Görünüm</label>
        <select id="m-mod">
          <option value="k">Konuma göre &mdash; bir konum, 22 sayı</option>
          <option value="s">Sayıya göre &mdash; bir sayı, 32 konum</option>
        </select>
      </div>
      <div class="field" id="m-kwrap">
        <label for="m-k">Konum</label>
        <select id="m-k"></select>
      </div>
      <div class="field" id="m-swrap" style="display:none">
        <label for="m-s">Sayı</label>
        <select id="m-s"></select>
      </div>
    </div>
    <p class="count" id="m-count"></p>
    <div id="m-out"></div>
  </div>
</section>

<!-- KÖKENLER -->
<section class="panel" id="p-kokenler">
  <div class="wrap"><div class="prose">
    <h2 class="sec">Kökenler ve bilinmeyenler</h2>
    <p class="lede" style="margin-bottom:30px">Neyin belgeli, neyin varsayım, neyin açık olduğunu ayıran bölüm.</p>
    <h3 class="sub">Hayat Ağacı nereden geliyor</h3>
    <p>Şema Yahudi Kabalası'ndan gelir. On sefira ve yirmi iki yol fikri, MS 2.–6. yüzyıllara tarihlenen <strong>Sefer Yetzirah</strong>'da birlikte geçer. Bugün kullanılan ağacın basılı hâli çok daha geç: <strong>1652</strong>, Kircher'in Oedipus Aegyptiacus'u.</p>
    <h3 class="sub">Yollar neden yirmi iki</h3>
    <p>İbrani alfabesinde yirmi iki harf vardır: üç ana (element), yedi çift (gezegen), on iki basit (burç). Tarot'un yirmi iki Majör Arkana'sıyla eşleştirilmesi 19. yüzyıl Fransası'nda başlar, 1888 Altın Şafak'ta bugünkü hâlini alır.</p>
    <div class="callout"><p class="eyebrow">Dürüst not</p><p>Tarot–harf eşleşmesi kadim değil, ~150 yıllık bir düzenlemedir. Sistem bunu kullanır ama "binlerce yıllık" diye sunmaz.</p></div>
    <h3 class="sub">Açık sorular</h3>
    <ul>
      <li><strong>Ego küresinin formülü.</strong> Zihin + Duygular mı, Benlik + Beden mi?</li>
      <li><strong>İndirgeme yöntemi.</strong> Yöntem 1 tek örnekle seçildi; Yöntem 2 sistemli test edilmedi.</li>
      <li><strong>Yolların yönü ve yıl sayısının işlenişi.</strong> Farklı seçimler farklı haritalar üretir.</li>
      <li><strong>Doğrulama.</strong> Geniş örneklem ve kör test gerekir.</li>
    </ul>
  </div></div>
</section>

<div class="drawer" id="drawer"><div class="dpanel" id="dpanel"></div></div>

<div class="modal" id="kilitModal">
  <div class="mbox">
    <h3 id="km-title">Kademe kilidini aç</h3>
    <p>Yorum içeriği için şifreni gir. Kademe 1 ana hatları, Kademe 2 tüm ayrıntıyı açar.</p>
    <input type="password" id="km-sifre" placeholder="Şifre" inputmode="text" autocomplete="off">
    <button class="go" id="km-gonder" type="button">Kilidi aç</button>
    <div class="merr" id="km-err"></div>
    <button class="mkapat" id="km-kapat" type="button">Vazgeç</button>
  </div>
</div>

<footer><div class="wrap">
  <p>Nevra Sistem &middot; UYANIŞ · 10+22 Hayat Ağacı Sayı Sistemi. Hesaplama herkese açık; yorum kademeli. Matris 32 konum &times; 22 sayı = 704 birleşim.</p>
</div></footer>

${dataScript}
<script src="/assets/uyanis-app.js" defer><\/script>
</body>
</html>`;
}
