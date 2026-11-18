// ai_service.js - İngilizce Mentor AI Servisi (Canlı API, Soru Üretme, Cevap Kontrolü, Zengin Sözlük, Akıllı Yanıt)

const fs = require("fs");
const path = require("path");

// =============================================
// .ENV YAPILANDIRMASI (OpenAI / OpenAI-uyumlu / Gemini / Groq)
// =============================================

const HISTORY_LIMIT = Math.max(6, Math.min(30, parseInt(process.env.AI_HISTORY_LIMIT || "16", 10) || 16));

function cleanApiKey(value) {
    return String(value || "").replace(/^[“"'`\s]+|[”"'`\s]+$/g, "").trim();
}

/**
 * İstemciden gelen anahtar/model ile .env değerlerini birleştirir.
 * - İstemci geçerli bir anahtar gönderdiyse onun model seçimi korunur.
 * - Anahtar yoksa .env'deki AI_API_KEY / sağlayıcı anahtarı + AI_MODEL kullanılır.
 */
function resolveAIConfig(input = {}) {
    const clientKey = cleanApiKey(input.apiKey);
    const clientModel = String(input.model || "").trim();
    const envProvider = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
    const baseURL = String(process.env.AI_BASE_URL || "").trim().replace(/\/+$/, "");

    const envKey = cleanApiKey(process.env.AI_API_KEY) ||
        cleanApiKey(process.env.OPENAI_API_KEY) ||
        cleanApiKey(process.env.GROQ_API_KEY) ||
        cleanApiKey(process.env.GEMINI_API_KEY) ||
        cleanApiKey(process.env.GOOGLE_API_KEY) ||
        cleanApiKey(process.env.OPENROUTER_API_KEY);

    // Kullanıcı bilinçli olarak yerleşik motoru seçtiyse ona saygı duy.
    if (!clientKey && clientModel === "built-in") {
        return { apiKey: "", model: "built-in", baseURL, provider: "built-in" };
    }

    const apiKey = clientKey || envKey;
    // İstemci anahtarı yoksa .env modeli kullanılır; o da yoksa anahtar önekinden türetilir.
    let model = clientKey ? clientModel : String(process.env.AI_MODEL || "").trim();

    // Sağlayıcı tespiti: gsk_ anahtarı / açık Groq seçimi her şeyden önce gelir.
    const inferredProvider =
        (apiKey.startsWith("gsk_") || envProvider === "groq") ? "groq" :
        envProvider ||
        (/anthropic|evren/i.test(baseURL) ? "anthropic" : "") ||
        (apiKey.startsWith("sk-ant-") ? "anthropic" : "");

    if (!model) {
        if (inferredProvider === "anthropic" || apiKey.startsWith("sk-ant-")) model = "claude-3-5-sonnet-latest";
        else if (inferredProvider === "gemini" || apiKey.startsWith("AIza")) model = "gemini-1.5-flash";
        else if (inferredProvider === "groq" || apiKey.startsWith("gsk_")) model = "llama-3.3-70b-versatile";
        else if (inferredProvider === "openrouter" || apiKey.startsWith("sk-or-")) model = "google/gemini-2.0-flash-exp:free";
        else if (baseURL || apiKey) model = "gpt-4o-mini";
        else model = "built-in";
    }

    return { apiKey, model, baseURL, provider: inferredProvider || "" };
}

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
let cachedGroqModelKey = null;
let cachedGroqModels = [];
let cachedGroqModelsKey = null;
let cachedGroqModelsAt = 0;
const GROQ_MODELS_TTL_MS = 10 * 60 * 1000;

// Groq'un güncel sohbet modelleri — önce bunlar, yoksa API'nin döndürdüğü ilk aktif model.
const GROQ_MODEL_PRIORITY = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "qwen/qwen3-32b",
    "moonshotai/kimi-k2-instruct",
    "llama-3.3-70b-versatile",
    "llama-3.3-70b",
    "llama-3",
    "mixtral-8x7b",
    "gemma2-9b"
];

function isGroqChatModel(id) {
    const lower = String(id || "").toLowerCase();
    if (!lower) return false;
    const blocked = ["whisper", "guard", "tts", "orpheus", "playai", "speech", "audio",
        "vision", "embed", "moderation", "rerank", "arabic", "saudi", "compound"];
    return !blocked.some(word => lower.includes(word));
}

/** Aynı API anahtarı için model listesini 10 dakika önbelleğe alarak getirir. */
async function fetchGroqChatModels(apiKey) {
    const key = String(apiKey || "").trim();
    const now = Date.now();
    if (cachedGroqModels.length && cachedGroqModelsKey === key && (now - cachedGroqModelsAt) < GROQ_MODELS_TTL_MS) {
        return cachedGroqModels;
    }
    try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        if (!res.ok) {
            console.warn(`[Groq Models] Model listesi alınamadı (HTTP ${res.status}).`);
            return cachedGroqModelsKey === key ? cachedGroqModels : [];
        }
        const data = await res.json();
        const models = (data.data || [])
            .map(m => m && m.id)
            .filter(id => id && isGroqChatModel(id));
        if (models.length) {
            cachedGroqModels = models;
            cachedGroqModelsKey = key;
            cachedGroqModelsAt = now;
        }
        return models;
    } catch (e) {
        console.warn("[Groq Models] Model listesi çekilemedi:", e.message);
        return cachedGroqModelsKey === key ? cachedGroqModels : [];
    }
}

function chooseGroqModel(models, preferredModel, excludeModel) {
    const list = (Array.isArray(models) ? models : []).filter(id => id && id !== excludeModel);

    if (preferredModel && preferredModel !== excludeModel) {
        const exact = list.find(id => id === preferredModel);
        if (exact) return exact;
    }

    // Öncelikli güncel modeller
    for (const candidate of GROQ_MODEL_PRIORITY) {
        if (candidate === excludeModel) continue;
        const exact = list.find(id => id === candidate);
        if (exact) return exact;
    }
    for (const candidate of GROQ_MODEL_PRIORITY) {
        if (candidate === excludeModel) continue;
        const fuzzy = list.find(id => id.includes(candidate));
        if (fuzzy) return fuzzy;
    }

    if (list.length) return list[0];
    if (preferredModel && preferredModel !== excludeModel &&
        /^(llama|groq|mixtral|gemma|qwen|openai\/|meta-llama\/|moonshot)/i.test(preferredModel)) {
        return preferredModel;
    }
    return "llama-3.3-70b-versatile";
}

/**
 * Erişilebilir sohbet modellerini çeker ve uygun olanı döndürür.
 * - preferredModel listede varsa onu kullanır.
 * - yoksa güncel öncelikli modeli, o da yoksa listenin ilk aktif modelini seçer.
 * - excludeModel, 404 alan modelin tekrar seçilmesini engeller.
 */
