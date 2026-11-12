// public/languages.js - Çoklu Dil Yönetim Sistemi (Language Preference & Multilingual System)

const SUPPORTED_LANGUAGES = {
    'en': { code: 'en', name: 'İngilizce', nameEn: 'English', flag: '🇬🇧', voice: 'en-US' },
    'tr': { code: 'tr', name: 'Türkçe', nameEn: 'Turkish', flag: '🇹🇷', voice: 'tr-TR' },
    'de': { code: 'de', name: 'Almanca', nameEn: 'German', flag: '🇩🇪', voice: 'de-DE' },
    'es': { code: 'es', name: 'İspanyolca', nameEn: 'Spanish', flag: '🇪🇸', voice: 'es-ES' },
    'fr': { code: 'fr', name: 'Fransızca', nameEn: 'French', flag: '🇫🇷', voice: 'fr-FR' },
    'it': { code: 'it', name: 'İtalyanca', nameEn: 'Italian', flag: '🇮🇹', voice: 'it-IT' },
    'ru': { code: 'ru', name: 'Rusça', nameEn: 'Russian', flag: '🇷🇺', voice: 'ru-RU' }
};

// Almanca, İspanyolca, Fransızca, İtalyanca ve Rusça için temel sözlük karşılıkları
// (comprehensiveWordList İngilizce-Türkçe 540+ kelimeyi kapsar; bu tablo ise diğer diller seçildiğinde dinamik destek sağlar)
const MULTI_LANG_WORDS = [
    { en: "apple", tr: "elma", de: "Apfel", es: "manzana", fr: "pomme", it: "mela", ru: "яблоко" },
    { en: "book", tr: "kitap", de: "Buch", es: "libro", fr: "livre", it: "libro", ru: "книга" },
    { en: "computer", tr: "bilgisayar", de: "Computer", es: "computadora", fr: "ordinateur", it: "computer", ru: "компьютер" },
    { en: "house", tr: "ev", de: "Haus", es: "casa", fr: "maison", it: "casa", ru: "дом" },
    { en: "sun", tr: "güneş", de: "Sonne", es: "sol", fr: "soleil", it: "sole", ru: "солнце" },
    { en: "water", tr: "su", de: "Wasser", es: "agua", fr: "eau", it: "acqua", ru: "вода" },
    { en: "music", tr: "müzik", de: "Musik", es: "música", fr: "musique", it: "musica", ru: "музыка" },
    { en: "time", tr: "zaman", de: "Zeit", es: "tiempo", fr: "temps", it: "tempo", ru: "время" },
    { en: "money", tr: "para", de: "Geld", es: "dinero", fr: "argent", it: "denaro", ru: "деньги" },
    { en: "tree", tr: "ağaç", de: "Baum", es: "árbol", fr: "arbre", it: "albero", ru: "дерево" },
    { en: "world", tr: "dünya", de: "Welt", es: "mundo", fr: "monde", it: "mondo", ru: "мир" },
    { en: "car", tr: "araba", de: "Auto", es: "coche", fr: "voiture", it: "macchina", ru: "машина" },
    { en: "school", tr: "okul", de: "Schule", es: "escuela", fr: "école", it: "scuola", ru: "школа" },
    { en: "friend", tr: "arkadaş", de: "Freund", es: "amigo", fr: "ami", it: "amico", ru: "друг" },
    { en: "family", tr: "aile", de: "Familie", es: "familia", fr: "famille", it: "famiglia", ru: "семья" },
    { en: "city", tr: "şehir", de: "Stadt", es: "ciudad", fr: "ville", it: "città", ru: "город" },
    { en: "work", tr: "iş / çalışmak", de: "Arbeit", es: "trabajo", fr: "travail", it: "lavoro", ru: "работа" },
    { en: "life", tr: "hayat", de: "Leben", es: "vida", fr: "vie", it: "vita", ru: "жизнь" },
    { en: "day", tr: "gün", de: "Tag", es: "día", fr: "jour", it: "giorno", ru: "день" },
    { en: "night", tr: "gece", de: "Nacht", es: "noche", fr: "nuit", it: "notte", ru: "ночь" },
    { en: "heart", tr: "kalp", de: "Herz", es: "corazón", fr: "cœur", it: "cuore", ru: "сердце" },
    { en: "dream", tr: "rüya / hayal", de: "Traum", es: "sueño", fr: "rêve", it: "sogno", ru: "мечта" },
    { en: "peace", tr: "huzur / barış", de: "Frieden", es: "paz", fr: "paix", it: "pace", ru: "мир" },
    { en: "success", tr: "başarı", de: "Erfolg", es: "éxito", fr: "succès", it: "successo", ru: "успех" },
    { en: "freedom", tr: "özgürlük", de: "Freiheit", es: "libertad", fr: "liberté", it: "libertà", ru: "свобода" },
    { en: "language", tr: "dil", de: "Sprache", es: "idioma", fr: "langue", it: "lingua", ru: "язык" },
    { en: "knowledge", tr: "bilgi", de: "Wissen", es: "conocimiento", fr: "connaissance", it: "conoscenza", ru: "знание" },
    { en: "courage", tr: "cesaret", de: "Mut", es: "coraje", fr: "courage", it: "coraggio", ru: "храбрость" },
    { en: "journey", tr: "yolculuk", de: "Reise", es: "viaje", fr: "voyage", it: "viaggio", ru: "путешествие" },
    { en: "hope", tr: "umut", de: "Hoffnung", es: "esperanza", fr: "espoir", it: "speranza", ru: "надежда" },
    { en: "future", tr: "gelecek", de: "Zukunft", es: "futuro", fr: "futur", it: "futuro", ru: "будущее" },
    { en: "strength", tr: "güç / kuvvet", de: "Stärke", es: "fuerza", fr: "force", it: "forza", ru: "сила" },
    { en: "wisdom", tr: "bilgelik", de: "Weisheit", es: "sabiduría", fr: "sagesse", it: "saggezza", ru: "мудрость" },
    { en: "memory", tr: "hafıza / anı", de: "Erinnerung", es: "memoria", fr: "mémoire", it: "memoria", ru: "память" },
    { en: "patience", tr: "sabır", de: "Geduld", es: "paciencia", fr: "patience", it: "pazienza", ru: "терпение" },
    { en: "resilience", tr: "dayanıklılık", de: "Widerstandskraft", es: "resiliencia", fr: "résilience", it: "resilienza", ru: "устойчивость" },
    { en: "appointment", tr: "randevu", de: "Termin", es: "cita", fr: "rendez-vous", it: "appuntamento", ru: "встреча" },
    { en: "achievement", tr: "başarı", de: "Leistung", es: "logro", fr: "accomplissement", it: "conseguimento", ru: "достижение" },
    { en: "attempt", tr: "teşebbüs / deneme", de: "Versuch", es: "intento", fr: "tentative", it: "tentativo", ru: "попытка" },
    { en: "attitude", tr: "tavır / tutum", de: "Einstellung", es: "actitud", fr: "attitude", it: "atteggiamento", ru: "отношение" }
];

