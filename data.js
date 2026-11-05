/**
 * EBCED HESABI - Tam Veri Dosyası
 * Tüm numeroloji, analiz ve referans bilgileri
 */

// ============================================
// 1. EBCED HARF DEĞERLERİ
// ============================================
const ebcedMap = {
    'a': 1, 'j': 1, 's': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5,
    'f': 6, 'o': 6, 'x': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9,
    // Türkçe karakterler
    'ç': 3, 'ğ': 7, 'ı': 9, 'ö': 6, 'ş': 7, 'ü': 3
};

// ============================================
// 2. HARFLERIN ENERJİLERİ VE ÖZELLİKLERİ
// ============================================
const letterEnergies = {
    1: {
        letter: 'A, J, S',
        energy: 'Liderlik, Öncülük, Başlangıç',
        traits: ['Lider', 'Güçlü', 'Bağımsız', 'Yenilikçi', 'Cesurane'],
        character: 'Doğuştan lider, inisiyatif alır, başarıya odaklı'
    },
    2: {
        letter: 'B, K, T',
        energy: 'Aracılık, Denge, İşbirliği',
        traits: ['Dipsomatist', 'Uyumlu', 'Empatik', 'Dikkatli', 'Uzlaştırıcı'],
        character: 'Doğal aracı, uzlaştırma yeteneği, duyarlı'
    },
    3: {
        letter: 'C, L, U, Ç',
        energy: 'Yaratıcılık, İfade, Sanat',
        traits: ['Yaratıcı', 'Sosyal', 'Konuşkan', 'Iyimser', 'Estetik'],
        character: 'Sanatsal yetenekler, güzel anlatış, sosyal çekicilik'
    },
    4: {
        letter: 'D, M, V',
        energy: 'İstikrar, Güvenilirlik, Temel',
        traits: ['Sağlam', 'Praktik', 'Organize', 'Sorumlu', 'Dayanıklı'],
        character: 'Güvenilir ve istikrarlı, detaylara dikkat eden'
    },
    5: {
        letter: 'E, N, W',
        energy: 'Özgürlük, Değişim, Hareket',
        traits: ['Özgür', 'Meraklı', 'Esnek', 'Maceracı', 'Sosyal'],
        character: 'Değişime uyum sağlayan, yeni deneyimlerden zevk alan'
    },
    6: {
        letter: 'F, O, X, Ö',
        energy: 'Aile, Sevgi, Sorumluluğu',
        traits: ['Şefkatli', 'Aile odaklı', 'Koruyucu', 'Sevgi dolu', 'Denli'],
        character: 'Doğal olarak şefkatli, aile ve ilişkilere bağlı'
    },
    7: {
        letter: 'G, P, Y, Ğ, Ş',
        energy: 'Bilgelik, İçgüdü, Araştırma',
        traits: ['Bilge', 'Analitik', 'Sezgili', 'Derinlemesine', 'Mistik'],
        character: 'Entelektüel ve sezgili, hayatın derin anlamını arayan'
    },
    8: {
        letter: 'H, Q, Z',
        energy: 'Güç, Kontrol, İktisar',
        traits: ['Güçlü', 'Hedef odaklı', 'Başarıcı', 'Belirli', 'İktidar'],
        character: 'Güç ve kontrolü doğal olarak kullanan, başarıya ulaşan'
    },
    9: {
        letter: 'I, R, İ',
        energy: 'Evrensellik, Tamamlama, Hizmet',
        traits: ['İdealist', 'Evrensel', 'Empatik', 'Sanat seveni', 'Hizmet odaklı'],
        character: 'İnsan ve sanat alanında başarı kazanan, idealist yapı'
    }
};

