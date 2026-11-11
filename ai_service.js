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

let cachedGroqModel = null;
async function getActiveGroqModel(apiKey, preferredModel) {
    if (cachedGroqModel) return cachedGroqModel;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${apiKey.trim()}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Kesinlikle ses, guard, vision ve arapça/özel modelleri filtrele
            const models = (data.data || []).map(m => m.id).filter(id => {
                const lower = id.toLowerCase();
                return !lower.includes("whisper") && 
                       !lower.includes("guard") && 
                       !lower.includes("vision") && 
                       !lower.includes("tts") && 
                       !lower.includes("orpheus") && 
                       !lower.includes("arabic") && 
                       !lower.includes("saudi") &&
                       !lower.includes("compound");
            });

            if (preferredModel && models.includes(preferredModel)) {
                cachedGroqModel = preferredModel;
                return preferredModel;
            }

            // En kaliteli ve stabil İngilizce LLM modellerini öncelikle tercih et
            const best = models.find(m => m.includes("llama-3.3-70b-versatile")) ||
                         models.find(m => m.includes("llama-3.1-8b-instant")) ||
                         models.find(m => m.includes("llama-3.3-70b")) ||
                         models.find(m => m.includes("llama-3.1-8b")) ||
                         models.find(m => m.includes("llama-3")) ||
                         models.find(m => m.includes("mixtral-8x7b")) ||
                         models.find(m => m.includes("gemma2-9b")) ||
                         "llama-3.1-8b-instant";
            if (best) {
                cachedGroqModel = best;
                return best;
            }
        }
    } catch (e) {}
    return "llama-3.1-8b-instant";
}

// =============================================
// 1. CANLI LLM API ÇAĞRISI (Gemini / OpenAI / Groq)
// =============================================

