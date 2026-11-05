// ai_service.js - İngilizce Mentor AI Servisi (Canlı API, Soru Üretme, Cevap Kontrolü, Zengin Sözlük, Akıllı Yanıt)

const fs = require("fs");
const path = require("path");

// =============================================
// ZENGİN KELİME HAVUZU (Yerleşik + Dosyadan)
// =============================================
const BUILTIN_VOCABULARY = [
    {
        word: "resilience",
        meaning: "dayanıklılık, kendini toparlama gücü",
        phonetic: "/rɪˈzɪl.jəns/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "She showed great resilience by bouncing back quickly after the setback.", tr: "Yaşadığı aksilikten sonra hızla toparlanarak büyük bir dayanıklılık gösterdi." },
            { en: "Emotional resilience is essential for handling high-pressure work environments.", tr: "Duygusal dayanıklılık, yüksek baskılı çalışma ortamlarıyla başa çıkmak için temeldir." },
            { en: "The human spirit has an incredible capacity for resilience in times of crisis.", tr: "İnsan ruhu, kriz zamanlarında inanılmaz bir kendini toparlama kapasitesine sahiptir." }
        ]
    },
    {
        word: "involvement",
        meaning: "katılım, dahil olma, ilgi",
        phonetic: "/ɪnˈvɒlv.mənt/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "Active involvement in classroom discussions improves speaking fluency.", tr: "Sınıf tartışmalarına aktif katılım, konuşma akıcılığını geliştirir." },
            { en: "Her direct involvement in the community project made a huge difference.", tr: "Toplum projesine doğrudan dahil olması çok büyük bir fark yarattı." },
            { en: "The company denied any financial involvement in the disputed contract.", tr: "Şirket, tartışmalı sözleşmeye herhangi bir finansal dahiliyeti olduğunu reddetti." }
        ]
    },
    {
        word: "appointment",
        meaning: "randevu, tayin / atama",
        phonetic: "/əˈpɔɪnt.mənt/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "I scheduled an appointment with my dentist for next Tuesday morning.", tr: "Gelecek salı sabahı için diş hekimimle bir randevu ayarladım." },
            { en: "His appointment as chief executive surprised everyone in the industry.", tr: "Genel müdür olarak atanması sektördeki herkesi şaşırttı." },
            { en: "Please call our office if you need to reschedule or cancel your appointment.", tr: "Randevunuzu ertelemeniz veya iptal etmeniz gerekirse lütfen ofisimizi arayın." }
        ]
    },
    {
        word: "achievement",
        meaning: "başarı, kazanım",
        phonetic: "/əˈtʃiːv.mənt/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "Graduating with honors was the proudest achievement of his academic journey.", tr: "Onur derecesiyle mezun olmak, akademik yolculuğunun en gurur verici başarısıydı." },
            { en: "Language fluency is a long-term achievement that requires daily dedication.", tr: "Dil akıcılığı, günlük adanmışlık gerektiren uzun vadeli bir başarıdır." },
            { en: "The team celebrated their achievement after completing the challenging project.", tr: "Ekip, zorlu projeyi tamamladıktan sonra başarılarını kutladı." }
        ]
    },
    {
        word: "opportunity",
        meaning: "fırsat, olanak",
        phonetic: "/ˌɒp.əˈtjuː.nə.ti/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "Studying abroad provides a unique opportunity to immerse yourself in English.", tr: "Yurt dışında okumak, kendinizi İngilizceye kaptırmak için eşsiz bir fırsat sunar." },
            { en: "Don't let this great career opportunity slip away without applying.", tr: "Bu harika kariyer fırsatının başvurmadan kaçıp gitmesine izin verme." },
            { en: "Every challenge in life presents an opportunity for personal growth.", tr: "Hayattaki her zorluk, kişisel gelişim için bir fırsat sunar." }
        ]
    },
    {
        word: "challenge",
        meaning: "meydan okuma, zorluk",
        phonetic: "/ˈtʃæl.ɪndʒ/",
        pos: "İsim / Fiil (Noun/Verb)",
        sentences: [
            { en: "Mastering English prepositions can be a real challenge for many learners.", tr: "İngilizce edatlarda ustalaşmak pek çok öğrenci için gerçek bir zorluk olabilir." },
            { en: "She decided to challenge herself by reading a classic English novel every month.", tr: "Her ay klasik bir İngilizce roman okuyarak kendine meydan okumaya karar verdi." },
            { en: "We need creative solutions to overcome this technical challenge.", tr: "Bu teknik zorluğun üstesinden gelmek için yaratıcı çözümlere ihtiyacımız var." }
        ]
    },
    {
        word: "essential",
        meaning: "temel, zorunlu, vazgeçilmez",
        phonetic: "/ɪˈsen.ʃəl/",
        pos: "Sıfat (Adjective)",
        sentences: [
            { en: "Consistent daily listening is essential for natural English pronunciation.", tr: "Doğal İngilizce telaffuzu için düzenli günlük dinleme vazgeçilmezdir." },
            { en: "Water and sunlight are essential for plants to survive and blossom.", tr: "Bitkilerin hayatta kalması ve çiçek açması için su ve güneş ışığı temeldir." },
            { en: "Good communication skills are essential in modern remote workplaces.", tr: "Modern uzaktan çalışma ortamlarında iyi iletişim becerileri zorunludur." }
        ]
    },
    {
        word: "curious",
        meaning: "meraklı, ilgi çekici",
        phonetic: "/ˈkjʊə.ri.əs/",
        pos: "Sıfat (Adjective)",
        sentences: [
            { en: "Children are naturally curious about the world and constantly ask questions.", tr: "Çocuklar doğal olarak dünya hakkında meraklıdır ve sürekli sorular sorarlar." },
            { en: "I am curious to learn how native speakers use idioms in casual conversation.", tr: "Anadili İngilizce olanların deyimleri günlük sohbette nasıl kullandığını öğrenmeye meraklıyım." },
            { en: "There was a curious silence in the courtroom before the verdict was read.", tr: "Karar okunmadan önce mahkeme salonunda tuhaf bir sessizlik vardı." }
        ]
    },
    {
        word: "persuade",
        meaning: "ikna etmek, inandırmak",
        phonetic: "/pəˈsweɪd/",
        pos: "Fiil (Verb)",
        sentences: [
            { en: "The defense attorney tried to persuade the jury with solid evidence.", tr: "Savunma avukatı somut kanıtlarla jüriyi ikna etmeye çalıştı." },
            { en: "Can you persuade your manager to let us attend the international summit?", tr: "Müdürünü uluslararası zirveye katılmamıza izin vermesi için ikna edebilir misin?" },
            { en: "Nothing could persuade him to change his strict principles.", tr: "Hiçbir şey onu katı ilkelerini değiştirmeye ikna edemezdi." }
        ]
    },
    {
        word: "reluctant",
        meaning: "isteksiz, tereddütlü",
        phonetic: "/rɪˈlʌk.tənt/",
        pos: "Sıfat (Adjective)",
        sentences: [
            { en: "Many beginners are reluctant to speak English because of fear of making mistakes.", tr: "Pek çok yeni başlayan, hata yapma korkusundan dolayı İngilizce konuşma konusunda isteksizdir." },
            { en: "He was reluctant to share his personal notes with the rest of the class.", tr: "Kişisel notlarını sınıfın geri kalanıyla paylaşma konusunda tereddütlüydü." },
            { en: "She gave a reluctant nod, accepting the difficult terms.", tr: "İsteksiz bir baş hareketiyle zor koşulları kabul etti." }
        ]
    },
    {
        word: "fluency",
        meaning: "akıcılık (özellikle dilde)",
        phonetic: "/ˈfluː.ən.si/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "You don't need a huge vocabulary to achieve conversational fluency in English.", tr: "İngilizcede sohbette akıcılık kazanmak için devasa bir kelime haznesine ihtiyacınız yoktur." },
            { en: "Practicing shadowing every day will dramatically improve your speaking fluency.", tr: "Her gün gölgeleme (shadowing) pratiği yapmak konuşma akıcılığınızı belirgin şekilde artıracaktır." },
            { en: "Her fluency in three languages opened up worldwide career prospects.", tr: "Üç dildeki akıcılığı, dünya genelinde kariyer kapıları açtı." }
        ]
    },
    {
        word: "comprehension",
        meaning: "kavrama, anlama yetisi",
        phonetic: "/ˌkɒm.prɪˈhen.ʃən/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "Reading diverse English articles enhances your overall reading comprehension.", tr: "Çeşitli İngilizce makaleler okumak genel okuma kavramanızı güçlendirir." },
            { en: "His comprehension of advanced grammar rules surprised the English instructor.", tr: "İleri düzey gramer kurallarını kavraması İngilizce öğretmenini şaşırttı." },
            { en: "Listening to podcasts at 1x speed helps build intuitive auditory comprehension.", tr: "Podcast'leri normal hızda dinlemek sezgisel işitsel kavrama oluşturmaya yardımcı olur." }
        ]
    },
    {
        word: "determination",
        meaning: "kararlılık, azim",
        phonetic: "/dɪˌtɜː.mɪˈneɪ.ʃən/",
        pos: "İsim (Noun)",
        sentences: [
            { en: "With determination and disciplined practice, anyone can learn English.", tr: "Azim ve disiplinli pratikle herkes İngilizce öğrenebilir." },
            { en: "Her fierce determination to pass the IELTS exam inspired her classmates.", tr: "IELTS sınavını geçme konusundaki güçlü kararlılığı sınıf arkadaşlarına ilham verdi." },
            { en: "He tackled every obstacle with courage and quiet determination.", tr: "Her engeli cesaret ve sessiz bir kararlılıkla göğüsledi." }
        ]
    },
    {
        word: "inevitable",
        meaning: "kaçınılmaz, önüne geçilemez",
        phonetic: "/ɪnˈev.ɪ.tə.bəl/",
        pos: "Sıfat (Adjective)",
        sentences: [
            { en: "Making mistakes is an inevitable and healthy part of learning any new skill.", tr: "Hata yapmak, yeni bir beceri öğrenmenin kaçınılmaz ve sağlıklı bir parçasıdır." },
            { en: "Change is inevitable; how we adapt to it defines our success.", tr: "Değişim kaçınılmazdır; ona nasıl uyum sağladığımız başarımızı belirler." },
            { en: "The eventual collapse of the fragile agreement was entirely inevitable.", tr: "Kırılgan anlaşmanın nihai çöküşü tamamen kaçınılmazdı." }
        ]
    },
    {
        word: "elaborate",
        meaning: "ayrıntılı, detaylandırmak",
        phonetic: "/ɪˈlæb.ər.ət/",
        pos: "Sıfat / Fiil (Adj/Verb)",
        sentences: [
            { en: "Could you please elaborate on your idea so everyone understands?", tr: "Herkesin anlaması için fikrinizi biraz daha detaylandırabilir misiniz?" },
            { en: "They prepared an elaborate presentation with charts and live demonstrations.", tr: "Grafikler ve canlı gösterimlerle ayrıntılı bir sunum hazırladılar." },
            { en: "The architect explained the elaborate details of the building's design.", tr: "Mimar, binanın tasarımının ayrıntılı detaylarını açıkladı." }
        ]
    }
];

