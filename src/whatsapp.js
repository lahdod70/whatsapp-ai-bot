const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

async function sendMessage(to, text) {
    try {
        await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ Message sent to ${to}`);
    } catch (error) {
        console.error('❌ Failed to send message:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { sendMessage };