const LanguageManager = {
    // 1. Tercihleri Getir (Varsayılan: Öğrenilen=en, Ana Dil=tr, Yön=learning_to_native)
    getPreferences: function() {
        const learning = localStorage.getItem("user_learning_lang") || "en";
        const native = localStorage.getItem("user_native_lang") || "tr";
        const direction = localStorage.getItem("user_word_direction") || "learning_to_native";
        return {
            learningLang: learning,
            nativeLang: native,
            direction: direction
        };
    },

    // 2. Tercihleri Kaydet & Sunucuyla Senkronize Et
    setPreferences: function(nativeLang, learningLang, options = {}) {
        const nLang = nativeLang || "tr";
        const lLang = learningLang || "en";
        const dir = options.direction || localStorage.getItem("user_word_direction") || "learning_to_native";

        localStorage.setItem("user_native_lang", nLang);
        localStorage.setItem("user_learning_lang", lLang);
        localStorage.setItem("user_word_direction", dir);

        // Sunucuya kaydet (kullanıcı giriş yapmışsa)
        const username = localStorage.getItem("username");
        if (username && options.syncServer !== false) {
            fetch(`${window.location.origin}/update-languages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, nativeLang: nLang, learningLang: lLang })
            }).catch(e => console.warn("Dil tercihleri sunucuya senkronize edilemedi:", e));
        }

        // Sayfa genelinde olay tetikle (diğer bileşenler anında güncellensin)
        window.dispatchEvent(new CustomEvent("languagePreferencesChanged", {
            detail: { nativeLang: nLang, learningLang: lLang, direction: dir }
        }));

        return { nativeLang: nLang, learningLang: lLang, direction: dir };
    },

    // 3. Yönü Değiştir (İngilizce ➔ Türkçe  ↔  Türkçe ➔ İngilizce)
    toggleDirection: function() {
        const prefs = this.getPreferences();
        const newDir = (prefs.direction === "learning_to_native") ? "native_to_learning" : "learning_to_native";
        localStorage.setItem("user_word_direction", newDir);

        window.dispatchEvent(new CustomEvent("languagePreferencesChanged", {
            detail: { ...prefs, direction: newDir }
        }));
        return newDir;
    },

    // 4. Dil Bilgisi
    getLanguageMeta: function(code) {
        return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES['en'];
    },

    // 5. Aktif Dillere ve Yöne Göre Kelime Listesini Üret
    getWordList: function() {
        const prefs = this.getPreferences();
        const lCode = prefs.learningLang;
        const nCode = prefs.nativeLang;
        const isReversed = (prefs.direction === "native_to_learning");

        let rawList = [];

        // Standart İngilizce - Türkçe kombinasyonu ise tam 540+ kelimelik comprehensiveWordList'i kullan
        if ((lCode === 'en' && nCode === 'tr') || (lCode === 'tr' && nCode === 'en')) {
            const baseList = (typeof comprehensiveWordList !== 'undefined') ? comprehensiveWordList : [];
            rawList = baseList.map(item => {
                if (lCode === 'en' && nCode === 'tr') {
                    return isReversed 
                        ? { word: item.meaning, meaning: item.word, sourceLang: 'tr', targetLang: 'en' }
                        : { word: item.word, meaning: item.meaning, sourceLang: 'en', targetLang: 'tr' };
                } else {
                    // Öğrenilen: Türkçe, Ana dil: İngilizce
                    return isReversed
                        ? { word: item.word, meaning: item.meaning, sourceLang: 'en', targetLang: 'tr' }
                        : { word: item.meaning, meaning: item.word, sourceLang: 'tr', targetLang: 'en' };
                }
            });
        } else {
            // Diğer diller (Almanca, İspanyolca, Fransızca, İtalyanca, Rusça vb.)
            rawList = MULTI_LANG_WORDS.map(item => {
                const lText = item[lCode] || item['en'] || "";
                const nText = item[nCode] || item['tr'] || "";
                return isReversed
                    ? { word: nText, meaning: lText, sourceLang: nCode, targetLang: lCode }
                    : { word: lText, meaning: nText, sourceLang: lCode, targetLang: nCode };
            });
        }

        return rawList;
    },

    // 6. Sayfa Üstü Dil Seçim ve Yön Çubuğu UI Bileşeni (Language Bar)
    renderBar: function(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const prefs = this.getPreferences();
        const lMeta = this.getLanguageMeta(prefs.learningLang);
        const nMeta = this.getLanguageMeta(prefs.nativeLang);
        const isRev = (prefs.direction === "native_to_learning");

        const leftLang = isRev ? nMeta : lMeta;
        const rightLang = isRev ? lMeta : nMeta;
        const leftRole = isRev ? "Ana Dil" : "Öğrenilen Dil";
        const rightRole = isRev ? "Öğrenilen Dil" : "Ana Dil";

        container.innerHTML = `
            <div class="lang-bar-wrapper" style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(15, 23, 42, 0.75);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                padding: 6px 14px;
                border-radius: 30px;
                font-size: 0.82rem;
                color: #e2e8f0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                flex-wrap: wrap;
                justify-content: center;
            ">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size:1.1rem;">${leftLang.flag}</span>
                    <strong style="color:#ffffff;">${leftLang.name}</strong>
                    <span style="font-size:0.7rem; color:#94a3b8; background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:10px;">${leftRole}</span>
                </div>

                <span style="color:#38bdf8; font-weight:bold; font-size:1rem;">➔</span>

                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size:1.1rem;">${rightLang.flag}</span>
                    <strong style="color:#ffffff;">${rightLang.name}</strong>
                    <span style="font-size:0.7rem; color:#94a3b8; background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:10px;">${rightRole}</span>
                </div>

                <button type="button" id="btnToggleDirection" title="Dillerin Yönünü Değiştir" style="
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.35);
                    color: #38bdf8;
                    padding: 4px 10px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.78rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: 0.2s;
                " onmouseover="this.style.background='rgba(56,189,248,0.3)'" onmouseout="this.style.background='rgba(56,189,248,0.15)'">
                    🔄 <span>Yön Değiştir</span>
                </button>

                <button type="button" id="btnOpenLangModal" title="Dil Seçeneklerini Ayarla" style="
                    background: rgba(99, 102, 241, 0.2);
                    border: 1px solid rgba(99, 102, 241, 0.4);
                    color: #a5b4fc;
                    padding: 4px 10px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.78rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: 0.2s;
                " onmouseover="this.style.background='rgba(99,102,241,0.35)'" onmouseout="this.style.background='rgba(99,102,241,0.2)'">
                    🌐 <span>Dilleri Değiştir</span>
                </button>
            </div>
        `;

        document.getElementById("btnToggleDirection").onclick = () => {
            this.toggleDirection();
            this.renderBar(containerId, options);
            if (options.onDirectionChange) options.onDirectionChange();
        };

        document.getElementById("btnOpenLangModal").onclick = () => {
            this.openModal(() => {
                this.renderBar(containerId, options);
                if (options.onLanguageChange) options.onLanguageChange();
            });
        };
    },

    // 7. Dil Seçim Modalı (Modal Dialog)
    openModal: function(onSavedCallback) {
        let modal = document.getElementById("langPreferenceModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "langPreferenceModal";
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                padding: 15px;
            `;
            document.body.appendChild(modal);
        }

        const prefs = this.getPreferences();

        const langOptions = Object.values(SUPPORTED_LANGUAGES).map(l => 
            `<option value="${l.code}">${l.flag} ${l.name} (${l.nameEn})</option>`
        ).join("");

        modal.innerHTML = `
            <div style="
                background: #1e293b;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                width: 100%;
                max-width: 440px;
                padding: 24px;
                color: #ffffff;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                position: relative;
                font-family: 'Poppins', sans-serif;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                    <h3 style="margin:0; font-size:1.15rem; color:#f8fafc; display:flex; align-items:center; gap:8px;">
                        🌐 Dil Tercihleri
                    </h3>
                    <button type="button" id="closeLangModalBtn" style="
                        background: rgba(255,255,255,0.08); border:none; color:#94a3b8;
                        width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1rem;
                    ">✕</button>
                </div>

                <p style="color:#94a3b8; font-size:0.84rem; line-height:1.4; margin-bottom:18px;">
                    Öğrenmek istediğiniz dili ve ana dilinizi seçin. Tüm testler, eşleştirmeler ve kelime listeleri seçiminize göre anında uyarlanacaktır.
                </p>

                <div style="margin-bottom:14px; text-align:left;">
                    <label style="display:block; font-size:0.8rem; font-weight:600; color:#38bdf8; margin-bottom:6px;">
                        🎯 Öğrenilen Dil (Learning Language):
                    </label>
                    <select id="modalLearningSelect" style="
                        width:100%; padding:10px 12px; border-radius:10px; background:#0f172a;
                        color:#ffffff; border:1px solid rgba(255,255,255,0.15); font-size:0.9rem;
                    ">
                        ${langOptions}
                    </select>
                </div>

                <div style="margin-bottom:18px; text-align:left;">
                    <label style="display:block; font-size:0.8rem; font-weight:600; color:#10b981; margin-bottom:6px;">
                        🏠 Ana Dil (Native Language):
                    </label>
                    <select id="modalNativeSelect" style="
                        width:100%; padding:10px 12px; border-radius:10px; background:#0f172a;
                        color:#ffffff; border:1px solid rgba(255,255,255,0.15); font-size:0.9rem;
                    ">
                        ${langOptions}
                    </select>
                </div>

                <div style="
                    background: rgba(56, 189, 248, 0.1);
                    border: 1px solid rgba(56, 189, 248, 0.25);
                    padding: 10px 14px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    color: #bae6fd;
                    margin-bottom: 20px;
                    text-align: left;
                    line-height: 1.4;
                " id="modalPreviewHint">
                    💡 <strong>Test Formatı:</strong> Öğrenilen dildeki kelimelerin ana dilinizdeki karşılıklarını bulacaksınız.
                </div>

                <button type="button" id="modalSaveLangBtn" style="
                    width: 100%;
                    background: linear-gradient(135deg, #4f46e5 0%, #0284c7 100%);
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.92rem;
                    transition: 0.2s;
                ">Kaydet & Uygula</button>
            </div>
        `;

        modal.style.display = "flex";

        const learnSel = document.getElementById("modalLearningSelect");
        const natSel = document.getElementById("modalNativeSelect");
        learnSel.value = prefs.learningLang;
        natSel.value = prefs.nativeLang;

        function updateHint() {
            const l = SUPPORTED_LANGUAGES[learnSel.value] || { name: 'İngilizce', flag: '🇬🇧' };
            const n = SUPPORTED_LANGUAGES[natSel.value] || { name: 'Türkçe', flag: '🇹🇷' };
            document.getElementById("modalPreviewHint").innerHTML = `
                💡 <strong>Test Akışı:</strong> <strong>${l.flag} ${l.name}</strong> kelimeleri sorulacak, sizden <strong>${n.flag} ${n.name}</strong> karşılıklarını bulmanız istenecek.
            `;
        }

        learnSel.onchange = updateHint;
        natSel.onchange = updateHint;
        updateHint();

        document.getElementById("closeLangModalBtn").onclick = () => {
            modal.style.display = "none";
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };

        document.getElementById("modalSaveLangBtn").onclick = () => {
            const newLearning = learnSel.value;
            const newNative = natSel.value;
            if (newLearning === newNative) {
                alert("Öğrenilen dil ile Ana dil birbirinden farklı olmalıdır!");
                return;
            }
            LanguageManager.setPreferences(newNative, newLearning);
            modal.style.display = "none";
            if (onSavedCallback) onSavedCallback({ nativeLang: newNative, learningLang: newLearning });
        };
    }
};

// Global dışa aktarım
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.LanguageManager = LanguageManager;