// ============================================
// 3. İSİM ANALİZİ - HER RAKAM İÇİN DETAYLı BİLGİ
// ============================================
const nameAnalysis = {
    1: {
        type: 'LİDER - ÖNCÜ ENERJİSİ (1)',
        energy: '🔥 Yüksek Enerji • Dinamik ve Güçlü',
        traits: [
            '✨ Liderlik yeteneği ve inisiyatif alış',
            '✨ Bağımsız kişilik, kendine güven',
            '✨ Yenilikçi ve öncü ruh',
            '✨ Güçlü irade ve kararlılık',
            '✨ Başarı ve ilerleme arzusu'
        ],
        meaning: 'Bu isim sahibi doğuştan lider. Kendine güvenen, yenilikçi ve başarıya odaklı bir yapıya sahiptir. İsmin enerjisi kişiyi ön plana çıkarır, başarı ve yükselişi kolaylaştırır.',
        lifeArea: 'İş, Liderlik, Girişimcilik, Başarı',
        recommendation: 'Liderlik pozisyonlarında başarılı olabilir. Bağımsız çalışmaya uygun.'
    },
    2: {
        type: 'ARACILIK - DENGE ENERJİSİ (2)',
        energy: '💙 Orta Enerji • Uyumlu ve İşbirlikçi',
        traits: [
            '💫 Diplomasi ve uzlaştırma yeteneği',
            '💫 Duyarlı ve empatik kişilik',
            '💫 İşbirliğine açık, takım oyuncu',
            '💫 Sakinlik ve denge',
            '💫 Dostça ve birleştirici havası'
        ],
        meaning: 'Bu isim sahibi doğal bir aracı. Diğerlerini birleştirme, uzlaştırma ve denge kurma yeteneğine sahiptir. İlişkilerinde uyumlu ve samimi olan bu isim, başkalarının güvenini kolayca kazanır.',
        lifeArea: 'Diplomasi, Ortaklık, Sanat, Eğitim',
        recommendation: 'Takım çalışmasında ve uzlaştırma gerektiren alanlarda başarılı.'
    },
    3: {
        type: 'YARATICILIK - İFADE ENERJİSİ (3)',
        energy: '🌟 Yüksek Enerji • Yaratıcı ve Verimli',
        traits: [
            '🎨 Sanatsal ve yaratıcı yetenekler',
            '🎨 Güzel anlatış ve iletişim becerisi',
            '🎨 Sosyal ve canlı kişilik',
            '🎨 Optimizm ve pozitif bakış açısı',
            '🎨 Zevk ve estetik anlayışı'
        ],
        meaning: 'Bu isim sahibi yaratıcı ve expresif. Sanat, müzik, yazı veya tasarım gibi alanlarda başarı kazanabilir. İsmin enerjisi kişiye sosyal çekicilik ve anlatım gücü verir.',
        lifeArea: 'Sanat, Tasarım, İletişim, Müzik, Yazarlık',
        recommendation: 'Yaratıcı alanlarda parlak bir gelecek. Sosyal etkinliklerde ön plana çıkabilir.'
    },
    4: {
        type: 'İSTİKRAR - TEMEL ENERJİSİ (4)',
        energy: '🏔️ Düşük Enerji • Güvenilir ve Sağlam',
        traits: [
            '🛡️ Istikrar ve güvenilirlik',
            '🛡️ Pratik ve organize yapı',
            '🛡️ Disiplin ve sorumlu tutum',
            '🛡️ Dayanıklılık ve dirençlilik',
            '🛡️ Detaylara dikkat'
        ],
        meaning: 'Bu isim sahibi güvenilir ve istikrarlı. Pratik düşünen, organize ve sorumlu bir yapıya sahiptir. İsmin enerjisi kişiye kararlılık, sağlamlık ve uzun ömürlü başarı sunar.',
        lifeArea: 'Mühendislik, İnşaat, Yönetim, Teknoloji, Muhasebe',
        recommendation: 'Yapıya ve disipline gereken alanlarda üstün başarı. Uzun vadeli projeler için ideal.'
    },
    5: {
        type: 'ÖZGÜRLÜK - HARKETLİLİK ENERJİSİ (5)',
        energy: '⚡ Yüksek Enerji • Dinamik ve Meraklı',
        traits: [
            '🦋 Değişim ve yenilik sevgisi',
            '🦋 Meraklı ve öğrenmeye istekli',
            '🦋 Esneklik ve uyum kabiliyeti',
            '🦋 Macera ve keşfetme arzusu',
            '🦋 İletişim ve sosyallik'
        ],
        meaning: 'Bu isim sahibi özgür ve meraklı. Değişime uyum sağlayan, öğrenmeye istekli ve yeni deneyimlerden zevk alan bir yapıdadır. İsmin enerjisi yaşamda çeşitlilik ve fırsatlar açar.',
        lifeArea: 'Ticaret, Turizm, İletişim, Pazarlama, Seyahat',
        recommendation: 'Dinamik ve değişken ortamlarda başarılı. Çeşitli deneyimlerden güç alır.'
    },
    6: {
        type: 'AİLE - SEVGİ ENERJİSİ (6)',
        energy: '❤️ Orta Enerji • Şefkatli ve Koruyucu',
        traits: [
            '💕 Aile ve topluluğa bağlılık',
            '💕 Şefkat, merhamet ve yardımseverlik',
            '💕 Sorumlu ve bakıcı kişilik',
            '💕 Güzellik ve uyumu seviş',
            '💕 Barış ve huzur arayışı'
        ],
        meaning: 'Bu isim sahibi doğal olarak şefkatli ve sevgi dolu. Aile ve ilişkilerindeki sorumluluk duygusunu güçlü bir şekilde taşır. İsmin enerjisi kişiye huzur, güvenlik ve ilişkilerde başarı verir.',
        lifeArea: 'Aile, Danışmanlık, Hemşirelik, Öğretmenlik, Sosyal Çalışma',
        recommendation: 'İnsan ilişkilerinde başarılı. Aile ve toplum hizmetine uygun.'
    },
    7: {
        type: 'BİLGE - ARAŞTIRMA ENERJİSİ (7)',
        energy: '🔮 Düşük Enerji • Derinlemesine ve İçgüdüsel',
        traits: [
            '🧘 Spiritualite ve felsefe ilgisi',
            '🧘 Analitik ve araştırmacı yapı',
            '🧘 İçgüdü ve sezgi gücü',
            '🧘 Huzur ve iç dünya arayışı',
            '🧘 Mistik ve gizli bilgiye ilgi'
        ],
        meaning: 'Bu isim sahibi entelektüel ve sezgili. Hayatın daha derin anlamını arayan, meditasyon ve kendini tanıma yolunda ilerleyen bir yapıya sahiptir. İsmin enerjisi kişiye bilgelik ve iç barış sunar.',
        lifeArea: 'Araştırma, Felsefe, Psikoloji, Spiritualite, Bilim',
        recommendation: 'Araştırma ve analiz gerektiren alanlarda başarılı. Iç dünyada derinlik arayan kişiler için ideal.'
    },
    8: {
        type: 'GÜÇ - EKONOMİ ENERJİSİ (8)',
        energy: '💪 Yüksek Enerji • Başarı ve İktidar',
        traits: [
            '🏆 Güç, kontrol ve liderlik',
            '🏆 İş başarısı ve ilerleme',
            '🏆 Büyük hedeflere odaklanma',
            '🏆 Belirli ve kararlı yapı',
            '🏆 Maddi başarı ve refah'
        ],
        meaning: 'Bu isim sahibi kuvvetli ve başarı odaklı. Güç ve kontrolü doğal olarak kullanan, büyük hedeflere ulaşan bir yapıdadır. İsmin enerjisi kişiye başarı, refah ve yüksek mevkiye erişim kolaylaştırır.',
        lifeArea: 'İşletmcilik, Finans, Yönetim, Emlak, Ticaret',
        recommendation: 'Maddi başarı ve refah için uygun. İş ve yönetimde başarılı olabilir.'
    },
    9: {
        type: 'EVRENSELLIK - TAMAMLAMA ENERJİSİ (9)',
        energy: '🌍 Yüksek Enerji • Idealist ve Hizmet Yönelimli',
        traits: [
            '✊ Insanlık ve hizmet sevgisi',
            '✊ Evrensel değerleri önemseyen yapı',
            '✊ Empati ve anlayış gücü',
            '✊ Sanat ve estetik beğenisi',
            '✊ Tamamlama ve sonlandırma yeteneği'
        ],
        meaning: 'Bu isim sahibi idealist ve geniş bakış açılı. İnsanlığa hizmet etme, evrensel değerleri savunma istekleri güçlü olan bu isim, insan ve sanat alanında başarı kazanır.',
        lifeArea: 'Sanat, İnsani Yardım, Haklar, Eğitim, Kültür',
        recommendation: 'İnsanlık için hizmet alanlarında başarılı. Evrensel değerlere bağlı çalışmalar için uygun.'
    }
};

