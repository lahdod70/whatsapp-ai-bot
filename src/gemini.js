const { GoogleGenerativeAI } = require('@google/generative-ai');
const knowledge = require('./knowledge.json');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildSystemPrompt() {
    const kb = knowledge;
    return `أنت مساعد ذكي لـ "${kb.business_name}".

معلومات العمل:
${kb.business_description}

المنتجات والخدمات:
${kb.products.map(p => `- ${p.name}: ${p.description} | السعر: ${p.price}`).join('\n')}

سياسات مهمة:
${kb.policies.map(p => `- ${p}`).join('\n')}

معلومات التواصل:
${Object.entries(kb.contact).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

تعليمات:
- رد دائماً باللغة العربية
- كن مختصراً وودوداً
- إذا لم تعرف الإجابة قل "سأحيلك لفريق الدعم"
- لا تخترع معلومات غير موجودة في قاعدة المعرفة`;
}

async function generateReply(userMessage) {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: buildSystemPrompt()
        });
        const result = await model.generateContent(userMessage);
        return result.response.text() || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.';
    } catch (error) {
        console.error('❌ Gemini error:', error.message);
        return 'عذراً، الخدمة غير متاحة حالياً. تواصل معنا مباشرة.';
    }
}

module.exports = { generateReply };