// Dosyadaki kelimeleri yükle ve birleştir
let cachedWords = [...BUILTIN_VOCABULARY];
try {
    const allWordsPath = path.join(__dirname, "public", "all_words.js");
    if (fs.existsSync(allWordsPath)) {
        const fileContent = fs.readFileSync(allWordsPath, "utf-8");
        const jsonMatch = fileContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            for (const item of parsed) {
                if (item.word && !cachedWords.some(w => w.word.toLowerCase() === item.word.toLowerCase())) {
                    cachedWords.push({
                        word: item.word.trim(),
                        meaning: (item.meaning || "").trim()
                    });
                }
            }
        }
    }
} catch (e) {
    console.error("all_words.js okunamadı:", e.message);
}

// =============================================
// 1. CANLI LLM API ÇAĞRISI (Gemini / OpenAI)
// =============================================

function sanitizeContentsForGemini(history, currentMessage) {
    let rawItems = [];

    if (history && history.length > 0) {
        // En son mesaj eğer veritabanına yeni kaydedilen bu mesajsa tekrarlamamak için çıkaralım
        const items = [...history];
        const last = items[items.length - 1];
        if (last && last.sender !== "English_Mentor" && last.content === currentMessage) {
            items.pop();
        }

        // Son 8 mesajı alalım
        const recent = items.slice(-8);
        for (const msg of recent) {
            const role = (msg.sender === "English_Mentor" || msg.sender === "English_AI") ? "model" : "user";
            let text = msg.content || "";
            // Base64 ses verilerini temizle
            if (text.startsWith("[SES:")) text = "[Kullanıcı sesli pratik yaptı]";
            text = text.trim();
            if (text) rawItems.push({ role, text });
        }
    }

    // Güncel kullanıcı mesajı
    let cleanCurrent = (currentMessage || "").trim();
    if (cleanCurrent.startsWith("[SES:")) cleanCurrent = "[Kullanıcı sesli pratik yaptı]";
    if (!cleanCurrent) cleanCurrent = "Hello!";
    rawItems.push({ role: "user", text: cleanCurrent });

    // GEMINI MULTI-TURN KURALI: Mutlaka 'user' ile başlamalı ve roller ardışık tekrarlanmamalı
    let contents = [];
    for (const item of rawItems) {
        if (contents.length === 0) {
            if (item.role === "user") {
                contents.push({ role: "user", parts: [{ text: item.text }] });
            }
            // Başta model mesajı varsa atla (Gemini kabul etmez)
        } else {
            const prev = contents[contents.length - 1];
            if (prev.role === item.role) {
                // Aynı rol ardışık geldiyse metinleri birleştir
                prev.parts[0].text += "\n" + item.text;
            } else {
                contents.push({ role: item.role, parts: [{ text: item.text }] });
            }
        }
    }

    if (contents.length === 0) {
        contents.push({ role: "user", parts: [{ text: cleanCurrent }] });
    }

    return contents;
}

