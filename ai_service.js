// ai_service.js - İngilizce Mentor AI Servisi (Soru Üretme, Cevap Kontrolü, Sohbet, Sesli Pratik)

const fs = require("fs");
const path = require("path");

// Kelime listesini yükle
let cachedWords = [];
try {
    const allWordsPath = path.join(__dirname, "public", "all_words.js");
    if (fs.existsSync(allWordsPath)) {
        const fileContent = fs.readFileSync(allWordsPath, "utf-8");
        const jsonMatch = fileContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) cachedWords = JSON.parse(jsonMatch[0]);
    }
} catch (e) {}

if (!cachedWords.length) {
    cachedWords = [
        { word: "involvement", meaning: "katılım, dahil olma" },
        { word: "appointment", meaning: "randevu" },
        { word: "achievement", meaning: "başarı" },
        { word: "resilience", meaning: "dayanıklılık" },
        { word: "opportunity", meaning: "fırsat" },
        { word: "challenge", meaning: "meydan okuma" },
        { word: "essential", meaning: "temel, zorunlu" },
        { word: "curious", meaning: "meraklı" },
        { word: "persuade", meaning: "ikna etmek" },
        { word: "reluctant", meaning: "isteksiz" },
        { word: "fluency", meaning: "akıcılık" },
        { word: "comprehension", meaning: "kavrama, anlama" }
    ];
}

// =============================================
// 1. CANLI LLM API ÇAĞRISI (Gemini / OpenAI)
// =============================================
async function callExternalAI(userMessage, apiKey, model, focusMode, level, conversationHistory) {
    if (!apiKey) return null;

    const systemPrompt = `You are English Mentor, a verified expert English language tutor on an English learning platform.
Student level: ${level || "auto"}.
Focus mode: ${focusMode || "coach"}.

CORE RULES:
1. Be warm, encouraging, and natural - never robotic or repetitive.
2. If the student writes in Turkish, respond in Turkish but always include English examples, translations, and explanations.
3. If they write in English, respond in English and gently correct any mistakes.
4. When they ask for a word in a sentence, give 2-3 varied example sentences with Turkish translations.
5. When asked to generate a quiz question, create a fill-in-the-blank sentence and provide exactly 4 options (A, B, C, D). Clearly mark which letter is correct at the end with "CORRECT: X" format.
6. When checking grammar, explain errors clearly with corrected versions.
7. For casual conversation, be engaging and ask follow-up questions.
8. Keep responses concise but informative.`;

    // Build conversation messages
    let messages = [];
    if (conversationHistory && conversationHistory.length > 0) {
        // Last 6 messages for context
        const recent = conversationHistory.slice(-6);
        for (const msg of recent) {
            messages.push({
                role: msg.sender === "English_Mentor" ? "model" : "user",
                parts: [{ text: msg.content }]
            });
        }
    }
    messages.push({ role: "user", parts: [{ text: userMessage }] });

    // Gemini API
    if (model && model.startsWith("gemini") && apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: messages,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 1200 }
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return data.candidates[0].content.parts[0].text;
                }
            } else {
                console.error("Gemini API Error:", res.status, await res.text());
            }
        } catch (err) {
            console.error("Gemini Connection Error:", err.message);
        }
    }

    // OpenAI API
    if (model && model.startsWith("gpt") && apiKey) {
        try {
            const openaiMessages = [{ role: "system", content: systemPrompt }];
            if (conversationHistory) {
                for (const msg of conversationHistory.slice(-6)) {
                    openaiMessages.push({
                        role: msg.sender === "English_Mentor" ? "assistant" : "user",
                        content: msg.content
                    });
                }
            }
            openaiMessages.push({ role: "user", content: userMessage });

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model, messages: openaiMessages, temperature: 0.8 })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
            }
        } catch (err) {
            console.error("OpenAI Connection Error:", err.message);
        }
    }

    return null;
}

