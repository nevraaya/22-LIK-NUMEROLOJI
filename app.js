// Tab Navigation
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');

        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(tab).classList.add('active');

        // Rakamlar sekmesinde otomatik yükle
        if (tab === 'numbers') {
            showAllNumbers();
        }
    });
});

// Tek İsim Analizi
function analyzeSingle() {
    const name = document.getElementById('singleName').value.trim();
    const result = document.getElementById('singleResult');

    if (!name) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen bir isim giriniz</div>';
        result.classList.add('show');
        return;
    }

    const ebcedResult = calculateEbced(name);
    if (!ebcedResult) {
        result.innerHTML = '<div class="error-message">⚠️ Geçerli bir isim giriniz</div>';
        result.classList.add('show');
        return;
    }

    const digit = ebcedResult.digit;
    const analysis = nameAnalysis[digit];
    const characteristics = numberCharacteristics[digit];

    let html = `
        <div class="result-card">
            <h3>${name.toUpperCase()} - ${analysis.type}</h3>
            <div style="margin: 15px 0;">
                <span class="number-badge">📊 EBCED: ${ebcedResult.total}</span>
                <span class="number-badge">🔢 RAKAM: ${digit}</span>
            </div>
        </div>

        <div class="harmony-badge harmony-excellent">
            ${analysis.energy}
        </div>

        <div class="result-card">
            <h3>📖 Açıklama</h3>
            <p style="line-height: 1.8; color: #6b7280;">${analysis.meaning}</p>
        </div>

        <div class="grid-2">
            <div class="box">
                <h4>🎯 Yaşam Alanları</h4>
                <p>${analysis.lifeArea}</p>
            </div>
            <div class="box">
                <h4>💡 Tavsiye</h4>
                <p>${analysis.recommendation}</p>
            </div>
        </div>

        <h3 style="margin-top: 35px; color: var(--primary); font-size: 1.3em;">✨ Kişilik Özellikleri</h3>
        <div class="grid-2 grid-3">
            <div class="box">
                <h4>⚡ Enerjisi</h4>
                <p>${letterEnergies[digit].energy}</p>
            </div>
            <div class="box">
                <h4>📋 Özellikleri</h4>
                <ul class="traits-list">
                    ${letterEnergies[digit].traits.map(trait => `<li>${trait}</li>`).join('')}
                </ul>
            </div>
            <div class="box">
                <h4>👤 Karakter</h4>
                <p>${letterEnergies[digit].character}</p>
            </div>
        </div>

        <h3 style="margin-top: 35px; color: var(--primary); font-size: 1.3em;">🌍 Detaylı Özellikleri</h3>
        <div class="grid-2 grid-3">
            <div class="box">
                <h4>♈ Zodiyak</h4>
                <p>${characteristics.zodiac}</p>
            </div>
            <div class="box">
                <h4>🪐 Gezegen</h4>
                <p>${characteristics.planet}</p>
            </div>
            <div class="box">
                <h4>🔥 Element</h4>
                <p>${characteristics.element}</p>
            </div>
            <div class="box">
                <h4>🎨 Renk</h4>
                <p>${characteristics.color}</p>
            </div>
            <div class="box">
                <h4>💎 Taş</h4>
                <p>${characteristics.gemstone}</p>
            </div>
            <div class="box">
                <h4>📅 Gün</h4>
                <p>${characteristics.dayOfWeek}</p>
            </div>
        </div>

        <h3 style="margin-top: 35px; color: var(--primary); font-size: 1.3em;">💼 Uygun Meslekler</h3>
        <div class="result-card">
            <ul class="traits-list">
                ${characteristics.profession.map(prof => `<li>${prof}</li>`).join('')}
            </ul>
        </div>

        <h3 style="margin-top: 35px; color: var(--primary); font-size: 1.3em;">❤️ Uyum Bilgileri</h3>
        <div class="grid-2 grid-3">
            <div class="box">
                <h4>💕 Aşk Uyumu</h4>
                <p><strong>${characteristics.compatibility.love.join(', ')}</strong></p>
            </div>
            <div class="box">
                <h4>💼 İş Uyumu</h4>
                <p><strong>${characteristics.compatibility.business.join(', ')}</strong></p>
            </div>
            <div class="box">
                <h4>🤝 Dostluk Uyumu</h4>
                <p><strong>${characteristics.compatibility.friend.join(', ')}</strong></p>
            </div>
        </div>
    `;

    result.innerHTML = html;
    result.classList.add('show');
}

