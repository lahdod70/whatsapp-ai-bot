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
- تخزين عملي لمست