// =============================================
// 2. SORU ÜRETİCİ (Quiz Generator)
// =============================================
function generateQuizQuestion(requestedWord) {
    const templates = [
        { s: "She showed great _______ by not giving up even after multiple failures.", target: "resilience", tr: "Defalarca başarısız olmasına rağmen pes etmeyerek büyük bir dayanıklılık gösterdi." },
        { s: "I need to reschedule my _______ with the dentist for next week.", target: "appointment", tr: "Diş hekimiyle randevumu gelecek haftaya ertelemem gerekiyor." },
        { s: "Winning the scholarship was the greatest _______ of her career.", target: "achievement", tr: "Bursu kazanmak, kariyerinin en büyük başarısıydı." },
        { s: "This job offers a wonderful _______ to gain international experience.", target: "opportunity", tr: "Bu iş, uluslararası deneyim kazanmak için harika bir fırsat sunuyor." },
        { s: "Active _______ in classroom discussions improves speaking skills rapidly.", target: "involvement", tr: "Sınıf tartışmalarına aktif katılım, konuşma becerilerini hızla geliştirir." },
        { s: "Drinking enough water and sleeping well are _______ for good health.", target: "essential", tr: "Yeterince su içmek ve iyi uyumak, sağlık için temeldir." },
        { s: "He was very _______ about how quantum computers actually work.", target: "curious", tr: "Kuantum bilgisayarların nasıl çalıştığı konusunda çok meraklıydı." },
        { s: "The lawyer tried to _______ the jury that his client was innocent.", target: "persuade", tr: "Avukat, müvekkilinin masum olduğuna jüriyi ikna etmeye çalıştı." },
        { s: "She was _______ to leave her comfortable job and move abroad.", target: "reluctant", tr: "Rahat işini bırakıp yurt dışına taşınma konusunda isteksizdi." },
        { s: "Daily practice is the key to achieving _______ in any language.", target: "fluency", tr: "Günlük pratik, herhangi bir dilde akıcılığa ulaşmanın anahtarıdır." },
        { s: "Learning a new language requires patience and strong _______.", target: "determination", tr: "Yeni bir dil öğrenmek sabır ve güçlü bir kararlılık gerektirir." },
        { s: "The students worked hard to _______ their presentation skills.", target: "improve", tr: "Öğrenciler sunum becerilerini geliştirmek için çok çalıştı." },
        { s: "Reading books regularly helps to increase your vocabulary and _______.", target: "comprehension", tr: "Düzenli kitap okumak kelime dağarcığınızı ve kavrama yeteneğinizi artırır." },
        { s: "Climate change is one of the biggest _______ facing humanity today.", target: "challenge", tr: "İklim değişikliği, insanlığın bugün karşı karşıya olduğu en büyük zorluklardan biridir." },
    ];

    let chosen;
    if (requestedWord) {
        chosen = templates.find(t => t.target.toLowerCase() === requestedWord.toLowerCase());
    }
    if (!chosen) {
        chosen = templates[Math.floor(Math.random() * templates.length)];
    }

    // 4 seçenek oluştur
    let options = [chosen.target];
    const pool = cachedWords.map(w => w.word).filter(w => w.toLowerCase() !== chosen.target.toLowerCase());
    while (options.length < 4 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(idx, 1)[0];
        if (!options.includes(pick)) options.push(pick);
    }
    // Karıştır
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        sentence: chosen.s,
        correctAnswer: chosen.target,
        options: options,
        turkishHint: chosen.tr,
        meaning: (cachedWords.find(w => w.word.toLowerCase() === chosen.target.toLowerCase()) || {}).meaning || ""
    };
}