// İki Kişi Uyumu
function analyzeHarmony() {
    const name1 = document.getElementById('name1').value.trim();
    const name2 = document.getElementById('name2').value.trim();
    const result = document.getElementById('harmonyResult');

    if (!name1 || !name2) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen her iki ismi de giriniz</div>';
        result.classList.add('show');
        return;
    }

    const result1 = calculateEbced(name1);
    const result2 = calculateEbced(name2);

    if (!result1 || !result2) {
        result.innerHTML = '<div class="error-message">⚠️ Geçerli isimleri giriniz</div>';
        result.classList.add('show');
        return;
    }

    const digit1 = result1.digit;
    const digit2 = result2.digit;

    const harmonyKey = `${digit1}_${digit2}`;
    const harmony = harmonies[harmonyKey] || harmonies[`${digit2}_${digit1}`];

    const harmonyLevel = harmonyLevels[harmony.level];

    let html = `
        <div class="comparison">
            <div class="person-box">
                <h3>${name1.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit1}</span>
                <p style="margin-top: 10px; color: #6b7280;">${nameAnalysis[digit1].type}</p>
            </div>
            <div class="person-box">
                <h3>${name2.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit2}</span>
                <p style="margin-top: 10px; color: #6b7280;">${nameAnalysis[digit2].type}</p>
            </div>
        </div>

        <div class="divider"></div>

        <div class="harmony-badge harmony-${harmony.level}" style="font-size: 1.2em; font-weight: 600;">
            ${harmonyLevel.icon} ${harmonyLevel.name}
        </div>

        <div class="result-card">
            <h3>📖 Uyum Adı</h3>
            <p style="font-size: 1.1em; color: var(--primary); font-weight: 600;">${harmony.name}</p>
            <p style="margin-top: 15px; line-height: 1.8; color: #6b7280;">${harmony.meaning}</p>
        </div>

        <div class="result-card">
            <h3>ℹ️ Uyum Derecesi</h3>
            <p style="line-height: 1.8; color: #6b7280;">${harmonyLevel.description}</p>
        </div>
    `;

    result.innerHTML = html;
    result.classList.add('show');
}

// Evlilik Analizi
function analyzeMarriage() {
    const wife = document.getElementById('wifeName').value.trim();
    const husband = document.getElementById('husbandName').value.trim();
    const result = document.getElementById('marriageResult');

    if (!wife || !husband) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen her iki ismi de giriniz</div>';
        result.classList.add('show');
        return;
    }

    const wifeResult = calculateEbced(wife);
    const husbandResult = calculateEbced(husband);

    if (!wifeResult || !husbandResult) {
        result.innerHTML = '<div class="error-message">⚠️ Geçerli isimleri giriniz</div>';
        result.classList.add('show');
        return;
    }

    const digit1 = wifeResult.digit;
    const digit2 = husbandResult.digit;

    const harmonyKey = `${digit1}_${digit2}`;
    const harmony = harmonies[harmonyKey] || harmonies[`${digit2}_${digit1}`];
    const guidance = marriageGuidance[harmony.level];

    let html = `
        <div class="comparison">
            <div class="person-box">
                <h3>${wife.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit1}</span>
            </div>
            <div class="person-box">
                <h3>${husband.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit2}</span>
            </div>
        </div>

        <div class="divider"></div>

        <div class="harmony-badge harmony-${harmony.level}" style="font-size: 1.2em; font-weight: 600;">
            ${guidance.title}
        </div>

        <h3 style="margin-top: 30px; color: var(--primary); font-size: 1.3em;">💭 Detaylı Analiz</h3>
        <div class="result-card">
            <ul class="tips-list">
                ${guidance.points.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>

        <div class="result-card" style="margin-top: 30px;">
            <h3>💡 Tavsiye</h3>
            <p style="line-height: 1.8; color: #6b7280;">${guidance.recommendation}</p>
        </div>
    `;

    result.innerHTML = html;
    result.classList.add('show');
}

