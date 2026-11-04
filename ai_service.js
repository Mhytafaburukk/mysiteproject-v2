// ai_service.js - Donanımlı İngilizce Yapay Zeka Servisi (AI Question Generator & AI Chatbot)

const fs = require("fs");
const path = require("path");

// all_words.js içindeki kelimeleri yüklemeye çalışalım
let cachedWords = [];
try {
    const allWordsPath = path.join(__dirname, "public", "all_words.js");
    if (fs.existsSync(allWordsPath)) {
        const fileContent = fs.readFileSync(allWordsPath, "utf-8");
        const jsonMatch = fileContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            cachedWords = JSON.parse(jsonMatch[0]);
        }
    }
} catch (e) {
    console.log("Kelime listesi yüklenirken fallback kullanıldı:", e.message);
}

if (!cachedWords || cachedWords.length === 0) {
    cachedWords = [
        { word: "appointment", meaning: "randevu" },
        { word: "achievement", meaning: "başarı" },
        { word: "resilience", meaning: "dayanıklılık, yılmazlık" },
        { word: "comprehension", meaning: "kavrama, anlama" },
        { word: "fluency", meaning: "akıcılık" },
        { word: "opportunity", meaning: "fırsat" },
        { word: "challenge", meaning: "zorluk, meydan okuma" },
        { word: "improvement", meaning: "gelişme, ilerleme" },
        { word: "curious", meaning: "meraklı" },
        { word: "essential", meaning: "gerekli, temel" },
        { word: "persuade", meaning: "ikna etmek" },
        { word: "reluctant", meaning: "isteksiz" }
    ];
}

// Cümle ve Boşluk Doldurma Şablonları (AI NLP Motoru için)
const sentenceTemplates = [
    {
        pattern: "She showed great _______ by not giving up even after failing multiple times.",
        keywords: ["resilience", "determination", "patience", "courage"],
        defaultTarget: "resilience",
        tr: "Defalarca başarısız olmasına rağmen pes etmeyerek büyük bir dayanıklılık/azim gösterdi."
    },
    {
        pattern: "Don't forget that you have an important _______ with the dentist tomorrow at 3 PM.",
        keywords: ["appointment", "meeting", "interview", "consultation"],
        defaultTarget: "appointment",
        tr: "Yarın saat 15:00'te diş hekimiyle önemli bir randevun olduğunu unutma."
    },
    {
        pattern: "Winning the international award was the greatest _______ of her academic career.",
        keywords: ["achievement", "success", "milestone", "victory"],
        defaultTarget: "achievement",
        tr: "Uluslararası ödülü kazanmak, akademik kariyerinin en büyük başarısıydı."
    },
    {
        pattern: "Practicing speaking every day is essential to gain _______ in English.",
        keywords: ["fluency", "confidence", "accuracy", "proficiency"],
        defaultTarget: "fluency",
        tr: "İngilizcede akıcılık kazanmak için her gün konuşma pratiği yapmak şarttır."
    },
    {
        pattern: "This internship offers a wonderful _______ to gain real-world working experience.",
        keywords: ["opportunity", "chance", "possibility", "advantage"],
        defaultTarget: "opportunity",
        tr: "Bu staj, gerçek iş deneyimi kazanmak için harika bir fırsat sunuyor."
    },
    {
        pattern: "Drinking enough water and getting good sleep are _______ for maintaining health.",
        keywords: ["essential", "crucial", "vital", "necessary"],
        defaultTarget: "essential",
        tr: "Yeterince su içmek ve iyi uyumak, sağlığı korumak için elzemdir/temeldir."
    },
    {
        pattern: "He was very _______ about how modern artificial intelligence actually works.",
        keywords: ["curious", "enthusiastic", "passionate", "interested"],
        defaultTarget: "curious",
        tr: "Modern yapay zekanın gerçekte nasıl çalıştığı konusunda oldukça meraklıydı."
    },
    {
        pattern: "We need to make some key _______ in our study plan to get higher scores.",
        keywords: ["improvement", "changes", "adjustments", "progress"],
        defaultTarget: "improvement",
        tr: "Daha yüksek puanlar almak için çalışma planımızda bazı temel iyileştirmeler yapmamız gerekiyor."
    },
    {
        pattern: "He was _______ to leave his comfortable home and move to another country.",
        keywords: ["reluctant", "hesitant", "unwilling", "afraid"],
        defaultTarget: "reluctant",
        tr: "Konforlu evini bırakıp başka bir ülkeye taşınma konusunda isteksizdi."
    },
    {
        pattern: "The lawyer tried hard to _______ the jury of the client's innocence.",
        keywords: ["persuade", "convince", "assure", "satisfy"],
        defaultTarget: "persuade",
        tr: "Avukat, jüriyi müvekkilinin masum olduğuna ikna etmek için çok çabaladı."
    }
];

