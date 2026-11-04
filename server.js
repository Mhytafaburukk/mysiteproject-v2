const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const aiService = require("./ai_service");

const app = express();
const PORT = process.env.PORT || 5001;

// --- SERVEO URL ---
const SERVEO_URL = "https://31e174e29e114188-176-233-24-247.serveousercontent.com";

function hashPassword(password) {
    if (!password) return "";
    return crypto.createHash("sha256").update(password).digest("hex");
}

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const filePath = path.join(__dirname, "users.json");

// Profesyonel Eğitmen / Mentor Sabitleri (Robotik değil, kurumsal ve şık)
const AI_BOT_USERNAME = "English_Mentor";
const LEGACY_AI_NAME = "English_AI";

// Şık, elit bir İngilizce Mentor / Akademi Rozeti Avatarı (Lacivert zemin + Altın rengi monogram ve eğitim amblemi)
const MENTOR_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='%231e293b' stroke='%234f46e5' stroke-width='4'/><circle cx='60' cy='60' r='52' fill='%230f172a'/><path d='M60 28 L90 44 L60 60 L30 44 Z' fill='%236366f1'/><path d='M42 54 L42 72 Q60 84 78 72 L78 54 Q60 66 42 54 Z' fill='%23e0e7ff'/><circle cx='60' cy='92' r='4' fill='%2338bdf8'/><path d='M90 44 L90 68' stroke='%2338bdf8' stroke-width='3' stroke-linecap='round'/></svg>";

let usersArray = [];
if (fs.existsSync(filePath)) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        usersArray = JSON.parse(data);
    } catch (error) {
        console.error("JSON dosyası okunurken hata:", error);
        usersArray = [];
    }
}

if (!usersArray || usersArray.length === 0) {
    usersArray = [
        { username: "Burak", password: hashPassword("1535abcd"), favorikelimeler: ["achievement", "resilience"], messages: [], followers: [AI_BOT_USERNAME, "Alice_Bot"], following: [AI_BOT_USERNAME], knownWords: 120, profilePic: "" }
    ];
}

// English_Mentor kullanıcısını kontrol et & güncelle
let mentorUser = usersArray.find(u => u.username === AI_BOT_USERNAME || u.username === LEGACY_AI_NAME);
if (!mentorUser) {
    mentorUser = {
        username: AI_BOT_USERNAME,
        password: hashPassword("mentor_secret_pass_2026"),
        favorikelimeler: ["involvement", "comprehension", "fluency", "resilience"],
        messages: [
            {
                sender: AI_BOT_USERNAME,
                receiver: "Burak",
                content: "Hello Burak! 👋 Ben senin resmi **İngilizce Mentörünüm** (Doğrulanmış Eğitmen ✓). Bana dilediğin kelimeyi, cümleyi veya gramer kuralını sorabilirsin!",
                timestamp: new Date(),
                isRead: true
            }
        ],
        followers: ["Burak"],
        following: ["Burak"],
        knownWords: 5000,
        profilePic: MENTOR_AVATAR,
        isAI: true,
        isVerified: true
    };
    usersArray.unshift(mentorUser);
} else {
    mentorUser.username = AI_BOT_USERNAME;
    mentorUser.isAI = true;
    mentorUser.isVerified = true;
    mentorUser.profilePic = MENTOR_AVATAR;
}

function saveDataToFile() {
    try {
        fs.writeFileSync(filePath, JSON.stringify(usersArray, null, 2), "utf-8");
    } catch (error) {
        console.error("Veri kaydedilirken hata:", error);
    }
}

// Veri yapısı kontrolü
usersArray.forEach(user => {
    if (!user.followers) user.followers = [];
    if (!user.following) user.following = [];
    if (!user.messages) user.messages = [];
    if (!user.favorikelimeler) user.favorikelimeler = [];
    if (user.knownWords === undefined) user.knownWords = 0;
    if (user.password && user.password.length !== 64) {
        user.password = hashPassword(user.password);
    }
});
saveDataToFile();

// --- API ROTLARI ---

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });
    if (usersArray.some(u => u.username === username)) return res.json({ success: false, message: "Bu kullanıcı adı alınmış!" });

    const newUser = { 
        username, 
        password: hashPassword(password), 
        favorikelimeler: [], 
        messages: [
            {
                sender: AI_BOT_USERNAME,
                receiver: username,
                content: `Merhaba ${username}! 👋 Platformumuza hoş geldin. Ben senin resmi İngilizce Mentörünüm. Takıldığın her şeyi bana sorabilirsin!`,
                timestamp: new Date(),
                isRead: false
            }
        ], 
        followers: [AI_BOT_USERNAME], 
        following: [AI_BOT_USERNAME], 
        knownWords: 0, 
        profilePic: "" 
    };

    if (mentorUser) {
        mentorUser.messages.push({
            sender: AI_BOT_USERNAME,
            receiver: username,
            content: `Merhaba ${username}! 👋 Hoş geldin!`,
            timestamp: new Date(),
            isRead: true
        });
    }

    usersArray.push(newUser);
    saveDataToFile();
    res.json({ success: true, message: "Kayıt başarılı!" });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    const hashedPassword = hashPassword(password);
    const user = usersArray.find(u => u.username === username && (u.password === hashedPassword || u.password === password));
    if (user) {
        if (user.password !== hashedPassword) {
            user.password = hashedPassword;
            saveDataToFile();
        }
        res.json({ success: true, username });
    } else {
        res.json({ success: false, message: "Geçersiz kullanıcı adı veya şifre" });
    }
});