async function callExternalAI(userMessage, apiKey, model, focusMode, level, conversationHistory) {
    if (!apiKey) return null;

    const systemPrompt = `You are "English Mentor", a warm, world-class certified English language tutor and conversation partner on an English learning platform.
Student English Level: ${level || "auto (adapt to student)"}.
Focus Coaching Mode: ${focusMode || "coach"}.

CRITICAL INSTRUCTIONS:
1. LANGUAGE USAGE:
   - If the student speaks or asks in Turkish (e.g. "bana resilience kelimesini anlatır mısın", "cümle kur", "bu doğru mu"):
     Answer in fluent Turkish with warm encouragement, but ALWAYS provide rich, natural English example sentences, English explanations, pronunciation hints, and Turkish translations.
   - If the student writes in English, reply in natural, engaging English and gently point out any grammar improvements.
2. WORD EXPLANATIONS:
   - When asked about a specific word, provide:
     • Turkish definition and part of speech (Noun/Verb/Adj)
     • Pronunciation guide
     • 2-3 realistic example sentences from daily life / business with Turkish translations
     • Key collocations / common prepositions (e.g. "resilience to/against", "involvement in")
     • An inviting prompt asking the student to write their own sentence using this word.
3. QUIZ / QUESTIONS:
   - If asked for a question or quiz, write a clean fill-in-the-blank question with 4 clear options (A, B, C, D) and a Turkish hint.
4. TONE:
   - Natural, lively, highly supportive, professional tutor. Never use dry robotic disclaimers. Format with clean Markdown (bolding, bullet points, blockquotes).`;

    // 1. Google Gemini API
    if (model && model.startsWith("gemini") && apiKey) {
        try {
            const contents = sanitizeContentsForGemini(conversationHistory, userMessage);
            const geminiModel = model || "gemini-1.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey.trim()}`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1500
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text.trim();
            } else {
                const errText = await res.text();
                console.error(`Gemini API Hatası [${res.status}]:`, errText);
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch(e) {}

                if (detail.includes("free tier is not available for this project")) {
                    detail = `Bu API anahtarı eski/kısıtlı bir Cloud projesine bağlı olduğu için Google ücretsiz tarifeyi engelliyor.\n\n💡 **Tamamen Ücretsiz Hızlı Çözüm:**\n1. [Google AI Studio](https://aistudio.google.com/app/apikey) sayfasına gidin.\n2. **"Create API key"** butonuna basın.\n3. Listeden **"Create API key in new project"** *(Yeni projede anahtar oluştur)* seçeneğini seçin.\n4. Oluşan yeni anahtarı Model & API menüsüne yapıştırın. Hiçbir kart veya ödeme bilgisi girmeden anında çalışacaktır!`;
                }

                return {
                    error: true,
                    message: `⚠️ **Google Gemini API Bildirimi:**\n\n${detail}`
                };
            }
        } catch (err) {
            console.error("Gemini Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **Google Gemini Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    // 2. Groq API (Llama 3.3 70B - %100 Ücretsiz & Işık Hızında)
    if ((model && (model.startsWith("llama") || model.startsWith("groq"))) || (apiKey && apiKey.startsWith("gsk_"))) {
        try {
            const groqModel = model && model.startsWith("llama") ? model : "llama-3.3-70b-versatile";
            let groqMessages = [{ role: "system", content: systemPrompt }];

            if (conversationHistory && conversationHistory.length > 0) {
                for (const msg of conversationHistory.slice(-6)) {
                    let text = (msg.content || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    groqMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            groqMessages.push({ role: "user", content: userMessage });

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: groqModel,
                    messages: groqMessages,
                    temperature: 0.7,
                    max_tokens: 1500
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) return text.trim();
            } else {
                const errText = await res.text();
                console.error(`Groq API Hatası [${res.status}]:`, errText);
            }
        } catch (err) {
            console.error("Groq Bağlantı Hatası:", err.message);
        }
    }

    // 3. OpenAI API
    if (model && model.startsWith("gpt") && apiKey) {
        try {
            let openaiMessages = [{ role: "system", content: systemPrompt }];

            if (conversationHistory && conversationHistory.length > 0) {
                for (const msg of conversationHistory.slice(-6)) {
                    let text = (msg.content || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    openaiMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            openaiMessages.push({ role: "user", content: userMessage });

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: model || "gpt-4o-mini",
                    messages: openaiMessages,
                    temperature: 0.7,
                    max_tokens: 1500
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) return text.trim();
            } else {
                const errText = await res.text();
                console.error(`OpenAI API Hatası [${res.status}]:`, errText);
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch(e) {}
                return {
                    error: true,
                    message: `⚠️ **OpenAI API Hatası (HTTP ${res.status}):**\n> *${detail}*`
                };
            }
        } catch (err) {
            console.error("OpenAI Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **OpenAI Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    return null;
}

// API Anahtarı Test Fonksiyonu (Model & API modalı için)
async function testAPIKey(apiKey, model) {
    if (!apiKey) return { success: false, message: "Lütfen bir API anahtarı girin." };

    if (model && model.startsWith("gemini")) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Say 'OK' if you can read this." }] }]
                })
            });
            if (res.ok) {
                return { success: true, message: `✅ ${model} bağlantısı başarılı! API anahtarınız aktif ve çalışıyor.` };
            } else {
                const errJson = await res.json().catch(() => null);
                let msg = errJson?.error?.message || `HTTP ${res.status}`;
                if (msg.includes("free tier is not available for this project")) {
                    return {
                        success: false,
                        message: `❌ Google Uyarısı: Bu anahtar ücretsiz tarifeyi kabul etmeyen eski/kısıtlı bir Cloud projesine bağlı.\n\n💡 10 SANİYEDE ÜCRETSİZ ÇÖZÜM:\n1. https://aistudio.google.com/app/apikey adresini açın.\n2. "Create API key" butonuna tıklayın.\n3. Açılan listeden "Create API key in new project" (Yeni projede anahtar oluştur) seçeneğini seçin.\n4. Alacağınız yeni anahtarı buraya yapıştırın. Hiçbir kart veya ödeme bilgisi girmeden anında çalışacaktır!`
                    };
                }
                return { success: false, message: `❌ Google Gemini Hatası: ${msg}` };
            }
        } catch (e) {
            return { success: false, message: `❌ Ağ/Bağlantı Hatası: ${e.message}` };
        }
    }

    if ((model && (model.startsWith("llama") || model.startsWith("groq"))) || (apiKey && apiKey.startsWith("gsk_"))) {
        try {
            const groqModel = model && model.startsWith("llama") ? model : "llama-3.3-70b-versatile";
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey.trim()}` },
                body: JSON.stringify({ model: groqModel, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 })
            });
            if (res.ok) {
                return { success: true, message: `✅ Groq (${groqModel}) bağlantısı başarılı! Model son derece hızlı ve aktif.` };
            } else {
                const errJson = await res.json().catch(() => null);
                return { success: false, message: `❌ Groq Hatası: ${errJson?.error?.message || res.status}` };
            }
        } catch (e) {
            return { success: false, message: `❌ Ağ Hatası: ${e.message}` };
        }
    }

    if (model && model.startsWith("gpt")) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey.trim()}` },
                body: JSON.stringify({ model: model, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 })
            });
            if (res.ok) {
                return { success: true, message: `✅ OpenAI (${model}) bağlantısı başarılı!` };
            } else {
                const errJson = await res.json().catch(() => null);
                return { success: false, message: `❌ OpenAI Hatası: ${errJson?.error?.message || res.status}` };
            }
        } catch (e) {
            return { success: false, message: `❌ Ağ Hatası: ${e.message}` };
        }
    }

    return { success: false, message: "Desteklenmeyen model seçimi." };
}