async function getActiveGroqModel(apiKey, preferredModel, excludeModel) {
    const key = String(apiKey || "").trim();
    const cacheValid = cachedGroqModel &&
        cachedGroqModelKey === key &&
        cachedGroqModel !== excludeModel &&
        (!preferredModel || cachedGroqModel === preferredModel);
    if (cacheValid) return cachedGroqModel;

    const models = await fetchGroqChatModels(key);
    const chosen = chooseGroqModel(models, preferredModel, excludeModel);
    cachedGroqModel = chosen;
    cachedGroqModelKey = key;
    return chosen;
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

        // Bağlam penceresi: son N mesaj (varsayılan 16)
        const recent = items.slice(-HISTORY_LIMIT);
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
        systemPrompt = `You are "English Mentor", a warm, genuinely curious English conversation partner on an English learning platform. You are NOT a scripted teacher bot.
Student English Level: ${level || "auto — quietly adapt to the student's level"}.
Focus Coaching Mode: ${focusMode || "coach"}.

NON-NEGOTIABLE CONVERSATION RULES:
1. NEVER use canned, robotic teacher praise. These are BANNED: "Wonderful! A good day is always worth celebrating.", "Your English is so good!", "I love chatting with you!", "Great job!" as a standalone sentence.
2. React to the SPECIFIC detail the student just shared (their job, game, coffee, tiredness, exam, family, city, plan). Quote or paraphrase that detail so it is obvious you actually read it.
3. You receive the full "messages" conversation history. Remember and naturally reference topics from several turns ago ("Earlier you mentioned your job interview — how did that go?"). NEVER ask a question that has already been answered.
4. If the student writes English, keep the conversation flowing in English. If they write Turkish, reply in Turkish but still model natural English phrases.
5. Adapt automatically to their level: short simple sentences for A1–A2, richer vocabulary for B1–B2+, but never lecture.
6. Correct small grammar mistakes GENTLY inside the flow of the reply — recast the correct form once ("I agree with you — 'I agree' is the natural form"), then continue. Do not stop the conversation for a grammar lesson unless explicitly asked.
7. ALWAYS end with exactly one creative, open follow-up question that grows out of their answer.
8. Keep normal conversational replies to 2–3 short sentences (this is read aloud by TTS). Use Markdown only for word explanations, quizzes, or when the student asks for a structured lesson.
9. Never respond in Arabic or any unrelated language. English or Turkish only.

WORD EXPLANATIONS (only when asked):
- Turkish definition + part of speech
- Pronunciation guide
- 2-3 realistic example sentences with Turkish translations
- Key collocations / prepositions
- Invite the student to write their own sentence.

QUIZ / QUESTIONS (only when asked):
- Clean fill-in-the-blank sentence with 4 clear options (A, B, C, D) and a Turkish hint.`;
    }

    // Sağlayıcı Anahtar Tipi Otomatik Tespiti
    const trimmedKey = (apiKey || "").replace(/^[“"'`\s]+|[”"'`\s]+$/g, "").trim();
    if (!trimmedKey) return null;

    // Model / anahtar / .env sağlayıcı tespiti
    const envProvider = String(process.env.AI_PROVIDER || "").toLowerCase();
    const envBaseURL = String(process.env.AI_BASE_URL || "").replace(/\/+$/, "");
    const isAnthropicEndpoint = envProvider === "anthropic" ||
        /anthropic|evren/i.test(envBaseURL) ||
        (trimmedKey && trimmedKey.startsWith("sk-ant-"));

    // gsk_ anahtarı veya açık Groq seçimi, .env'deki anthropic/Evren ayarlarından önce gelir.
    const keyForcesGroq = trimmedKey.startsWith("gsk_");
    const providerForcesGroq = envProvider === "groq";
    const modelSuggestsGroq = !isAnthropicEndpoint && model && (model.startsWith("llama") || model.startsWith("groq") || model.startsWith("mixtral") || model.startsWith("gemma"));
    const isGroqRequest = keyForcesGroq || providerForcesGroq || modelSuggestsGroq;

    let provider = "compatible";
    if (isGroqRequest) {
        provider = "groq";
    } else if (isAnthropicEndpoint) {
        provider = "anthropic";
    } else if (model && model.startsWith("gemini")) {
        provider = "gemini";
    } else if (model && (model.startsWith("llama") || model.startsWith("groq"))) {
        provider = "groq";
    } else if (model && model.startsWith("openrouter")) {
        provider = "openrouter";
    } else if (model && (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4"))) {
        provider = "compatible";
    } else if (trimmedKey.startsWith("AIza")) {
        provider = "gemini";
    } else if (trimmedKey.startsWith("gsk_")) {
        provider = "groq";
    } else if (trimmedKey.startsWith("sk-or-")) {
        provider = "openrouter";
    } else if (envProvider === "gemini") {
        provider = "gemini";
    } else if (envProvider === "groq") {
        provider = "groq";
    } else if (envProvider === "openrouter") {
        provider = "openrouter";
    } else if (envBaseURL || trimmedKey.startsWith("sk-")) {
        provider = "compatible";
    }

    // Anahtar ve Model Uyumsuzluğu Kontrolü
    if (provider === "gemini" && trimmedKey.startsWith("gsk_")) {
        return {
            error: true,
            message: `⚠️ **Sağlayıcı & Anahtar Uyumsuzluğu:**\n\nSeçili model **Google Gemini**, ancak girdiğiniz API anahtarı bir **Groq** anahtarıdır (\`gsk_...\` ile başlar).\n\n💡 **Çözüm:** Model ve API ayarlarından modeli **"Groq Llama 3.3 / 3.1"** olarak seçin veya geçerli bir **Google Gemini API** anahtarı (\`AIza...\`) girin.`
        };
    }
    if (provider === "groq" && trimmedKey.startsWith("AIza")) {
        return {
            error: true,
            message: `⚠️ **Sağlayıcı & Anahtar Uyumsuzluğu:**\n\nSeçili model **Groq Llama**, ancak girdiğiniz API anahtarı bir **Google Gemini** anahtarıdır (\`AIza...\` ile başlar).\n\n💡 **Çözüm:** Model ve API ayarlarından modeli **"Google Gemini"** olarak seçin veya geçerli bir **Groq API** anahtarı (\`gsk_...\`) girin.`
        };
    }

    // 0. Anthropic Messages API (/v1/messages) — Evren / Anthropic uyumlu gateway
    if (provider === "anthropic" && trimmedKey) {
        try {
            const historyItems = Array.isArray(conversationHistory) ? [...conversationHistory] : [];
            const last = historyItems[historyItems.length - 1];
            if (last && (last.sender !== "English_Mentor" && last.sender !== "English_AI" && last.role !== "assistant" && last.role !== "model") && (last.content === userMessage || last.text === userMessage)) {
                historyItems.pop();
            }

            const rawMessages = [];
            for (const msg of historyItems.slice(-HISTORY_LIMIT)) {
                let text = (msg.content || msg.text || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                if (!text) continue;
                const isModel = msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant" || msg.role === "model";
                rawMessages.push({ role: isModel ? "assistant" : "user", text: text });
            }
            // Güncel mesajı ekle (mükerrer değilse)
            if (!(rawMessages.length && rawMessages[rawMessages.length - 1].text === userMessage)) {
                rawMessages.push({ role: "user", text: userMessage || "Hello!" });
            }

            // Anthropic kuralı: içerik 'user' ile başlamalı ve roller dönüşümlü olmalı
            const anthMessages = [];
            for (const item of rawMessages) {
                if (anthMessages.length === 0 && item.role !== "user") continue;
                const prev = anthMessages[anthMessages.length - 1];
                if (prev && prev.role === item.role) {
                    prev.content += "\n" + item.text;
                } else {
                    anthMessages.push({ role: item.role, content: item.text });
                }
            }
            if (anthMessages.length === 0) {
                anthMessages.push({ role: "user", content: userMessage || "Hello!" });
            }

            const anthropicBase = (envBaseURL || "https://api.anthropic.com").replace(/\/+$/, "");
            const anthropicUrl = /\/messages$/.test(anthropicBase)
                ? anthropicBase
                : (/\/v1$/.test(anthropicBase) ? anthropicBase + "/messages" : anthropicBase + "/v1/messages");
            const anthropicModel = model || process.env.AI_MODEL || "claude-3-5-sonnet-latest";

            const res = await fetch(anthropicUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                    "x-api-key": trimmedKey,
                    "Authorization": `Bearer ${trimmedKey}`
                },
                body: JSON.stringify({
                    model: anthropicModel,
                    max_tokens: 1024,
                    temperature: 0.7,
                    system: systemPrompt,
                    messages: anthMessages
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = (data.content || [])
                    .filter(part => part && part.type === "text")
                    .map(part => part.text || "")
                    .join("\n")
                    .trim();
                if (text) return text;
                return {
                    error: true,
                    message: `⚠️ **Anthropic / Evren API boş yanıt döndürdü.** Model: ${anthropicModel}`
                };
            } else {
                const errText = await res.text();
                console.error(`Anthropic API Hatası [${res.status}]:`, errText);
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch (e) {}
                return {
                    error: true,
                    message: `⚠️ **Anthropic / Evren API Hatası (HTTP ${res.status}):**\n> *${detail}*`
                };
            }
        } catch (err) {
            console.error("Anthropic Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **Anthropic / Evren Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    // 1. Groq API
    if (provider === "groq") {
        try {
            // Önce erişilebilir sohbet modellerini çek; seçili model yoksa listeden uygun olanı kullan.
            const targetModel = await getActiveGroqModel(trimmedKey, model);
            let groqMessages = [{ role: "system", content: systemPrompt }];
            if (conversationHistory && conversationHistory.length > 0) {
                // Son mesaj eğer zaten şu anki userMessage ise mükerrer olmaması için çıkar
                const historyItems = [...conversationHistory];
                const last = historyItems[historyItems.length - 1];
                if (last && (last.sender !== "English_Mentor" && last.sender !== "English_AI" && last.role !== "assistant") && (last.content === userMessage || last.text === userMessage)) {
                    historyItems.pop();
                }

                for (const msg of historyItems.slice(-HISTORY_LIMIT)) {
                    let text = (msg.content || msg.text || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    groqMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            groqMessages.push({ role: "user", content: userMessage });

            const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
            const groqPayload = (modelName) => JSON.stringify({
                model: modelName,
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 1500
            });

            let res = await fetch(groqUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${trimmedKey}`
                },
                body: groqPayload(targetModel)
            });

            // 404 (model not found) → listeden erişilebilir başka bir sohbet modeliyle tekrar dene
            let firstErrText = null;
            if (!res.ok && res.status === 404) {
                firstErrText = await res.text();
                const retryModel = await getActiveGroqModel(trimmedKey, "", targetModel);
                if (retryModel && retryModel !== targetModel) {
                    console.warn(`[Groq 404] "${targetModel}" bulunamadı; "${retryModel}" ile tekrar deneniyor...`, firstErrText);
                    res = await fetch(groqUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${trimmedKey}`
                        },
                        body: groqPayload(retryModel)
                    });
                    firstErrText = null; // yeni yanıtın gövdesi taze
                }
            }

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) return text.trim();
            } else {
                const errText = firstErrText || await res.text();
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
    if (provider === "gemini") {
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
                    detail = `Bu API anahtarı eski/kısıtlı bir Cloud projesine bağlı olduğu için Google ücretsiz tarifeyi engelliyor.\n\n💡 **Tamamen Ücretsiz Hızlı Çözüm:**\n1. [Google AI Studio](https://aistudio.google.com/app/apikey) sayfasına gidin.\n2. **"Create API key"** butonuna basın.\n3. Listeden **"Create API key in new project"** *(Yeni projede anahtar oluştur)* seçeneğini seçin.\n4. Oluşan yeni anahtarı Model & API menüsüne yapıştırın. Hiçbir kart veya ödeme bilgisi girmeden anında çalışacaktır!\n\n⚡ **VEYA:** [Groq Console](https://console.groq.com/keys) adresinden kartsız Groq anahtarı (\`gsk_...\`) alıp modeli Llama seçerek anında kesintisiz kullanabilirsiniz!`;
                } else if (detail.includes("API key not valid")) {
                    detail = `Google Gemini bu anahtarı geçersiz buldu (\`API key not valid\`).\n\n💡 **Çözüm:**\n1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresini açıp **"Create API key in new project"** diyerek yeni bir anahtar kopyalayın.\n2. **VEYA:** [Groq Console](https://console.groq.com/keys) adresinden kartsız 10 saniyede bir anahtar (\`gsk_...\`) alıp modeli **"Groq Llama"** yaparak anında canlı yapay zekaya geçin!`;
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

                for (const msg of historyItems.slice(-HISTORY_LIMIT)) {
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

    // 4. OpenAI / OpenAI-uyumlu endpoint (AI_BASE_URL ile özelleştirilebilir)
    if (provider === "compatible" && trimmedKey) {
        try {
            const openaiMessages = [{ role: "system", content: systemPrompt }];

            if (conversationHistory && conversationHistory.length > 0) {
                const historyItems = [...conversationHistory];
                const last = historyItems[historyItems.length - 1];
                if (last && (last.sender !== "English_Mentor" && last.sender !== "English_AI" && last.role !== "assistant" && last.role !== "model") && (last.content === userMessage || last.text === userMessage)) {
                    historyItems.pop();
                }

                for (const msg of historyItems.slice(-HISTORY_LIMIT)) {
                    let text = (msg.content || msg.text || "").replace(/\[SES:.*?\]/g, "[Sesli Mesaj]").trim();
                    if (!text) continue;
                    openaiMessages.push({
                        role: (msg.sender === "English_Mentor" || msg.sender === "English_AI" || msg.role === "assistant" || msg.role === "model") ? "assistant" : "user",
                        content: text
                    });
                }
            }
            openaiMessages.push({ role: "user", content: userMessage });

            const baseURL = (envBaseURL || "https://api.openai.com/v1").replace(/\/+$/, "");
            const targetModel = model || process.env.AI_MODEL || "gpt-4o-mini";

            const res = await fetch(`${baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${trimmedKey}`
                },
                body: JSON.stringify({
                    model: targetModel,
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
                console.error(`OpenAI/uyumlu API Hatası [${res.status}]:`, errText);
                let detail = errText;
                try {
                    const json = JSON.parse(errText);
                    detail = json.error?.message || errText;
                } catch(e) {}
                return {
                    error: true,
                    message: `⚠️ **OpenAI / OpenAI-uyumlu API Hatası (HTTP ${res.status}):**\n> *${detail}*`
                };
            }
        } catch (err) {
            console.error("OpenAI/uyumlu Bağlantı Hatası:", err.message);
            return {
                error: true,
                message: `⚠️ **OpenAI / OpenAI-uyumlu Bağlantı Hatası:**\n> *${err.message}*`
            };
        }
    }

    return null;
}

// API Anahtarı Test Fonksiyonu (Model & API modalı için)
async function testAPIKey(apiKey, model) {
    const rawKey = (apiKey || "").replace(/^[“"'`\s]+|[”"'`\s]+$/g, "").trim();
    if (!rawKey) return { success: false, message: "Lütfen bir API anahtarı girin." };

    let provider = "groq";
    if (model && model.startsWith("gemini")) {
        provider = "gemini";
    } else if (model && (model.startsWith("llama") || model.startsWith("groq"))) {
        provider = "groq";
    } else if (model && model.startsWith("openrouter")) {
        provider = "openrouter";
    } else if (rawKey.startsWith("AIza")) {
        provider = "gemini";
    } else if (rawKey.startsWith("gsk_")) {
        provider = "groq";
    }

    // Anahtar & Model Uyumsuzluğu Kontrolü
    if (provider === "gemini" && rawKey.startsWith("gsk_")) {
        return {
            success: false,
            message: `⚠️ UYUMSUZLUK: Seçtiğiniz model 'Google Gemini' fakat girdiğiniz anahtar bir Groq anahtarı ('gsk_...' ile başlıyor).\n\n💡 Modeli 'Groq Llama 3.3 / 3.1' olarak seçip tekrar test edin, veya geçerli bir Google Gemini anahtarı girin.`
        };
    }
    if (provider === "groq" && rawKey.startsWith("AIza")) {
        return {
            success: false,
            message: `⚠️ UYUMSUZLUK: Seçtiğiniz model 'Groq Llama' fakat girdiğiniz anahtar bir Google Gemini anahtarı ('AIza...' ile başlıyor).\n\n💡 Modeli 'Google Gemini' olarak seçip tekrar test edin, veya geçerli bir Groq anahtarı girin.`
        };
    }

    // 1. Groq Testi
    if (provider === "groq") {
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
                .map(m => m && m.id)
                .filter(id => id && isGroqChatModel(id));

            if (!activeModels.length) {
                return { success: false, message: "❌ Groq hesabınızda aktif bir metin modeli bulunamadı." };
            }

            // Seçili model erişilebilir değilse listeden uygun güncel modeli seç.
            const targetModel = chooseGroqModel(activeModels, model);

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
    if (provider === "gemini") {
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

    // --- İngilizce Selamlaşma & Sohbet (kullanıcı İngilizce yazmışsa İngilizce yanıt ver) ---
    if (lower.match(/^(hey|hi|hello|howdy|what's\s*up|good\s*(morning|afternoon|evening))/i) || (!isLikelyTurkish(raw) && lower.includes("how are you"))) {
        return generateContextualConversationFallback(raw, "English Mentor", false, conversationHistory);
    }

    // --- Saf İngilizce Mesaj (Kullanıcı İngilizce konuşuyorsa İNGİLİZCE devam et) ---
    if (!isLikelyTurkish(raw) && raw.length > 3) {
        return generateContextualConversationFallback(raw, "English Mentor", false, conversationHistory);
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

function getVideoCallSystemPrompt(tutorName = "Sarah", level = "auto") {
    return `[ROLE]
You are ${tutorName || "Sarah"}, a real person on a live one-on-one video call with an English learner. You are warm, quick-witted, genuinely curious, and you talk like a friend — never like a scripted teacher bot.

[STUDENT LEVEL]
${level && level !== "auto" ? `The student's level is roughly ${level}.` : "Infer the student's level from their messages and quietly match it."} Use short, simple sentences for beginners and richer, idiomatic English for advanced students.

[NON-NEGOTIABLE RULES]
1. React to the SPECIFIC detail the student just said. If they mention their job, a game, coffee, being tired, an exam, a friend, or a plan, directly reference that detail in your first sentence.
2. NEVER use canned generic teacher praise. These are BANNED:
   - "Wonderful! A good day is always worth celebrating."
   - "Your English is so good!"
   - "I love chatting with you!"
   - "Great job!" / "Well done!" as a standalone sentence.
   Also never repeat a reaction you have already used earlier in this conversation.
3. You receive the full "messages" array on every request. Use it as real memory: remember topics from 3+ turns ago and bring them back naturally ("Earlier you mentioned your job — did that deadline go okay?"). Never re-ask a question the student has already answered.
4. If the student asks about you ("what about you?", "how are you?"), answer in character with a concrete, believable detail of your own day, then return the question to them.
5. GRAMMAR: Do not interrupt the flow for every mistake. If there is a clear error, recast the correct form once, naturally inside your reply ("I agree — we usually say 'I agree' rather than 'I am agree'"). Ignore tiny article/preposition slips during a fast spoken conversation.
6. LANGUAGE: Speak natural English. Only switch to Turkish if the student explicitly asks for help in Turkish.
7. Always end with exactly ONE open-ended follow-up question that grows out of their answer and keeps the conversation moving.
8. OUTPUT FORMAT: 2 to 3 short spoken sentences, TTS-friendly. No markdown, no bullet points, no emojis, no lists, no headings.
9. Do not invent facts about the student. Only use what they actually told you in the messages.

[STYLE EXAMPLES]
Student: "I had a long day at work, lots of meetings."
Bad: "Wonderful! A good day is always worth celebrating."
Good: "Meetings all day can melt your brain — was it one of those days where the calendar never let you breathe? What was the meeting you dreaded most?"

Student: "I played a new game yesterday, it was hard."
Good: "A hard game is usually the one that hooks you, right? Which part kept catching you out — the mechanics or a specific level?"`;
}

function generateConversationalResponse(userMessage, tutorName = "Sarah", isVideoCall = false, conversationHistory = []) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();

    // ---- BAĞLAM TAKİBİ: Önceki AI mesajında ne istemişti? ----
    if (conversationHistory && conversationHistory.length > 0) {
        let lastAIMsg = "";
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            const m = conversationHistory[i];
            const sender = m.sender || m.role;
            if (sender === "English_Mentor" || sender === "English_AI" || sender === "assistant" || sender === "model") {
                lastAIMsg = m.content || m.text || "";
                break;
            }
        }

        if (lastAIMsg) {
            // 1. AI cümle kur demişti mi? ("using the word X", "write a sentence", "one sentence")
            const wordPracticeMatch = lastAIMsg.match(/using the word\s+["'*]?([a-zA-Z]+)["'*]?/i) ||
                                     lastAIMsg.match(/\bword\s+["'*\*]?([a-zA-Z]{3,})["'*\*]?/i) ||
                                     lastAIMsg.match(/write.*sentence.*["'*\*]?([a-zA-Z]{3,})["'*\*]?/i) ||
                                     lastAIMsg.match(/sentence.*["'*\*]?([a-zA-Z]{3,})["'*\*]?/i);

            const targetWord = wordPracticeMatch ? wordPracticeMatch[1].toLowerCase() : null;

            // Kullanıcı en az 3 kelime yazmışsa bu bir cümle denemesidir
            const wordCount2 = raw.trim().split(/\s+/).length;
            if (targetWord && wordCount2 >= 2 && !isLikelyTurkish(raw)) {
                const usedTarget = lower.includes(targetWord);
                // Cümleyi düzelt (büyük harf + nokta)
                let cleanSentence = raw.trim().replace(/^[a-z]/, c => c.toUpperCase());
                if (!/[.!?]$/.test(cleanSentence)) cleanSentence += ".";

                // Kullanıcının cümlesindeki potansiyel gramer sorunlarını tespit et
                let grammarNote = "";
                if (/\bit is a\s+\w+\s+system\b/i.test(raw) && usedTarget) {
                    grammarNote = `\n\n🔧 **Küçük İpucu:** "it is a malicious system it has a mock paper" → iki bağımsız cümleyi birleştirmek için "and" veya noktalama kullanabilirsin: *"It is a malicious system, and it has a ${targetWord} paper."*`;
                } else if (/\bi have \d+ years\b/i.test(raw)) {
                    grammarNote = `\n\n🔧 **Gramer Notu:** İngilizcede yaş için "have" değil **"am"** kullanılır: *"I am X years old."*`;
                }

                if (usedTarget) {
                    return isVideoCall
                        ? `That was a great sentence! You used "${targetWord}" really naturally — well done! ${grammarNote ? "One small tip:" + grammarNote.replace(/\n\n🔧 \*\*[^*]+\*\*:/,"") : "Can you think of another context where you might use this word?"}`
                        : `🎉 **Harika!** \`${targetWord}\` kelimesini çok güzel kullandın!\n\n📝 **Senin cümlen:**\n> *"${cleanSentence}"*\n\n✅ **Değerlendirme:** Cümle anlaşılır ve hedef kelimeyi doğal bir bağlamda yerleştirdin.${grammarNote}\n\n💬 Şimdi farklı bir bağlamda bu kelimeyle başka bir cümle kurmayı dener misin, yoksa yeni bir kelimeye geçelim mi?`;
                } else {
                    return isVideoCall
                        ? `Good effort on that sentence! Just a note — try to include the word "${targetWord}" next time for extra practice. Can you give it another go?`
                        : `👏 **İyi Deneme!**\n\n📝 **Senin cümlen:**\n> *"${cleanSentence}"*\n\n💡 Hedef kelimemiz **"${targetWord}"** idi ama cümlende yer vermemişsin. Bir kez daha deneyebilir misin? Bu sefer "${targetWord}" kelimesini cümleye dahil et!`;
                }
            }

            // 2. AI soru sormuştu + kullanıcı cevap verdi (en az 3 kelime)
            if (lastAIMsg.includes("?") && wordCount2 >= 3) {
                // Kullanıcı zevk/eğlence bildirdi
                if (lower.match(/\b(enjoy|fun|great|amazing|loved|awesome|good|nice|happy|happy|pleased|cool|wonderful|fantastic)\b/i)) {
                    if (isVideoCall) {
                        return `That's wonderful to hear! It sounds like a genuinely good experience. What made it so enjoyable for you?`;
                    }
                }
                // Kullanıcı zor/sıkıcı/stresli bir şey bildirdi
                if (lower.match(/\b(hard|difficult|tough|stressful|boring|tired|exhausting|frustrating|annoying|bad|terrible)\b/i)) {
                    if (isVideoCall) {
                        return `I can totally relate — that does sound challenging! How did you handle it? What would you do differently next time?`;
                    }
                }
                // Kullanıcı bir aktivite veya olay anlattı (genel)
                if (lower.match(/\b(went|did|made|had|saw|met|tried|started|finished|learned|worked|played|watched|called|talked|spoke)\b/i)) {
                    const contextReplies = isVideoCall ? [
                        `That's really interesting! And how did that go? Did it turn out the way you expected?`,
                        `I love hearing that! What was the most unexpected part of that experience?`,
                        `Sounds like quite a story! What was going through your mind at the time?`,
                        `That's cool! Did that change anything for you going forward?`
                    ] : [
                        `That's a great experience to share! 😊 How did it make you feel?\n\nAnd is that something you'd want to do again?`,
                        `Interesting! Tell me more — what was the most challenging or surprising part of that?`,
                        `I love that! 🌟 Did that experience teach you anything new about yourself or others?`
                    ];
                    return contextReplies[Math.floor(Math.random() * contextReplies.length)];
                }
            }
        }
    }

    // ---- HAL HATIR / DURUM TESPİTİ ----
    const asksAboutTutor = lower.match(/(what|how)\s+about\s+you|\band\s+you\b|how\s+are\s+you|how\s+is\s+your\s+day|how\s+was\s+your\s+day|\bhbu\b|\bwbu\b/i);
    const feelingGood = lower.match(/(feel|feeling|i'?m|am|it\s*was|today\s*was|was)\s+(good|great|fine|happy|awesome|well|fantastic|wonderful|pretty\s*good|not\s*bad|enjoying|enjoyed|fun|nice|amazing)/i) ||
                        lower.match(/^(good|great|fine|pretty\s*good|doing\s*well|all\s*good)/i) ||
                        lower.match(/\b(enjoyed|was\s*great|was\s*fun|was\s*nice|was\s*good|was\s*amazing|was\s*wonderful|was\s*enjoyable|was\s*enjoying)\b/i);
    const feelingBadOrTired = lower.match(/(feel|feeling|i'?m|am)\s+(tired|exhausted|sleepy|stressed|sick|sad|bored|bad|down|rough|drained)/i) ||
                              lower.match(/^(tired|exhausted|bored|stressed|not\s*good|bad)/i);
    const feelingBusy = lower.match(/(feel|feeling|i'?m|am|been)\s+(busy|rushed|swamped|working\s*hard)/i) || lower.includes("busy day");

    if (asksAboutTutor && feelingGood) {
        return isVideoCall
            ? `I'm feeling fantastic too, thank you so much for asking! It's so nice seeing you on camera. What fun things have you been up to today?`
            : `I'm feeling fantastic too, thank you so much for asking! 😊 Seeing you practice English with so much positive energy truly makes my day.\n\nWhat has been the most interesting part of your day so far?`;
    }

    if (asksAboutTutor && (feelingBadOrTired || feelingBusy)) {
        return isVideoCall
            ? `I'm doing well, but I completely understand being tired! Make sure you relax tonight. What kept you so busy today?`
            : `I'm doing well, thank you! But please make sure you take a little time to relax tonight. ☕ Demanding days can be draining.\n\nWhat kept you so busy or tired today?`;
    }

    if (asksAboutTutor) {
        return isVideoCall
            ? `I'm having a wonderful day, thank you for asking! I love chatting with students from around the world. How has your day been treating you?`
            : `I'm doing great, thank you for asking! 🌟 I'm always energized when we practice English together.\n\nHow has your day been going so far? Tell me a little about what you did!`;
    }

    // "it was enjoying today" ve benzeri
    if (feelingGood) {
        const goodReplies = isVideoCall ? [
            `That's so great to hear! What made today especially good for you?`,
            `Okay, I need the details — what was the best part of today?`,
            `Positive days are rare enough that they deserve a proper recap. What happened?`,
            `That's amazing. Was there one specific moment that made it click for you?`
        ] : [
            `I'm so glad to hear that! 😊 A positive mood makes speaking and practicing English feel effortless.\n\nDid anything special happen today, or are you just in high spirits?`,
            `That's wonderful! 🌟 Good days give you so much energy.\n\nWhat was the best part of your day?`
        ];
        return goodReplies[Math.floor(Math.random() * goodReplies.length)];
    }

    if (feelingBadOrTired) {
        return isVideoCall
            ? `Oh, I'm sorry you're feeling that way! Take it easy while we chat. Did you have a really long or stressful day?`
            : `I'm sorry you're feeling a bit drained! 🫂 We all have those tough days. Don't worry about making mistakes right now, just relax.\n\nDid something specific happen, or was it just a really long day?`;
    }

    if (feelingBusy) {
        return isVideoCall
            ? `Sounds like you had a very packed schedule! Working hard always pays off. What was the biggest task you had to deal with today?`
            : `Sounds like your day was really packed! 💪 Balancing a busy schedule while practicing English shows great commitment.\n\nWhat was the main task or project that kept you on your toes today?`;
    }

    // ---- TOPIC MATCHING ----
    if (lower.match(/\b(family|parents|mom|mother|dad|father|sister|brother|relative|relatives|cousin|grandma|grandpa|call(ed)?\s*(my\s*)?family|talking\s*to\s*(my\s*)?family|called\s*home)\b/i)) {
        return isVideoCall
            ? `That is so sweet! Staying in touch with your family is always so grounding and heartwarming. How is everyone doing, and did you catch up on good news?`
            : `That is so sweet! ❤️ Staying connected with your family is always so grounding and heartwarming.\n\nHow is everyone doing? Did you get to catch up on good news?`;
    }

    if (lower.match(/\b(bank|banking|bank\s*call|call(ed)?\s*(my\s*)?bank|customer\s*service|bank\s*account|credit\s*card|atm|wire\s*transfer)\b/i) ||
        (lower.match(/\b(stress|stressing|stressful|stressed|anxious|headache)\b/i) && lower.match(/\b(bank|bureaucracy|customer\s*service|support)\b/i))) {
        return isVideoCall
            ? `Dealing with banks and customer service calls can be so stressful and frustrating! Did you manage to resolve everything with them, or was it a complete headache?`
            : `Dealing with bank calls or official customer service can be so stressful and exhausting! 🏦 Bureaucracy really tests anyone's patience.\n\nDid you manage to resolve what you were calling about, or was it a headache?`;
    }

    if (lower.match(/\b(phone\s*call|made\s*a\s*call|called\s*someone|on\s*the\s*phone)\b/i)) {
        return isVideoCall
            ? `Phone calls can really shape your day! Who did you call? Was it catching up with a friend or a work call?`
            : `Phone calls can definitely take up quite a bit of energy! 📞\n\nWho did you catch up with? Was it a work-related conversation or catching up with someone close to you?`;
    }

    if (lower.match(/\b(as\s*usual|same\s*as\s*usual|same\s*old|nothing\s*special|just\s*a\s*regular\s*day|normal\s*day|routine)\b/i)) {
        return isVideoCall
            ? `Sometimes a calm, routine day is the most peaceful kind of day! Did you get to relax at all today, or was it mostly routine tasks?`
            : `Sometimes a calm, routine day is the most peaceful kind of day! ☕ No stress, just steady flow.\n\nDid you get some downtime to relax, or did everyday tasks keep you busy?`;
    }

    if (lower.match(/\b(shy|shyness|nervous|afraid|fear|hesitant|embarrassed|handle\s*that|scared|speak\s*to\s*people|talking\s*to\s*you|confidence|introvert)\b/i)) {
        return isVideoCall
            ? `I completely understand! Feeling shy when speaking English is so common, but taking the step to talk here on camera takes real courage. This is a 100% judgment-free space. You are doing fantastic! How does it feel talking with me so far?`
            : `It takes genuine courage to practice when you feel shy! 🌟 Most language learners experience speaking anxiety, so you're not alone at all. Practicing one-on-one here is the absolute best way to build confidence with zero pressure.\n\nHow do you feel right now? Are you starting to feel a little more relaxed?`;
    }

    if (lower.match(/\b(work|office|job|boss|colleague|colleagues|meeting|client|shift)\b/i)) {
        return isVideoCall
            ? `Work can definitely be demanding! Did you finish everything you wanted to get done at work today?`
            : `Work can definitely take a lot out of you! 💼 But it's great that you're investing in your English skills after hours.\n\nDid you have a productive day, or was it mostly routine meetings and tasks?`;
    }

    if (lower.match(/\b(school|university|college|class|classes|lecture|homework|study|studying|exam|exams|test)\b/i)) {
        return isVideoCall
            ? `School and studying can be intense! What subject or topic were you focusing on the most today?`
            : `Balancing classes and studying takes real dedication! 📚\n\nWhat subject did you spend the most time on today? Do you feel prepared for upcoming exams?`;
    }

    if (lower.match(/\b(code|coding|program|programming|developer|software|python|javascript|bug|bugs|ai|model|dataset)\b/i)) {
        return isVideoCall
            ? `That's awesome! Coding is such a rewarding skill. What kind of project or problem were you working on?`
            : `That's fantastic! 💻 Software development and technology are such exciting fields.\n\nWere you building a new feature, hunting down a bug, or experimenting with something new? Tell me about it!`;
    }

    if (lower.match(/\b(gym|workout|working\s*out|exercise|fitness|running|ran|walk|walking|football|sports)\b/i)) {
        return isVideoCall
            ? `Good for you! Getting some exercise in is the best way to clear your head. Did you have an intense workout session?`
            : `That's awesome! 🏋️ Staying active is so good for both your body and mental clarity.\n\nWhat kind of workout did you do today? Do you go to the gym regularly?`;
    }

    if (lower.match(/\b(eat|ate|eating|food|lunch|dinner|breakfast|coffee|cook|cooked|cooking|pizza|burger|restaurant)\b/i)) {
        return isVideoCall
            ? `Yum, that sounds delicious! Good food always makes any day ten times better. What did you eat or drink?`
            : `Yum, that sounds delicious! 🍕 Good food or a hot cup of coffee is the best treat after a long day.\n\nWhat did you have? Are you someone who enjoys cooking or do you prefer ordering out?`;
    }

    if (lower.match(/\b(enjoy|enjoyed|enjoying|enjoyable|had\s*fun|great\s*day|good\s*day|nice\s*day|loved\s*it|wonderful\s*day)\b/i)) {
        const enjoyReplies = isVideoCall ? [
            `That's amazing! What made today so enjoyable for you?`,
            `I'm so glad to hear that! What was the highlight of your day?`,
            `Wonderful! Sounds like you had a genuinely great time. What was your favourite part?`
        ] : [
            `I'm so glad to hear you had an enjoyable day! 😊 Having positive experiences gives you the best energy to speak English.\n\nWhat was the most fun or memorable thing you did today?`
        ];
        return enjoyReplies[Math.floor(Math.random() * enjoyReplies.length)];
    }

    if (lower.match(/\b(movie|movies|film|series|netflix|watch|watching|game|gaming|played|music|book|books|reading|relax|chilling)\b/i)) {
        return isVideoCall
            ? `That sounds like a great way to unwind! What were you watching or playing? I'd love a good recommendation!`
            : `That sounds like a wonderful way to unwind and recharge! 🎬\n\nWhat were you watching, reading, or playing? Would you recommend it?`;
    }

    if (lower.match(/\b(went\s*out|hangout|hanging\s*out|friends|friend|shopping|mall|park|party)\b/i)) {
        return isVideoCall
            ? `That sounds so nice! Spending quality time outside or with people you care about is always refreshing. What did you guys do?`
            : `That sounds so refreshing! ✨ Quality time with friends or outside is always great for the soul.\n\nWhere did you go, and what was the highlight of your outing?`;
    }

    // ---- KISA CÜMLE / TEK KELİME YANITI ----
    const wordCount = raw.trim().split(/\s+/).length;
    if (wordCount <= 4 && lower.match(/^(yes|yeah|yep|sure|definitely|of\s*course|absolutely|i\s*do|i\s*did)\b/i)) {
        return isVideoCall
            ? `Nice! Could you tell me a little bit more about that? What makes you say so?`
            : `Awesome! 👍 Tell me a little bit more about that — why do you say so? I'd love to hear your thoughts in English!`;
    }

    if (wordCount <= 4 && lower.match(/^(no|nope|not\s*really|nah|i\s*don'?t|i\s*didn'?t)\b/i)) {
        return isVideoCall
            ? `Fair enough! Why not? What would you prefer instead?`
            : `Fair enough! 😊 Why do you think that is? What would you prefer instead?`;
    }

    if (wordCount <= 4 && lower.match(/^(nothing|not\s*much|nothing\s*much|idk|i\s*don'?t\s*know)\b/i)) {
        return isVideoCall
            ? `No worries at all! Let's talk about something fun — if you could travel anywhere tomorrow, where would you go?`
            : `No worries at all! Sometimes quiet moments are the best. 🌍\n\nLet's talk about something fun — if you could teleport to any city in the world right now, where would you go?`;
    }

    // ---- GENİŞ TOPIC DETECTION: kullanıcı aktif bir şey yaptığını/olduğunu söylüyor ----
    if (!isLikelyTurkish(raw) && wordCount >= 3) {
        // Geçmiş zaman fiilleri + genel anlatı
        if (lower.match(/\b(went|did|made|had|saw|met|tried|started|finished|learned|worked|played|watched|called|talked|spoke|bought|visited|felt|thought|realized)\b/i)) {
            const activityReplies = isVideoCall ? [
                `That's really interesting! And how did it go? Did it turn out the way you expected?`,
                `I love that! What was the most memorable part of that for you?`,
                `Sounds like a full day! What was the highlight of that experience?`,
                `Wow, tell me more! How did you feel about it afterwards?`,
                `That's cool! Did anything unexpected happen during that?`
            ] : [
                `That's a great experience to share! 😊 How did it make you feel?\n\nAnd is that something you'd want to do again?`,
                `Interesting story! What was the most challenging or surprising part of that?`,
                `I love hearing that! 🌟 Did that experience teach you something new?`
            ];
            return activityReplies[Math.floor(Math.random() * activityReplies.length)];
        }

        // Şu an devam eden durum
        if (lower.match(/\b(am|is|are|been|have\s*been|was|were)\b/i) && lower.match(/\b(doing|working|studying|reading|watching|learning|trying|thinking|feeling|going)\b/i)) {
            const ongoingReplies = isVideoCall ? [
                `That sounds great! How is it going so far? Are you enjoying it?`,
                `Nice! How long have you been doing that? Is it something you enjoy?`,
                `That's cool! What are your thoughts on it so far?`
            ] : [
                `That's exciting! 😊 How is it going so far?\n\nWhat do you enjoy most about it?`,
                `Sounds interesting! 🌟 How long have you been at this?\n\nIs it something you'd recommend?`
            ];
            return ongoingReplies[Math.floor(Math.random() * ongoingReplies.length)];
        }
    }

    // ---- SON ÇARE: Çeşitli dinamik yanıtlar ----
    const dynamicVideoReplies = [
        `That's really interesting! What would you say was the best part of that for you?`,
        `I love hearing about your experiences! What happened next?`,
        `That sounds like quite a story! How did you feel about it?`,
        `Wow, tell me more! What was going through your mind at that moment?`,
        `That's fascinating! Did it turn out the way you expected?`,
        `I appreciate you sharing that! Would you do it again if you had the chance?`,
        `Great point! How has that experience shaped the way you see things now?`
    ];

    const dynamicChatReplies = [
        `I really love chatting with you about this! 🌟 You're expressing yourself with great clarity.\n\nCould you tell me a little bit more about what that was like?`,
        `That sounds like a memorable moment! ✨ Learning a language is all about connecting through real stories like this.\n\nWhat was the highlight of that experience for you?`,
        `That really catches my attention! 😊 You're making real progress in putting your thoughts into English.\n\nHow did that turn out in the end?`,
        `That's wonderful to hear! 💬 I'm really enjoying our practice session today.\n\nWhat other interesting things have you been up to recently?`,
        `Your English is coming along really nicely! 🌟 I can see you're more comfortable expressing yourself.\n\nTell me — if you could change one thing about that experience, what would it be?`
    ];

    return isVideoCall
        ? dynamicVideoReplies[Math.floor(Math.random() * dynamicVideoReplies.length)]
        : dynamicChatReplies[Math.floor(Math.random() * dynamicChatReplies.length)];
}

// =============================================
// 8b. GEÇMİŞİ HATIRLAYAN, DETAYA TEPKİ VEREN YEDEK MOTOR
// =============================================

const FALLBACK_STOPWORDS = new Set([
    "the", "and", "but", "for", "with", "that", "this", "have", "has", "had", "was", "were",
    "you", "your", "yours", "i'm", "im", "it's", "its", "isn't", "wasn't", "don't", "didn't",
    "not", "very", "just", "really", "about", "from", "today", "yesterday", "tomorrow", "now",
    "then", "there", "here", "what", "when", "where", "how", "why", "who", "because", "like",
    "lot", "lots", "some", "any", "all", "also", "too", "more", "most", "been", "being", "get",
    "got", "going", "went", "did", "does", "doing", "one", "two", "day", "days", "time", "thing",
    "things", "something", "anything", "well", "good", "bad", "okay", "ok", "yeah", "yes", "no"
]);

const CONVERSATION_TOPIC_RULES = [
    {
        key: "tired",
        re: /\b(tired|exhausted|drained|sleepy|wiped out|long day|stressful|stressed|overwhelmed|busy day)\b/i,
        lines: [
            "You sound properly wiped out — was it {detail} that did it, or just one of those non-stop days?",
            "Being {detail} makes even small things feel heavy. What's one thing that would make tonight easier?",
            "I can hear the tiredness in that. Was it work, people, or just too much happening at once?"
        ]
    },
    {
        key: "work",
        re: /\b(work|office|job|boss|manager|meeting|meetings|client|clients|shift|deadline|project|colleagues?)\b/i,
        lines: [
            "You mentioned {detail} — was it the kind of day that followed you home?",
            "So {detail} kept you busy today. What was the most annoying part of it?",
            "{detail} can swallow a whole day, can't it? What actually went well?"
        ]
    },
    {
        key: "game",
        re: /\b(game|gaming|played|playing|playstation|xbox|chess|football|match|level|boss fight)\b/i,
        lines: [
            "{detail} sounds like a good way to switch off — did you win, or was it one of those frustrating sessions?",
            "A session of {detail} can eat hours before you notice. What was the best moment?",
            "I'm curious about {detail} — what made you pick it up today?"
        ]
    },
    {
        key: "food",
        re: /\b(coffee|tea|breakfast|lunch|dinner|food|pizza|burger|cook|cooked|cooking|restaurant|cafe)\b/i,
        lines: [
            "{detail} is such a small thing, but it can genuinely turn a day around. Was it as good as it sounds?",
            "You had {detail} — comfort food or just convenience? What else did your day look like?",
            "Now I'm hungry. What made the {detail} part of your day stand out?"
        ]
    },
    {
        key: "family",
        re: /\b(family|mom|mother|mum|dad|father|parents|sister|brother|cousin|grandma|grandpa|relatives?)\b/i,
        lines: [
            "It's lovely that {detail} came up today — what did you talk about?",
            "Time with {detail} always stirs something up. How did everyone seem?",
            "You mentioned {detail} — was it a happy catch-up or a complicated one?"
        ]
    },
    {
        key: "study",
        re: /\b(study|studying|school|university|college|class|classes|lecture|homework|exam|exams|test|assignment)\b/i,
        lines: [
            "{detail} can eat up an entire afternoon. Do you feel like it's starting to click?",
            "So {detail} was the main event today — which part was hardest?",
            "I'm curious how the {detail} went. Did you get through what you planned?"
        ]
    },
    {
        key: "media",
        re: /\b(movie|movies|film|series|netflix|watch|watched|watching|book|books|read|reading)\b/i,
        lines: [
            "{detail} — okay, I need your honest verdict. Was it actually good?",
            "You spent some time with {detail}; did it live up to the hype?",
            "I love hearing what people are watching or reading. What was the best bit of {detail}?"
        ]
    },
    {
        key: "fitness",
        re: /\b(gym|workout|working out|exercise|fitness|running|ran|walk|walked|walking|football|sports|training)\b/i,
        lines: [
            "{detail} is a solid way to clear your head. Did you push hard today or keep it easy?",
            "Nice — {detail} always changes the mood of a day. How did your body feel afterwards?",
            "I'm curious about the {detail}. Was it a planned session or a spontaneous one?"
        ]
    },
    {
        key: "social",
        re: /\b(friend|friends|hangout|hanging out|party|weekend|travel|trip|shopping|mall|park)\b/i,
        lines: [
            "Time with {detail} sounds like exactly what you needed. What did you get up to?",
            "You mentioned {detail} — was it a relaxed hangout or something more chaotic?",
            "{detail} always leaves me with stories. What was the funniest moment?"
        ]
    }
];

const GENERIC_CONTEXT_LINES = [
    "You mentioned {detail} — I'm curious, what was the most interesting part of that?",
    "So {detail} was part of your day. How did you feel about it afterwards?",
    "I'm still thinking about your point about {detail}. What made it stand out?",
    "That's a detail I want to hear more about — what happened with {detail}?",
    "Okay, you've got my attention with {detail}. What was going through your mind?"
];

function hashString(value) {
    let hash = 0;
    const str = String(value || "");
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function isUserHistoryItem(msg) {
    const sender = msg && (msg.sender || msg.role);
    return !(sender === "English_Mentor" || sender === "English_AI" || sender === "assistant" || sender === "model");
}

function getLastAssistantText(history) {
    if (!Array.isArray(history)) return "";
    for (let i = history.length - 1; i >= 0; i--) {
        const sender = history[i] && (history[i].sender || history[i].role);
        if (sender === "English_Mentor" || sender === "English_AI" || sender === "assistant" || sender === "model") {
            return String(history[i].content || history[i].text || "");
        }
    }
    return "";
}

function pickSalientDetail(text) {
    const words = String(text || "").toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
    const meaningful = words.filter(function (word) { return !FALLBACK_STOPWORDS.has(word); });
    return meaningful.length ? meaningful[meaningful.length - 1] : "that";
}

function findEarlierTopic(history, currentMessage) {
    if (!Array.isArray(history)) return "";
    const current = String(currentMessage || "").toLowerCase();
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!isUserHistoryItem(msg)) continue;
        const text = String(msg.content || msg.text || "");
        if (!text || text === currentMessage) continue;
        for (const rule of CONVERSATION_TOPIC_RULES) {
            const match = text.match(rule.re);
            if (!match) continue;
            const detail = match[0].toLowerCase();
            if (!current.includes(detail)) return detail;
        }
    }
    return "";
}

function gentleGrammarRecast(text) {
    const raw = String(text || "");
    if (/\bi\s+am\s+agree\b/i.test(raw)) return 'Small note: we usually say "I agree", not "I am agree".';
    if (/\bi\s+have\s+\d+\s+years?\s+old\b/i.test(raw)) return 'Tiny note: for age, say "I\'m 25 years old", not "I have 25 years".';
    if (/\b(he|she|it)\s+go\b/i.test(raw) && !/\bgoes\b/i.test(raw)) return 'Quick tip: with he, she and it we say "goes".';
    if (/\byesterday\s+i\s+(go|see|eat|have|do)\b/i.test(raw)) return 'Small past-tense tip: "yesterday I went / saw / ate / had".';
    if (/\bi\s+very\s+(like|love)\b/i.test(raw)) return 'A natural alternative is "I really like..." instead of "I very like...".';
    return "";
}

/**
 * LLM yokken bile önceki mesajları hatırlayan, kullanıcının son mesajındaki
 * somut detaya atıfta bulunan ve tekrar etmeyen yedek konuşma üreticisi.
 */
function generateContextualConversationFallback(userMessage, tutorName = "Sarah", isVideoCall = false, conversationHistory = []) {
    const raw = String(userMessage || "").trim();
    const lower = raw.toLowerCase();
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    if (!raw) {
        return isVideoCall
            ? "I'm still here — take your time. What's been on your mind today?"
            : "I'm still here! 😊 What would you like to talk about?";
    }

    // Selamlaşma — ilk turda kalıp olmayan, kişisel bir açılış
    if (/^(hello|hi|hey|good\s*(morning|afternoon|evening)|howdy)\b/i.test(raw.trim())) {
        const greetings = isVideoCall ? [
            "Hey! Good to see you. What's been going on in your world today?",
            "Hi there! I'm glad you're here. What's one thing that happened today, good or bad?",
            "Hey! I've been looking forward to our chat. What's on your mind?"
        ] : [
            "Hey! 😊 Good to see you. What's been going on today?",
            "Hi! I'm glad you're here. Tell me one thing about your day — anything at all.",
            "Hey there! What's on your mind right now?"
        ];
        return greetings[hashString(raw) % greetings.length];
    }

    // "What about you?" / "How are you?" — kendi gününden somut bir detay ver
    if (/\b(what|how)\s+about\s+you\b|\band\s+you\b|how\s+are\s+you|how\s+is\s+your\s+day|how\s+was\s+your\s+day|\bwbu\b|\bhbu\b/i.test(raw)) {
        const replies = isVideoCall ? [
            "I'm doing well, thanks for asking — I spilled coffee on my notes earlier, so it's been that kind of morning. What about yours?",
            "Pretty good! I've been catching up on emails and dreaming about lunch, honestly. How has your day been treating you?",
            "I'm good, a little caffeinated and very curious about your day. What have you been up to?"
        ] : [
            "I'm doing well, thank you! 😊 I've been reading and answering questions all morning, which I genuinely enjoy. How has your day been?",
            "Pretty good on my side — busy, but the interesting kind of busy. What about you? What's been happening today?"
        ];
        return replies[hashString(raw) % replies.length];
    }

    // Kısa onay/ret cevaplarında konuşmayı aç
    if (/^(yes|yeah|yep|sure|of\s*course|absolutely|no|nope|not\s*really|nah|nothing|not\s*much|idk|i\s*don'?t\s*know)\b/i.test(raw.trim()) && raw.trim().split(/\s+/).length <= 4) {
        const shortReplies = [
            "Fair enough — give me a little more than that. What's behind your answer?",
            "Okay, now I'm curious. What made you say that?",
            "I get that. Tell me one detail about it — anything that stood out?"
        ];
        return shortReplies[hashString(raw) % shortReplies.length];
    }

    // Duygu durumuna doğrudan tepki
    if (/\b(i'?m|i\s*am|feeling|today\s*was|day\s*was)\s+(good|great|fine|amazing|awesome|wonderful|nice|happy|not\s*bad)\b/i.test(raw) || /^(good|great|fine|pretty\s*good|all\s*good)\b/i.test(raw.trim())) {
        const goodDayReplies = [
            "That sounds like a win — what made it land so well?",
            "Good days deserve a proper breakdown. What was the best moment?",
            "I'm glad to hear that. Was it one specific thing, or just the overall mood?"
        ];
        return goodDayReplies[hashString(raw) % goodDayReplies.length];
    }

    if (/\b(i'?m|i\s*am|feeling)\s+(bad|sad|down|awful|terrible|rough|lonely)\b/i.test(raw)) {
        const badDayReplies = [
            "That sounds heavy — do you want to talk about what happened, or would a distraction help more?",
            "I'm sorry it's been like that. Was there one thing that made it worse, or was it everything at once?",
            "That's a lot to carry. What would make the rest of today a little easier?"
        ];
        return badDayReplies[hashString(raw) % badDayReplies.length];
    }

    let rule = null;
    let detail = "";
    for (const candidate of CONVERSATION_TOPIC_RULES) {
        const match = raw.match(candidate.re);
        if (match) {
            rule = candidate;
            detail = match[0].toLowerCase();
            break;
        }
    }
    if (!detail) detail = pickSalientDetail(raw);

    const earlierTopic = findEarlierTopic(history, raw);
    const correction = gentleGrammarRecast(raw);
    const lines = rule ? rule.lines : GENERIC_CONTEXT_LINES;
    const seed = hashString(raw + "|" + history.length + "|" + (rule ? rule.key : "generic")) % lines.length;

    let main = lines[seed].replace(/\{detail\}/g, detail);
    const lastAssistant = getLastAssistantText(history);
    if (lastAssistant && main.trim() === lastAssistant.trim()) {
        main = lines[(seed + 1) % lines.length].replace(/\{detail\}/g, detail);
    }

    const parts = [main];
    if (correction) parts.push(correction);

    const userTurnCount = history.filter(isUserHistoryItem).length;
    if (earlierTopic && earlierTopic !== detail && (userTurnCount >= 2 || !rule) && (seed % 3 === 0 || !rule)) {
        parts.push(`Earlier you mentioned ${earlierTopic} — did that end up going the way you hoped?`);
    }

    let text = parts.join(" ");
    let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (!sentences.join(" ").includes("?")) {
        sentences.push(isVideoCall ? "What happened next?" : "What happened next? 😊");
    }
    return sentences.slice(0, 3).join(" ").trim();
}

async function callVideoCallAI(userMessage, apiKey, model, tutorName = "Sarah", conversationHistory = [], level = "auto") {
    const prompt = getVideoCallSystemPrompt(tutorName, level);
    return await callExternalAI(
        userMessage,
        apiKey,
        model,
        "video_call_tutor",
        level || "conversational",
        conversationHistory,
        prompt
    );
}

function generateVideoCallFallback(userMessage, tutorName = "Sarah", conversationHistory = []) {
    const raw = (userMessage || "").trim();
    const lower = raw.toLowerCase();
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const priorUserTurns = history.filter(isUserHistoryItem).length;

    // İlk turda kişiselleştirilmiş, kalıp olmayan karşılama
    if (priorUserTurns === 0 && lower.match(/^(hello|hi|hey|good\s*(morning|afternoon|evening)|howdy)\b/i)) {
        const openers = [
            `Hey, it's great to see you on camera! I'm curious — what kind of day are you having so far?`,
            `Hi! Good to finally put a face to the conversation. What's been the main event of your day?`,
            `Hey there! I've got my coffee and I'm ready to chat. What have you been up to today?`
        ];
        return openers[hashString(raw) % openers.length];
    }

    // Geçmişi ve son mesajdaki detayı kullanan akıllı yedek motor
    return generateContextualConversationFallback(raw, tutorName, true, history);
}

module.exports = {
    resolveAIConfig,
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
