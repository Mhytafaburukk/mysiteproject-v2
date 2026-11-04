const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const aiService = require("./ai_service");

const app = express();
const PORT = process.env.PORT || 5001;

// --- GÜNCEL SERVEO URL ---
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

// AI Bot Sabitleri
const AI_BOT_USERNAME = "English_AI";
const AI_PROFILE_PIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%236a5acd;stop-opacity:1'/><stop offset='100%25' style='stop-color:%2300fa9a;stop-opacity:1'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23grad)'/><rect x='28' y='32' width='44' height='36' rx='10' fill='%23ffffff'/><circle cx='40' cy='48' r='5' fill='%236a5acd'/><circle cx='60' cy='48' r='5' fill='%236a5acd'/><path d='M 42 58 Q 50 64 58 58' stroke='%236a5acd' stroke-width='3' fill='none' stroke-linecap='round'/><rect x='47' y='18' width='6' height='14' fill='%23ffffff' rx='3'/><circle cx='50' cy='16' r='5' fill='%2300fa9a'/></svg>";

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
        { username: "Burak", password: hashPassword("1535abcd"), favorikelimeler: ["achievement", "resilience"], messages: [], followers: [AI_BOT_USERNAME, "Alice_Bot", "David_Bot"], following: [AI_BOT_USERNAME, "Alice_Bot"], knownWords: 120, profilePic: "" },
        { username: "Alice_Bot", password: hashPassword("alice123"), favorikelimeler: ["comprehension", "fluency"], messages: [], followers: ["Burak", "David_Bot"], following: ["Burak"], knownWords: 95, profilePic: "" },
        { username: "David_Bot", password: hashPassword("david123"), favorikelimeler: ["pronunciation", "idiom"], messages: [], followers: ["Burak"], following: ["Burak", "Alice_Bot"], knownWords: 150, profilePic: "" },
        { username: "Sophia_Bot", password: hashPassword("sophia123"), favorikelimeler: ["communication", "dialogue"], messages: [], followers: [], following: ["Burak"], knownWords: 75, profilePic: "" }
    ];
}

// English_AI Bot Kullanıcısını Doğrulama ve Entegre Etme
let aiUser = usersArray.find(u => u.username === AI_BOT_USERNAME);
if (!aiUser) {
    aiUser = {
        username: AI_BOT_USERNAME,
        password: hashPassword("official_ai_engine_secret_2026"),
        favorikelimeler: ["comprehension", "fluency", "resilience", "vocabulary", "intelligence"],
        messages: [
            {
                sender: AI_BOT_USERNAME,
                receiver: "Burak",
                content: "Hello Burak! 👋 Ben sitenin resmi Yapay Zeka (AI) Asistanıyım. Doğrulanmış mavi rozetimle buradayım. Bana soru sorabilir, kelime anlamı öğrenebilir veya İngilizce sohbet edebilirsin!",
                timestamp: new Date(),
                isRead: true
            }
        ],
        followers: ["Burak"],
        following: ["Burak"],
        knownWords: 5000,
        profilePic: AI_PROFILE_PIC,
        isAI: true,
        isVerified: true
    };
    usersArray.unshift(aiUser);
} else {
    aiUser.isAI = true;
    aiUser.isVerified = true;
    if (!aiUser.profilePic) aiUser.profilePic = AI_PROFILE_PIC;
}

function saveDataToFile() {
    try {
        fs.writeFileSync(filePath, JSON.stringify(usersArray, null, 2), "utf-8");
    } catch (error) {
        console.error("Veri kaydedilirken hata:", error);
    }
}