// =============================================
// 2. SORU ÜRETİCİ (Quiz Generator)
// =============================================
const QUIZ_TEMPLATES = [
    { s: "She showed great _______ by not giving up even after multiple failures.", target: "resilience", tr: "Defalarca başarısız olmasına rağmen pes etmeyerek büyük bir dayanıklılık gösterdi." },
    { s: "I need to reschedule my _______ with the dentist for next Tuesday.", target: "appointment", tr: "Diş hekimiyle randevumu gelecek salıya ertelemem gerekiyor." },
    { s: "Winning the prestigious scholarship was the greatest _______ of her academic career.", target: "achievement", tr: "Prestijli bursu kazanmak, akademik kariyerinin en büyük başarısıydı." },
    { s: "Studying abroad offers a wonderful _______ to gain international life experience.", target: "opportunity", tr: "Yurt dışında okumak, uluslararası yaşam deneyimi kazanmak için harika bir fırsat sunuyor." },
    { s: "Active _______ in classroom discussions dramatically improves speaking skills.", target: "involvement", tr: "Sınıf tartışmalarına aktif katılım, konuşma becerilerini belirgin şekilde geliştirir." },
    { s: "Drinking plenty of water and getting enough sleep are _______ for good health.", target: "essential", tr: "Bol su içmek ve yeterince uyumak, sağlık için temeldir." },
    { s: "He was very _______ about how modern artificial intelligence actually learns.", target: "curious", tr: "Modern yapay zekanın gerçekte nasıl öğrendiği konusunda çok meraklıydı." },
    { s: "The defense lawyer tried to _______ the jury that his client was innocent.", target: "persuade", tr: "Savunma avukatı, müvekkilinin masum olduğuna jüriyi ikna etmeye çalıştı." },
    { s: "Many beginners are _______ to speak English due to fear of making silly mistakes.", target: "reluctant", tr: "Pek çok yeni başlayan, komik hatalar yapma korkusundan İngilizce konuşmada isteksizdir." },
    { s: "Consistent daily practice is the true key to achieving conversational _______.", target: "fluency", tr: "Düzenli günlük pratik, sohbette akıcılığa ulaşmanın gerçek anahtarıdır." },
    { s: "Learning a new language requires patience and strong mental _______.", target: "determination", tr: "Yeni bir dil öğrenmek sabır ve güçlü bir zihinsel kararlılık gerektirir." },
    { s: "Making mistakes during practice is an _______ and healthy part of learning.", target: "inevitable", tr: "Pratik sırasında hata yapmak, öğrenmenin kaçınılmaz ve sağlıklı bir parçasıdır." },
    { s: "Could you please _______ on your suggestion so that everyone can understand?", target: "elaborate", tr: "Herkesin anlayabilmesi için önerinizi biraz daha detaylandırabilir misiniz?" },
    { s: "Reading high-quality English books regularly will expand your vocabulary and _______.", target: "comprehension", tr: "Kaliteli İngilizce kitapları düzenli okumak kelime dağarcığınızı ve kavramanızı geliştirir." },
    { s: "Mastering a foreign language is a rewarding _______ that opens doors globally.", target: "challenge", tr: "Yabancı bir dilde ustalaşmak, küresel kapılar açan tatmin edici bir meydan okumadır." }
];

