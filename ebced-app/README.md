# 🌟 EBCED HESABI - Numeroloji Uygulaması

Tamamen bağımsız, modern ve responsive EBCED numeroloji web uygulaması. İsim analizi, uyum hesaplaması, evlilik danışmanı ve daha fazlası.

## ✨ Özellikler

### 📊 Tek İsim Analizi
- EBCED değer ve rakam hesaplama
- Detaylı kişilik analizi
- Enerji ve karakteristik bilgileri
- Astroloji entegrasyonu (zodiyak, gezegen, element)
- Uygun meslekler önerisi

### 💑 İki Kişi Uyumu
- Karşılaştırmalı analiz
- 81 uyum kombinasyonu (Arapça adları)
- Uyum derecesi göstericiler

### 💍 Evlilik Danışmanı
- Evlilik uyumu raporu
- 7 madde halinde detaylı rehberler
- Uyum seviyesine göre tavsiyeler

### 🤝 İş Ortaklığı Analizi
- Ortaklık başarı oranı
- Mali ve operasyonel tavsiyeleri

### 👶 Ad Verme Rehberi
- Bebeğin adı analizi
- Ailedeki uyum kontrolü
- Cinsiyete göre enerji rehberi

### 🔢 Rakam Özellikleri
- 9 rakamın tüm detayları
- Astroloji, sağlık, meslek bilgileri
- Uyum tabloları

## 🎨 Tasarım

- ✅ Modern gradient arayüz
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Smooth geçiş animasyonları
- ✅ Hover efektleri
- ✅ Türkçe font desteği (Cinzel + Inter)

## 📁 Dosya Yapısı

```
ebced-app/
├── index.html        # Ana sayfa (tam uygulaması)
├── app.js           # JavaScript fonksiyonları
├── data.js          # Tüm numeroloji verileri
├── package.json     # Proje bilgileri
└── README.md        # Bu dosya
```

## 🚀 Kullanım

### Yerel Olarak Çalıştırma

1. **Tarayıcıda açma:**
```bash
# Dosya yolunu tarayıcıya kopyalay veya
file:///path/to/ebced-app/index.html
```

2. **Python ile:**
```bash
cd ebced-app
python -m http.server 3000
# Tarayıcıda: http://localhost:3000
```

3. **Node.js http-server ile:**
```bash
npm install -g http-server
cd ebced-app
http-server -p 3000
```

### Vercel'de Deploy

1. GitHub'a push et
2. Vercel'e connect et
3. Build ayarlarını yapılandır:
   - Framework: None
   - Build Command: (boş)
   - Output Directory: `/ebced-app`

## 📊 Veri Yapısı

### EBCED Haritası
- 26 İngilizce harf
- Türkçe karakterler: ç, ğ, ı, ö, ş, ü

### 81 Uyum Kombinasyonu
- Her kombinasyonun Arapça adı
- Uyum derecesi (excellent/good/moderate/bad)
- Detaylı açıklama

### Her Rakam İçin (1-9)
- Harfler
- Enerji türü
- Kişilik özellikleri
- Zodiyak işareti
- Hükmen gezegen
- Element
- Şanslı renk ve taş
- Uygun meslekler
- Sağlık bilgileri
- Uyum tabloları

## 🔧 Teknoloji

- **HTML5** - Semantic markup
- **CSS3** - Modern tasarım, Grid, Flexbox
- **Vanilla JavaScript** - Herhangi bir framework olmadan
- **Responsive Design** - Mobile-first approach

## 💡 Örnekler

### Tek İsim Analizi
```
İsim: Mehmet
EBCED: 78 → 7+8 = 15 → 1+5 = 6
Rakam: 6 (Aile, Sevgi, Sorumluluk)
```

### İki Kişi Uyumu
```
Mehmet (6) + Ayşe (2)
Uyum: "MÜTTEFİK OLA" - Çok güzel uyum
```

## 📝 Notlar

- Tüm hesaplamalar istemci tarafında yapılır (sunucu gerekmez)
- Veri tabanı olarak sadece JavaScript nesneleri kullanılır
- Responsive tasarım 768px altında optimize edilmiş

## 🌐 Web Sitesine Entegrasyon

Bu uygulamayı kendi web sitenize embed etmek için:

```html
<iframe 
  src="https://your-domain.com/ebced-app/" 
  width="100%" 
  height="800px"
  frameborder="0"
  style="border-radius: 10px;">
</iframe>
```

## 📄 Lisans

MIT

## 👤 Yazarlar

- Claude (Numeroloji Uygulaması)
- Emine Nevra Aya (Numeroloji Bilgisi)

---

🌟 **Her isim bir enerji taşır ve bu enerji kişinin yaşamını şekillendirir.**

*Nomen Est Omen - İsim Kaderdir*