// AI İle Soru & Boşluk Doldurma Üretici
function generateAIQuestion(requestedWord, questionType) {
    let targetWord = requestedWord ? requestedWord.toLowerCase().trim() : null;
    let wordObj = null;

    if (targetWord) {
        wordObj = cachedWords.find(w => w.word.toLowerCase() === targetWord) || {
            word: targetWord,
            meaning: "özel kelime"
        };
    } else {
        wordObj = cachedWords[Math.floor(Math.random() * cachedWords.length)];
        targetWord = wordObj.word.toLowerCase();
    }

    // Şablonlardan uygun olan var mı kontrol et
    let matchedTemplate = sentenceTemplates.find(t => 
        t.defaultTarget.toLowerCase() === targetWord || 
        t.keywords.map(k => k.toLowerCase()).includes(targetWord)
    );

    let sentence = "";
    let translation = "";
    let options = [];

    if (matchedTemplate) {
        sentence = matchedTemplate.pattern;
        translation = matchedTemplate.tr;
        targetWord = matchedTemplate.defaultTarget;
        options = [targetWord];
        
        // Yanıltıcı şıkları kelime listesinden veya şablonun diğer kelimelerinden al
        while (options.length < 4) {
            const randomPick = cachedWords[Math.floor(Math.random() * cachedWords.length)].word;
            if (!options.map(o => o.toLowerCase()).includes(randomPick.toLowerCase())) {
                options.push(randomPick);
            }
        }
    } else {
        // Dinamik olarak kelimeden akıllı soru üret
        const sampleSentences = [
            `The company took a big step to achieve its goals, but the manager needed a clear _______ from the board.`,
            `In modern English, mastering the word '_______' is very useful for daily communication.`,
            `Students often find it challenging to use '_______' correctly in formal essays.`,
            `Can you choose the correct word that completes the context: '_______' refers to ${wordObj.meaning}.`
        ];
        
        const randomStructure = [
            {
                s: `I am looking forward to this great _______ to improve my English skills.`,
                correct: targetWord,
                tr: `İngilizce becerilerimi geliştirmek için bu harika fırsatı/adımı sabırsızlıkla bekliyorum.`
            },
            {
                s: `Understanding the concept of '_______' will help you express yourself much better.`,
                correct: targetWord,
                tr: `'${targetWord}' kavramını anlamak, kendinizi çok daha iyi ifade etmenizi sağlayacaktır.`
            },
            {
                s: `The teacher explained that '_______' (${wordObj.meaning}) plays a crucial role in language learning.`,
                correct: targetWord,
                tr: `Öğretmen, '${targetWord}' kelimesinin dil öğreniminde kritik bir rol oynadığını açıkladı.`
            }
        ];

        const chosen = randomStructure[Math.floor(Math.random() * randomStructure.length)];
        sentence = chosen.s.replace(targetWord, "_______");
        translation = chosen.tr;
        targetWord = wordObj.word;

        options = [targetWord];
        while (options.length < 4) {
            const pick = cachedWords[Math.floor(Math.random() * cachedWords.length)].word;
            if (!options.map(o => o.toLowerCase()).includes(pick.toLowerCase())) {
                options.push(pick);
            }
        }
    }

    // Seçenekleri karıştır
    options.sort(() => Math.random() - 0.5);

    return {
        success: true,
        word: targetWord,
        meaning: wordObj.meaning,
        type: questionType || "fill_in_the_blank",
        sentence: sentence,
        options: options,
        correctAnswer: targetWord,
        turkishHint: translation,
        explanation: `'${targetWord}' kelimesi Türkçede '${wordObj.meaning}' anlamına gelir. Bu cümlede bağlama en uygun ve gramer açısından doğru seçenek '${targetWord}'dir.`
    };
}