function generateQuizQuestion(requestedWord) {
    let chosen;
    if (requestedWord) {
        chosen = QUIZ_TEMPLATES.find(t => t.target.toLowerCase() === requestedWord.toLowerCase());
    }
    if (!chosen) {
        chosen = QUIZ_TEMPLATES[Math.floor(Math.random() * QUIZ_TEMPLATES.length)];
    }

    // 4 şık oluştur
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
// 3. YERLEŞİK AKILLI YANIT MOTORU (FALLBACK)
// =============================================

function isLikelyTurkish(text) {
    // Türkçe özel karakterler
    if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) return true;

    // Türkçe sık kullanılan kelimeler (ASCII ile yazılmış olsa dahi)
    const turkishKeywords = /\b(ve|veya|ile|için|bana|beni|ben|sen|seni|sana|bir|bu|şu|o|ne|nasıl|neden|niçin|misin|mısın|musun|müsün|mı|mi|mu|mü|anlat|anlatır|anlatir|açıkla|acikla|soru|sor|yaz|kelime|kelimesi|kelimesini|cümle|cumle|örnek|ornek|doğru|dogru|yanlış|yanlis|hata|hadi|haydi|edelim|yapalım|yapalim|istiyorum|teşekkür|merhaba|selam|günaydın|evet|hayır|tamam|anladım|peki|lütfen|lutfen|gibi|kadar|daha|çok|cok|az|en|var|yok|değil|degil|olur|olmaz|çalış|çalışalım|calis|calisalim|nedir|hakkında|hakkinda|ogret|öğret|anlamı|anlami)\b/i;

    return turkishKeywords.test(text);
}

function findWordInVocabulary(text) {
    const clean = text.toLowerCase();
    // 1. Doğrudan kelime eşleşmesi
    for (const v of BUILTIN_VOCABULARY) {
        const reg = new RegExp(`\\b${v.word}\\b`, "i");
        if (reg.test(clean)) return v;
    }
    for (const w of cachedWords) {
        if (!w.word) continue;
        const reg = new RegExp(`\\b${w.word}\\b`, "i");
        if (reg.test(clean)) {
            // Eğer zengin sentences yoksa dinamik üretelim
            return {
                word: w.word,
                meaning: w.meaning || "anlamı belirtilmemiş",
                phonetic: "",
                pos: "Kelime",
                sentences: [
                    { en: `We should practice using "${w.word}" in daily English conversations.`, tr: `Günlük İngilizce konuşmalarda "${w.word}" kelimesini kullanma pratiği yapmalıyız.` },
                    { en: `Can you create a sentence with the word "${w.word}"?`, tr: `"${w.word}" kelimesiyle bir cümle kurabilir misin?` }
                ]
            };
        }
    }
    return null;
}