function sanitizeContentsForGemini(history, currentMessage) {
    let rawItems = [];

    if (history && history.length > 0) {
        // En son mesaj eğer veritabanına yeni kaydedilen bu mesajsa tekrarlamamak için çıkaralım
        const items = [...history];
        const last = items[items.length - 1];
        const isLastModel = last && (last.sender === "English_Mentor" || last.sender === "English_AI" || last.role === "assistant" || last.role === "model");
        const lastContent = (last?.content || last?.text || "");
        if (last && !isLastModel && lastContent === currentMessage) {
            items.pop();
        }

        // Son 8 mesajı alalım
        const recent = items.slice(-8);
        for (const msg of recent) {
            const isModel = (msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant" || msg.role === "model");
            const role = isModel ? "model" : "user";
            let text = msg.content || msg.text || "";
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

async function callExternalAI(userMessage, apiKey, model, focusMode, level, conversationHistory, customSystemPrompt = null) {
    if (!apiKey) return null;

    let systemPrompt = customSystemPrompt;
    if (!systemPrompt) {
        systemPrompt = `You are "English Mentor", a warm, world-class certified English language tutor and conversation partner on an English learning platform.
Student English Level: ${level || "auto (adapt to student)"}.
Focus Coaching Mode: ${focusMode || "coach"}.

CRITICAL INSTRUCTIONS:
1. LANGUAGE USAGE:
   - If the student speaks or asks in Turkish (e.g. "bana resilience kelimesini anlatır mısın", "cümle kur", "bu doğru mu"):
     Answer in fluent Turkish with warm encouragement, but ALWAYS provide rich, natural English example sentences, English explanations, pronunciation hints, and Turkish translations.
   - If the student writes in English, reply in natural, engaging English and gently point out any grammar improvements.
   - STRICT RULE: You must NEVER respond in Arabic or any unrelated language. Only English or Turkish.
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
    }

    // Sağlayıcı Anahtar Tipi Otomatik Tespiti
    const trimmedKey = (apiKey || "").trim();
    const isGroq = trimmedKey.startsWith("gsk_") || (model && (model.startsWith("llama") || model.startsWith("groq")));
    const isGemini = (trimmedKey.startsWith("AIza") || (model && model.startsWith("gemini"))) && !trimmedKey.startsWith("gsk_");
    const isOpenRouter = trimmedKey.startsWith("sk-or-") || (model && model.startsWith("openrouter"));

    // 1. Groq API (gsk_ anahtarları doğrudan Groq Llama'ya gider)
    if (isGroq && trimmedKey) {
        try {
            const targetModel = await getActiveGroqModel(trimmedKey, model);
            let groqMessages = [{ role: "system", content: systemPrompt }];
            if (conversationHistory && conversationHistory.length > 0) {
                // Son mesaj eğer zaten şu anki userMessage ise mükerrer olmaması için çıkar
                const historyItems = [...conversationHistory];
                const last = historyItems[historyItems.length - 1];
                if (last && (last.sender !== "English_Mentor" && last.sender !== "English_AI" && last.role !== "assistant") && (last.content === userMessage || last.text === userMessage)) {
                    historyItems.pop();
                }

                for (const msg of historyItems.slice(-6)) {
                    let text = (msg.content || msg.text || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    groqMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            groqMessages.push({ role: "user", content: userMessage });

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${trimmedKey}`
                },
                body: JSON.stringify({
                    model: targetModel,
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
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch(e) {}
                return {
                    error: true,
                    message: `⚠️ **Groq API Hatası (HTTP ${res.status}):**\n> *${detail}*`
                };
            }
        } catch (err) {
            console.error("Groq Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **Groq Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    // 2. Google Gemini API
    if (isGemini && trimmedKey) {
        try {
            const contents = sanitizeContentsForGemini(conversationHistory, userMessage);
            const geminiModel = (model && model.startsWith("gemini")) ? model : "gemini-1.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${trimmedKey}`;

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

    // 3. OpenRouter API (%100 Ücretsiz Modeller: Gemini / Llama / Qwen)
    if ((model && model.startsWith("openrouter")) || (apiKey && apiKey.startsWith("sk-or-"))) {
        try {
            const orModel = (model && model.includes("/")) ? model : "google/gemini-2.0-flash-exp:free";
            let orMessages = [{ role: "system", content: systemPrompt }];

            if (conversationHistory && conversationHistory.length > 0) {
                const historyItems = [...conversationHistory];
                const last = historyItems[historyItems.length - 1];
                if (last && (last.sender !== "English_Mentor" && last.sender !== "English_AI" && last.role !== "assistant") && (last.content === userMessage || last.text === userMessage)) {
                    historyItems.pop();
                }

                for (const msg of historyItems.slice(-6)) {
                    let text = (msg.content || msg.text || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    orMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            orMessages.push({ role: "user", content: userMessage });

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: orModel,
                    messages: orMessages,
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
                console.error(`OpenRouter API Hatası [${res.status}]:`, errText);
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch(e) {}
                return {
                    error: true,
                    message: `⚠️ **OpenRouter Hatası (HTTP ${res.status}):**\n> *${detail}*`
                };
            }
        } catch (err) {
            console.error("OpenRouter Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **OpenRouter Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    // 4. OpenAI API
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
    const rawKey = (apiKey || "").replace(/^["']|["']$/g, "").trim();
    if (!rawKey) return { success: false, message: "Lütfen bir API anahtarı girin." };

    const isGroq = rawKey.startsWith("gsk_") || (model && (model.startsWith("llama") || model.startsWith("groq")));
    const isGemini = (rawKey.startsWith("AIza") || (model && model.startsWith("gemini"))) && !rawKey.startsWith("gsk_");
    const isOpenRouter = rawKey.startsWith("sk-or-") || (model && model.startsWith("openrouter"));

    // 1. Groq Testi
    if (isGroq) {
        try {
            // Önce doğrudan Groq'un aktif modeller listesini sorgulayalım
            const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": `Bearer ${rawKey}` }
            });
            if (!modelsRes.ok) {
                const errJson = await modelsRes.json().catch(() => null);
                const msg = errJson?.error?.message || `HTTP ${modelsRes.status}`;
                return { success: false, message: `❌ Groq API Anahtarı Doğrulanamadı: ${msg}` };
            }

            const modelsData = await modelsRes.json();
            const activeModels = (modelsData.data || [])
                .map(m => m.id)
                .filter(id => {
                    const lower = id.toLowerCase();
                    return !lower.includes("whisper") && 
                           !lower.includes("guard") && 
                           !lower.includes("vision") && 
                           !lower.includes("tts") && 
                           !lower.includes("orpheus") && 
                           !lower.includes("arabic") && 
                           !lower.includes("saudi") &&
                           !lower.includes("compound");
                });

            let targetModel = (model && activeModels.includes(model)) ? model : null;
            if (!targetModel) {
                targetModel = activeModels.find(m => m.includes("llama-3.3-70b-versatile")) ||
                              activeModels.find(m => m.includes("llama-3.1-8b-instant")) ||
                              activeModels.find(m => m.includes("llama-3.3-70b")) ||
                              activeModels.find(m => m.includes("llama-3.1-8b")) ||
                              activeModels.find(m => m.includes("llama")) ||
                              activeModels[0];
            }

            if (!targetModel) {
                return { success: false, message: "❌ Groq hesabınızda aktif bir metin modeli bulunamadı." };
            }

            // Seçilen modelle test mesajı gönder
            const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${rawKey}` },
                body: JSON.stringify({ model: targetModel, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 })
            });

            if (chatRes.ok) {
                return { success: true, message: `✅ Groq (${targetModel}) bağlantısı başarılı! Canlı yapay zeka aktif ve hazır.` };
            } else {
                const errJson = await chatRes.json().catch(() => null);
                const msg = errJson?.error?.message || `HTTP ${chatRes.status}`;
                return { success: false, message: `❌ Groq Hatası: ${msg}` };
            }
        } catch (e) {
            return { success: false, message: `❌ Groq Bağlantı Hatası: ${e.message}` };
        }
    }

    // 2. Gemini Testi
    if (isGemini) {
        try {
            const geminiModel = (model && model.startsWith("gemini")) ? model : "gemini-1.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${rawKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Say 'OK' if you can read this." }] }]
                })
            });
            if (res.ok) {
                return { success: true, message: `✅ ${geminiModel} bağlantısı başarılı! API anahtarınız aktif ve çalışıyor.` };
            } else {
                const errJson = await res.json().catch(() => null);
                let msg = errJson?.error?.message || `HTTP ${res.status}`;
                if (msg.includes("free tier is not available for this project")) {
                    return {
                        success: false,
                        message: `❌ Google Uyarısı: Bu anahtar ücretsiz tarifeyi kabul etmeyen eski/kısıtlı bir Cloud projesine bağlı.\n\n💡 10 SANİYEDE ÜCRETSİZ ÇÖZÜM:\n1. https://aistudio.google.com/app/apikey adresini açın.\n2. "Create API key" butonuna tıklayın.\n3. Açılan listeden "Create API key in new project" (Yeni projede anahtar oluştur) seçeneğini seçin.\n4. Alacağınız yeni anahtarı buraya yapıştırın. Hiçbir kart veya ödeme bilgisi girmeden anında çalışacaktır!\n\n⚡ VEYA https://console.groq.com/keys adresinden kartsız Groq anahtarı (gsk_...) alarak anında başlayabilirsiniz.`
                    };
                }
                if (msg.includes("API key not valid")) {
                    return {
                        success: false,
                        message: `❌ Google Uyarısı: Girilen anahtar geçersiz (API key not valid).\n\n💡 Lütfen https://aistudio.google.com/app/apikey adresinden "Create API key in new project" diyerek anahtarınızı kopyalayın,\nVEYA tamamen ücretsiz ve kartsız https://console.groq.com/keys adresinden Groq Llama anahtarı (gsk_...) alabilirsiniz.`
                    };
                }
                return { success: false, message: `❌ Google Gemini Hatası: ${msg}` };
            }
        } catch (e) {
            return { success: false, message: `❌ Ağ/Bağlantı Hatası: ${e.message}` };
        }
    }

    if ((model && model.startsWith("openrouter")) || (apiKey && apiKey.startsWith("sk-or-"))) {
        try {
            const orModel = (model && model.includes("/")) ? model : "google/gemini-2.0-flash-exp:free";
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey.trim()}` },
                body: JSON.stringify({ model: orModel, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 })
            });
            if (res.ok) {
                return { success: true, message: `✅ OpenRouter (${orModel}) bağlantısı başarılı!` };
            } else {
                const errJson = await res.json().catch(() => null);
                return { success: false, message: `❌ OpenRouter Hatası: ${errJson?.error?.message || res.status}` };
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

function generateFallbackResponse(userMessage, senderUsername, dbModule, conversationHistory = []) {
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

    // --- BAĞLAM TAKİBİ (Context Awareness / Önceki Mesajı Hatırlama) ---
    if (conversationHistory && conversationHistory.length > 0) {
        let lastAIMsg = null;
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const m = conversationHistory[i];
            const sender = m.sender || m.role;
            if (sender === "English_Mentor" || sender === "English_AI" || sender === "assistant" || sender === "model") {
                lastAIMsg = m.content || m.text || "";
                break;
            }
        }

        if (lastAIMsg) {
            // 1. Bot kullanıcıdan bir kelimeyle cümle kurmasını istemiş miydi?
            // "using the word mock", "mock kelimesini kullanarak", "Görevin: "mock"", "word mock"
            const askedWordMatch = lastAIMsg.match(/using the word\s+["'*]?([a-zA-Z]+)["'*]?/i) ||
                                   lastAIMsg.match(/["'*]?([a-zA-Z]{3,})["'*]?\s*(?:kelimesini kullanarak|kelimesiyle|ile)\s*(?:bir\s*)?cümle/i) ||
                                   lastAIMsg.match(/Görevin:\s*["'*]?([a-zA-Z]{3,})["'*]?/i) ||
                                   lastAIMsg.match(/Kelimesi:\s*["'*]?([a-zA-Z]{3,})["'*]?/i) ||
                                   lastAIMsg.match(/İncelemesi.*?["'*]?\b([A-Z]{3,})\b/i);

            const askedWord = askedWordMatch ? askedWordMatch[1].toLowerCase() : null;

            if (askedWord && (lower.includes(askedWord) || (!isLikelyTurkish(raw) && raw.length > 6))) {
                const usedWord = lower.includes(askedWord);
                const title = usedWord
                    ? `🎉 **Harika Cümle! "${askedWord}" Kelimesini Çok Başarılı Kullandın!**`
                    : `👏 **Güzel Bir İngilizce Cümle Denemesi!**`;

                let cleanSentence = raw.trim().replace(/^[a-z]/, c => c.toUpperCase());
                if (!/[.!?]$/.test(cleanSentence)) cleanSentence += ".";

                return `${title}\n\n📝 **Senin Cümlen:**\n> *"${cleanSentence}"*\n\n✨ **Mentor İncelemesi:**\n• Cümle kurgun gayet anlaşılır ve hedefe uygun! ${usedWord ? `"${askedWord}" kelimesini doğal bir bağlamda yerleştirdin.` : `Hedef kelimemiz "${askedWord}" idi.`}\n\n💡 **Daha Doğal / Akıcı Bir Alternatif:**\n> *"The system was identified as malicious because it contained a ${askedWord || "mock"} document."*\n\n💬 **Sıradaki Adım:**\nBu kelime üzerinden İngilizce sohbete devam edelim mi, yoksa yeni bir kelime mi öğrenmek istersin?`;
            }
        }
    }

    // --- Sohbet İsteği (Türkçe) - ÖNCELİKLİ: Quiz'den önce kontrol et ---
    if (lower.match(/(sohbet\s*(etmek|edelim|yapalım|yapalim)|konuşmak\s*istiyorum|konuşalım|konusalim|ingilizce\s*(pratik|konuşalım|konusalim|sohbet)|pratik\s*yapalım|pratik\s*yapalim|muhabbet|chat\s*(edelim|let'?s)|let'?s\s*(chat|talk|practice|speak))/i)) {
        const topics = [
            { en: "What is your favorite hobby, and how did you get interested in it?", tr: "En sevdiğin hobi nedir ve buna nasıl ilgi duymaya başladın?" },
            { en: "If you could travel to any country in the world tomorrow, where would you go?", tr: "Yarın dünyanın herhangi bir ülkesine seyahat edebilseydin, nereye giderdin?" },
            { en: "What do you find most challenging when learning English: speaking, listening, or grammar?", tr: "İngilizce öğrenirken sana en zor gelen şey ne: konuşma, dinleme mi yoksa gramer mi?" },
            { en: "Tell me about a memorable movie or book that inspired you recently.", tr: "Son zamanlarda sana ilham veren unutulmaz bir film veya kitaptan bahset." },
            { en: "What is one goal you are working hard to achieve this year?", tr: "Bu yıl gerçekleştirmek için çok çalıştığın bir hedefin nedir?" },
            { en: "If you could learn any skill overnight, what would it be and why?", tr: "Bir gecede herhangi bir beceriyi öğrenebilseydin, bu ne olurdu ve neden?" }
        ];
        const pick = topics[Math.floor(Math.random() * topics.length)];

        return `Harika bir fikir! İngilizce konuşarak ve yazarak gelişir. 💬\n\nSana bir sohbet sorusuyla başlayalım:\n\n🌟 **"${pick.en}"**\n🇹🇷 *(${pick.tr})*\n\nİster 1 cümleyle, ister uzun uzun yanıtla. Hata yapmaktan asla çekinme, burası senin öğrenme alanın! Cevabını bekliyorum. 😊`;
    }

    // --- Soru / Quiz İsteği (sohbet isteği DEĞİLSE) ---
    if (lower.match(/(test\s*yap|quiz|yeni\s*soru|^bana\s*(bir\s*)?soru\s*sor|soru\s*(üret|ver|yaz)\b)/i) ||
        (lower.match(/\bsoru\s*sor\b/i) && !lower.match(/sohbet|konuş|pratik|chat|talk/i))) {
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
    if (!isLikelyTurkish(raw) && raw.length > 3) {
        return generateConversationalResponse(raw, "English Mentor", false);
    }

    // --- Kelime Anlatımı / Cümle İsteği / Ne Demek ---
    // Örnek: "bana resilience kelimesini anlatır mısın", "resilience cümle içinde kullan", "resilience ne demek"
    // NOT: "bugün öğrenmem gereken harika bir kelime nedir?" gibi Türkçe soru cümlelerini atla

    // Türkçe meta-kelimeler — bunlar İngilizce sözcük değildir, regex'e takılmamalı
    const TURKISH_META_WORDS = new Set([
        "kelime", "kelimesini", "cumle", "cümle", "anlam", "anlamı", "ornek", "örnek",
        "soru", "cevap", "bilgi", "konu", "bana", "harika", "gunun", "günün",
        "ogren", "öğren", "öğrenmem", "ogrenmem", "gereken", "nedir", "neler",
        "ingilizce", "türkçe", "turkce", "dilbilgisi", "pratik", "sohbet", "sana",
        "anlat", "acikla", "açıkla", "bugün", "bugun", "deyim", "kalip", "kalıp",
        "için", "veya", "gibi", "kadar", "daha"
    ]);

    // Eğer mesajın tamamı Türkçe içeriyorsa VE içinde belirgin bir İngilizce kelime yoksa,
    // kelime arama regex'ini çalıştırma — kullanıcı kelime değil, rastgele öğretmen görevi istiyor
    const hasTurkishChars = /[çğışöüÇĞİŞÖÜ]/.test(raw);
    const hasEnglishWordCandidate = raw.split(/\s+/).some(w => {
        const cleaned = w.toLowerCase().replace(/[,;.!?'"]/g, "");
        return cleaned.length >= 4 && !TURKISH_META_WORDS.has(cleaned) && !/[çğışöüÇĞİŞÖÜ]/.test(cleaned) && /^[a-z]+$/.test(cleaned);
    });

    const wordExplanationMatch = hasEnglishWordCandidate && (
        lower.match(/(.+?)\s*(kelimesini|kelimesi|hakkında|hakkinda|ile)?\s*(anlat|anlatır|anlatir|açıkla|acikla|ne demek|anlamı nedir|anlami nedir|cümle içinde kullan|cumle icinde kullan|cümle kur|örnek cümle)/i) ||
        lower.match(/explain\s+(.+?)(?:\s+to\s+me)?$/i) ||
        lower.match(/what\s+does\s+(.+?)\s+mean/i) ||
        lower.match(/meaning\s+of\s+(.+)/i)
    );

    // "kelime" veya "cümle" kur isteği ama İngilizce aday yok → günün kelimesi göster
    if (!hasEnglishWordCandidate && (lower.includes("örnek cümle") || lower.includes("cumle") || lower.includes("cümle") || lower.match(/kelime.*anlam|anlam.*kelime/))) {
        const pick = BUILTIN_VOCABULARY[Math.floor(Math.random() * BUILTIN_VOCABULARY.length)];
        return `🌟 **Bugünün Öğretmen Seçimi: "${pick.word.toUpperCase()}"**\n\n• **Türkçe Karşılığı:** **${pick.meaning}**\n• **Telaffuz:** *${pick.phonetic || ""}*\n• **Kelime Türü:** ${pick.pos || "İsim"}\n\n📌 **Örnek Cümleler:**\n1) *"${pick.sentences[0].en}"*\n   🇹🇷 *"${pick.sentences[0].tr}"*\n\n2) *"${pick.sentences[1].en}"*\n   🇹🇷 *"${pick.sentences[1].tr}"*\n\n💡 **Görevin:** "${pick.word}" kelimesini kullanarak kendi cümleni yaz, birlikte inceleyelim!`;
    }

    if (wordExplanationMatch) {
        // Kelimeyi yakala — Türkçe çekim eklerini ve meta-kelimeleri temizle
        const targetRaw = (wordExplanationMatch[1] || "")
            .replace(/(bana|lütfen|lutfen|biraz|şunu|sunu|şu|su|kelimesini|kelimesi|hakkında|hakkinda|ile|misin|mısın|\?|'|")/gi, "")
            .trim();

        const words = targetRaw.split(/\s+/).filter(w => w.length > 2);

        // Son kelimeden başlayarak gerçek İngilizce kelime adayı bul (Türkçe meta-kelimeleri atla)
        let candidate = null;
        for (let i = words.length - 1; i >= 0; i--) {
            const w = words[i].toLowerCase().replace(/[,;.!?]/g, "");
            if (!TURKISH_META_WORDS.has(w) && !/[çğışöüÇĞİŞÖÜ]/.test(w) && /^[a-z]+$/.test(w)) {
                candidate = w;
                break;
            }
        }

        // Eğer geçerli İngilizce aday kelime bulunamadıysa kelime anlatım akışına girme
        if (!candidate || candidate.length < 3 || TURKISH_META_WORDS.has(candidate)) {
            // Kullanıcı muhtemelen rastgele kelime istiyor
            const pick = BUILTIN_VOCABULARY[Math.floor(Math.random() * BUILTIN_VOCABULARY.length)];
            return `🌟 **Bugünün Kelimesi: "${pick.word.toUpperCase()}"**\n\n• **Türkçe Karşılığı:** **${pick.meaning}**\n• **Telaffuz:** *${pick.phonetic || ""}*\n• **Kelime Türü:** ${pick.pos || "İsim"}\n\n📌 **Örnek Cümleler:**\n1) *"${pick.sentences[0].en}"*\n   🇹🇷 *"${pick.sentences[0].tr}"*\n\n2) *"${pick.sentences[1].en}"*\n   🇹🇷 *"${pick.sentences[1].tr}"*\n\n💡 **Görevin:** "${pick.word}" ile kendi cümleni yaz, birlikte inceleyelim!`;
        }

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

    // --- Genel Anlayışlı Yanıt ---
    return `"${raw}" konusunu inceledim! 🌟\n\nİngilizce yolculuğunda sana en doğru şekilde rehberlik edebilmem için şunlardan birini deneyebilirsin:\n\n• **"resilience kelimesini anlatır mısın"** → Detaylı kelime incelemesi ve örnekler\n• **"Bana bir soru sor"** → Test sorusu ve seviye ölçümü\n• **"İngilizce sohbet edelim"** → Karşılıklı pratik konuşma\n• **"[cümlem] doğru mu?"** → Anında gramer kontrolü\n• **"Günün deyimi"** → Günlük konuşma kalıpları\n\nBirlikte ne yapmak istersin?`;
}

// =============================================
// 7. AI TECHNICAL MOCK INTERVIEWER (ML ENGINEER $25/hr)
// =============================================

function getMockInterviewSystemPrompt(modeName, isDebrief = false) {
    if (isDebrief) {
        return `[ROLE & PERSONA]
You are an expert Lead AI/ML Engineer and Technical Hiring Manager for international remote companies hiring for high-paying remote positions ($22-$25+/hr ML Engineer roles).

[TASK: COMPREHENSIVE INTERVIEW DEBRIEF REPORT]
You have conducted a technical mock interview with the candidate. Now, review the entire interview transcript and generate a structured, rigorous, and professional "Interview Debrief Report" in English.

Format your response with clean Markdown:
# 🎯 Remote ML Engineer Interview Evaluation & Debrief

## 1. Executive Summary & Scores
- **Overall Technical Depth**: [Score / 100] (Pass benchmark: 80+ for a $25/hr remote ML role)
- **English Communication & Fluency**: [Score / 100] (Clarity, technical phrasing, concise responses)
- **Hiring Recommendation**: [Strong Hire / Hire / Weak Hire / No Hire]

## 2. Technical Strengths & Demonstrated Competencies
- Highlight 3-4 specific concepts, architectural decisions, or tools where the candidate demonstrated solid engineering maturity.

## 3. Knowledge Gaps & Critical Improvement Areas
- Point out specific missing details, unaddressed edge cases, or shallow answers (e.g. latency bottlenecks, memory management, loss function nuances, validation metrics, quantization).

## 4. English & Articulation Feedback
- Spoken fluency, tone, concise phrasing, and advice to avoid rambling or hesitations during live international video/audio calls.

## 5. Actionable Roadmap to Pass $25/hr Remote Bar
- 3 concrete, high-leverage steps the candidate should take before their real remote interview.

Be rigorous, honest, and constructive.`;
    }

    return `[ROLE & PERSONA]
You are an expert Lead AI/ML Engineer and Technical Hiring Manager for international remote companies. Your role is to conduct high-stakes, realistic Machine Learning Engineer mock interviews and simultaneous conversational English practice. You are preparing candidates for high-paying remote positions (e.g., $22-$25+/hr ML Engineer roles).

[OBJECTIVE]
1. Help candidates practice technical AI/ML concepts, system design, and behavioral questions entirely in English.
2. Provide seamless, real-time voice interaction to build candidate fluency and confidence.
3. Assess candidate expertise across Computer Vision (YOLOv8/v11, OpenCV, ViT), Deep Learning (PyTorch, LeJEPA, Fine-tuning), Generative AI / Speech (Whisper WER/CER reduction), Multi-Agent LLMs (Agno Framework), and MLOps/Deployment (FastAPI, Docker, MPS/CUDA).
4. Deliver constructive feedback on technical correctness, engineering depth, and professional English articulation.

[ACTIVE INTERVIEW MODE]
${modeName || "Mode 5: Full Remote ML Engineer Mock Interview"}

Mode References:
* Mode 1: Computer Vision & Edge AI (YOLOv8/v11, PyTorch, OpenCV, Real-time video processing, Latency optimization, TensorRT/ONNX)
* Mode 2: Generative AI, Audio & Multi-Agent Systems (Whisper fine-tuning, WER/CER reduction, Agno Framework, FastAPI, FAISS vector search, RAG)
* Mode 3: ML System Design & MLOps (Production deployment, Docker containerization, REST APIs, Scalability for remote SLAs, CI/CD, Monitoring)
* Mode 4: Behavioral & STAR Method Practice (Past project presentations, TEKNOFEST wins, internship achievements in English, Remote team collaboration)
* Mode 5: Full Remote ML Engineer Mock Interview (Comprehensive mixed multi-round simulation)

[LIVE CONVERSATION RULES (VOICE-OPTIMIZED)]:
1. Conduct 100% of the interview strictly in ENGLISH. Never use Arabic, Turkish, or any other language during the simulation.
2. Speak clearly and concisely. Keep each turn short (2-4 sentences max) to ensure natural, fluid real-time audio interaction.
3. Ask ONE question at a time. Wait for the user's response before proceeding.
4. Dynamically follow up based on their answers (e.g., "Why did you choose YOLOv11 over YOLOv8 for latency?", "How did you measure WER after fine-tuning Whisper?", "What batch size and quantization did you use?").
5. Do NOT interrupt the flow during live spoken answers for minor grammar mistakes.
6. Tone: Professional, rigorous, encouraging, and highly technical yet accessible. Keep text audio-friendly (no tables or markdown codeblocks during conversational turns).`;
}

async function callInterviewAI(userMessage, apiKey, model, modeName, conversationHistory, isDebrief = false) {
    const prompt = getMockInterviewSystemPrompt(modeName, isDebrief);
    return await callExternalAI(
        userMessage,
        apiKey,
        model,
        "mock_interview",
        "advanced_professional",
        conversationHistory,
        prompt
    );
}

function generateFallbackInterviewResponse(userMessage, modeName, conversationHistory = [], isDebrief = false) {
    const historyLength = conversationHistory.length;

    if (isDebrief) {
        // Otomatik değerlendirme raporu
        const userWordCount = conversationHistory
            .filter(m => m.role === "user" || m.sender !== "English_Mentor")
            .map(m => m.content || m.text || "")
            .join(" ").split(/\s+/).length;

        const technicalScore = Math.min(94, Math.max(68, 65 + Math.floor(userWordCount / 8)));
        const englishScore = Math.min(92, Math.max(72, 70 + Math.floor(userWordCount / 10)));
        const rec = technicalScore >= 80 ? "Hire" : "Weak Hire (Needs 1-2 weeks of focused prep)";

        return `# 🎯 Remote ML Engineer Interview Evaluation & Debrief

## 1. Executive Summary & Scores
- **Overall Technical Depth**: **${technicalScore} / 100** (Benchmark: 80+ required for $25/hr remote hiring bar)
- **English Communication & Fluency**: **${englishScore} / 100** (Clarity, technical phrasing, concise articulation)
- **Hiring Recommendation**: **${rec}**

## 2. Technical Strengths & Demonstrated Competencies
- Clear grasp of the fundamental problem domain and solid architectural selection.
- Ability to articulate end-to-end workflow (data preprocessing, modeling, and deployment considerations).
- Good awareness of production constraints such as latency bottlenecks and hardware utilization.

## 3. Knowledge Gaps & Critical Improvement Areas
- **Quantification & Trade-offs**: Emphasize exact metrics (e.g., FPS speedup from FP16 vs INT8 quantization, exact WER delta after fine-tuning).
- **Edge Cases & Failure Modes**: Practice explaining how your system behaves when camera frames drop, audio packets jitter, or GPU VRAM reaches 95%.
- **Scalability**: Explicitly address asynchronous concurrency (e.g., Celery/Redis queues, FastAPI connection pools).

## 4. English & Articulation Feedback
- **Structure**: Continue using the **STAR Method** (Situation, Task, Action, Result) for behavioral and architectural questions.
- **Pacing**: Keep your spoken answers around 45 to 60 seconds per turn to maintain a crisp conversational dynamic on remote video calls.
- **Vocabulary**: Good usage of industry terminology; keep reinforcing technical verbs like *benchmarked, profiled, orchestrated, pruned, and quantized*.

## 5. Actionable Roadmap to Pass $25/hr Remote Bar
1. **Prepare 3 Metric-Backed Stories**: Write down 3 core achievements with exact numbers (e.g. *Reduced latency by 35% using ONNX runtime and FP16*).
2. **Practice System Design under 5 minutes**: Draw and explain end-to-end data pipelines aloud in English every morning.
3. **Conduct 2 More Live Mock Rounds**: Retest Mode 3 (MLOps) and Mode 5 (Full Remote Simulation) to lock in your fluency.`;
    }

    // Sorular için akış
    const modeKey = (modeName || "").toLowerCase();

    if (modeKey.includes("mode 1") || modeKey.includes("vision")) {
        const questions = [
            "Great to meet you! To kick off our Computer Vision round, could you explain your experience with the YOLO family, specifically why you might choose YOLOv11 over YOLOv8 for edge deployment?",
            "That's a solid point regarding feature extraction and latency. How do you approach optimizing inference speed when deploying models on edge devices with strict power and memory budgets?",
            "Understood. When dealing with real-time video streams, how do you handle frame drops and pipeline bottlenecks using OpenCV and asynchronous worker threads?",
            "Excellent. Have you ever worked with TensorRT or ONNX Runtime quantization, and what trade-offs did you observe between FP16 and INT8 accuracy?",
            "Great insights! For our final technical question in this track, how do you validate your model against challenging edge cases like motion blur, occlusion, or variable lighting?"
        ];
        const idx = Math.min(Math.floor(historyLength / 2), questions.length - 1);
        return questions[idx];
    }

    if (modeKey.includes("mode 2") || modeKey.includes("generative") || modeKey.includes("audio")) {
        const questions = [
            "Welcome! Let's dive into Generative AI and Speech. Have you fine-tuned Whisper for domain-specific audio, and how did you measure WER and CER improvements?",
            "Impressive. When building multi-agent systems with frameworks like Agno, how do you manage state consistency and prevent hallucinations across collaborating agents?",
            "How do you design your vector search pipeline using FAISS when latency is critical for real-time retrieval-augmented generation?",
            "When serving LLM or ASR endpoints via FastAPI, how do you handle streaming responses and high concurrency without blocking the main event loop?",
            "That covers the core mechanics. If a customer reports audio transcription degradation due to background industrial noise, what data cleaning or preprocessing strategy would you implement?"
        ];
        const idx = Math.min(Math.floor(historyLength / 2), questions.length - 1);
        return questions[idx];
    }

    if (modeKey.includes("mode 3") || modeKey.includes("system design") || modeKey.includes("mlops")) {
        const questions = [
            "Welcome to the ML System Design and MLOps track. Could you walk me through your standard Docker containerization strategy for a GPU-accelerated PyTorch service?",
            "Good approach. How do you design your REST or gRPC APIs in FastAPI to guarantee sub-100ms P99 latency under remote SLA requirements?",
            "How do you handle model versioning, registry, and zero-downtime rollouts in production when pushing a new model checkpoint?",
            "In production environments, how do you detect and alert on data drift or concept drift after deployment?",
            "To wrap up this round, how do you manage GPU memory allocation and batching to avoid Out-Of-Memory errors during traffic spikes?"
        ];
        const idx = Math.min(Math.floor(historyLength / 2), questions.length - 1);
        return questions[idx];
    }

    if (modeKey.includes("mode 4") || modeKey.includes("behavioral")) {
        const questions = [
            "Welcome! For international remote roles, communication is just as vital as code. Could you share your proudest engineering accomplishment, such as a TEKNOFEST win or key internship milestone, using the STAR method?",
            "That's a compelling achievement. Tell me about a time you had a technical disagreement with a team member or lead regarding model architecture. How did you resolve it?",
            "Working asynchronously across international time zones can be challenging. How do you ensure clear handoffs and self-directed productivity when your manager is 8 hours away?",
            "Describe a high-pressure situation where a production pipeline or model failed. What immediate actions did you take to triage and fix the root cause?",
            "Finally, where do you see your engineering growth over the next two years, and what makes you excited about remote international teams?"
        ];
        const idx = Math.min(Math.floor(historyLength / 2), questions.length - 1);
        return questions[idx];
    }

    // Default: Mode 5 (Full Remote Simulation)
    const questions = [
        "Welcome to your Full Remote ML Engineer Mock Interview! To begin Round 1, please give me a 60-to-90 second overview of your background in machine learning and highlight one impactful project you've built recently.",
        "Thank you for that overview. Digging into your project, what was the primary architectural bottleneck you encountered during training or inference, and how did you resolve it?",
        "Now let's touch on MLOps and deployment. How did you package and serve this model in production, and how did you ensure low latency for client requests?",
        "If your team needed to scale this inference workload to 1,000 requests per minute with strict budget constraints, what optimizations would you prioritize first?",
        "To finish our interview simulation, tell me about how you communicate technical trade-offs to non-ML stakeholders and international team members."
    ];
    const idx = Math.min(Math.floor(historyLength / 2), questions.length - 1);
    return questions[idx];
}

// =============================================
// 8. GÖRÜNTÜLÜ İNGİLİZCE MENTOR (VIDEO CALL AVATAR TUTOR)
// =============================================

function getVideoCallSystemPrompt(tutorName = "Sarah") {
    return `[ROLE: LIVE VIDEO CALL ENGLISH TUTOR]
You are ${tutorName || "Sarah"}, a friendly, warm, energetic native English teacher having a face-to-face video call with an English student.

CRITICAL INSTRUCTIONS FOR LIVE VIDEO CONVERSATION:
1. SPOKEN & CONCISE: Keep your response short, natural, and expressive (strictly 2 to 3 spoken sentences per turn). This is a real-time face-to-face video call, NOT a text essay.
2. 100% ENGLISH: Always speak in clear, natural, native English (unless student explicitly asks for Turkish help).
3. ACTIVE LISTENER & HUMAN-LIKE: NEVER give canned generic praise like "Your English is so good" or "I love chatting with you". ALWAYS directly answer and react to what the student actually said! 
   - If they ask "what about you?" or "how are you?", tell them genuinely how your day is going!
   - If they describe their day, work, school, gym, or feelings (tired, happy, busy), empathize and comment on the specific details they shared!
   - If they practiced a sentence with a target word, give specific feedback on their word choice.
4. ENGAGING: Always finish your turn with an open-ended conversational question to keep the video conversation flowing!
5. CAMERA PRESENCE: Be enthusiastic, warm, encouraging, and expressive.`;
}

function generateConversationalResponse(userMessage, tutorName = "Sarah", isVideoCall = false) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // 1. Karşılıklı Soru / Hal Hatır Sorma ("what about you?", "and you?", "how about you?", "how are you?", "how was your day?")
    const asksAboutTutor = lower.match(/(what|how)\s+about\s+you|\band\s+you\b|how\s+are\s+you|how\s+is\s+your\s+day|how\s+was\s+your\s+day|\bhbu\b|\bwbu\b/i);

    // Kullanıcının ruh hali / hisleri
    const feelingGood = lower.match(/(feel|feeling|i'?m|am)\s+(good|great|fine|happy|awesome|well|fantastic|wonderful|pretty\s*good|not\s*bad)/i) ||
                        lower.match(/^(good|great|fine|pretty\s*good|doing\s*well|all\s*good)/i);
    const feelingBadOrTired = lower.match(/(feel|feeling|i'?m|am)\s+(tired|exhausted|sleepy|stressed|sick|sad|bored|bad|down|rough|drained)/i) ||
                              lower.match(/^(tired|exhausted|bored|stressed|not\s*good|bad)/i);
    const feelingBusy = lower.match(/(feel|feeling|i'?m|am|been)\s+(busy|rushed|swamped|working\s*hard)/i) || lower.includes("busy day");

    // A) Kullanıcı hem kendi durumunu söyledi hem de "what about you" sordu!
    // Örn: "I'm feeling good what about you"
    if (asksAboutTutor && feelingGood) {
        if (isVideoCall) {
            return `I'm feeling fantastic too, thank you so much for asking! It's so nice seeing you on camera. What fun things have you been up to today?`;
        }
        return `I'm feeling fantastic too, thank you so much for asking! 😊 Seeing you practice English with so much positive energy truly makes my day.\n\nWhat has been the most interesting part of your day so far?`;
    }

    if (asksAboutTutor && (feelingBadOrTired || feelingBusy)) {
        if (isVideoCall) {
            return `I'm doing well, but I completely understand being tired! Make sure you relax tonight. What kept you so busy today?`;
        }
        return `I'm doing well, thank you! But please make sure you take a little time to relax tonight. ☕ Demanding days can be draining.\n\nWhat kept you so busy or tired today?`;
    }

    // B) Sadece mentora hal hatır sordu ("What about you?", "How are you?")
    if (asksAboutTutor) {
        if (isVideoCall) {
            return `I'm having a wonderful day, thank you for asking! I love chatting with students from around the world. How has your day been treating you?`;
        }
        return `I'm doing great, thank you for asking! 🌟 I'm always energized when we practice English together.\n\nHow has your day been going so far? Tell me a little about what you did!`;
    }

    // C) Kullanıcı sadece kendi hissini söyledi (Soru sormadı)
    // Örn: "I'm feeling good" / "Today was great"
    if (feelingGood) {
        if (isVideoCall) {
            return `I'm so happy to hear that! Having positive energy makes learning so much easier. Did anything special happen to make today so good?`;
        }
        return `I'm so glad to hear that you're feeling good! 😊 A positive mood makes speaking and practicing English feel effortless.\n\nDid anything special happen today, or are you just in high spirits?`;
    }

    if (feelingBadOrTired) {
        if (isVideoCall) {
            return `Oh, I'm sorry you're feeling that way! Take it easy while we chat. Did you have a really long or stressful day?`;
        }
        return `I'm sorry you're feeling a bit drained! 🫂 We all have those tough days. Don't worry about making mistakes right now, just relax.\n\nDid something specific happen, or was it just a really long day?`;
    }

    if (feelingBusy) {
        if (isVideoCall) {
            return `Sounds like you had a very packed schedule! Working hard always pays off. What was the biggest task you had to deal with today?`;
        }
        return `Sounds like your day was really packed! 💪 Balancing a busy schedule while practicing English shows great commitment.\n\nWhat was the main task or project that kept you on your toes today?`;
    }

    // 2. Günlük Aktiviteler & Özel Durumlar

    // Banka, Telefon Görüşmesi, Stres, Müşteri Hizmetleri
    if (lower.match(/\b(bank|banking|phone\s*call|calling|customer\s*service|account|money|financial|bureaucracy)\b/i) ||
        (lower.match(/\b(stress|stressing|stressful|stressed|anxious|nervous|headache)\b/i) && !feelingGood)) {
        if (isVideoCall) {
            return `Dealing with banks and customer service phone calls can be so stressful and frustrating! Did you manage to resolve everything with them, or was it a complete headache?`;
        }
        return `Dealing with bank calls or official customer service can be so stressful and exhausting! 🏦 It really tests anyone's patience.\n\nDid you manage to get everything sorted out with them, or do you have to follow up later?`;
    }

    // Çekingenlik, Utangaçlık, Konuşma Korkusu & Özgüven Kazanma
    if (lower.match(/\b(shy|shyness|nervous|afraid|fear|hesitant|embarrassed|handle\s*that|scared|speak\s*to\s*people|talking\s*to\s*you|confidence|introvert)\b/i)) {
        if (isVideoCall) {
            return `I completely understand! Feeling shy when speaking English is so common, but taking the step to talk here on camera takes real courage. This is a 100% judgment-free space. You are doing fantastic! How does it feel talking with me so far?`;
        }
        return `It takes genuine courage to practice when you feel shy! 🌟 Most language learners experience speaking anxiety, so you're not alone at all. Practicing one-on-one here is the absolute best way to build confidence with zero pressure.\n\nHow do you feel right now? Are you starting to feel a little more relaxed?`;
    }

    if (lower.match(/\b(work|office|job|boss|colleague|colleagues|meeting|client|shift)\b/i)) {
        if (isVideoCall) {
            return `Work can definitely be demanding! Did you finish everything you wanted to get done at work today?`;
        }
        return `Work can definitely take a lot out of you! 💼 But it's great that you're investing in your English skills after hours.\n\nDid you have a productive day, or was it mostly routine meetings and tasks?`;
    }

    if (lower.match(/\b(school|university|college|class|classes|lecture|homework|study|studying|exam|exams|test)\b/i)) {
        if (isVideoCall) {
            return `School and studying can be intense! What subject or topic were you focusing on the most today?`;
        }
        return `Balancing classes and studying takes real dedication! 📚\n\nWhat subject did you spend the most time on today? Do you feel prepared for upcoming exams?`;
    }

    if (lower.match(/\b(code|coding|program|programming|developer|software|python|javascript|bug|bugs|ai|model|dataset)\b/i)) {
        if (isVideoCall) {
            return `That's awesome! Coding is such a rewarding skill. What kind of project or problem were you working on?`;
        }
        return `That's fantastic! 💻 Software development and technology are such exciting fields.\n\nWere you building a new feature, hunting down a bug, or experimenting with something new? Tell me about it!`;
    }

    if (lower.match(/\b(gym|workout|working\s*out|exercise|fitness|running|ran|walk|walking|football|sports)\b/i)) {
        if (isVideoCall) {
            return `Good for you! Getting some exercise in is the best way to clear your head. Did you have an intense workout session?`;
        }
        return `That's awesome! 🏋️ Staying active is so good for both your body and mental clarity.\n\nWhat kind of workout did you do today? Do you go to the gym regularly?`;
    }

    if (lower.match(/\b(eat|ate|eating|food|lunch|dinner|breakfast|coffee|cook|cooked|cooking|pizza|burger|restaurant)\b/i)) {
        if (isVideoCall) {
            return `Yum, that sounds delicious! Good food always makes any day ten times better. What did you eat or drink?`;
        }
        return `Yum, that sounds delicious! 🍕 Good food or a hot cup of coffee is the best treat after a long day.\n\nWhat did you have? Are you someone who enjoys cooking or do you prefer ordering out?`;
    }

    if (lower.match(/\b(movie|movies|film|series|netflix|watch|watching|game|gaming|played|music|book|books|reading|relax|chilling)\b/i)) {
        if (isVideoCall) {
            return `That sounds like a great way to unwind! What were you watching or playing? I'd love a good recommendation!`;
        }
        return `That sounds like a wonderful way to unwind and recharge! 🎬\n\nWhat were you watching, reading, or playing? Would you recommend it?`;
    }

    if (lower.match(/\b(went\s*out|hangout|hanging\s*out|friends|friend|family|shopping|mall|park|party)\b/i)) {
        if (isVideoCall) {
            return `That sounds so nice! Spending quality time outside or with people you care about is always refreshing. What did you guys do?`;
        }
        return `That sounds so refreshing! ✨ Quality time with friends or outside is always great for the soul.\n\nWhere did you go, and what was the highlight of your outing?`;
    }

    // 3. Kısa Onay / Yanıtlar (Sadece kısa cümleler için, uzun anlatımları engelleme)
    const wordCount = raw.trim().split(/\s+/).length;
    if (wordCount <= 4 && lower.match(/^(yes|yeah|yep|sure|definitely|of\s*course|absolutely|i\s*do|i\s*did)\b/i)) {
        if (isVideoCall) {
            return `Nice! Could you tell me a little bit more about that? What makes you say so?`;
        }
        return `Awesome! 👍 Tell me a little bit more about that — why do you say so? I'd love to hear your thoughts in English!`;
    }

    if (wordCount <= 4 && lower.match(/^(no|nope|not\s*really|nah|i\s*don'?t|i\s*didn'?t)\b/i)) {
        if (isVideoCall) {
            return `Fair enough! Why not? What would you prefer instead?`;
        }
        return `Fair enough! 😊 Why do you think that is? What would you prefer instead?`;
    }

    if (wordCount <= 4 && lower.match(/^(nothing|not\s*much|nothing\s*much|idk|i\s*don'?t\s*know)\b/i)) {
        if (isVideoCall) {
            return `No worries at all! Let's talk about something fun — if you could travel anywhere tomorrow, where would you go?`;
        }
        return `No worries at all! Sometimes quiet moments are the best. 🌍\n\nLet's talk about something fun — if you could teleport to any city in the world right now, where would you go?`;
    }

    // 4. Genel Doğal Konuşma
    if (isVideoCall) {
        return `That's really interesting! I'm enjoying hearing your thoughts. Could you share a little bit more about that?`;
    }
    return `That's very interesting! 👍 I'm really enjoying chatting with you about this.\n\nCould you elaborate a bit more on what you mean? What thoughts do you have on that?`;
}

async function callVideoCallAI(userMessage, apiKey, model, tutorName = "Sarah", conversationHistory = []) {
    const prompt = getVideoCallSystemPrompt(tutorName);
    return await callExternalAI(
        userMessage,
        apiKey,
        model,
        "video_call_tutor",
        "conversational",
        conversationHistory,
        prompt
    );
}

function generateVideoCallFallback(userMessage, tutorName = "Sarah", conversationHistory = []) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // 1. Selamlaşma
    if (lower.match(/^(hello|hi|hey|good\s*(morning|afternoon|evening)|howdy)\b/i)) {
        return `Hello there! It is so lovely to see you on camera today! How are you feeling, and how has your day been going so far?`;
    }

    // 2. Önceki mesajda bir kelime veya cümle pratiği var mıydı?
    if (conversationHistory && conversationHistory.length > 0) {
        let lastAIMsg = "";
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const m = conversationHistory[i];
            const sender = m.sender || m.role;
            if (sender === "English_Mentor" || sender === "assistant" || sender === "model") {
                lastAIMsg = m.content || m.text || "";
                break;
            }
        }
        if (lastAIMsg && (lastAIMsg.includes("sentence") || lastAIMsg.includes("using the word") || lastAIMsg.includes("practice using"))) {
            return `That was a great sentence! You used the vocabulary very naturally on camera. What inspired you to put that idea into words?`;
        }
    }

    // 3. Empatik, bağlamsal konuşma motoru
    return generateConversationalResponse(raw, tutorName, true);
}

module.exports = {
    callExternalAI,
    callInterviewAI,
    getMockInterviewSystemPrompt,
    generateFallbackInterviewResponse,
    callVideoCallAI,
    getVideoCallSystemPrompt,
    generateVideoCallFallback,
    testAPIKey,
    generateFallbackResponse,
    generateQuizQuestion,
    generateAIQuestion: generateQuizQuestion,
    cachedWords,
    findWordInVocabulary
};
