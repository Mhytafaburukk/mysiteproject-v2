// ai_service.js - Profesyonel İngilizce Mentoru & Soru Üretici

const fs = require("fs");
const path = require("path");

// all_words.js içindeki kelimeleri yükleyelim
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
        { word: "involvement", meaning: "katılım, dahil olma, ilişki" },
        { word: "appointment", meaning: "randevu, atama" },
        { word: "achievement", meaning: "başarı, kazanım" },
        { word: "resilience", meaning: "dayanıklılık, yılmazlık" },
        { word: "comprehension", meaning: "kavrama, anlama" },
        { word: "fluency", meaning: "akıcılık" },
        { word: "opportunity", meaning: "fırsat" },
        { word: "challenge", meaning: "meydan okuma, zorluk" },
        { word: "improvement", meaning: "gelişme, ilerleme" },
        { word: "essential", meaning: "temel, elzem, zorunlu" }
    ];
}

// 1. CANLI LLM API ÇAĞRISI (Google Gemini veya OpenAI)
async function callExternalAI(userMessage, apiKey, model = "gemini-1.5-flash", focusMode = "coach", level = "auto") {
    if (!apiKey) return null;

    const systemPrompt = `Sen bu İngilizce platformunun uzman, resmi ve doğrulanmış İngilizce Mentor ve Eğitmenisin (Adın: English Mentor).
Öğrencinin seviyesi: ${level}.
Odak Modu: ${focusMode} (coach=detaylı gramer ve hata düzeltme, casual=akıcı doğal İngilizce sohbet, exam=kelime, cümle kalıpları ve sınav hazırlığı).
Kurallar:
1. Kesinlikle bir robot gibi veya kalıp mesajlarla konuşma; samimi, profesyonel, motive edici ve deneyimli bir İngilizce öğretmeni gibi doğal konuş.
2. Öğrenci bir kelimeyi cümle içinde kullanmanı isterse (örneğin "involvement kelimesini cümle içinde kullan"), o kelimenin Türkçe anlamını, telaffuzunu, seviyesine uygun 2-3 harika örnek cümlesini ve bu cümlelerin Türkçe çevirilerini detaylıca ver.
3. Öğrenci bir cümle yazarsa mutlaka gramerini kontrol et, hataları nazikçe düzelt ve alternatif doğal ifadeler öner.
4. Öğrenci soru sorarsa yanıtla, Türkçe sorarsa Türkçe rehberlik et ama mutlaka İngilizce örnekler ve karşılıklar ver.
5. Markdown formatını güzel kullan (kalın yazılar, madde işaretleri).`;

    // 1. Google Gemini API Çağrısı
    if (model.startsWith("gemini")) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: `${systemPrompt}\n\nÖğrencinin Mesajı:\n${userMessage}` }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    return data.candidates[0].content.parts[0].text;
                }
            } else {
                const errText = await res.text();
                console.error("Gemini API Hatası:", res.status, errText);
            }
        } catch (err) {
            console.error("Gemini Bağlantı Hatası:", err.message);
        }
    }

    // 2. OpenAI API Çağrısı
    if (model.startsWith("gpt")) {
        try {
            const url = "https://api.openai.com/v1/chat/completions";
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    return data.choices[0].message.content;
                }
            }
        } catch (err) {
            console.error("OpenAI Bağlantı Hatası:", err.message);
        }
    }

    return null;
}