// ============================================
// 4. İSİM TİPLERİ VE ÖZELLİKLERİ
// ============================================
const nameTypes = {
    'nûr': {
        name: 'NÛR (Nur/Işık)',
        meaning: 'Işık, parlak, aydınlatan',
        characteristics: 'Güneş enerjisi, parlak, aynalanmaya eğilimli, dış dünyaya açık',
        recommendation: 'Başarıya, başarı ve ilerlemeye yöneltir'
    },
    'câ': {
        name: 'CÂ (Güç/Kudret)',
        meaning: 'Güç, kudret, iktidar',
        characteristics: 'Güçlü irade, belirli, otoriter, kontrolcü',
        recommendation: 'İktidar, güç ve kontrol duygularını geliştirir'
    },
    'gül': {
        name: 'GÜL (Gül/Güzellik)',
        meaning: 'Güzel, çekici, çiçek',
        characteristics: 'Estetik, güzellik sevgisi, zarif, hassas',
        recommendation: 'Güzellik ve sanat alanlarında başarı'
    },
    'efe': {
        name: 'EFE (Efe/Kahaman)',
        meaning: 'Kahramanı, erkek, güçlü',
        characteristics: 'Erkeksi, güçlü, cesur, yiğit',
        recommendation: 'Cesaret ve liderlik özellikleri geliştirir'
    },
    'lâ': {
        name: 'LÂ/MÂ (Nefiy/Değillik)',
        meaning: 'Değillik, olumsuz, reddediş',
        characteristics: 'Azarılı, zorluklar, karşıtlık, mücadele',
        recommendation: 'Dirençlilik ve güçlenmeyi sağlayabilir'
    },
    'ece': {
        name: 'ECE (Ece/Kraliçe)',
        meaning: 'Kraliçe, hanım, asil',
        characteristics: 'Asil, zarif, ruhani, feminen',
        recommendation: 'Asalet ve ruhaniyeti arttırır'
    }
};