function generateFallbackResponse(userMessage, senderUsername, dbModule) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // --- Sesli mesaj ---
    if (raw.startsWith("[SES:")) {
        return `🎤 **Sesli mesajını aldım!**\n\nHarika bir telaffuz ve konuşma adımı! 🗣️\n\nŞimdi birlikte pratik yapalım. Bir kelime veya cümle söyleyebilir ya da bana merak ettiğin bir konuyu sorabilirsin. İster Türkçe ister İngilizce devam edelim!`;
    }

    // --- Aktif Quiz Cevabı Kontrolü ---
    if (dbModule) {
        const activeQuiz = dbModule.getActiveQuiz(senderUsername);
        if (activeQuiz) {
            const userAnswer = raw.replace(/^[a-dA-D]\)\s*/, "").trim().toLowerCase();
            const correctAnswer = activeQuiz.correct_answer.toLowerCase();

            // A, B, C, D harf kontrolü
            const letterMatch = raw.match(/^([a-dA-D])[\)\.\s]*$/);
            let actualAnswer = userAnswer;
            if (letterMatch && Array.isArray(activeQuiz.options)) {
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
                return `✅ **Tebrikler, Doğru Cevap!** 🎉\n\n📌 **Cevap:** **${activeQuiz.correct_answer}**\n\n🇹🇷 **Cümlenin Çevirisi:**\n> *"${activeQuiz.turkish_hint}"*\n\n🌟 Harika gidiyorsun! Yeni bir soru için **"Bana bir soru sor"** yazabilir veya sohbete devam edebilirsin.`;
            } else {
                return `❌ **Bu sefer olmadı ama pes etmek yok!**\n\n• Senin cevabın: **${raw}**\n• Doğru cevap: **${activeQuiz.correct_answer}**\n\n🇹🇷 **Cümlenin Çevirisi:**\n> *"${activeQuiz.turkish_hint}"*\n\n💡 **Neden ${activeQuiz.correct_answer}?** Çünkü cümlenin bağlamı ve gramer akışı bu kelimeyi gerektiriyor.\n\nTekrar denemek için **"Yeni soru"** yazabilirsin!`;
            }
        }
    }

    // --- Soru / Quiz İsteği ---
    if (lower.match(/(soru\s*(sor|üret|ver|yaz)|test\s*yap|quiz|bana.*soru|ask\s*me|yeni\s*soru|bir\s*soru)/)) {
        const q = generateQuizQuestion();

        if (dbModule) {
            dbModule.setActiveQuiz(senderUsername, q.sentence, q.correctAnswer, q.options, q.turkishHint);
        }

        const optionLetters = q.options.map((opt, i) => `**${String.fromCharCode(65 + i)})** ${opt}`).join("\n");

        return `🎯 **Günün İngilizce Sorusu Geldi!**\n\nAşağıdaki boşluğa hangi kelime gelmelidir?\n\n📝 *"${q.sentence}"*\n\n**Seçenekler:**\n${optionLetters}\n\n💡 *İpucu (Çeviri):* ${q.turkishHint}\n\nCevabını bekliyorum! (Harf olarak **A, B, C, D** veya doğrudan kelimeyi yazabilirsin)`;
    }

    // --- Günün Kelimesi (Öncelikli) ---
    if (lower.match(/(günün\s*kelimesi|gunun\s*kelimesi|word\s*of\s*the\s*day|kelime\s*öğren|kelime\s*ogren)/)) {
        const pick = BUILTIN_VOCABULARY[Math.floor(Math.random() * BUILTIN_VOCABULARY.length)];
        return `🌟 **Günün Kelimesi: "${pick.word.toUpperCase()}"**\n\n• **Türkçe Karşılığı:** **${pick.meaning}**\n• **Telaffuz:** *${pick.phonetic || ""}*\n• **Kelime Türü:** ${pick.pos || "İsim"}\n\n📌 **Örnek Cümleler:**\n1) *"${pick.sentences[0].en}"*\n   🇹🇷 *"${pick.sentences[0].tr}"*\n\n2) *"${pick.sentences[1].en}"*\n   🇹🇷 *"${pick.sentences[1].tr}"*\n\n💡 **Günün Görevi:** Bu kelimeyi kullanarak bana bir cümle yaz, birlikte inceleyelim!`;
    }

    // --- Günün Deyimi (Öncelikli) ---
    if (lower.match(/(deyim|idiom|kalıp|expression)/)) {
        const idioms = [
            { en: "Break the ice", tr: "Buzları eritmek (ortamdaki gerginliği veya yabancılığı gidermek)", ex: "He told a funny story to break the ice at the start of the meeting.", extr: "Toplantının başında ortamı ısıtmak için komik bir hikaye anlattı." },
            { en: "Piece of cake", tr: "Çantada keklik, çocuk oyuncağı", ex: "Don't worry about the English exam; it's going to be a piece of cake!", extr: "İngilizce sınavı için endişelenme; çocuk oyuncağı olacak!" },
            { en: "Hit the nail on the head", tr: "Tam üstüne basmak, tam isabetli konuşmak", ex: "You hit the nail on the head when you mentioned time management.", extr: "Zaman yönetiminden bahsettiğinde tam üstüne bastın." },
            { en: "Cost an arm and a leg", tr: "Ateş pahası olmak, çok pahalıya patlamak", ex: "That new smartphone costs an arm and a leg, but it's very powerful.", extr: "O yeni akıllı telefon ateş pahası ama çok güçlü." }
        ];
        const pick = idioms[Math.floor(Math.random() * idioms.length)];
        return `🗣️ **Günün İngilizce Deyimi (Idiom):**\n\n🌟 **"${pick.en}"**\n🇹🇷 **Anlamı:** ${pick.tr}\n\n📌 **Örnek Cümle:**\n> *"${pick.ex}"*\n> 🇹🇷 *"${pick.extr}"*\n\nBu deyimi kullanarak bir cümle kurmayı denemek ister misin?`;
    }

    // --- İngilizce Selamlaşma & Sohbet (Kullanıcı İngilizce yazmışsa İNGİLİZCE yanıt ver) ---
    if (lower.match(/^(hey|hi|hello|howdy|what's\s*up|good\s*(morning|afternoon|evening))/i) || (!isLikelyTurkish(raw) && lower.includes("how are you"))) {
        return `Hey ${senderUsername}! 👋\n\nI'm doing fantastic, thank you for asking! 😊 It's always a pleasure to practice English with you.\n\nHow is your day going so far? What would you like to work on today — speaking practice, learning new vocabulary, or checking a sentence?`;
    }

    // --- Saf İngilizce Mesaj (Kullanıcı İngilizce konuşuyorsa İNGİLİZCE devam et) ---
    if (!isLikelyTurkish(raw) && raw.length > 5) {
        const englishResponses = [
            `That's great! 👏 Your English sounds very natural.\n\nTo keep our conversation going, let me ask you:\n**What is something exciting or interesting that happened in your week so far?**\n\nTake your time and reply in English! 😊`,
            `Well said! That sentence is clear and grammatically solid. ✨\n\n💡 **Mentor Tip:** You can also add conversational phrases like *"To be honest,"* or *"In my experience,"* to sound even more fluent.\n\nWhat other topics are you curious about today?`,
            `I love chatting with you in English! 💪 You're making noticeable progress every day.\n\nHere is a quick question for you:\n**If you could speak English fluently overnight, what is the first thing you would do?**\n\nShare your thoughts!`
        ];
        return englishResponses[Math.floor(Math.random() * englishResponses.length)];
    }

    // --- Kelime Anlatımı / Cümle İsteği / Ne Demek ---
    // Örnek: "bana resilience kelimesini anlatır mısın", "resilience cümle içinde kullan", "resilience ne demek"
    const wordExplanationMatch = lower.match(/(.+?)\s*(kelimesini|kelimesi|hakkında|ile)?\s*(anlat|anlatır|anlatir|açıkla|acikla|nedir|ne demek|anlamı|anlami|cümle içinde kullan|cumle icinde kullan|cümle kur|örnek cümle)/i) ||
                                 lower.match(/explain\s+(.+?)(?:\s+to\s+me)?$/i) ||
                                 lower.match(/what\s+does\s+(.+?)\s+mean/i) ||
                                 lower.match(/meaning\s+of\s+(.+)/i);

    if (wordExplanationMatch) {
        // Kelimeyi yakala
        const targetRaw = (wordExplanationMatch[1] || "").replace(/(bana|lütfen|lutfen|biraz|şunu|sunu|şu|su|kelimesini|kelimesi|hakkında|hakkinda|ile|misin|mısın|\?|'|")/gi, "").trim();
        const words = targetRaw.split(/\s+/).filter(w => w.length > 2);
        const candidate = words[words.length - 1] || targetRaw;

        const found = findWordInVocabulary(candidate) || findWordInVocabulary(raw);

        if (found) {
            const phon = found.phonetic ? ` *${found.phonetic}*` : "";
            const pos = found.pos ? ` • **Türü:** ${found.pos}` : "";
            const sentBlocks = found.sentences.map((s, idx) => `📌 **Örnek ${idx + 1}:**\n> *"${s.en}"*\n> 🇹🇷 *"${s.tr}"*`).join("\n\n");

            return `📖 **"${found.word.toUpperCase()}"** İncelemesi${phon}\n\n• **Türkçe Karşılığı:** **${found.meaning}**${pos}\n\n${sentBlocks}\n\n💡 **Mentor İpucu:** Bu kelimeyi hafızanda kalıcı kılmak için şimdi **"${found.word}"** ile kendi oluşturduğun bir cümleyi bana yaz, hemen birlikte inceleyelim!`;
        } else if (candidate && candidate.length >= 3) {
            return `📖 **"${candidate}"** Kelimesi:\n\nBu kelime İngilizcede sıkça karşımıza çıkar! İnceleyelim:\n\n📌 **Örnek Kullanım:**\n> *"Understanding the true value of **${candidate}** takes time and real-world experience."*\n> 🇹🇷 *"**${candidate}** kelimesinin gerçek değerini anlamak zaman ve gerçek yaşam deneyimi gerektirir."*\n\n📌 **2. Örnek:**\n> *"She used **${candidate}** effectively in her formal presentation."*\n> 🇹🇷 *"Resmi sunumunda **${candidate}** kavramını etkili bir şekilde kullandı."*\n\nŞimdi sıra sende! Bu kelimeyle kendi cümleni bana gönder, düzeltme ve önerilerimi paylaşayım.`;
        }
    }

    // --- Gramer Kontrolü ---
    if (lower.includes("doğru mu") || lower.includes("dogru mu") || lower.includes("düzelt") || lower.includes("duzelt") || lower.includes("hata var mı") || lower.includes("check my sentence") || lower.includes("correct")) {
        let cleanText = raw.replace(/(cümlem?\s*doğru\s*mu|dogru\s*mu|düzelt|duzelt|hata\s*var\s*mı|var\s*mi|bu\s*doğru\s*mu\??|check|correct\s*this)/gi, "").trim();
        if (cleanText.length > 3) {
            let feedback = "Cümlen gayet anlaşılır ve dilbilgisi açısından oldukça başarılı!";
            let improved = cleanText;

            if (/\bi\s+(am\s+)?go\b/i.test(cleanText) && !/going/i.test(cleanText)) {
                improved = cleanText.replace(/\bi am go\b/gi, "I am going").replace(/\bi go\b/gi, "I go");
                feedback = "'I am go' hatalıdır. Şimdiki zaman için **'I am going'**, geniş zaman için **'I go'** kullanmalısın.";
            } else if (/\b(he|she|it)\s+go\b/i.test(cleanText)) {
                improved = cleanText.replace(/\bhe go\b/gi, "He goes").replace(/\bshe go\b/gi, "She goes");
                feedback = "Geniş zamanda (Simple Present) 3. tekil şahıslar için fiil **'-s/-es'** takısı alır: **goes**.";
            } else if (/\bi have \d+ years old\b/i.test(cleanText)) {
                improved = cleanText.replace(/i have (\d+) years old/gi, "I am $1 years old");
                feedback = "İngilizcede yaş söylerken 'have' değil, **'to be' (I am)** fiili kullanılır.";
            } else if (/\bsince \d+ (years?|months?|days?)\b/i.test(cleanText)) {
                feedback = "'Since' başlangıç noktası için kullanılır (since 2020). Geçen süreyi ifade etmek için **'for'** kullanılır (for 2 years).";
                improved = cleanText.replace(/since (\d+ (?:years?|months?|days?))/gi, "for $1");
            }

            return `🔍 **Gramer & Cümle Analizi:**\n\n📝 **Senin Cümlen:** "${cleanText}"\n✨ **Önerilen Hali:** "${improved}"\n\n💡 **Açıklama:** ${feedback}\n\nİstersen bu cümlenin daha resmi veya daha günlük alternatiflerini de çıkarabilirim!`;
        }
    }

    // --- Türkçe Selamlaşma ---
    if (lower.match(/^(merhaba|selam|günaydın|gunaydin|iyi\s*günler|iyi\s*aksamlar|nasılsın|nasilsin)/)) {
        return `Merhaba ${senderUsername}! 👋\n\nBen senin resmi **İngilizce Mentörünüm**. Bugün İngilizceni bir adım ileri taşımaya hazır mısın?\n\nBirlikte neler yapabiliriz:\n• 🎯 **Soru Çöz** → *"Bana bir soru sor"*\n• 📖 **Kelime Öğren** → *"resilience kelimesini anlatır mısın"*\n• 📝 **Cümle Kur & Kontrol Et** → *"I have 25 years old doğru mu?"*\n• 🗣️ **İngilizce Sohbet Et** → *"Let's practice English!"*\n• 🌟 **Günün Kelimesi** → *"Günün kelimesi nedir?"*\n\nNe ile başlayalım?`;
    }

    // --- Sohbet İsteği (Türkçe) ---
    if (lower.match(/(sohbet\s*(etmek|edelim|yapalım)|konuşmak\s*istiyorum|ingilizce\s*(pratik|konuşalım)|pratik\s*yapalım|muhabbet)/)) {
        const topics = [
            { en: "What is your favorite hobby, and how did you get interested in it?", tr: "En sevdiğin hobi nedir ve buna nasıl ilgi duymaya başladın?" },
            { en: "If you could travel to any country in the world tomorrow, where would you go?", tr: "Yarın dünyanın herhangi bir ülkesine seyahat edebilseydin, nereye giderdin?" },
            { en: "What do you find most challenging when learning English: speaking, listening, or grammar?", tr: "İngilizce öğrenirken sana en zor gelen şey ne: konuşma, dinleme mi yoksa gramer mi?" },
            { en: "Tell me about a memorable movie or book that inspired you recently.", tr: "Son zamanlarda sana ilham veren unutulmaz bir film veya kitaptan bahset." }
        ];
        const pick = topics[Math.floor(Math.random() * topics.length)];

        return `Harika bir fikir! İngilizce konuşarak ve yazarak gelişir. 💬\n\nİşte sohbetimizi başlatacak ilk soru:\n\n🌟 **"${pick.en}"**\n🇹🇷 *(${pick.tr})*\n\nİster 1 cümleyle, ister uzun uzun yanıtla. Hata yapmaktan asla çekinme, burası senin öğrenme alanın! Cevabını bekliyorum. 😊`;
    }

    // --- Genel Anlayışlı Yanıt ---
    return `"${raw}" konusunu inceledim! 🌟\n\nİngilizce yolculuğunda sana en doğru şekilde rehberlik edebilmem için şunlardan birini deneyebilirsin:\n\n• **"resilience kelimesini anlatır mısın"** → Detaylı kelime incelemesi ve örnekler\n• **"Bana bir soru sor"** → Test sorusu ve seviye ölçümü\n• **"İngilizce sohbet edelim"** → Karşılıklı pratik konuşma\n• **"[cümlem] doğru mu?"** → Anında gramer kontrolü\n• **"Günün deyimi"** → Günlük konuşma kalıpları\n\nBirlikte ne yapmak istersin?`;
}

module.exports = {
    callExternalAI,
    testAPIKey,
    generateFallbackResponse,
    generateQuizQuestion,
    generateAIQuestion: generateQuizQuestion,
    cachedWords,
    findWordInVocabulary
};
