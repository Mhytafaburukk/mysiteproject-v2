const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
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

let usersArray = [];
if (fs.existsSync(filePath)) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        usersArray = JSON.parse(data);
    } catch (error) {
        console.error("JSON dosyası okunurken hata:", error);
        usersArray = [];
    }
} else {
    usersArray = [
        { username: "Burak", password: hashPassword("1535abcd"), favorikelimeler: ["achievement", "resilience"], messages: [], followers: ["Alice_Bot", "David_Bot", "Sophia_Bot"], following: ["Alice_Bot", "David_Bot"], knownWords: 120, profilePic: "" },
        { username: "Alice_Bot", password: hashPassword("alice123"), favorikelimeler: ["comprehension", "fluency"], messages: [], followers: ["Burak", "David_Bot"], following: ["Burak"], knownWords: 95, profilePic: "" },
        { username: "David_Bot", password: hashPassword("david123"), favorikelimeler: ["pronunciation", "idiom"], messages: [], followers: ["Burak"], following: ["Burak", "Alice_Bot"], knownWords: 150, profilePic: "" },
        { username: "Sophia_Bot", password: hashPassword("sophia123"), favorikelimeler: ["communication", "dialogue"], messages: [], followers: [], following: ["Burak"], knownWords: 75, profilePic: "" }
    ];
    fs.writeFileSync(filePath, JSON.stringify(usersArray, null, 2), "utf-8");
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
    // Eğer şifre düz metinse (SHA-256 64 karakterli hex değilse) otomatik hashle
    if (user.password && user.password.length !== 64) {
        user.password = hashPassword(user.password);
    }
});

// --- API ROTLARI ---

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });
    if (usersArray.some(u => u.username === username)) return res.json({ success: false, message: "Bu kullanıcı adı alınmış!" });

    usersArray.push({ 
        username, 
        password: hashPassword(password), 
        favorikelimeler: [], 
        messages: [], 
        followers: [], 
        following: [], 
        knownWords: 0, 
        profilePic: "" 
    });
    saveDataToFile();
    res.json({ success: true, message: "Kayıt başarılı!" });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Eksik bilgi!" });

    const hashedPassword = hashPassword(password);
    const user = usersArray.find(u => u.username === username && (u.password === hashedPassword || u.password === password));
    if (user) {
        // Düz metin şifre varsa otomatik hashle
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
        saveDataToFile();
        res.json({ success: true, newMessage });
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
            following: user.following || []
        }
    });
});

app.get("/users", (req, res) => {
    res.json(usersArray.map(u => ({ username: u.username, profilePic: u.profilePic || null })));
});

// --- ADMIN ÖZEL ROTASI (YENİ) ---
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
    console.log(`-----------------------------------------`);
});

