// İş Ortaklığı Analizi
function analyzeBusinessPartnership() {
    const partner1 = document.getElementById('partner1Name').value.trim();
    const partner2 = document.getElementById('partner2Name').value.trim();
    const result = document.getElementById('businessResult');

    if (!partner1 || !partner2) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen her iki ortak ismini de giriniz</div>';
        result.classList.add('show');
        return;
    }

    const partner1Result = calculateEbced(partner1);
    const partner2Result = calculateEbced(partner2);

    if (!partner1Result || !partner2Result) {
        result.innerHTML = '<div class="error-message">⚠️ Geçerli isimleri giriniz</div>';
        result.classList.add('show');
        return;
    }

    const digit1 = partner1Result.digit;
    const digit2 = partner2Result.digit;

    const harmonyKey = `${digit1}_${digit2}`;
    const harmony = harmonies[harmonyKey] || harmonies[`${digit2}_${digit1}`];
    const guidance = businessPartnershipAnalysis[harmony.level];

    let html = `
        <div class="comparison">
            <div class="person-box">
                <h3>${partner1.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit1}</span>
            </div>
            <div class="person-box">
                <h3>${partner2.toUpperCase()}</h3>
                <span class="number-badge">🔢 Rakam: ${digit2}</span>
            </div>
        </div>

        <div class="divider"></div>

        <div class="harmony-badge harmony-${harmony.level}" style="font-size: 1.2em; font-weight: 600;">
            <strong>${guidance.outlook}</strong>
        </div>

        <div class="result-card">
            <h3>📊 Ortaklık Görünümü</h3>
            <p style="line-height: 1.8; color: #6b7280;">${guidance.description}</p>
        </div>

        <h3 style="margin-top: 30px; color: var(--primary); font-size: 1.3em;">✓ Tavsiyeler</h3>
        <div class="result-card">
            <ul class="tips-list">
                ${guidance.advice.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;

    result.innerHTML = html;
    result.classList.add('show');
}

// Ad Verme Rehberi
function analyzeNameForBaby() {
    const babyName = document.getElementById('babyName').value.trim();
    const gender = document.getElementById('babyGender').value;
    const parentName = document.getElementById('parentName').value.trim();
    const result = document.getElementById('babyResult');

    if (!babyName) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen bebeğin adını giriniz</div>';
        result.classList.add('show');
        return;
    }

    const nameResult = calculateEbced(babyName);
    if (!nameResult) {
        result.innerHTML = '<div class="error-message">⚠️ Geçerli bir ad giriniz</div>';
        result.classList.add('show');
        return;
    }

    const digit = nameResult.digit;
    const analysis = nameAnalysis[digit];
    const characteristics = numberCharacteristics[digit];

    let html = `
        <div class="result-card">
            <h3>${babyName.toUpperCase()} - Ad Analizi</h3>
            <div style="margin: 15px 0;">
                <span class="number-badge">📊 EBCED: ${nameResult.total}</span>
                <span class="number-badge">🔢 RAKAM: ${digit}</span>
                ${gender ? `<span class="number-badge">${gender === 'boy' ? '👦 Erkek' : '👧 Kız'}</span>` : ''}
            </div>
        </div>

        <h3 style="margin-top: 30px; color: var(--primary); font-size: 1.3em;">📖 Ad Rehberi</h3>
        <div class="result-card">
            <ul class="tips-list">
                ${nameGuidanceForBabies.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>

        <div class="divider"></div>

        <h3 style="color: var(--primary); font-size: 1.3em;">✨ Adın Enerjisi</h3>
        <div class="result-card">
            <h3>${analysis.type}</h3>
            <div class="harmony-badge harmony-excellent" style="margin: 15px 0;">
                ${analysis.energy}
            </div>
            <p style="line-height: 1.8; color: #6b7280; margin-top: 15px;">${analysis.meaning}</p>
        </div>

        <h3 style="margin-top: 30px; color: var(--primary); font-size: 1.3em;">👨‍👩‍👧 Aile Uyumu</h3>
        <div class="result-card">
            <h4 style="color: var(--primary); margin-bottom: 10px;">Tavsiye</h4>
            <p style="line-height: 1.8; color: #6b7280;">${nameGuidanceForBabies.considerations.family}</p>
        </div>
    `;

    if (parentName) {
        const parentResult = calculateEbced(parentName);
        if (parentResult) {
            const parentDigit = parentResult.digit;
            const harmonyKey = `${digit}_${parentDigit}`;
            const harmony = harmonies[harmonyKey] || harmonies[`${parentDigit}_${digit}`];
            const harmonyLevel = harmonyLevels[harmony.level];

            html += `
                <h3 style="margin-top: 30px; color: var(--primary); font-size: 1.3em;">❤️ Ebeveyn Uyumu</h3>
                <div class="person-box">
                    <p><strong>Ebeveyn:</strong> ${parentName.toUpperCase()} (Rakam: ${parentDigit})</p>
                    <p><strong>Bebek:</strong> ${babyName.toUpperCase()} (Rakam: ${digit})</p>
                </div>
                <div class="harmony-badge harmony-${harmony.level}" style="margin-top: 15px;">
                    ${harmonyLevel.icon} ${harmonyLevel.name}
                </div>
                <p style="margin-top: 15px; line-height: 1.8; color: #6b7280;">${harmony.meaning}</p>
            `;
        }
    }

    result.innerHTML = html;
    result.classList.add('show');
}

// Tüm Rakamları Göster
function showAllNumbers() {
    const result = document.getElementById('numbersResult');

    if (result.classList.contains('show')) return;

    let html = '<div class="char-grid">';

    for (let i = 1; i <= 9; i++) {
        const analysis = nameAnalysis[i];
        const characteristics = numberCharacteristics[i];

        html += `
            <div class="char-card">
                <div class="char-number">${i}</div>
                <div class="char-name">${analysis.type.split(' ')[0]}</div>
                <div class="char-info">
                    <strong>🪐</strong> ${characteristics.planet}<br>
                    <strong>🔥</strong> ${characteristics.element}<br>
                    <strong>🎨</strong> ${characteristics.color}
                </div>
            </div>
        `;
    }

    html += '</div>';

    html += '<div class="divider"></div>';
    html += '<h3 style="color: var(--primary); margin-top: 30px; margin-bottom: 25px; font-size: 1.3em;">📊 Detaylı Özellikleri</h3>';

    for (let i = 1; i <= 9; i++) {
        const analysis = nameAnalysis[i];
        const characteristics = numberCharacteristics[i];

        html += `
            <div class="result-card" style="margin-bottom: 25px;">
                <h3 style="color: var(--primary);">${i}. RAKAM - ${analysis.type}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div style="color: #6b7280;">
                        <p><strong>Harfler:</strong> ${letterEnergies[i].letter}</p>
                        <p><strong>Enerji:</strong> ${letterEnergies[i].energy}</p>
                        <p><strong>Gezegen:</strong> ${characteristics.planet}</p>
                        <p><strong>Zodiyak:</strong> ${characteristics.zodiac}</p>
                    </div>
                    <div style="color: #6b7280;">
                        <p><strong>Element:</strong> ${characteristics.element}</p>
                        <p><strong>Renk:</strong> ${characteristics.color}</p>
                        <p><strong>Taş:</strong> ${characteristics.gemstone}</p>
                        <p><strong>Gün:</strong> ${characteristics.dayOfWeek}</p>
                    </div>
                </div>
                <p style="margin-top: 15px; line-height: 1.8; color: #6b7280;">${analysis.meaning}</p>
            </div>
        `;
    }

    result.innerHTML = html;
    result.classList.add('show');
}

// Harflerle İsim Analizi
function analyzeLetterByLetter() {
    const name = document.getElementById('lettersName').value.trim();
    const result = document.getElementById('lettersResult');

    if (!name) {
        result.innerHTML = '<div class="error-message">⚠️ Lütfen bir isim giriniz</div>';
        result.classList.add('show');
        return;
    }

    const letters = name.toLowerCase().split('');
    let html = `<div class="result-card"><h3>✨ ${name.toUpperCase()} - HARFLERİN ANALİZİ</h3></div>`;
    
    // Her harfin card'ını oluştur
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 30px 0;">';
    
    let totalDigit = 0;
    letters.forEach((letter, index) => {
        const ebcedValue = ebcedMap[letter] || 0;
        const analysis = letterAnalysis[letter] || letterAnalysis[letter.toUpperCase()];
        
        if (analysis) {
            totalDigit += ebcedValue;
            const bright = analysis.bright || 'Bilgi bulunmuyor';
            const kabbalistic = analysis.kabbalistic || 'Bilinmiyor';
            
            html += `
                <div class="harmony-card" style="border-left: 4px solid var(--primary); padding: 15px; border-radius: 8px; background: var(--light);">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${letter.toUpperCase()}</div>
                    <div style="color: #6b7280; font-size: 0.9em; line-height: 1.6;">
                        <p><strong>Rakam:</strong> ${ebcedValue}</p>
                        <p><strong>Kabala:</strong> ${kabbalistic}</p>
                        <p style="margin-top: 10px; font-style: italic; color: #4b5563;">"${bright}"</p>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    
    // Toplam enerji
    const finalDigit = reduceToSingleDigit(totalDigit);
    const finalAnalysis = nameAnalysis[finalDigit];
    
    html += `
        <div class="result-card" style="border: 2px solid var(--primary); background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: var(--primary);">📊 TOPLAM ENERJİ</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #6b7280;">EBCED Toplam</div>
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary);">${totalDigit}</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #6b7280;">İndirgeme</div>
                    <div style="font-size: 2em; font-weight: bold; color: var(--accent);">${finalDigit}</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #6b7280;">Enerji Tipi</div>
                    <div style="font-size: 1.1em; font-weight: bold; color: var(--primary);">${finalAnalysis.type}</div>
                </div>
            </div>
            <p style="margin-top: 15px; line-height: 1.8; color: #6b7280;">${finalAnalysis.meaning}</p>
        </div>
    `;
    
    result.innerHTML = html;
    result.classList.add('show');
}
