/**
 * WhatsApp AI Bot - Single File Version
 * Author: Khaled Saqer / Lahdod.com
 */

require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'running', bot: 'Lingua Coffee WhatsApp Bot', version: '2.0.0' });
});

// ─── Webhook Verification ──────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verification request received');
    console.log('Mode:', mode, '| Token:', token);

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed! Expected:', process.env.WEBHOOK_VERIFY_TOKEN);
        res.sendStatus(403);
    }
});

// ─── Receive Messages ──────────────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
    res.sendStatus(200);

    try {
        const body     = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        const message  = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message) return;

        const from = message.from;
        const type = message.type;

        console.log(`📩 Message from: ${from} | Type: ${type}`);

        if (type !== 'text') {
            await sendMessage(from, 'عذراً، أستطيع الرد على الرسائل النصية فقط حالياً 😊');
            return;
        }

        const userText = message.text.body;
        console.log(`💬 User: ${userText}`);

        const reply = await generateReply(userText);
        console.log(`🤖 Bot: ${reply}`);

        await sendMessage(from, reply);

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
});

// ─── Gemini AI ─────────────────────────────────────────────────────────────────
async function generateReply(userMessage) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = `أنت مساعد ذكي لشركة Lingua Coffee المتخصصة في ركن القهوة.

معلومات الشركة:
- الموقع: https://linguacoffee.com/
- المقر: أبوظبي – المصفح الصناعية M17
- أوقات التواصل: 10 صباحاً - 8 مساءً (بتوقيت الإمارات)
- واتساب: 00971552399048

المنتج الرئيسي: ركن القهوة (Coffee Corner)
- مدة التنفيذ: 25-35 يوم عمل
- مواد: خشب فاخر مقاوم للماء
- لا يحتاج صرف صحي، فقط نقطة كهرباء
- شحن مجاني لدول مجلس التعاون الخليجي
- داخل الإمارات: نفس اليوم
- السعودية/الكويت/قطر/البحرين/عُمان: 10-15 يوم
- الدفع عبر Stripe (لا Tabby/Tamara)

تعليمات:
- أجب باللغة العربية دائماً
- كن ودياً ومختصراً
- لأسئلة الأسعار والتفاصيل، وجّه العميل لـ: https://linguacoffee.com/costs/coffee-corner-store/
- للتواصل المباشر: 00971552399048`;

        const result = await model.generateContent(`${systemPrompt}\n\nالعميل: ${userMessage}\nالمساعد:`);
        return result.response.text().trim();

    } catch (err) {
        console.error('❌ Gemini error:', err.message);
        return 'عذراً، حدث خطأ مؤقت. يرجى التواصل معنا على واتساب: 00971552399048';
    }
}

// ─── Send WhatsApp Message ──────────────────────────────────────────────────────
async function sendMessage(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ Message sent to ${to}`);
    } catch (err) {
        console.error('❌ Send error:', err.response?.data || err.message);
    }
}

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ WhatsApp AI Bot running on port ${PORT}`);
    console.log(`🔗 Webhook: /webhook`);
    console.log(`🔑 Verify Token: ${process.env.WEBHOOK_VERIFY_TOKEN}`);
});