// =============================================
// 3. YERLEŞİK AKILLI YANIT MOTORU (Fallback)
// =============================================
function generateFallbackResponse(userMessage, senderUsername, dbModule) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // --- Sesli mesaj ---
    if (raw.startsWith("[SES:")) {
        return "Sesli mesajını aldım! Telaffuz çalışman için harika bir adım. Bir kelime veya cümle söyle, birlikte üzerinde çalışalım.";
    }

    // --- Aktif quiz cevabı kontrolü ---
    if (dbModule) {
        const activeQuiz = dbModule.getActiveQuiz(senderUsername);
        if (activeQuiz) {
            const userAnswer = raw.replace(/^[a-dA-D]\)\s*/, "").trim().toLowerCase();
            const correctAnswer = activeQuiz.correct_answer.toLowerCase();

            // Kullanıcı A/B/C/D harfi mi yazdı?
            const letterMatch = raw.match(/^([a-dA-D])[\)\.\s]*$/);
            let actualAnswer = userAnswer;
            if (letterMatch) {
                const letterIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
                if (letterIndex >= 0 && letterIndex < activeQuiz.options.length) {
                    actualAnswer = activeQuiz.options[letterIndex].toLowerCase();
                }
            }

            const isCorrect = (actualAnswer === correctAnswer) ||
                              (userAnswer === correctAnswer) ||
                              (raw.toLowerCase() === correctAnswer);

            dbModule.deactivateQuiz(senderUsername);

            if (isCorrect) {
                return `✅ **Doğru cevap! Tebrikler!** 🎉\n\nCevap: **${activeQuiz.correct_answer}**\n\n🇹🇷 **Cümlenin çevirisi:** ${activeQuiz.turkish_hint}\n\nDevam etmek için "Yeni soru" yaz veya başka bir şey sorabilirsin!`;
            } else {
                return `❌ **Yanlış cevap.**\n\nSenin cevabın: **${raw}**\nDoğru cevap: **${activeQuiz.correct_answer}**\n\n🇹🇷 **Cümlenin çevirisi:** ${activeQuiz.turkish_hint}\n\n💡 **${activeQuiz.correct_answer}** kelimesi bu bağlamda en uygun seçenek çünkü cümlenin anlam ve gramer yapısına tam olarak oturuyor.\n\nTekrar denemek için "Yeni soru" yaz!`;
            }
        }
    }

    // --- Soru / Quiz isteği ---
    if (lower.match(/(soru\s*(sor|üret|ver|yaz)|test\s*yap|quiz|bana.*soru|ask\s*me|yeni\s*soru|bir\s*soru)/)) {
        const q = generateQuizQuestion();

        // Quiz state kaydet
        if (dbModule) {
            dbModule.setActiveQuiz(senderUsername, q.sentence, q.correctAnswer, q.options, q.turkishHint);
        }

        const optionLetters = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n");

        return `🎯 **İşte senin için bir İngilizce sorusu:**\n\nAşağıdaki boşluğu doldurun:\n\n📌 *${q.sentence}*\n\n**Seçenekler:**\n${optionLetters}\n\n💡 *İpucu:* ${q.turkishHint}\n\nCevabını yaz! (Harf veya kelime olarak: A, B, C, D ya da doğrudan kelimeyi)`;
    }

    // --- Kelimeyi cümle içinde kullanma ---
    const sentenceMatch = lower.match(/(.+?)\s*(kelimesini|ile|'?ı?'?|'?yi?'?)?\s*(cümle\s*i[çc]inde\s*kullan|cümle\s*kur|örnek\s*cümle)/i) ||
                          lower.match(/use\s+([a-zA-Z\s]+)\s+in\s+a\s+sentence/i);

    if (sentenceMatch) {
        let word = (sentenceMatch[1] || "").replace(/(kelimesini|ile|lütfen|mısın|misin|\?|')/gi, "").trim();
        word = word.split(/\s+/).pop();
        const found = cachedWords.find(w => w.word.toLowerCase() === word.toLowerCase());
        const meaning = found ? found.meaning : "ilgili kavram";

        return `Tabii! **"${word}"** (${meaning}) kelimesini farklı bağlamlarda kullanalım:\n\n📌 **1. Günlük Kullanım:**\n> *"Her active ${word} in the school project impressed all her teachers."*\n> 🇹🇷 *"Okul projesindeki aktif katılımı tüm öğretmenlerini etkiledi."*\n\n📌 **2. Formal / Akademik:**\n> *"The company denied any direct ${word} in the financial scandal."*\n> 🇹🇷 *"Şirket, finansal skandala herhangi bir doğrudan dahil olmayı reddetti."*\n\n📌 **3. Kişisel:**\n> *"My ${word} in volunteer work has taught me valuable life lessons."*\n> 🇹🇷 *"Gönüllü çalışmalardaki katılımım bana değerli hayat dersleri öğretti."*\n\nŞimdi sıra sende! Bu kelimeyle kendi cümleni kur, kontrol edeyim.`;
    }

    // --- Kelime anlamı ---
    const meaningMatch = lower.match(/(.+?)\s+(ne\s*demek|anlamı\s*nedir|anlamı\s*ne|kelimesinin\s*anlamı)/i) ||
                         lower.match(/meaning\s*of\s+([a-zA-Z\s]+)/i) ||
                         lower.match(/what\s*does\s+([a-zA-Z\s]+)\s*mean/i);

    if (meaningMatch) {
        let word = (meaningMatch[1] || "").replace(/['"?]/g, "").trim().toLowerCase();
        const found = cachedWords.find(w => w.word.toLowerCase() === word);

        if (found) {
            return `📖 **"${found.word}"** Kelime İncelemesi:\n\n• **Türkçe Anlamı:** ${found.meaning}\n• **Örnek Cümle:** *"You should take every ${found.word} to practice English."*\n• **Çevirisi:** *"İngilizce pratik yapmak için her fırsatı değerlendirmelisin."*\n\nBu kelimeyle cümle kurmak ister misin?`;
        }
        return `📖 **"${word}"** hakkında: Bu kelimeyi cümle içinde kullanmamı veya detaylı açıklamamı istersen söyle!`;
    }

    // --- Gramer düzeltme ---
    if (lower.includes("doğru mu") || lower.includes("düzelt") || lower.includes("correct") || lower.includes("hata var mı") || lower.includes("grammar") || lower.includes("check")) {
        let cleanText = raw.replace(/(cümlem?\s*doğru\s*mu|düzelt|hata\s*var\s*mı|bu\s*doğru\s*mu\??|check|correct\s*this)/gi, "").trim();
        if (cleanText.length > 3) {
            let feedback = "Cümlen gayet anlaşılır ve doğru!";
            let improved = cleanText;

            if (/\bi\s+(am\s+)?go\b/i.test(cleanText) && !/going/i.test(cleanText)) {
                improved = cleanText.replace(/\bi am go\b/gi, "I am going").replace(/\bi go\b/gi, "I go");
                feedback = "'I am go' yerine şimdiki zaman için **'I am going'**, geniş zaman için **'I go'** kullanılır.";
            } else if (/\b(he|she)\s+go\b/i.test(cleanText)) {
                improved = cleanText.replace(/\bhe go\b/gi, "He goes").replace(/\bshe go\b/gi, "She goes");
                feedback = "3. tekil şahıslarda geniş zamanda fiil **'-s/-es'** takısı alır: **goes**.";
            } else if (/\bi have \d+ years old\b/i.test(cleanText)) {
                improved = cleanText.replace(/i have (\d+) years old/gi, "I am $1 years old");
                feedback = "İngilizcede yaş belirtirken **'have'** değil **'am/is/are'** kullanılır.";
            } else if (/\bsince \d+ (years?|months?|days?)\b/i.test(cleanText)) {
                feedback = "'Since' belirli bir tarih/zaman noktası ile kullanılır (since 2020). Süre belirtmek için **'for'** kullanılır (for 2 years).";
                improved = cleanText.replace(/since (\d+ (?:years?|months?|days?))/gi, "for $1");
            }

            return `🔍 **Cümle Analizi:**\n\n📝 **Senin cümlen:** "${cleanText}"\n✨ **Düzeltme/Öneri:** "${improved}"\n💡 **Açıklama:** ${feedback}`;
        }
    }

    // --- Selamlaşma ---
    if (lower.match(/^(merhaba|selam|hey|hi|hello|günaydın|iyi\s*günler|good\s*morning|good\s*evening|nasılsın)/)) {
        return `Merhaba ${senderUsername}! 👋\n\nBen senin İngilizce Mentörünüm. Bugün ne üzerinde çalışmak istersin?\n\n• Bir kelime sor → *"resilience ne demek?"*\n• Cümle içinde kullanım iste → *"achievement kelimesini cümle içinde kullan"*\n• Test çöz → *"Bana bir soru sor"*\n• Gramer kontrolü → *"I have 20 years old - doğru mu?"*\n• İngilizce sohbet → *"Let's chat in English!"*\n\nHaydi başlayalım!`;
    }

    // --- İngilizce sohbet isteği ---
    if (lower.match(/(ingilizce\s*(sohbet|konuş|pratik)|let'?s?\s*(chat|talk|speak|practice)|english\s*(chat|conversation)|sohbet\s*edelim|konuşalım|pratik\s*yapalım)/)) {
        const topics = [
            "What's the most interesting thing you learned this week? Tell me about it!",
            "If you could travel anywhere in the world right now, where would you go and why?",
            "What's your favorite hobby? How did you get into it?",
            "Tell me about a movie or book you enjoyed recently. What made it special?",
            "What would you do if you had an extra hour every day?"
        ];
        const pick = topics[Math.floor(Math.random() * topics.length)];
        return `Great! Let's practice English together! 🗣️\n\nHere's a conversation starter for you:\n\n**${pick}**\n\nTake your time and answer in English. Don't worry about mistakes — I'll help you if needed! 😊`;
    }

    // --- İngilizce cümle yazılmışsa (pratik/sohbet devamı) ---
    const englishRatio = (raw.match(/[a-zA-Z]/g) || []).length / Math.max(raw.length, 1);
    if (englishRatio > 0.7 && raw.length > 10) {
        // İngilizce yazılmış, sohbet devam ettir
        const responses = [
            `That's a great response! 👏\n\nI noticed your English is quite good. Let me share a useful expression:\n\n💡 **Tip:** Instead of saying "${raw.split(" ").slice(0, 3).join(" ")}...", you could also say it more naturally as: *"${raw.split(" ").slice(0, 3).join(" ")}..."*\n\nKeep going! What else would you like to talk about?`,
            `Nice! Your English is getting better! 🌟\n\nHere's a follow-up question: **What do you think is the most challenging part of learning English?**\n\nFeel free to answer in English or Turkish!`,
            `Well said! I can see you're making progress! 💪\n\nLet me ask you something: **Can you rephrase what you just said using different words?** This is a great exercise for building vocabulary!`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // --- Deyim / Idiom isteği ---
    if (lower.match(/(deyim|idiom|expression|kalıp)/)) {
        const idioms = [
            { en: "Break the ice", tr: "Buzları kırmak", ex: "She told a joke to break the ice at the meeting.", extr: "Toplantıda buzları kırmak için bir şaka anlattı." },
            { en: "Hit the nail on the head", tr: "Tam isabetli konuşmak", ex: "You hit the nail on the head with that analysis.", extr: "O analizle tam isabetli konuştun." },
            { en: "Bite off more than you can chew", tr: "Başa çıkamayacağın işe girişmek", ex: "I bit off more than I could chew by taking 6 courses.", extr: "6 ders alarak başa çıkamayacağım bir işe giriştim." },
            { en: "A piece of cake", tr: "Çocuk oyuncağı, çok kolay", ex: "The exam was a piece of cake!", extr: "Sınav çocuk oyuncağıydı!" },
        ];
        const pick = idioms[Math.floor(Math.random() * idioms.length)];
        return `🗣️ **Günün Deyimi (Idiom):**\n\n**"${pick.en}"** → ${pick.tr}\n\n📌 **Örnek:** *"${pick.ex}"*\n🇹🇷 **Çevirisi:** *"${pick.extr}"*\n\nBu deyimi kendi cümlende kullanmayı dene!`;
    }

    // --- Günün kelimesi ---
    if (lower.match(/(günün\s*kelimesi|word\s*of\s*the\s*day|yeni\s*kelime|bir\s*kelime\s*öğret)/)) {
        const pick = cachedWords[Math.floor(Math.random() * cachedWords.length)];
        return `🌟 **Günün Kelimesi:**\n\n**"${pick.word}"** → ${pick.meaning}\n\n📌 **Örnek cümle:** *"${pick.word.charAt(0).toUpperCase() + pick.word.slice(1)} is crucial for personal growth and professional success."*\n🇹🇷 *"${pick.meaning.split(",")[0]} kişisel gelişim ve profesyonel başarı için çok önemlidir."*\n\nBu kelimeyle bir cümle kur, kontrol edeyim!`;
    }

    // --- Genel Akıllı Yanıt ---
    return `"${raw}" ile ilgili yardımcı olayım!\n\nŞunlardan birini deneyebilirsin:\n• **"Bana bir soru sor"** → Test çöz\n• **"[kelime] ne demek?"** → Kelime anlamı\n• **"[kelime] cümle içinde kullan"** → Örnek cümleler\n• **"[cümle] doğru mu?"** → Gramer kontrolü\n• **"İngilizce sohbet edelim"** → Pratik yap\n• **"Deyim öğret"** → İngilizce deyimler\n\nNe yapmak istersin?`;
}

// =============================================
// 4. AI SORU ÜRETİCİ (kelime.html için)
// =============================================
function generateAIQuestion(requestedWord) {
    return generateQuizQuestion(requestedWord);
}

module.exports = {
    callExternalAI,
    generateFallbackResponse,
    generateQuizQuestion,
    generateAIQuestion,
    cachedWords
};
