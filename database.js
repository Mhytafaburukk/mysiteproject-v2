// database.js - SQLite Veritabanı Altyapısı
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "english_platform.db");

const db = new Database(DB_PATH);

// WAL mode for better concurrent reads
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- TABLO OLUŞTURMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    known_words INTEGER DEFAULT 0,
    profile_pic TEXT DEFAULT '',
    is_ai INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_username TEXT NOT NULL,
    following_username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_username, following_username)
  );

  CREATE TABLE IF NOT EXISTS favorite_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    word TEXT NOT NULL,
    UNIQUE(username, word)
  );

  CREATE TABLE IF NOT EXISTS quiz_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    question_sentence TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT NOT NULL,
    turkish_hint TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver);
  CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_username);
  CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_username);
  CREATE INDEX IF NOT EXISTS idx_quiz_state_user ON quiz_state(username, is_active);
`);

// --- YARDIMCI FONKSİYONLAR ---

function hashPassword(password) {
    if (!password) return "";
    return crypto.createHash("sha256").update(password).digest("hex");
}

// --- KULLANICI İŞLEMLERİ ---

function getUser(username) {
    return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

function getAllUsers() {
    return db.prepare("SELECT id, username, profile_pic, is_ai, is_verified, known_words FROM users ORDER BY is_ai DESC, username ASC").all();
}

function createUser(username, password, options = {}) {
    const hashed = hashPassword(password);
    const stmt = db.prepare(`
        INSERT INTO users (username, password, known_words, profile_pic, is_ai, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        username,
        hashed,
        options.knownWords || 0,
        options.profilePic || "",
        options.isAI ? 1 : 0,
        options.isVerified ? 1 : 0
    );
}

function verifyLogin(username, password) {
    const hashed = hashPassword(password);
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) return null;
    // Support both hashed and legacy plain text
    if (user.password === hashed || user.password === password) {
        if (user.password !== hashed) {
            db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hashed, username);
        }
        return user;
    }
    return null;
}

function deleteUser(username) {
    const del = db.transaction(() => {
        db.prepare("DELETE FROM messages WHERE sender = ? OR receiver = ?").run(username, username);
        db.prepare("DELETE FROM followers WHERE follower_username = ? OR following_username = ?").run(username, username);
        db.prepare("DELETE FROM favorite_words WHERE username = ?").run(username);
        db.prepare("DELETE FROM quiz_state WHERE username = ?").run(username);
        db.prepare("DELETE FROM users WHERE username = ?").run(username);
    });
    del();
}

function updateProfilePic(username, base64) {
    db.prepare("UPDATE users SET profile_pic = ? WHERE username = ?").run(base64, username);
}

function updateKnownWords(username, score) {
    db.prepare("UPDATE users SET known_words = ? WHERE username = ?").run(score, username);
}

// --- TAKİP İŞLEMLERİ ---

function followUser(follower, target) {
    try {
        db.prepare("INSERT INTO followers (follower_username, following_username) VALUES (?, ?)").run(follower, target);
        return true;
    } catch (e) {
        return false; // zaten takip ediyor
    }
}

function getFollowers(username) {
    return db.prepare("SELECT follower_username FROM followers WHERE following_username = ?").all(username).map(r => r.follower_username);
}

function getFollowing(username) {
    return db.prepare("SELECT following_username FROM followers WHERE follower_username = ?").all(username).map(r => r.following_username);
}

// --- MESAJ İŞLEMLERİ ---

function getConversation(user1, user2) {
    return db.prepare(`
        SELECT * FROM messages
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
        ORDER BY timestamp ASC
    `).all(user1, user2, user2, user1);
}

function getAllMessages(username) {
    return db.prepare("SELECT * FROM messages WHERE sender = ? OR receiver = ? ORDER BY timestamp ASC").all(username, username);
}

function sendMessage(sender, receiver, content) {
    const stmt = db.prepare(`
        INSERT INTO messages (sender, receiver, content, timestamp, is_read)
        VALUES (?, ?, ?, ?, 0)
    `);
    const now = new Date().toISOString();
    return stmt.run(sender, receiver, content, now);
}

