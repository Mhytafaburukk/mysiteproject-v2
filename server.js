const express = require("express");
const path = require("path");
const cors = require("cors");
const DB = require("./database");
const aiService = require("./ai_service");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- MENTOR AVATAR ---
const MENTOR_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='%231e293b' stroke='%234f46e5' stroke-width='4'/><circle cx='60' cy='60' r='52' fill='%230f172a'/><path d='M60 28 L90 44 L60 60 L30 44 Z' fill='%236366f1'/><path d='M42 54 L42 72 Q60 84 78 72 L78 54 Q60 66 42 54 Z' fill='%23e0e7ff'/><circle cx='60' cy='92' r='4' fill='%2338bdf8'/><path d='M90 44 L90 68' stroke='%2338bdf8' stroke-width='3' stroke-linecap='round'/></svg>";
const AI_BOT = "English_Mentor";

// --- MİGRASYON (users.json → SQLite) ---
DB.migrateFromJSON(path.join(__dirname, "users.json"));

// --- Mentor botun varlığını kontrol et ---
if (!DB.getUser(AI_BOT)) {
    DB.createUser(AI_BOT, "mentor_secret_2026_locked", {
        knownWords: 5000,
        profilePic: MENTOR_AVATAR,
        isAI: true,
        isVerified: true
    });
}
// Mentor'ı her zaman güncelle
const mentorRow = DB.getUser(AI_BOT);
if (mentorRow) {
    DB.db.prepare("UPDATE users SET profile_pic = ?, is_ai = 1, is_verified = 1 WHERE username = ?").run(MENTOR_AVATAR, AI_BOT);
}

// ==========================================
// API ROTLARI
// ==========================================

// KAYIT
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });
    if (DB.getUser(username)) return res.json({ success: false, message: "Bu kullanıcı adı alınmış!" });

    DB.createUser(username, password);

    // Mentor ile karşılıklı takip
    DB.followUser(username, AI_BOT);
    DB.followUser(AI_BOT, username);

    // Hoş geldin mesajı
    DB.sendMessage(AI_BOT, username, `Merhaba ${username}! 👋 Platformumuza hoş geldin! Ben senin İngilizce Mentörünüm. Bana istediğin soruyu sorabilirsin.`);

    res.json({ success: true, message: "Kayıt başarılı!" });
});

// GİRİŞ
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    const user = DB.verifyLogin(username, password);
    if (user) {
        res.json({ success: true, username: user.username });
    } else {
        res.json({ success: false, message: "Geçersiz kullanıcı adı veya şifre" });
    }
});

// MESAJLAŞMA
app.get("/get-messages/:username1/:username2", (req, res) => {
    let { username1, username2 } = req.params;
    if (username2 === "English_AI") username2 = AI_BOT;
    const messages = DB.getConversation(username1, username2);
    res.json({ success: true, messages });
});

app.post("/send-message", async (req, res) => {
    let { sender, receiver, content, apiKey, model, focusMode, englishLevel } = req.body;
    if (receiver === "English_AI") receiver = AI_BOT;

    if (!DB.getUser(sender)) return res.status(404).json({ success: false, message: "Gönderen bulunamadı!" });
    if (!DB.getUser(receiver)) return res.status(404).json({ success: false, message: "Alıcı bulunamadı!" });

    // Kullanıcı mesajını kaydet
    DB.sendMessage(sender, receiver, content);

    let mentorReplyText = null;

    // Eğer alıcı AI ise yanıt üret
    if (receiver === AI_BOT) {
        console.log(`[MESAJ] '${sender}' -> English Mentor | "${content.slice(0, 50)}"`);
        console.log(`[AI AYARLARI] Model: ${model || "built-in"} | API Key: ${apiKey ? "Mevcut (" + apiKey.slice(0, 4) + "...)" : "YOK"}`);

        // 1. Canlı API dene (API key varsa ve built-in değilse)
        if (apiKey && model && model !== "built-in") {
            const history = DB.getConversation(sender, AI_BOT).slice(-8);
            try {
                const apiRes = await aiService.callExternalAI(content, apiKey, model, focusMode, englishLevel, history);
                if (typeof apiRes === "string") {
                    mentorReplyText = apiRes;
                    console.log(`[CANLI API BAŞARILI] ${model} yanıt üretti.`);
                } else if (apiRes && apiRes.error) {
                    console.warn(`[CANLI API HATASI]`, apiRes.message);
                    const fallback = aiService.generateFallbackResponse(content, sender, DB);
                    mentorReplyText = `${apiRes.message}\n\n${fallback}`;
                }
            } catch (err) {
                console.error(`[CANLI API EXCEPTION]`, err.message);
            }
        }

        // 2. API çağrılmadıysa veya yanıtsız kaldıysa dahili motor
        if (!mentorReplyText) {
            mentorReplyText = aiService.generateFallbackResponse(content, sender, DB);
        }

        // Yanıtı kaydet
        DB.sendMessage(AI_BOT, sender, mentorReplyText);
    }

    res.json({ success: true });
});

