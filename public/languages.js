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

// ============================================================
// UI ÇEVIRI SİSTEMİ — Arayüz metinleri Ana Dile (nativeLang) göre
// ============================================================
const UI_TRANSLATIONS = {
    tr: {
        // Genel Navigasyon
        home: 'Anasayfa', panel: 'Panel', logout: 'Çıkış Yap',
        messages: 'Mesajlar & AI', wordList: 'Kelime Listesi',
        wordTest: 'Kelime Testi', wordMatch: 'Kelime Eşleştirme',
        videoMentor: 'Görüntülü Mentor', mockInterview: 'Mock Interview',
        profile: 'Profilim', settings: 'Ayarlar', back: 'Geri',
        // Dashboard
        welcome: 'Hoşgeldiniz',
        progressTitle: 'İlerleme Durumu',
        knownWords: 'Bilinen Kelime Sayısı',
        totalWords: 'Toplam Kelime',
        changeLanguage: 'Dili Değiştir',
        // Profil
        myFavWords: 'Favori Kelimelerim',
        users: 'Kullanıcılar',
        followers: 'Takipçi',
        following: 'Takip Edilen',
        nativeLang: 'Ana Dil',
        learningLang: 'Öğrenilen Dil',
        langPreference: '🌐 Dil Tercihi',
        deleteAccount: 'Hesabı Sil',
        // Kelime Listesi
        allWords: 'Tüm Kelimeler',
        searchPlaceholder: 'Kelime ara...',
        noMatch: 'Eşleşen kelime bulunamadı.',
        favorite: 'Favori',
        // Kelime Testi
        classicTest: '📝 Klasik Kelime Testi',
        aiTest: '🤖 AI Boşluk Doldurma & Soru',
        questionLabel: 'Bu kelimenin',
        questionSuffix: 'karşılığı nedir?',
        questionNum: 'Soru',
        questionRepeat: '(Tekrar)',
        // Eşleştirme
        matchTitle: 'Kelime Eşleştirme',
        matchSubtitle: 'Kelimeleri doğru anlamlarıyla eşleştirin.',
        matchTip: '📱 İpucu: Önce bir kelimeye dokunun, ardından doğru anlamına dokunarak eşleştirin!',
        matched: 'Eşleşen',
        score: 'Puan',
        newRound: 'Yeni Tur',
        wordsLabel: 'Kelimeler (Seçin veya Sürükleyin):',
        meaningsLabel: 'Karşılıkları:',
        // Yön Çubuğu
        changeDirection: '🔄 Yön Değiştir',
        changeLanguages: '🌐 Dilleri Değiştir',
        // Dil Seçim Modal
        langPreferenceTitle: '🌐 Dil Tercihleri',
        learningLangLabel: '🎯 Öğrenilen Dil (Learning Language):',
        nativeLangLabel: '🏠 Ana Dil (Native Language):',
        saveApply: 'Kaydet & Uygula',
        langMustDiffer: 'Öğrenilen dil ile Ana dil birbirinden farklı olmalıdır!',
        // Diğer
        visitProfile: 'Profili Gör',
        talkBtn: 'Konuş 🎓',
        followBtn: 'Takip Et',
        followingBtn: 'Takip Ediliyor',
        sendMessage: 'Mesaj Gönder',
        viewFavorites: 'Favori Kelimeleri Gör',
        noFavorites: 'Henüz favori kelimesi yok.',
        listingWords: 'kelime listeleniyor.',
    },
    en: {
        home: 'Home', panel: 'Dashboard', logout: 'Log Out',
        messages: 'Messages & AI', wordList: 'Word List',
        wordTest: 'Word Quiz', wordMatch: 'Word Match',
        videoMentor: 'Video Mentor', mockInterview: 'Mock Interview',
        profile: 'My Profile', settings: 'Settings', back: 'Back',
        welcome: 'Welcome',
        progressTitle: 'Progress',
        knownWords: 'Words Learned',
        totalWords: 'Total Words',
        changeLanguage: 'Change Language',
        myFavWords: 'My Favourite Words',
        users: 'Users',
        followers: 'Followers',
        following: 'Following',
        nativeLang: 'Native Language',
        learningLang: 'Learning Language',
        langPreference: '🌐 Language Settings',
        deleteAccount: 'Delete Account',
        allWords: 'All Words',
        searchPlaceholder: 'Search words...',
        noMatch: 'No matching words found.',
        favorite: 'Favorite',
        classicTest: '📝 Classic Word Quiz',
        aiTest: '🤖 AI Fill-in & Questions',
        questionLabel: 'What is the',
        questionSuffix: 'equivalent of this word?',
        questionNum: 'Question',
        questionRepeat: '(Retry)',
        matchTitle: 'Word Matching',
        matchSubtitle: 'Match the words with their correct meanings.',
        matchTip: '📱 Tip: Tap a word first, then tap its correct meaning to match!',
        matched: 'Matched',
        score: 'Score',
        newRound: 'New Round',
        wordsLabel: 'Words (Tap or Drag):',
        meaningsLabel: 'Meanings:',
        changeDirection: '🔄 Flip Direction',
        changeLanguages: '🌐 Change Languages',
        langPreferenceTitle: '🌐 Language Preferences',
        learningLangLabel: '🎯 Learning Language:',
        nativeLangLabel: '🏠 Native Language:',
        saveApply: 'Save & Apply',
        langMustDiffer: 'Learning language and Native language must be different!',
        visitProfile: 'Visit Profile',
        talkBtn: 'Talk 🎓',
        followBtn: 'Follow',
        followingBtn: 'Following',
        sendMessage: 'Send Message',
        viewFavorites: 'View Favourite Words',
        noFavorites: 'No favourite words yet.',
        listingWords: 'words listed.',
    },
    de: {
        home: 'Startseite', panel: 'Dashboard', logout: 'Abmelden',
        messages: 'Nachrichten & KI', wordList: 'Wortliste',
        wordTest: 'Wörterquiz', wordMatch: 'Wörter zuordnen',
        videoMentor: 'Video-Mentor', mockInterview: 'Mock-Interview',
        profile: 'Mein Profil', settings: 'Einstellungen', back: 'Zurück',
        welcome: 'Willkommen',
        progressTitle: 'Fortschritt',
        knownWords: 'Gelernte Wörter',
        totalWords: 'Gesamtwörter',
        changeLanguage: 'Sprache ändern',
        myFavWords: 'Meine Lieblingswörter',
        users: 'Benutzer',
        followers: 'Follower',
        following: 'Gefolgt',
        nativeLang: 'Muttersprache',
        learningLang: 'Lernsprache',
        langPreference: '🌐 Spracheinstellungen',
        deleteAccount: 'Konto löschen',
        allWords: 'Alle Wörter',
        searchPlaceholder: 'Wörter suchen...',
        noMatch: 'Keine passenden Wörter gefunden.',
        favorite: 'Favorit',
        classicTest: '📝 Klassisches Wörterquiz',
        aiTest: '🤖 KI-Lückentext & Fragen',
        questionLabel: 'Was ist das',
        questionSuffix: 'Äquivalent dieses Wortes?',
        questionNum: 'Frage',
        questionRepeat: '(Wiederholen)',
        matchTitle: 'Wörter zuordnen',
        matchSubtitle: 'Ordnen Sie die Wörter den richtigen Bedeutungen zu.',
        matchTip: '📱 Tipp: Tippen Sie zuerst auf ein Wort, dann auf die richtige Bedeutung!',
        matched: 'Zugeordnet',
        score: 'Punktzahl',
        newRound: 'Neue Runde',
        wordsLabel: 'Wörter (Tippen oder Ziehen):',
        meaningsLabel: 'Bedeutungen:',
        changeDirection: '🔄 Richtung wechseln',
        changeLanguages: '🌐 Sprachen ändern',
        langPreferenceTitle: '🌐 Spracheinstellungen',
        learningLangLabel: '🎯 Lernsprache:',
        nativeLangLabel: '🏠 Muttersprache:',
        saveApply: 'Speichern & Anwenden',
        langMustDiffer: 'Lernsprache und Muttersprache müssen unterschiedlich sein!',
        visitProfile: 'Profil besuchen',
        talkBtn: 'Sprechen 🎓',
        followBtn: 'Folgen',
        followingBtn: 'Gefolgt',
        sendMessage: 'Nachricht senden',
        viewFavorites: 'Lieblingswörter ansehen',
        noFavorites: 'Noch keine Lieblingswörter.',
        listingWords: 'Wörter aufgelistet.',
    },
    es: {
        home: 'Inicio', panel: 'Panel', logout: 'Cerrar sesión',
        messages: 'Mensajes & IA', wordList: 'Lista de palabras',
        wordTest: 'Quiz de palabras', wordMatch: 'Emparejar palabras',
        videoMentor: 'Mentor de video', mockInterview: 'Entrevista simulada',
        profile: 'Mi perfil', settings: 'Configuración', back: 'Volver',
        welcome: 'Bienvenido',
        progressTitle: 'Progreso',
        knownWords: 'Palabras aprendidas',
        totalWords: 'Total de palabras',
        changeLanguage: 'Cambiar idioma',
        myFavWords: 'Mis palabras favoritas',
        users: 'Usuarios',
        followers: 'Seguidores',
        following: 'Siguiendo',
        nativeLang: 'Idioma nativo',
        learningLang: 'Idioma de aprendizaje',
        langPreference: '🌐 Preferencias de idioma',
        deleteAccount: 'Eliminar cuenta',
        allWords: 'Todas las palabras',
        searchPlaceholder: 'Buscar palabras...',
        noMatch: 'No se encontraron palabras.',
        favorite: 'Favorito',
        classicTest: '📝 Quiz clásico',
        aiTest: '🤖 IA Completar huecos',
        questionLabel: '¿Cuál es el equivalente',
        questionSuffix: 'de esta palabra?',
        questionNum: 'Pregunta',
        questionRepeat: '(Reintentar)',
        matchTitle: 'Emparejamiento',
        matchSubtitle: 'Empareja las palabras con sus significados.',
        matchTip: '📱 Consejo: Toca primero una palabra, luego su significado correcto.',
        matched: 'Emparejado',
        score: 'Puntuación',
        newRound: 'Nueva ronda',
        wordsLabel: 'Palabras (Toca o arrastra):',
        meaningsLabel: 'Significados:',
        changeDirection: '🔄 Cambiar dirección',
        changeLanguages: '🌐 Cambiar idiomas',
        langPreferenceTitle: '🌐 Preferencias de idioma',
        learningLangLabel: '🎯 Idioma de aprendizaje:',
        nativeLangLabel: '🏠 Idioma nativo:',
        saveApply: 'Guardar & Aplicar',
        langMustDiffer: '¡Los idiomas deben ser diferentes!',
        visitProfile: 'Ver perfil',
        talkBtn: 'Hablar 🎓',
        followBtn: 'Seguir',
        followingBtn: 'Siguiendo',
        sendMessage: 'Enviar mensaje',
        viewFavorites: 'Ver favoritos',
        noFavorites: 'Sin palabras favoritas aún.',
        listingWords: 'palabras listadas.',
    },
    fr: {
        home: 'Accueil', panel: 'Tableau de bord', logout: 'Déconnexion',
        messages: 'Messages & IA', wordList: 'Liste de mots',
        wordTest: 'Quiz de vocabulaire', wordMatch: 'Association de mots',
        videoMentor: 'Mentor vidéo', mockInterview: 'Entretien simulé',
        profile: 'Mon profil', settings: 'Paramètres', back: 'Retour',
        welcome: 'Bienvenue',
        progressTitle: 'Progression',
        knownWords: 'Mots appris',
        totalWords: 'Total des mots',
        changeLanguage: 'Changer de langue',
        myFavWords: 'Mes mots favoris',
        users: 'Utilisateurs',
        followers: 'Abonnés',
        following: 'Abonnements',
        nativeLang: 'Langue maternelle',
        learningLang: 'Langue d\'apprentissage',
        langPreference: '🌐 Préférences linguistiques',
        deleteAccount: 'Supprimer le compte',
        allWords: 'Tous les mots',
        searchPlaceholder: 'Rechercher des mots...',
        noMatch: 'Aucun mot trouvé.',
        favorite: 'Favori',
        classicTest: '📝 Quiz classique',
        aiTest: '🤖 IA Compléter les phrases',
        questionLabel: 'Quel est l\'équivalent',
        questionSuffix: 'de ce mot?',
        questionNum: 'Question',
        questionRepeat: '(Réessayer)',
        matchTitle: 'Association de mots',
        matchSubtitle: 'Associez les mots à leurs significations.',
        matchTip: '📱 Astuce: Tapez d\'abord un mot, puis sa signification correcte.',
        matched: 'Associé',
        score: 'Score',
        newRound: 'Nouveau tour',
        wordsLabel: 'Mots (Appuyez ou glissez):',
        meaningsLabel: 'Significations:',
        changeDirection: '🔄 Changer de direction',
        changeLanguages: '🌐 Changer de langue',
        langPreferenceTitle: '🌐 Préférences linguistiques',
        learningLangLabel: '🎯 Langue d\'apprentissage:',
        nativeLangLabel: '🏠 Langue maternelle:',
        saveApply: 'Enregistrer & Appliquer',
        langMustDiffer: 'Les langues doivent être différentes!',
        visitProfile: 'Voir le profil',
        talkBtn: 'Parler 🎓',
        followBtn: 'Suivre',
        followingBtn: 'Suivi',
        sendMessage: 'Envoyer un message',
        viewFavorites: 'Voir les favoris',
        noFavorites: 'Pas encore de favoris.',
        listingWords: 'mots listés.',
    },
    it: {
        home: 'Home', panel: 'Dashboard', logout: 'Disconnetti',
        messages: 'Messaggi & IA', wordList: 'Lista parole',
        wordTest: 'Quiz vocaboli', wordMatch: 'Abbina parole',
        videoMentor: 'Mentor video', mockInterview: 'Colloquio simulato',
        profile: 'Il mio profilo', settings: 'Impostazioni', back: 'Indietro',
        welcome: 'Benvenuto',
        progressTitle: 'Progressi',
        knownWords: 'Parole apprese',
        totalWords: 'Totale parole',
        changeLanguage: 'Cambia lingua',
        myFavWords: 'Le mie parole preferite',
        users: 'Utenti',
        followers: 'Follower',
        following: 'Seguiti',
        nativeLang: 'Lingua madre',
        learningLang: 'Lingua di apprendimento',
        langPreference: '🌐 Preferenze lingua',
        deleteAccount: 'Elimina account',
        allWords: 'Tutte le parole',
        searchPlaceholder: 'Cerca parole...',
        noMatch: 'Nessuna parola trovata.',
        favorite: 'Preferito',
        classicTest: '📝 Quiz classico',
        aiTest: '🤖 IA Completa le frasi',
        questionLabel: 'Qual è l\'equivalente',
        questionSuffix: 'di questa parola?',
        questionNum: 'Domanda',
        questionRepeat: '(Riprova)',
        matchTitle: 'Abbinamento parole',
        matchSubtitle: 'Abbina le parole ai loro significati.',
        matchTip: '📱 Suggerimento: Tocca prima una parola, poi il suo significato.',
        matched: 'Abbinato',
        score: 'Punteggio',
        newRound: 'Nuovo round',
        wordsLabel: 'Parole (Tocca o trascina):',
        meaningsLabel: 'Significati:',
        changeDirection: '🔄 Cambia direzione',
        changeLanguages: '🌐 Cambia lingue',
        langPreferenceTitle: '🌐 Preferenze lingua',
        learningLangLabel: '🎯 Lingua di apprendimento:',
        nativeLangLabel: '🏠 Lingua madre:',
        saveApply: 'Salva & Applica',
        langMustDiffer: 'Le lingue devono essere diverse!',
        visitProfile: 'Visita profilo',
        talkBtn: 'Parla 🎓',
        followBtn: 'Segui',
        followingBtn: 'Seguito',
        sendMessage: 'Invia messaggio',
        viewFavorites: 'Vedi preferiti',
        noFavorites: 'Nessuna parola preferita.',
        listingWords: 'parole elencate.',
    },
    ru: {
        home: 'Главная', panel: 'Панель', logout: 'Выйти',
        messages: 'Сообщения & ИИ', wordList: 'Список слов',
        wordTest: 'Тест по словам', wordMatch: 'Сопоставление слов',
        videoMentor: 'Видео-ментор', mockInterview: 'Пробное интервью',
        profile: 'Мой профиль', settings: 'Настройки', back: 'Назад',
        welcome: 'Добро пожаловать',
        progressTitle: 'Прогресс',
        knownWords: 'Изученных слов',
        totalWords: 'Всего слов',
        changeLanguage: 'Изменить язык',
        myFavWords: 'Мои любимые слова',
        users: 'Пользователи',
        followers: 'Подписчики',
        following: 'Подписки',
        nativeLang: 'Родной язык',
        learningLang: 'Язык обучения',
        langPreference: '🌐 Настройки языка',
        deleteAccount: 'Удалить аккаунт',
        allWords: 'Все слова',
        searchPlaceholder: 'Поиск слов...',
        noMatch: 'Слова не найдены.',
        favorite: 'Избранное',
        classicTest: '📝 Классический тест',
        aiTest: '🤖 ИИ Вставить пропуски',
        questionLabel: 'Каков эквивалент',
        questionSuffix: 'этого слова?',
        questionNum: 'Вопрос',
        questionRepeat: '(Повтор)',
        matchTitle: 'Сопоставление слов',
        matchSubtitle: 'Сопоставьте слова с их значениями.',
        matchTip: '📱 Совет: Нажмите на слово, затем на правильное значение.',
        matched: 'Совпало',
        score: 'Очки',
        newRound: 'Новый раунд',
        wordsLabel: 'Слова (Нажмите или перетащите):',
        meaningsLabel: 'Значения:',
        changeDirection: '🔄 Изменить направление',
        changeLanguages: '🌐 Изменить языки',
        langPreferenceTitle: '🌐 Языковые настройки',
        learningLangLabel: '🎯 Язык обучения:',
        nativeLangLabel: '🏠 Родной язык:',
        saveApply: 'Сохранить & Применить',
        langMustDiffer: 'Языки должны быть разными!',
        visitProfile: 'Посетить профиль',
        talkBtn: 'Говорить 🎓',
        followBtn: 'Подписаться',
        followingBtn: 'Вы подписаны',
        sendMessage: 'Отправить сообщение',
        viewFavorites: 'Посмотреть избранное',
        noFavorites: 'Нет избранных слов.',
        listingWords: 'слов в списке.',
    }
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

    // 6. UI çeviri metni getir — Ana Dile göre
    t: function(key) {
        const prefs = this.getPreferences();
        const lang = prefs.nativeLang || 'tr';
        const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['tr'];
        return dict[key] || (UI_TRANSLATIONS['tr'][key] || key);
    },

    // 6b. Sayfadaki data-i18n nitelikli elementleri çevir
    applyUILanguage: function() {
        const prefs = this.getPreferences();
        const lang = prefs.nativeLang || 'tr';
        const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['tr'];

        // data-i18n="key" olan elementlerin textContent'ini güncelle
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        // data-i18n-placeholder="key" olan inputların placeholder'ını güncelle
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.placeholder = dict[key];
        });

        // html lang niteliğini güncelle
        document.documentElement.lang = lang;
    },


    // 7. Sayfa Üstü Dil Seçim ve Yön Çubuğu UI Bileşeni (Language Bar)
    renderBar: function(containerId, options) {
        options = options || {};
        const container = document.getElementById(containerId);
        if (!container) return;

        const prefs = this.getPreferences();
        const lMeta = this.getLanguageMeta(prefs.learningLang);
        const nMeta = this.getLanguageMeta(prefs.nativeLang);
        const isRev = (prefs.direction === "native_to_learning");

        const leftLang = isRev ? nMeta : lMeta;
        const rightLang = isRev ? lMeta : nMeta;
        const leftRole = isRev ? this.t('nativeLang') : this.t('learningLang');
        const rightRole = isRev ? this.t('learningLang') : this.t('nativeLang');
        const changeDir = this.t('changeDirection');
        const changeLangs = this.t('changeLanguages');

        const bar = document.createElement('div');
        bar.className = 'lang-bar-wrapper';
        bar.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:rgba(15,23,42,0.75);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);padding:6px 14px;border-radius:30px;font-size:0.82rem;color:#e2e8f0;box-shadow:0 4px 15px rgba(0,0,0,0.2);flex-wrap:wrap;justify-content:center;';

        const lDiv = document.createElement('div');
        lDiv.style.cssText = 'display:flex;align-items:center;gap:5px;';
        lDiv.innerHTML = '<span style="font-size:1.1rem;">' + leftLang.flag + '</span><strong style="color:#fff;">' + leftLang.name + '</strong><span style="font-size:0.7rem;color:#94a3b8;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:10px;">' + leftRole + '</span>';

        const arrow = document.createElement('span');
        arrow.style.cssText = 'color:#38bdf8;font-weight:bold;font-size:1rem;';
        arrow.textContent = '➔';

        const rDiv = document.createElement('div');
        rDiv.style.cssText = 'display:flex;align-items:center;gap:5px;';
        rDiv.innerHTML = '<span style="font-size:1.1rem;">' + rightLang.flag + '</span><strong style="color:#fff;">' + rightLang.name + '</strong><span style="font-size:0.7rem;color:#94a3b8;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:10px;">' + rightRole + '</span>';

        const btn1 = document.createElement('button');
        btn1.type = 'button';
        btn1.style.cssText = 'background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.35);color:#38bdf8;padding:4px 10px;border-radius:20px;cursor:pointer;font-size:0.78rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;transition:0.2s;';
        btn1.textContent = changeDir;

        const btn2 = document.createElement('button');
        btn2.type = 'button';
        btn2.style.cssText = 'background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;padding:4px 10px;border-radius:20px;cursor:pointer;font-size:0.78rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;transition:0.2s;';
        btn2.textContent = changeLangs;

        bar.appendChild(lDiv);
        bar.appendChild(arrow);
        bar.appendChild(rDiv);
        bar.appendChild(btn1);
        bar.appendChild(btn2);

        container.innerHTML = '';
        container.appendChild(bar);

        const self = this;
        btn1.onclick = function() {
            self.toggleDirection();
            self.renderBar(containerId, options);
            if (options.onDirectionChange) options.onDirectionChange();
        };
        btn2.onclick = function() {
            self.openModal(function() {
                self.renderBar(containerId, options);
                if (options.onLanguageChange) options.onLanguageChange();
            });
        };
    },

    // 8. Dil Seçim Modalı
    openModal: function(onSavedCallback) {
        var modal = document.getElementById("langPreferenceModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "langPreferenceModal";
            modal.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:15px;";
            document.body.appendChild(modal);
        }

        var prefs = this.getPreferences();
        var langOptions = Object.values(SUPPORTED_LANGUAGES).map(function(l) {
            return '<option value="' + l.code + '">' + l.flag + ' ' + l.name + ' (' + l.nameEn + ')</option>';
        }).join('');

        var modalTitle = this.t('langPreferenceTitle');
        var learningLbl = this.t('learningLangLabel');
        var nativeLbl = this.t('nativeLangLabel');
        var saveBtn = this.t('saveApply');

        modal.innerHTML =
            '<div style="background:#1e293b;border:1px solid rgba(255,255,255,0.15);border-radius:20px;width:100%;max-width:440px;padding:24px;color:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);font-family:Poppins,sans-serif;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
            '<h3 style="margin:0;font-size:1.15rem;color:#f8fafc;">' + modalTitle + '</h3>' +
            '<button type="button" id="closeLangModalBtn" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;">&#x2715;</button>' +
            '</div>' +
            '<div style="margin-bottom:14px;">' +
            '<label style="display:block;font-size:0.8rem;font-weight:600;color:#38bdf8;margin-bottom:6px;">' + learningLbl + '</label>' +
            '<select id="modalLearningSelect" style="width:100%;padding:10px 12px;border-radius:10px;background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,0.15);font-size:0.9rem;">' + langOptions + '</select>' +
            '</div>' +
            '<div style="margin-bottom:18px;">' +
            '<label style="display:block;font-size:0.8rem;font-weight:600;color:#10b981;margin-bottom:6px;">' + nativeLbl + '</label>' +
            '<select id="modalNativeSelect" style="width:100%;padding:10px 12px;border-radius:10px;background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,0.15);font-size:0.9rem;">' + langOptions + '</select>' +
            '</div>' +
            '<div id="modalPreviewHint" style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.25);padding:10px 14px;border-radius:12px;font-size:0.8rem;color:#bae6fd;margin-bottom:20px;"></div>' +
            '<button type="button" id="modalSaveLangBtn" style="width:100%;background:linear-gradient(135deg,#4f46e5,#0284c7);color:#fff;border:none;padding:12px;border-radius:12px;font-weight:600;cursor:pointer;font-size:0.92rem;">' + saveBtn + '</button>' +
            '</div>';

        modal.style.display = "flex";

        var learnSel = document.getElementById("modalLearningSelect");
        var natSel = document.getElementById("modalNativeSelect");
        learnSel.value = prefs.learningLang;
        natSel.value = prefs.nativeLang;

        function updateHint() {
            var l = SUPPORTED_LANGUAGES[learnSel.value] || { name: 'English', flag: '🇬🇧' };
            var n = SUPPORTED_LANGUAGES[natSel.value] || { name: 'Turkish', flag: '🇹🇷' };
            document.getElementById("modalPreviewHint").innerHTML = '💡 <strong>' + l.flag + ' ' + l.name + '</strong> ➔ <strong>' + n.flag + ' ' + n.name + '</strong>';
        }

        learnSel.onchange = updateHint;
        natSel.onchange = updateHint;
        updateHint();

        document.getElementById("closeLangModalBtn").onclick = function() { modal.style.display = "none"; };
        modal.onclick = function(e) { if (e.target === modal) modal.style.display = "none"; };

        document.getElementById("modalSaveLangBtn").onclick = function() {
            var newLearning = learnSel.value;
            var newNative = natSel.value;
            if (newLearning === newNative) {
                var errDict = UI_TRANSLATIONS[newNative] || UI_TRANSLATIONS['tr'];
                alert(errDict.langMustDiffer);
                return;
            }
            LanguageManager.setPreferences(newNative, newLearning);
            modal.style.display = "none";
            LanguageManager.applyUILanguage();
            if (onSavedCallback) onSavedCallback({ nativeLang: newNative, learningLang: newLearning });
        };
    }
};

// Global dışa aktarım
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.UI_TRANSLATIONS = UI_TRANSLATIONS;
window.LanguageManager = LanguageManager;

// Sayfa yüklendiğinde otomatik UI dilini uygula
document.addEventListener("DOMContentLoaded", function() {
    if (window.LanguageManager) {
        LanguageManager.applyUILanguage();
    }
});
