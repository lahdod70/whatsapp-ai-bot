/**
 * WhatsApp AI Bot - Lingua Coffee
 * Powered by Meta WhatsApp Cloud API + Google Gemini AI
 * Author: Lahdod / Khaled Saqer
 */

const express = require('express');
const axios   = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  PORT             : process.env.PORT || 8080,
  VERIFY_TOKEN     : process.env.WEBHOOK_VERIFY_TOKEN || process.env.VERIFY_TOKEN || 'lahdod_webhook_2024',
  WA_TOKEN         : process.env.WHATSAPP_ACCESS_TOKEN || process.env.WA_TOKEN,
  PHONE_NUMBER_ID  : process.env.PHONE_NUMBER_ID,
  GEMINI_API_KEY   : process.env.GEMINI_API_KEY,
};

// ─── Gemini Setup ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const KNOWLEDGE_BASE = `
أنت مساعد ذكي لشركة "لغة القهوة | Lingua Coffee" — متخصصون في تأسيس مشاريع المقاهي وأركان القهوة.

== معلومات الشركة ==
- الموقع: https://linguacoffee.com/
- المقر: أبوظبي – المصفح الصناعية M17
- أوقات التواصل: 10:00 ص – 8:00 م (بتوقيت الإمارات)
- واتساب/اتصال مباشر: 00971552399048 (أ. خالد صقر)

== الخدمات ==
1. دراسة تكاليف المقهى (خطوتك الأولى للتأسيس)
2. تصميم العلامة التجارية للمقهى
3. كوفي كورنر "Coffee Corner" — الأكثر مبيعاً ⭐
4. تصميم ديكور المقهى
5. تصميم كشك خارجي

== ركن القهوة (Coffee Corner) ==
- المتجر الكامل (موديلات/مقاسات/أسعار): https://linguacoffee.com/costs/coffee-corner-store/
- مدة التنفيذ: 25 إلى 35 يوم
- المواد: خشب فاخر مقاوم للماء والرطوبة
- إضاءة مدمجة لتعزيز الجمالية
- تخزين عملي لمستلزمات القهوة (ما عدا موديل "المعلّق")
- يأتي قطعة واحدة، لا يحتاج فك وتركيب
- لا يحتاج صرف صحي — نقطة كهرباء فقط

== الشحن ==
- مجاني لكل دول مجلس التعاون الخليجي 🚚
- 10–15 يوم للسعودية/الكويت/قطر/البحرين/عُمان
- داخل الإمارات: توصيل بنفس اليوم بعد التنفيذ

== الدفع ==
- دفعتان مرنتان + بوابة Stripe آمنة
- لا يتوفر Tabby أو Tamara حالياً

== نطاق الخدمة ==
- متاح الآن: الإمارات + دول مجلس التعاون الخليجي
- قريباً: العراق، الأردن، سوريا، مصر، تركيا

== قواعد الرد ==
- تحدث دائماً بالعربية بأسلوب ودي ومحترف
- الردود مختصرة وواضحة (لا تتجاوز 200 كلمة)
- إذا سأل عن سعر محدد وجّهه للمتجر: https://linguacoffee.com/costs/coffee-corner-store/
- إذا أراد التواصل المباشر: 00971552399048
- لا تخترع معلومات غير موجودة في هذه القاعدة
- أضف إيموجي مناسب لكل رد
`;

// ─── Conversation History (in-memory per session) ─────────────────────────────
const sessions = new Map();

/**
 * Get or create chat session for a user.
 * @param {string} userId
 * @returns {import('@google/generative-ai').ChatSession}
 */
function getSession(userId) {
  if (!sessions.has(userId)) {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: KNOWLEDGE_BASE }],
        },
        {
          role: 'model',
          parts: [{ text: 'تم. أنا جاهز للرد على استفسارات عملاء لغة القهوة بشكل احترافي.' }],
        },
      ],
    });
    sessions.set(userId, chat);

    // Auto-clear session after 30 minutes of inactivity
    setTimeout(() => sessions.delete(userId), 30 * 60 * 1000);
  }
  return sessions.get(userId);
}

/**
 * Send a WhatsApp text message.
 * @param {string} to   - Recipient phone number
 * @param {string} text - Message content
 */
async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`;
  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${CONFIG.WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Get AI reply from Gemini.
 * @param {string} userId  - WhatsApp sender ID
 * @param {string} message - Incoming message text
 * @returns {Promise<string>}
 */
async function getAIReply(userId, message) {
  const chat   = getSession(userId);
  const result = await chat.sendMessage(message);
  return result.response.text();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.send('✅ WhatsApp AI Bot running on port ' + CONFIG.PORT);
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`🔑 Verify Token: ${CONFIG.VERIFY_TOKEN}`);

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.error('❌ Webhook verification failed');
  return res.sendStatus(403);
});

// Webhook incoming messages (POST)
app.post('/webhook', async (req, res) => {
  // Always respond 200 immediately to Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    // Only handle text messages
    if (message.type !== 'text') {
      await sendWhatsAppMessage(
        message.from,
        'عذراً، أستطيع التعامل مع الرسائل النصية فقط حالياً 😊'
      );
      return;
    }

    const senderId    = message.from;
    const messageText = message.text.body.trim();

    console.log(`📩 Message from ${senderId}: ${messageText}`);

    // Get AI reply
    const reply = await getAIReply(senderId, messageText);
    await sendWhatsAppMessage(senderId, reply);

    console.log(`📤 Replied to ${senderId}: ${reply.substring(0, 80)}...`);

  } catch (error) {
    console.error('❌ Error processing message:', error.message);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(CONFIG.PORT, () => {
  console.log(`✅ WhatsApp AI Bot running on port ${CONFIG.PORT}`);
  console.log(`🔗 Webhook: /webhook`);
  console.log(`🔑 Verify Token: ${CONFIG.VERIFY_TOKEN}`);
});