// MESAJLAŞMA (ASENKRON & DOĞRUDAN API ENTEGRASYONLU)
app.get("/get-messages/:username1/:username2", (req, res) => {
    let { username1, username2 } = req.params;
    if (username2 === LEGACY_AI_NAME) username2 = AI_BOT_USERNAME;
    if (username1 === LEGACY_AI_NAME) username1 = AI_BOT_USERNAME;

    const user = usersArray.find(u => u.username === username1);
    if (!user) return res.status(404).json({ success: false });
    
    const conversation = user.messages.filter(msg => 
        (msg.receiver === username2 || (username2 === AI_BOT_USERNAME && msg.receiver === LEGACY_AI_NAME)) || 
        (msg.sender === username2 || (username2 === AI_BOT_USERNAME && msg.sender === LEGACY_AI_NAME))
    );
    res.json({ success: true, messages: conversation });
});

app.post("/send-message", async (req, res) => {
    let { sender, receiver, content, apiKey, model, focusMode, englishLevel } = req.body;
    if (receiver === LEGACY_AI_NAME) receiver = AI_BOT_USERNAME;
    if (sender === LEGACY_AI_NAME) sender = AI_BOT_USERNAME;

    const sUser = usersArray.find(u => u.username === sender);
    const rUser = usersArray.find(u => u.username === receiver);

    if (sUser && rUser) {
        const userMsg = { 
            sender, 
            receiver, 
            content, 
            timestamp: new Date(),
            isRead: false 
        };
        sUser.messages.push(userMsg);
        rUser.messages.push(userMsg);

        // ALICI MENTOR İSE CEVAP ÜRET
        let mentorReply = null;
        if (receiver === AI_BOT_USERNAME) {
            let aiText = null;

            // 1. Canlı API Anahtarı Varsa Çağır
            if (apiKey && model && model !== "built-in") {
                aiText = await aiService.callExternalAI(content, apiKey, model, focusMode, englishLevel);
            }

            // 2. Canlı API Yoksa veya Hata Verdiyse Gelişmiş Zeki Yerleşik Yanıtı Çağır
            if (!aiText) {
                aiText = aiService.generateIntelligentFallbackResponse(content, sender);
            }

            mentorReply = {
                sender: AI_BOT_USERNAME,
                receiver: sender,
                content: aiText,
                timestamp: new Date(Date.now() + 200),
                isRead: false
            };
            sUser.messages.push(mentorReply);
            rUser.messages.push(mentorReply);
        }

        saveDataToFile();
        res.json({ success: true, userMessage: userMsg, mentorReply });
    } else {
        res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
    }
});

// BİLDİRİM İÇİN TÜM MESAJLARI GETİR
app.get("/get-all-messages/:username", (req, res) => {
    const user = usersArray.find(u => u.username === req.params.username);
    res.json({ success: !!user, messages: user ? user.messages : [] });
});

// MESAJLARI OKUNDU YAP
app.post("/mark-messages-read", (req, res) => {
    let { username, chatPartner } = req.body;
    if (chatPartner === LEGACY_AI_NAME) chatPartner = AI_BOT_USERNAME;
    const user = usersArray.find(u => u.username === username);
    if (user) {
        user.messages.forEach(msg => {
            if ((msg.sender === chatPartner || (chatPartner === AI_BOT_USERNAME && msg.sender === LEGACY_AI_NAME)) && msg.receiver === username) {
                msg.isRead = true;
            }
        });
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// TAKİP
app.post("/follow", (req, res) => {
    const { follower, target } = req.body;
    const fUser = usersArray.find(u => u.username === follower);
    const tUser = usersArray.find(u => u.username === target);
    if (fUser && tUser && !fUser.following.includes(target)) {
        fUser.following.push(target);
        tUser.followers.push(follower);
        saveDataToFile();
        res.json({ success: true, newFollowerCount: tUser.followers.length });
    } else {
        res.json({ success: false, message: "İşlem yapılamadı." });
    }
});

// PROFİL VE KULLANICILAR
app.get("/get-user-info/:username", (req, res) => {
    let { username } = req.params;
    if (username === LEGACY_AI_NAME) username = AI_BOT_USERNAME;
    const user = usersArray.find(u => u.username === username);
    if (!user) return res.status(404).json({ success: false });
    res.json({
        success: true,
        user: {
            username: user.username,
            knownWords: user.knownWords || 0,
            profilePic: user.profilePic || null,
            followers: user.followers || [],
            following: user.following || [],
            isAI: !!user.isAI,
            isVerified: !!user.isVerified
        }
    });
});

app.get("/users", (req, res) => {
    const sorted = [...usersArray].sort((a, b) => {
        if (a.username === AI_BOT_USERNAME) return -1;
        if (b.username === AI_BOT_USERNAME) return 1;
        return 0;
    });

    res.json(sorted.map(u => ({ 
        username: u.username, 
        profilePic: u.profilePic || null,
        isAI: !!u.isAI,
        isVerified: !!u.isVerified
    })));
});

// AI SORU ÜRETİMİ
app.post("/api/ai/generate-question", (req, res) => {
    const { word } = req.body || {};
    const question = aiService.generateAIQuestion(word);
    res.json(question);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`1. LOCAL: http://localhost:${PORT}`);
    console.log(`2. MENTOR: ${AI_BOT_USERNAME} aktif ve hazır!`);
    console.log(`-----------------------------------------`);
});
