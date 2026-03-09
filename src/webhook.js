/**
 * Webhook Handler
 * Handles incoming WhatsApp messages and verification
 */

const express = require('express');
const router = express.Router();
const { generateReply } = require('./gemini');
const { sendMessage } = require('./whatsapp');

// Verify webhook (Meta requirement)
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.sendStatus(403);
    }
});

// Receive messages
router.post('/', async (req, res) => {
    res.sendStatus(200);

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message) return;

        const from = message.from;
        const messageType = message.type;

        if (messageType !== 'text') {
            await sendMessage(from, 'عذراً، أستطيع الرد على الرسائل النصية فقط. 😊');
            return;
        }

        const userText = message.text.body;
        const reply = await generateReply(userText);
        await sendMessage(from, reply);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
});

module.exports = router;