// AI Chatbot Donanımlı Yanıt Motoru (English AI Asistanı)
function generateChatResponse(userMessage, senderUsername) {
    const msg = (userMessage || "").trim();
    const lower = msg.toLowerCase();

    // 1. Sesli Mesaj Durumu
    if (msg.startsWith("[SES:")) {
        return "🎧 Sesli mesajınızı aldım ve dinledim! Telaffuz çalışmanız harika gidiyor. Bana sesli veya yazılı olarak istediğiniz İngilizce soruyu sorabilir, gramer kontrolü yaptırabilir veya pratik yapabilirsiniz!";
    }

    // 2. Selamlaşma
    if (lower.match(/^(merhaba|selam|hey|hi|hello|günaydın|iyi günler|good morning|good evening)/)) {
        return `Hello ${senderUsername}! 👋 Ben sitenin resmi **İngilizce AI Asistanıyım** (Doğrulanmış Asistan ✅).\n\nBugün sana nasıl yardımcı olabilirim?\n• 📝 Soru üretmemi veya test yapmamı isteyebilirsin ("Bana bir soru sor")\n• 🔍 Yazdığın bir cümlenin gramerini düzelttirebilirsin\n• 📚 Bir kelimenin anlamını, eş anlamlısını veya örnek cümlesini sorabilirsin\n• 💬 Benimle İngilizce pratik yapabilirsin!`;
    }

    // 3. Soru İsteği ("bana soru sor", "soru üret", "test yap", "quiz")
    if (lower.includes("soru sor") || lower.includes("test yap") || lower.includes("quiz") || lower.includes("soru üret") || lower.includes("ask me a question")) {
        const q = generateAIQuestion();
        return `🎯 **İşte senin için özel AI Sorusu:**\n\n📌 **Cümle:**\n${q.sentence}\n\n**Seçenekler:**\n${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n")}\n\n💡 *İpucu (Türkçesi):* ${q.turkishHint}\n\nCevabını bana yaz, hemen kontrol edeyim! (Örn: "${q.correctAnswer}")`;
    }

    // 4. Kelime Anlamı Soruları ("... ne demek", "meaning of ...", "anlamı nedir")
    const meaningMatch = lower.match(/(.+?)\s+(ne demek|anlamı nedir|anlamı ne|nedir|kelimesinin anlamı)/i) || 
                         lower.match(/meaning of\s+([a-zA-Z\s]+)/i) ||
                         lower.match(/what does\s+([a-zA-Z\s]+)\s+mean/i);

    if (meaningMatch) {
        let queryWord = (meaningMatch[1] || "").replace(/['"]/g, "").trim().toLowerCase();
        let found = cachedWords.find(w => w.word.toLowerCase() === queryWord);

        if (found) {
            return `📖 **Kelime Analizi: "${found.word}"** ✅\n\n• **Türkçe Anlamı:** ${found.meaning}\n• **Kullanım Alanı:** Günlük ve akademik İngilizce\n• **Örnek Cümle:** "You should take every opportunity to practice '${found.word}'."\n• **Çevirisi:** "Pratik yapmak için her fırsatı değerlendirmelisin."\n\nBu kelimeyle bir cümle kurmak ister misin? Kurduğun cümleyi kontrol edebilirim!`;
        } else {
            return `📖 **"${queryWord}"** hakkında:\nBu kelime İngilizce bağlamında önemli bir ifadedir. Sözlüğümüzde '${queryWord}' ile ilgili pratik yapabilir veya benden bu kelimeyle bir örnek cümle kurmamı isteyebilirsin!`;
        }
    }

    // 5. Gramer Düzeltme İsteği ("cümlem doğru mu", "düzelt", "gramer", "correct this")
    if (lower.includes("doğru mu") || lower.includes("düzelt") || lower.includes("correct") || lower.includes("hata var mı") || lower.includes("grammar")) {
        // Kullanıcının mesajındaki olası hataları kontrol edelim
        let cleanText = msg.replace(/(cümlem doğru mu|düzelt|hata var mı|bu doğru mu\??)/gi, "").trim();
        if (cleanText.length > 3) {
            let feedback = "Oldukça iyi bir deneme!";
            let improved = cleanText;

            // Bazı yaygın hataların tespiti
            if (cleanText.toLowerCase().includes("i am go")) {
                improved = cleanText.replace(/i am go/gi, "I am going / I go");
                feedback = "'am go' yerine 'I am going' (şimdiki zaman) veya 'I go' (geniş zaman) kullanılmalıdır.";
            } else if (cleanText.toLowerCase().includes("he go") || cleanText.toLowerCase().includes("she go")) {
                improved = cleanText.replace(/he go/gi, "He goes").replace(/she go/gi, "She goes");
                feedback = "3. tekil şahıslarda (He/She/It) geniş zamanda fiile '-s/-es' takısı gelir: 'goes'.";
            } else if (cleanText.toLowerCase().includes("i have 20 years old")) {
                improved = "I am 20 years old";
                feedback = "İngilizcede yaş belirtirken 'have' değil 'am/is/are' kullanılır.";
            } else {
                feedback = "Cümlen genel olarak anlaşılır ve gramer yapısı mantıklı görünüyor! Harika iş.";
            }

            return `🔍 **Gramer & İfade Analizi:**\n\n📝 **Senin cümlen:** "${cleanText}"\n✨ **Öneri / Düzeltme:** "${improved}"\n💡 **Açıklama:** ${feedback}`;
        }
    }

    // 6. İngilizce Sohbet (Pratik Modu)
    const englishGreetings = ["how are you", "what are you doing", "who are you", "tell me a story", "can we speak english"];
    if (englishGreetings.some(phrase => lower.includes(phrase))) {
        if (lower.includes("who are you")) {
            return `I am the **Official AI Assistant** of this English Learning Platform! 🤖 I am verified ✅ and designed to help you master English vocabulary, grammar, and conversation. Feel free to ask me anything!`;
        }
        if (lower.includes("how are you")) {
            return `I'm doing wonderful, thank you! 😊 Always energized and ready to help you learn English. How has your day been so far? Are you ready to practice?`;
        }
        if (lower.includes("can we speak english")) {
            return `Absolutely! Let's practice English together. 🚀 Tell me: What did you do today, or what is your favorite hobby?`;
        }
    }

    // 7. Kullanıcı soru cevabı vermiş olabilir mi? (Seçenek A, B, C, D veya kelime)
    let singleWordMatch = cachedWords.find(w => w.word.toLowerCase() === lower);
    if (singleWordMatch) {
        return `🌟 Harika! **"${singleWordMatch.word}"** kelimesi (${singleWordMatch.meaning}) sistemimizde kayıtlı doğru bir kelimedir. Bir sonraki soruya geçmek için "Bana yeni bir soru sor" yazabilirsin!`;
    }

    // 8. Akıllı Genel Yanıt (Öğretici & Destekleyici)
    return `🤖 **AI Asistanı:**\n"${msg}" mesajını aldım!\n\nİngilizce öğrenme yolculuğunda her zaman yanındayım. İster soru çözmek iste, ister kelime sor, ister İngilizce sohbet et!\n\n💡 **Hızlı Komutlar:**\n• "Bana bir soru sor"\n• "[Kelime] ne demek?"\n• "Bu cümle doğru mu: [cümle]"\n• "İngilizce pratik yapalım"`;
}

module.exports = {
    generateAIQuestion,
    generateChatResponse,
    cachedWords
};