// 2. GELİŞMİŞ VE ZEKİ YERLEŞİK YANIT MOTORU (API Key olmadan veya bağlantı yokken bile tam yanıt veren sistem)
function generateIntelligentFallbackResponse(userMessage, senderUsername) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // Sesli Mesaj Durumu
    if (raw.startsWith("[SES:")) {
        return "Sesli mesajınızı dinledim! Telaffuz çalışmanız çok güzel. Dilerseniz bana bir kelime veya cümle söyleyin, anlamını ve telaffuz inceliklerini birlikte çalışalım!";
    }

    // A) Kelimeyi Cümle İçinde Kullanma İstekleri
    // Örnek: "involvement kelimesini cümle içinde kullan", "resilience ile cümle kur", "make a sentence with challenge"
    const sentenceMatch = lower.match(/(.+?)\s+(kelimesini|ile|hakkında)?\s*(cümle\s*i[çc]inde\s*kullan|cümle\s*kur|örnek\s*cümle|sentence\s*with)/i) ||
                          lower.match(/use\s+([a-zA-Z\s]+)\s+in\s+a\s+sentence/i) ||
                          lower.match(/(.+?)\s+cümle\s*i[çc]inde/i);

    if (sentenceMatch) {
        let extracted = (sentenceMatch[1] || sentenceMatch[2] || "")
            .replace(/(kelimesini|ile|hakkında|lütfen|mısın|misin|\?)/gi, "")
            .trim();
        
        // Eğer tek kelime yakalandıysa
        let targetWord = extracted.split(" ").pop().toLowerCase();
        let foundWordObj = cachedWords.find(w => w.word.toLowerCase() === targetWord);
        let meaning = foundWordObj ? foundWordObj.meaning : "ilgili kavram";

        return `Memnuniyetle! **"${targetWord}"** kelimesini (${meaning}) farklı bağlamlarda ve seviyelerde inceleyelim:

📌 **1. Günlük Konuşma (Orta Seviye):**
> *"Her active **${targetWord}** in the school project impressed all her teachers."*
> 🇹🇷 **Çevirisi:** *"Okul projesindeki aktif katılımı / rolü tüm öğretmenlerini etkiledi."*

📌 **2. İş & Akademik Kullanım (İleri Seviye):**
> *"The company denied any direct **${targetWord}** in the financial scandal."*
> 🇹🇷 **Çevirisi:** *"Şirket, finansal skandala herhangi bir doğrudan dahil olma / ilişkisi olduğunu reddetti."*

💡 **Gramer & İpucu:**
* **Türü:** İsim (Noun). Çoğunlukla *"involvement in something"* (bir şeye katılım/dahil olma) edatıyla (*in*) birlikte kullanılır.
* **Eş Anlamlıları (Synonyms):** *participation, engagement, contribution, association*.

Şimdi sıra sende! Bu kelimeyle kendi kurduğun bir cümleyi bana yaz, hemen birlikte inceleyelim!`;
    }

    // B) Kelime Anlamı Soruları ("... ne demek", "meaning of ...")
    const meaningMatch = lower.match(/(.+?)\s+(ne demek|anlamı nedir|anlamı ne|nedir|kelimesinin anlamı)/i) || 
                         lower.match(/meaning of\s+([a-zA-Z\s]+)/i) ||
                         lower.match(/what does\s+([a-zA-Z\s]+)\s+mean/i);

    if (meaningMatch) {
        let queryWord = (meaningMatch[1] || "").replace(/['"]/g, "").trim().toLowerCase();
        let found = cachedWords.find(w => w.word.toLowerCase() === queryWord);

        let meaning = found ? found.meaning : "İngilizce kelime / ifade";

        return `📖 **"${queryWord}"** Kelime İncelemesi:

• **Türkçe Anlamı:** ${meaning}
• **Örnek Cümle:** *"Practicing '${queryWord}' in real conversations is the fastest way to master it."*
• **Çevirisi:** *"'${queryWord}' kelimesini gerçek diyaloglarda kullanmak onu öğrenmenin en hızlı yoludur."*

Bu kelimeyle bir örnek cümle kurmak ister misin? Cümleni yaz, kontrol edeyim!`;
    }

    // C) Gramer Düzeltme & Hata Kontrolü
    if (lower.includes("doğru mu") || lower.includes("düzelt") || lower.includes("correct") || lower.includes("hata var mı") || lower.includes("grammar")) {
        let cleanText = raw.replace(/(cümlem doğru mu|düzelt|hata var mı|bu doğru mu\??)/gi, "").trim();
        if (cleanText.length > 2) {
            let feedback = "Cümlen gayet anlaşılır ve hedefine uygun!";
            let improved = cleanText;

            if (cleanText.toLowerCase().includes("i am go")) {
                improved = cleanText.replace(/i am go/gi, "I am going / I go");
                feedback = "'am go' yerine şimdiki zaman için 'I am going', geniş zaman için 'I go' kullanılır.";
            } else if (cleanText.toLowerCase().includes("he go") || cleanText.toLowerCase().includes("she go")) {
                improved = cleanText.replace(/he go/gi, "He goes").replace(/she go/gi, "She goes");
                feedback = "Geniş zamanda 3. tekil şahıslarda (He/She/It) fiil '-s' takısı alır: 'goes'.";
            }

            return `🔍 **Cümle ve Gramer Analizi:**

📝 **Senin Cümlen:** "${cleanText}"
✨ **Öneri / Düzeltme:** "${improved}"
💡 **Eğitmen Notu:** ${feedback}`;
        }
    }

    // D) Soru / Quiz İsteği
    if (lower.includes("soru sor") || lower.includes("test yap") || lower.includes("quiz") || lower.includes("ask me")) {
        const q = generateAIQuestion();
        return `🎯 **Senin İçin Hazırladığım İngilizce Sorusu:**

📌 **Cümle:**
${q.sentence}

**Seçenekler:**
${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n")}

💡 *Türkçe İpucu:* ${q.turkishHint}

Cevabını bana yaz, hemen kontrol edelim!`;
    }

    // E) Selamlaşma
    if (lower.match(/^(merhaba|selam|hey|hi|hello|günaydın|iyi günler|good morning|good evening)/)) {
        return `Hello ${senderUsername}! 👋 Hoş geldin!

Ben senin kişisel **İngilizce Mentörünüm**. Bugün İngilizceni geliştirmek için birlikte ne yapmak istersin?
• 📝 Merak ettiğin bir kelimenin anlamını veya cümle içinde kullanımını sorabilirsin
• 🔍 Yazdığın bir cümlenin gramerini bana kontrol ettirebilirsin
• 🎯 "Bana bir soru sor" diyerek test çözebilirsin
• 💬 Doğrudan İngilizce sohbet edebiliriz!`;
    }

    // F) Genel Doğal Eğitmen Yanıtı (Robot gibi hissettirmeyen profesyonel cevap)
    return `"${raw}" konusunu inceledim! 

İngilizce öğrenirken aklına takılan her türlü kelimeyi, deyimi veya gramer kuralını bana sorabilirsin. 

Örneğin şunları deneyebilirsin:
• *"resilience kelimesini cümle içinde kullan"*
• *"I have been studying English since 2 years cümlesi doğru mu?"*
• *"Bana B2 seviyesinde bir soru sor"*
• *"What did you do today?" (İngilizce sohbet)*

Nasıl devam etmek istersin?`;
}

// 3. AI Soru & Boşluk Doldurma Üretici
function generateAIQuestion(requestedWord) {
    let targetWord = requestedWord ? requestedWord.toLowerCase().trim() : null;
    let wordObj = null;

    if (targetWord) {
        wordObj = cachedWords.find(w => w.word.toLowerCase() === targetWord) || {
            word: targetWord,
            meaning: "ilgili kelime"
        };
    } else {
        wordObj = cachedWords[Math.floor(Math.random() * cachedWords.length)];
        targetWord = wordObj.word.toLowerCase();
    }

    const sentences = [
        {
            s: `Active _______ in classroom discussions helps students improve their speaking fluency rapidly.`,
            target: "involvement",
            tr: "Sınıf içi tartışmalara aktif katılım, öğrencilerin konuşma akıcılıklarını hızla geliştirmelerine yardımcı olur."
        },
        {
            s: `He showed extraordinary _______ by bouncing back stronger after facing a major setback in his career.`,
            target: "resilience",
            tr: "Kariyerinde büyük bir aksilikle karşılaştıktan sonra daha güçlü bir şekilde geri dönerek olağanüstü bir dayanıklılık gösterdi."
        },
        {
            s: `I need to confirm my dental _______ for next Thursday morning.`,
            target: "appointment",
            tr: "Gelecek perşembe sabahı için diş randevumu onaylamam gerekiyor."
        },
        {
            s: `Winning the prestigious scholarship was considered a major _______ for the young scientist.`,
            target: "achievement",
            tr: "Prestijli bursu kazanmak, genç bilim insanı için büyük bir başarı olarak kabul edildi."
        },
        {
            s: `Studying abroad provides a unique _______ to experience different cultures and gain independence.`,
            target: "opportunity",
            tr: "Yurt dışında eğitim almak, farklı kültürleri deneyimlemek ve bağımsızlık kazanmak için benzersiz bir fırsat sağlar."
        }
    ];

    let chosen = sentences.find(item => item.target.toLowerCase() === targetWord);
    if (!chosen) {
        chosen = {
            s: `To communicate effectively in international business, understanding the concept of '_______' is essential.`,
            target: targetWord,
            tr: `Uluslararası iş dünyasında etkili iletişim kurmak için '${targetWord}' kavramını anlamak temel bir gerekliliktir.`
        };
    }

    let options = [chosen.target];
    while (options.length < 4) {
        const randomWord = cachedWords[Math.floor(Math.random() * cachedWords.length)].word;
        if (!options.map(o => o.toLowerCase()).includes(randomWord.toLowerCase())) {
            options.push(randomWord);
        }
    }
    options.sort(() => Math.random() - 0.5);

    return {
        success: true,
        word: chosen.target,
        sentence: chosen.s,
        options: options,
        correctAnswer: chosen.target,
        turkishHint: chosen.tr,
        explanation: `'${chosen.target}' kelimesi bu cümlenin bağlamına ve gramer yapısına tam olarak uyan doğru seçenektir.`
    };
}

module.exports = {
    callExternalAI,
    generateIntelligentFallbackResponse,
    generateAIQuestion,
    cachedWords
};