// TÜM MESAJLAR (Bildirim için)
app.get("/get-all-messages/:username", (req, res) => {
    const messages = DB.getAllMessages(req.params.username);
    res.json({ success: true, messages });
});

// OKUNDU İŞARETLE
app.post("/mark-messages-read", (req, res) => {
    let { username, chatPartner } = req.body;
    if (chatPartner === "English_AI") chatPartner = AI_BOT;
    DB.markMessagesRead(username, chatPartner);
    res.json({ success: true });
});

// AI API ANAHTARI TESTİ
app.post("/api/ai/test-key", async (req, res) => {
    const { apiKey, model } = req.body || {};
    const result = await aiService.testAPIKey(apiKey, model);
    res.json(result);
});

// TAKİP
app.post("/follow", (req, res) => {
    const { follower, target } = req.body;
    const success = DB.followUser(follower, target);
    if (success) {
        const count = DB.getFollowers(target).length;
        res.json({ success: true, newFollowerCount: count });
    } else {
        res.json({ success: false, message: "Zaten takip ediyorsun." });
    }
});

// KULLANICI BİLGİSİ
app.get("/get-user-info/:username", (req, res) => {
    let { username } = req.params;
    if (username === "English_AI") username = AI_BOT;
    const user = DB.getUser(username);
    if (!user) return res.status(404).json({ success: false });
    res.json({
        success: true,
        user: {
            username: user.username,
            knownWords: user.known_words || 0,
            profilePic: user.profile_pic || null,
            followers: DB.getFollowers(username),
            following: DB.getFollowing(username),
            isAI: !!user.is_ai,
            isVerified: !!user.is_verified
        }
    });
});

// KULLANICILAR LİSTESİ
app.get("/users", (req, res) => {
    const users = DB.getAllUsers();
    res.json(users.map(u => ({
        username: u.username,
        profilePic: u.profile_pic || null,
        isAI: !!u.is_ai,
        isVerified: !!u.is_verified
    })));
});

// FAVORİ KELİMELER
app.get("/get-favorites/:username", (req, res) => {
    const words = DB.getFavorites(req.params.username);
    res.json({ success: true, favorikelimeler: words });
});

// SKOR GÜNCELLEME
app.post("/update-score", (req, res) => {
    const { username, score } = req.body;
    DB.updateKnownWords(username, score);
    res.json({ success: true, knownWords: score });
});

// PROFİL RESMİ GÜNCELLEME
app.post("/update-profile-pic", (req, res) => {
    const { username, imageBase64 } = req.body;
    DB.updateProfilePic(username, imageBase64);
    res.json({ success: true });
});

// HESAP SİLME
app.delete("/delete-account", (req, res) => {
    const { username } = req.body;
    DB.deleteUser(username);
    res.json({ success: true });
});

// AI SORU ÜRETİMİ (kelime.html için)
app.post("/api/ai/generate-question", (req, res) => {
    const { word } = req.body || {};
    const question = aiService.generateAIQuestion(word);
    res.json({ success: true, ...question });
});

// ADMIN
app.get("/admin-get-all-users/:adminUser", (req, res) => {
    if (req.params.adminUser === "Burak") {
        const users = DB.getAllUsers();
        res.json({ success: true, users });
    } else {
        res.status(403).json({ success: false, message: "Yetkisiz erişim!" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`  English Learning Platform`);
    console.log(`  LOCAL : http://localhost:${PORT}`);
    console.log(`  DB    : SQLite (english_platform.db)`);
    console.log(`  MENTOR: ${AI_BOT} aktif`);
    console.log(`-----------------------------------------`);
});