function markMessagesRead(username, chatPartner) {
    db.prepare("UPDATE messages SET is_read = 1 WHERE sender = ? AND receiver = ? AND is_read = 0").run(chatPartner, username);
}

// --- FAVORİ KELİMELER ---

function getFavorites(username) {
    return db.prepare("SELECT word FROM favorite_words WHERE username = ?").all(username).map(r => r.word);
}

function addFavorite(username, word) {
    try {
        db.prepare("INSERT INTO favorite_words (username, word) VALUES (?, ?)").run(username, word);
        return true;
    } catch (e) { return false; }
}

// --- QUIZ STATE ---

function setActiveQuiz(username, sentence, correctAnswer, options, turkishHint) {
    // Önceki aktif quizi deaktif yap
    db.prepare("UPDATE quiz_state SET is_active = 0 WHERE username = ? AND is_active = 1").run(username);
    db.prepare(`
        INSERT INTO quiz_state (username, question_sentence, correct_answer, options, turkish_hint, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    `).run(username, sentence, correctAnswer, JSON.stringify(options), turkishHint);
}

function getActiveQuiz(username) {
    const row = db.prepare("SELECT * FROM quiz_state WHERE username = ? AND is_active = 1 ORDER BY id DESC LIMIT 1").get(username);
    if (row) {
        row.options = JSON.parse(row.options);
    }
    return row;
}

function deactivateQuiz(username) {
    db.prepare("UPDATE quiz_state SET is_active = 0 WHERE username = ? AND is_active = 1").run(username);
}

// --- USERS.JSON MİGRASYONU ---

function migrateFromJSON(jsonPath) {
    const fs = require("fs");
    if (!fs.existsSync(jsonPath)) return;

    // Zaten kullanıcı varsa migrasyona gerek yok
    const existing = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
    if (existing.cnt > 0) return;

    console.log("users.json'dan veritabanına göç başlıyor...");
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

        const insertTransaction = db.transaction((users) => {
            for (const u of users) {
                // Bot kullanıcıları atlayalım (sadece English_Mentor kalacak)
                if (["Alice_Bot", "David_Bot", "Sophia_Bot", "English_AI"].includes(u.username)) continue;

                try {
                    db.prepare(`
                        INSERT OR IGNORE INTO users (username, password, known_words, profile_pic, is_ai, is_verified)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(
                        u.username,
                        u.password || hashPassword("default123"),
                        u.knownWords || 0,
                        u.profilePic || "",
                        u.isAI ? 1 : 0,
                        u.isVerified ? 1 : 0
                    );
                } catch (e) { /* kullanıcı zaten var */ }

                // Favori kelimeler
                if (u.favorikelimeler) {
                    for (const w of u.favorikelimeler) {
                        try {
                            db.prepare("INSERT OR IGNORE INTO favorite_words (username, word) VALUES (?, ?)").run(u.username, w);
                        } catch (e) {}
                    }
                }

                // Mesajlar (bot mesajlarını atlayalım)
                if (u.messages) {
                    for (const msg of u.messages) {
                        if (["Alice_Bot", "David_Bot", "Sophia_Bot"].includes(msg.sender) ||
                            ["Alice_Bot", "David_Bot", "Sophia_Bot"].includes(msg.receiver)) continue;
                        try {
                            db.prepare(`INSERT INTO messages (sender, receiver, content, timestamp, is_read) VALUES (?, ?, ?, ?, ?)`)
                              .run(msg.sender, msg.receiver, msg.content, msg.timestamp || new Date().toISOString(), msg.isRead ? 1 : 0);
                        } catch (e) {}
                    }
                }
            }
        });

        insertTransaction(data);
        console.log("Migrasyon tamamlandı!");
    } catch (e) {
        console.error("Migrasyon hatası:", e.message);
    }
}

module.exports = {
    db,
    hashPassword,
    getUser,
    getAllUsers,
    createUser,
    verifyLogin,
    deleteUser,
    updateProfilePic,
    updateKnownWords,
    followUser,
    getFollowers,
    getFollowing,
    getConversation,
    getAllMessages,
    sendMessage,
    markMessagesRead,
    getFavorites,
    addFavorite,
    setActiveQuiz,
    getActiveQuiz,
    deactivateQuiz,
    migrateFromJSON
};