// ============================================
// 5. 81 UYUM KOMBİNASYONU
// ============================================
const harmonies = {
    '1_1': { name: 'MUTİÂNİ', meaning: 'Çok uyumlu bir ilişki. Karşılıklı sevgi ve sadakat sağlam temeldir.', level: 'excellent' },
    '2_1': { name: 'MUHABBET-İ SADIK', meaning: 'Sabit bir sevgi var. İlişki sağlıklı ve samimi geçecektir.', level: 'excellent' },
    '2_2': { name: 'MUHABBET-İ SEVA', meaning: 'Sevgi eşit ölçüde. Dengeli ve güzel bir ilişki.', level: 'good' },
    '3_1': { name: 'EVVEL HAVF SONRA SULH', meaning: 'Başta zorluk, sonra barış ve anlaşma. Üstesinden gelinebilir.', level: 'moderate' },
    '3_2': { name: 'HAFİF\'ÜL MUHABBET', meaning: 'Az sevgi var. Çabayla başarılabilir ancak dikkat gerekli.', level: 'moderate' },
    '3_3': { name: 'İTTİFAK OLMAYA', meaning: 'Uyum zordur. Ciddi sorunlar yaşanabilir.', level: 'bad' },
    '4_1': { name: 'MUHABBET-İ EBEDİYYE', meaning: 'Ebedi bir sevgi. Çok güzel ve ömür boyu devam edecek ilişki.', level: 'excellent' },
    '4_2': { name: 'MUHABBETAN', meaning: 'Sevgi çok güzeldir. Oldukça uyumlu bir ilişki.', level: 'good' },
    '4_3': { name: 'MUHABBET-İ KAZİB', meaning: 'Sahte sevgi. Çok uyumlu değildir, dikkat!', level: 'bad' },
    '4_4': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum. Ne çok iyi ne çok kötü.', level: 'moderate' },
    '5_1': { name: 'İTTİFAK-I MUKARRER', meaning: 'Sağlam birlik. Çok güzel uyum sağlanır.', level: 'excellent' },
    '5_2': { name: 'HUSUMET-İ MUKARRER', meaning: 'Sabit düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '5_3': { name: 'İTTİFAK-I KAZİP', meaning: 'Sahte birlik. Uyumlu değildir.', level: 'bad' },
    '5_4': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel bir ilişki.', level: 'good' },
    '5_5': { name: 'MUHABBETİ BERABER', meaning: 'Birlikte sevinç. Oldukça güzel uyum.', level: 'good' },
    '6_1': { name: 'SADIK VE SALİH', meaning: 'Sadık ve iyi. Oldukça güzel bir ilişki.', level: 'good' },
    '6_2': { name: 'MÜTTEFİK OLA', meaning: 'Müttefik olmak. Çok güzel uyum.', level: 'excellent' },
    '6_3': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '6_4': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '6_5': { name: 'MUTİÂNİ', meaning: 'Çok uyumlu. Gayet güzel bir ilişki.', level: 'excellent' },
    '6_6': { name: 'NİFAK OLMAYA', meaning: 'Uyuşmazlık. Orta derecede sorun.', level: 'moderate' },
    '7_1': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel.', level: 'good' },
    '7_2': { name: 'HUSUMET-İ MUKARRER', meaning: 'Sabit düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '7_3': { name: 'İTAAT BEYNEHÜMA', meaning: 'Karşılıklı itaat. Oldukça güzel uyum.', level: 'good' },
    '7_4': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel.', level: 'good' },
    '7_5': { name: 'EL MUHABBET FİRAK', meaning: 'Sevgi fakat ayrılık. Orta hallidir.', level: 'moderate' },
    '7_6': { name: 'FİRKAT VE NİFAK', meaning: 'Ayrılık ve uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '7_7': { name: 'NİFAK-I MUKARRER', meaning: 'Sabit uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '8_1': { name: 'BEYNEHÜMA MUHABBET', meaning: 'Aralarında sevgi. Oldukça güzel.', level: 'good' },
    '8_2': { name: 'EL HUSUMET', meaning: 'Düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '8_3': { name: 'EL HAVF', meaning: 'Korku. Orta derecede sorun.', level: 'moderate' },
    '8_4': { name: 'BEYNEHÜMA ÂMİN', meaning: 'Aralarında güven. Çok güzel uyum.', level: 'excellent' },
    '8_5': { name: 'EL MUHABBET SADIK', meaning: 'Sadık sevgi. Çok uyumlu.', level: 'excellent' },
    '8_6': { name: 'İTTİFAK-I MUKARRER', meaning: 'Sağlam birlik. Çok güzel.', level: 'excellent' },
    '8_7': { name: 'İTTİFAK BEYNEHÜMA', meaning: 'Aralarında anlaşma. Çok güzel uyum.', level: 'excellent' },
    '8_8': { name: 'MUHABBET-İ TAM', meaning: 'Tam sevgi. Çok güzel uyum.', level: 'excellent' },
    '9_1': { name: 'NİFAK-I MUKARRER', meaning: 'Sabit uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '9_2': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '9_3': { name: 'MUHABBETİ BERABER', meaning: 'Birlikte sevinç. Oldukça güzel.', level: 'good' },
    '9_4': { name: 'BEYNEHÜMA İMTİZAÇ', meaning: 'Aralarında uyum. Çok güzel.', level: 'excellent' },
    '9_5': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '9_6': { name: 'NİFAK-I MUKARRER', meaning: 'Sabit uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '9_7': { name: 'FİRKAT-İ MUKARRER', meaning: 'Sabit ayrılık. Uyumlu değildir.', level: 'bad' },
    '9_8': { name: 'BEYNEHÜMA ADÂVET', meaning: 'Aralarında düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '9_9': { name: 'NİFAK VE FİRKAT', meaning: 'Uyuşmazlık ve ayrılık. Hiç uyumlu değil.', level: 'bad' }
};

// 2-9 kombinasyonları (eksik olanlar)
Object.assign(harmonies, {
    '1_2': { name: 'MUHABBET-İ SADIK', meaning: 'Sabit bir sevgi var. İlişki sağlıklı ve samimi geçecektir.', level: 'excellent' },
    '1_3': { name: 'EVVEL HAVF SONRA SULH', meaning: 'Başta zorluk, sonra barış ve anlaşma. Üstesinden gelinebilir.', level: 'moderate' },
    '1_4': { name: 'MUHABBET-İ EBEDİYYE', meaning: 'Ebedi bir sevgi. Çok güzel ve ömür boyu devam edecek ilişki.', level: 'excellent' },
    '1_5': { name: 'İTTİFAK-I MUKARRER', meaning: 'Sağlam birlik. Çok güzel uyum sağlanır.', level: 'excellent' },
    '1_6': { name: 'SADIK VE SALİH', meaning: 'Sadık ve iyi. Oldukça güzel bir ilişki.', level: 'good' },
    '1_7': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel.', level: 'good' },
    '1_8': { name: 'BEYNEHÜMA MUHABBET', meaning: 'Aralarında sevgi. Oldukça güzel.', level: 'good' },
    '1_9': { name: 'NİFAK-I MUKARRER', meaning: 'Sabit uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '2_3': { name: 'HAFİF\'ÜL MUHABBET', meaning: 'Az sevgi var. Çabayla başarılabilir ancak dikkat gerekli.', level: 'moderate' },
    '2_4': { name: 'MUHABBETAN', meaning: 'Sevgi çok güzeldir. Oldukça uyumlu bir ilişki.', level: 'good' },
    '2_5': { name: 'HUSUMET-İ MUKARRER', meaning: 'Sabit düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '2_6': { name: 'MÜTTEFİK OLA', meaning: 'Müttefik olmak. Çok güzel uyum.', level: 'excellent' },
    '2_7': { name: 'HUSUMET-İ MUKARRER', meaning: 'Sabit düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '2_8': { name: 'EL HUSUMET', meaning: 'Düşmanlık. Hiç uyumlu değil.', level: 'bad' },
    '2_9': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '3_4': { name: 'MUHABBET-İ KAZİB', meaning: 'Sahte sevgi. Çok uyumlu değildir, dikkat!', level: 'bad' },
    '3_5': { name: 'İTTİFAK-I KAZİP', meaning: 'Sahte birlik. Uyumlu değildir.', level: 'bad' },
    '3_6': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '3_7': { name: 'İTAAT BEYNEHÜMA', meaning: 'Karşılıklı itaat. Oldukça güzel uyum.', level: 'good' },
    '3_8': { name: 'EL HAVF', meaning: 'Korku. Orta derecede sorun.', level: 'moderate' },
    '3_9': { name: 'MUHABBETİ BERABER', meaning: 'Birlikte sevinç. Oldukça güzel.', level: 'good' },
    '4_5': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel bir ilişki.', level: 'good' },
    '4_6': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '4_7': { name: 'EL MUHABBET SEVA', meaning: 'Eşit sevgi. Oldukça güzel.', level: 'good' },
    '4_8': { name: 'BEYNEHÜMA ÂMİN', meaning: 'Aralarında güven. Çok güzel uyum.', level: 'excellent' },
    '4_9': { name: 'BEYNEHÜMA İMTİZAÇ', meaning: 'Aralarında uyum. Çok güzel.', level: 'excellent' },
    '5_6': { name: 'MUTİÂNİ', meaning: 'Çok uyumlu. Gayet güzel bir ilişki.', level: 'excellent' },
    '5_7': { name: 'EL MUHABBET FİRAK', meaning: 'Sevgi fakat ayrılık. Orta hallidir.', level: 'moderate' },
    '5_8': { name: 'EL MUHABBET SADIK', meaning: 'Sadık sevgi. Çok uyumlu.', level: 'excellent' },
    '5_9': { name: 'KABLEHÜMA VAHİDÜN', meaning: 'Orta derecede uyum.', level: 'moderate' },
    '6_7': { name: 'FİRKAT VE NİFAK', meaning: 'Ayrılık ve uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '6_8': { name: 'İTTİFAK-I MUKARRER', meaning: 'Sağlam birlik. Çok güzel.', level: 'excellent' },
    '6_9': { name: 'NİFAK-I MUKARRER', meaning: 'Sabit uyuşmazlık. Hiç uyumlu değil.', level: 'bad' },
    '7_8': { name: 'İTTİFAK BEYNEHÜMA', meaning: 'Aralarında anlaşma. Çok güzel uyum.', level: 'excellent' },
    '7_9': { name: 'FİRKAT-İ MUKARRER', meaning: 'Sabit ayrılık. Uyumlu değildir.', level: 'bad' },
    '8_9': { name: 'BEYNEHÜMA ADÂVET', meaning: 'Aralarında düşmanlık. Hiç uyumlu değil.', level: 'bad' }
});

// ============================================
// 6. GENEL EBCED BİLGİLERİ
// ============================================
const ebcedInfo = {
    title: '🌟 EBCED HESABI UYGULAMASI',
    subtitle: 'Numeroloji ile İlişkileri Keşfedin',
    definition: 'Eski alfabelerde hecelenmelerin alt tarafında bulunan harf sırası. Her harfin sayısal bir değeri vardır ve isimler aracılığıyla uyum derecesi tespit edilebilir.',
    philosophy: 'Nomen Est Omen - İsim Kaderdir: Her isim bir enerji taşır ve bu enerji kişinin yaşamını şekillendirir.'
};

// ============================================
// 7. UYUM SEVİYELERİ
// ============================================
const harmonyLevels = {
    'excellent': {
        name: '✓ ÇOOK UYUMLU',
        description: 'İlişkide sevgi, sadakat ve uyum çok güçlüdür',
        color: '#10b981',
        icon: '❤️'
    },
    'good': {
        name: '✓ OLDUKÇA GÜZELDİR',
        description: 'İlişki sağlıklı ve dengeli seyretmektedir',
        color: '#3b82f6',
        icon: '💙'
    },
    'moderate': {
        name: '⚠ ORTA HALLİDİR',
        description: 'Çabayla başarılabilir, uyumu çalışmak gerekir',
        color: '#f59e0b',
        icon: '💛'
    },
    'bad': {
        name: '✗ UYUMLU DEĞİLDİR',
        description: 'İlişkide zorluklar yaşanabilir',
        color: '#ef4444',
        icon: '❌'
    }
};

// ============================================
// 8. KULLANIM ALANLARI
// ============================================
const usageAreas = [
    {
        title: '💍 Evlilik Uyumu',
        description: 'Eşler arasında yaşam uyumunu tespit etme',
        details: 'İsim uyumu evlilik müşavırlarınca kullanılır. Çiftler arasındaki uyumun derecesini belirler.'
    },
    {
        title: '🤝 İş Ortaklığı',
        description: 'İş ortağı seçiminde uyum kontrol',
        details: 'Ticari ilişkilerde başarıyı belirlemek için iki kişinin isim uyumuna bakılır.'
    },
    {
        title: '👶 Çocuğa Ad Verme',
        description: 'Ailede uyumlu adlar seçme',
        details: 'Yeni doğan bebeğin adı seçilirken aile üyeleriyle uyum dikkate alınır.'
    },
    {
        title: '💫 İlişki Analizi',
        description: 'Arkadaş, akraba, komşu gibi kişilerin birbirleriyle uyumunu öğrenme',
        details: 'Her türlü insani ilişkinin kalitesi isim uyumu ile belirlenebilir.'
    }
];

// ============================================
// 10. HER RAKAM İÇİN DETAYLI KARARKTERİSTİKLER
// ============================================
const numberCharacteristics = {
    1: {
        zodiac: 'Koç',
        planet: 'Mars / Güneş',
        element: 'Ateş',
        color: 'Kırmızı',
        gemstone: 'Yakut',
        dayOfWeek: 'Salı',
        season: 'İlkbahar',
        profession: ['Lider', 'Girişimci', 'Yönetici', 'Komutan', 'Öncü'],
        health: 'Enerji yüksek, kan dolaşımı aktif, bazen hiperaktif',
        compatibility: {
            love: [3, 5, 7, 9],
            business: [1, 3, 5, 8],
            friend: [2, 4, 6, 9]
        }
    },
    2: {
        zodiac: 'Boğa',
        planet: 'Ay / Venüs',
        element: 'Toprak',
        color: 'Beyaz',
        gemstone: 'İnci',
        dayOfWeek: 'Pazartesi',
        season: 'İlkbahar',
        profession: ['Diplomat', 'Danışman', 'Dış ticaret', 'Pazarlama', 'İnsan kaynakları'],
        health: 'Duygusal denge önemli, sindirim sistemi hassas',
        compatibility: {
            love: [2, 4, 6, 8],
            business: [2, 4, 6, 7],
            friend: [1, 3, 5, 7]
        }
    },
    3: {
        zodiac: 'İkizler',
        planet: 'Merkür',
        element: 'Hava',
        color: 'Sarı',
        gemstone: 'Topaz',
        dayOfWeek: 'Çarşamba',
        season: 'İlkbahar',
        profession: ['Yazarı', 'Ressam', 'Müzisyen', 'Öğretmen', 'Oyuncu'],
        health: 'Sinir sistemi hassas, yaratıcılık önemli',
        compatibility: {
            love: [1, 3, 5, 9],
            business: [1, 3, 6, 9],
            friend: [2, 4, 7, 8]
        }
    },
    4: {
        zodiac: 'Yengeç',
        planet: 'Ay / Uranus',
        element: 'Su',
        color: 'Mavi',
        gemstone: 'Elmas',
        dayOfWeek: 'Cuma',
        season: 'Yaz',
        profession: ['Mühendis', 'Mimar', 'Muhasebeci', 'İnsan', 'Teknikçi'],
        health: 'Sindirim ve üriner sistem önemli, stres yönetimi gerekli',
        compatibility: {
            love: [2, 4, 6, 8],
            business: [1, 4, 7, 8],
            friend: [3, 5, 9]
        }
    },
    5: {
        zodiac: 'Aslan',
        planet: 'Merkür',
        element: 'Ateş',
        color: 'Turuncu',
        gemstone: 'Zümrüt',
        dayOfWeek: 'Çarşamba',
        season: 'Yaz',
        profession: ['Satıcı', 'Rehber', 'Aile danışmanı', 'Seyahat acentası', 'İletişim'],
        health: 'Hareket ve sosyal aktivite gerekli, sinir enerjisi yüksek',
        compatibility: {
            love: [1, 3, 5, 7, 9],
            business: [1, 3, 5, 9],
            friend: [2, 4, 6, 8]
        }
    },
    6: {
        zodiac: 'Başak',
        planet: 'Venüs',
        element: 'Toprak',
        color: 'Yeşil',
        gemstone: 'Zümrüt',
        dayOfWeek: 'Cuma',
        season: 'Yaz',
        profession: ['Hemşire', 'Doktor', 'Danışman', 'Öğretmen', 'Sosyal çalışmacı'],
        health: 'Barış ve huzur mental sağlığı için önemli',
        compatibility: {
            love: [2, 4, 6, 8, 9],
            business: [2, 4, 6, 8],
            friend: [1, 3, 5, 7]
        }
    },
    7: {
        zodiac: 'Terazi',
        planet: 'Neptün',
        element: 'Su',
        color: 'Mor',
        gemstone: 'Safir',
        dayOfWeek: 'Cuma',
        season: 'Sonbahar',
        profession: ['Araştırmacı', 'Felsefeci', 'Psikolog', 'Spirituel danışman', 'Bilim insanı'],
        health: 'İç dünya çalışması önemli, meditasyon faydalı',
        compatibility: {
            love: [1, 3, 5, 7],
            business: [2, 4, 7, 9],
            friend: [1, 3, 5, 8, 9]
        }
    },
    8: {
        zodiac: 'Akrep',
        planet: 'Satürn / Plüton',
        element: 'Su',
        color: 'Siyah',
        gemstone: 'Opal',
        dayOfWeek: 'Cumartesi',
        season: 'Sonbahar',
        profession: ['İşletmeci', 'Avukat', 'Finans müdürü', 'Mimar', 'Yönetici'],
        health: 'Fiziksel güç önemli, egzersiz faydası var',
        compatibility: {
            love: [2, 4, 6, 8],
            business: [1, 4, 8, 9],
            friend: [2, 5, 6]
        }
    },
    9: {
        zodiac: 'Yay',
        planet: 'Jüpiter',
        element: 'Ateş',
        color: 'Altın',
        gemstone: 'Ametist',
        dayOfWeek: 'Perşembe',
        season: 'Sonbahar',
        profession: ['Hukuk müşaviri', 'Öğretmen', 'Yazar', 'Sosyal aktivist', 'Rehber'],
        health: 'Ruh sağlığı önemli, evrensel değerler motivasyon kaynağı',
        compatibility: {
            love: [1, 3, 5, 6, 9],
            business: [3, 5, 6, 9],
            friend: [1, 2, 4, 7, 8]
        }
    }
};

// ============================================
// 11. EVLILIK UYUMU REHBERİ
// ============================================
const marriageGuidance = {
    'excellent': {
        title: '💚 ÇOOK UYUMLU - MÜKEMMEL EVLILIK',
        points: [
            '• Duygusal bağ çok kuvvetli ve sağlam',
            '• İlişkide anlaşmazlık çok az yaşanır',
            '• Karşılıklı sevgi ve sadakat güçlüdür',
            '• Cinsel uyum genellikle iyidir',
            '• Uzun ve mutlu evlilik ihtimali yüksek',
            '• Parasal konularda uyum sağlanabilir',
            '• Çocuk yetiştirmede görüşler yakındır'
        ],
        recommendation: 'Evliliği tavsiye edilir. Bu uyum düzeyinde, çift beraber büyüyüp gelişir.'
    },
    'good': {
        title: '💙 OLDUKÇA GÜZELDİR - SAĞLIKLI EVLILIK',
        points: [
            '• Genel olarak uyumlu ve dengeli bir ilişki',
            '• Küçük anlaşmazlıklar yaşanabilir ama çözülebilir',
            '• Sevgi ve saygı temeli sağlamdır',
            '• Biraz çabala başarılı olunur',
            '• Mutluluğun temeli atılabilir',
            '• Finansal konularda görüş ayrılıkları olabilir',
            '• Cinsel uyum yakalanabilir'
        ],
        recommendation: 'Evliliğe başlanabilir. Birbirine saygı ve anlayış ile başarılı olunabilir.'
    },
    'moderate': {
        title: '💛 ORTA HALLİDİR - ÇABALAR GEREKLİ',
        points: [
            '• İlişki zorluklar içerebilir',
            '• Karşılıklı anlayış ve tolerans gerekli',
            '• Başarı için çift terapisi veya danışmanlık yararlı olabilir',
            '• Küçük sorunlar büyüyebilir',
            '• Finansal konularda anlaşmazlık olabilir',
            '• Cinsel uyumda zorluk yaşanabilir',
            '• Sabır ve empati esasız'
        ],
        recommendation: 'Dikkatli olmak gerekir. Profesyonel danışmanlık önerilir. Birbiriyle çalışmayı kabul ederlerse başarılı olabilirler.'
    },
    'bad': {
        title: '❌ UYUMLU DEĞİLDİR - RİSKLİ',
        points: [
            '• Ciddi anlaşmazlıklar olasıdır',
            '• Duygusal bağ zayıf olabilir',
            '• Finansal konularda sık çatışma',
            '• Cinsel uyumda sorunlar',
            '• Evlilikten boşanma ihtimali yüksek',
            '• Psikolojik sorunlar yaşanabilir',
            '• Çocuklara olumsuz etki edebilir'
        ],
        recommendation: 'Evlilikten önce çok düşünmek, danışmanlık almak önerilir. Zorla devam ettirmek tavsiye edilmez.'
    }
};

// ============================================
// 12. AD VERME REHBERİ
// ============================================
const nameGuidanceForBabies = {
    guidance: 'Bebeğe ad verirken dikkate alınması gereken noktalar:',
    tips: [
        '✓ Ailedeki diğer kişilerle uyumlu bir rakam seçin',
        '✓ Bebeğin doğum gününün enerjisi ile uyum sağlasın',
        '✓ Ebeveynlerin isimlerinin enerjisini desteklesin',
        '✓ Yazılışı ve telaffuzu kolay olsun',
        '✓ Anlam açısından pozitif olsun',
        '✓ Neslimize ve kültürel değerlere uygun olsun',
        '✓ Ses harmonyası güzel olsun',
        '✓ Uzun vadede kişiye "kısmet" getireceğini düşünün'
    ],
    considerations: {
        boyut: 'Erkek isimler genel olarak güçlü enerjili (1,4,5,8) rakamlar ile, kız isimler ise dengeli/huzurlu enerjili (2,6,9) rakamlar ile daha uyumludur (ancak istisna vardır).',
        family: 'Ailede baskın enerji varsa, onu dengeleyici bir rakam seçilmesi aileyi dengeler.',
        health: 'Sağlık sorunları olan çocuklar için belirli rakamlar daha destekleyici olabilir.',
        destiny: 'Adın enerjisi çocuğun yaşam yolunu şekillendirir.'
    }
};

// ============================================
// 13. İŞ ORTAKLIĞI ANALİZİ
// ============================================
const businessPartnershipAnalysis = {
    'excellent': {
        outlook: 'Çok Başarılı',
        description: 'İş ortakları arasında tam uyum. Hedefler ve yönelimler aynı yöne işaret eder.',
        advice: [
            '✓ İşin büyüyeceği ve başarılı olacağı beklenilebilir',
            '✓ Mali konularda anlaşmazlık nadir',
            '✓ Karar verme sürecinde uyum sağlanır',
            '✓ Kriz dönemlerinde birbirini destekler'
        ]
    },
    'good': {
        outlook: 'Başarılı Olabilir',
        description: 'Genel olarak uyumlu bir ortaklık. Küçük sorunlar çıkabilir ama çözülebilir.',
        advice: [
            '✓ İşin başarısı için biraz çaba gerekli',
            '✓ İyi sözleşme ve kurallar belirlemek gerekir',
            '✓ Yükümlülükleri açıkça tanımlamak önemli',
            '✓ Düzenli iletişim halinde olmak faydalı'
        ]
    },
    'moderate': {
        outlook: 'Zorluklarla Karşılaşılabilir',
        description: 'Ortaklar farklı bakış açılarına sahiptir. Dikkatli planlama gerekir.',
        advice: [
            '⚠ Mali çatışmalar olabilir',
            '⚠ Karar verme sürecinde zorluklar',
            '⚠ Birer muhasebeci ve avukat tutmak önerilir',
            '⚠ Yazılı sözleşmeler çok önemli'
        ]
    },
    'bad': {
        outlook: 'Riskli',
        description: 'Ortaklık başarısız olma ihtimali yüksek. Tavsiye edilmez.',
        advice: [
            '✗ Önemli mali sorunlar yaşanabilir',
            '✗ Çatışma ve anlaşmazlıklar sık',
            '✗ İşin başarısı tehlikede',
            '✗ Başlamadan çok düşünmek gerekir'
        ]
    }
};

// ============================================
// 14. YARDIMCI FONKSİYONLAR
// ============================================

/**
 * EBCED değeri hesapla
 */
function calculateEbced(name) {
    if (!name) return null;

    const cleanName = name.toLowerCase().trim();
    let sum = 0;
    const letters = [];

    for (let char of cleanName) {
        if (ebcedMap[char]) {
            const value = ebcedMap[char];
            sum += value;
            letters.push(value);
        }
    }

    if (sum === 0) return null;

    return {
        letters: letters,
        total: sum,
        digit: reduceToSingleDigit(sum)
    };
}

/**
 * Sayıyı tek basamağa indir
 */
function reduceToSingleDigit(num) {
    while (num >= 10) {
        num = Math.floor(num / 10) + (num % 10);
    }
    return num;
}

/**
 * Uyum seviyesi metnini getir
 */
function getLevelText(level) {
    const texts = {
        'excellent': '✓ ÇOOK UYUMLU',
        'good': '✓ OLDUKÇA GÜZELDİR',
        'moderate': '⚠ ORTA HALLİDİR',
        'bad': '✗ UYUMLU DEĞİLDİR'
    };
    return texts[level] || 'Bilinmiyor';
}

/**
 * İki kişi arasındaki uyumu detaylı analiz et
 */
function getHarmonyAnalysis(digit1, digit2, type = 'marriage') {
    const key = `${digit1}_${digit2}`;
    const harmony = harmonies[key] || harmonies[`${digit2}_${digit1}`];

    if (!harmony) return null;

    const guidance = type === 'marriage' ? marriageGuidance[harmony.level] : businessPartnershipAnalysis[harmony.level];

    return {
        ...harmony,
        ...guidance
    };
}