// Veri yapısı kontrolü (Migration & Şifre Hashleme)
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
                content: `Merhaba ${username}! 🤖 İngilizce platformumuza hoş geldin! Ben senin resmi Yapay Zeka asistanınım. İngilizce öğrenirken aklına takılan her şeyi bana sorabilirsin!`,
                timestamp: new Date(),
                isRead: false
            }
        ], 
        followers: [AI_BOT_USERNAME], 
        following: [AI_BOT_USERNAME], 
        knownWords: 0, 
        profilePic: "" 
    };

    // AI botun mesaj listesine de ekleyelim
    if (aiUser) {
        aiUser.messages.push({
            sender: AI_BOT_USERNAME,
            receiver: username,
            content: `Merhaba ${username}! 🤖 İngilizce platformumuza hoş geldin! Ben senin resmi Yapay Zeka asistanınım.`,
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

// 2. Mesajlaşma
app.get("/get-messages/:username1/:username2", (req, res) => {
    const { username1, username2 } = req.params;
    const user = usersArray.find(u => u.username === username1);
    if (!user) return res.status(404).json({ success: false });
    const conversation = user.messages.filter(msg => msg.receiver === username2 || msg.sender === username2);
    res.json({ success: true, messages: conversation });
});

app.post("/send-message", (req, res) => {
    const { sender, receiver, content } = req.body;
    const sUser = usersArray.find(u => u.username === sender);
    const rUser = usersArray.find(u => u.username === receiver);

    if (sUser && rUser) {
        const newMessage = { 
            sender, 
            receiver, 
            content, 
            timestamp: new Date(),
            isRead: false 
        };
        sUser.messages.push(newMessage);
        rUser.messages.push(newMessage);

        // EĞER ALICI YAPAY ZEKA (English_AI) İSE ANINDA DONANIMLI CEVAP ÜRET
        if (receiver === AI_BOT_USERNAME) {
            const aiResponseText = aiService.generateChatResponse(content, sender);
            const aiReply = {
                sender: AI_BOT_USERNAME,
                receiver: sender,
                content: aiResponseText,
                timestamp: new Date(Date.now() + 300),
                isRead: false
            };
            sUser.messages.push(aiReply);
            rUser.messages.push(aiReply);
        }

        saveDataToFile();
        res.json({ success: true, newMessage });
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
    const { username, chatPartner } = req.body;
    const user = usersArray.find(u => u.username === username);
    if (user) {
        user.messages.forEach(msg => {
            if (msg.sender === chatPartner && msg.receiver === username) {
                msg.isRead = true;
            }
        });
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 3. Sosyal Özellikler (Takip)
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

// 4. Profil ve Kelimeler
app.post("/update-score", (req, res) => {
    const { username, score } = req.body;
    const user = usersArray.find(u => u.username === username);
    if (user) {
        user.knownWords = score;
        saveDataToFile();
        res.json({ success: true, knownWords: user.knownWords });
    }
});

app.post("/update-profile-pic", (req, res) => {
    const { username, imageBase64 } = req.body;
    const user = usersArray.find(u => u.username === username);
    if (user) {
        user.profilePic = imageBase64;
        saveDataToFile();
        res.json({ success: true });
    }
});

app.get("/get-user-info/:username", (req, res) => {
    const { username } = req.params;
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

app.get("/get-favorites/:username", (req, res) => {
    const user = usersArray.find(u => u.username === req.params.username);
    res.json({ success: !!user, favorikelimeler: user ? user.favorikelimeler : [] });
});

app.delete("/delete-account", (req, res) => {
    const { username } = req.body;
    usersArray = usersArray.filter(u => u.username !== username);
    saveDataToFile();
    res.json({ success: true });
});

app.get("/users", (req, res) => {
    // English_AI her zaman listenin başında yer alsın
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

// --- YAPAY ZEKA ENTEGRASYONU ROTLARI ---
app.post("/api/ai/generate-question", (req, res) => {
    const { word, type } = req.body || {};
    const question = aiService.generateAIQuestion(word, type);
    res.json(question);
});

app.get("/api/ai/generate-question", (req, res) => {
    const { word, type } = req.query || {};
    const question = aiService.generateAIQuestion(word, type);
    res.json(question);
});

// --- ADMIN ÖZEL ROTASI ---
app.get("/admin-get-all-users/:adminUser", (req, res) => {
    if (req.params.adminUser === "Burak") {
        res.json({ success: true, users: usersArray });
    } else {
        res.status(403).json({ success: false, message: "Yetkisiz erişim!" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`1. LOCAL: http://localhost:${PORT}`);
    console.log(`2. GLOBAL: ${SERVEO_URL}`);
    console.log(`3. AI BOT: ${AI_BOT_USERNAME} aktif ve hazır!`);
    console.log(`-----------------------------------------`);
});
