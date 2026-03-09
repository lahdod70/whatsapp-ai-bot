/**
 * WhatsApp AI Bot - Main Server
 * Built with Node.js + Express + Gemini AI
 * Author: Khaled Saqer / Lahdod.com
 */

require('dotenv').config();
const express = require('express');
const webhookRouter = require('./src/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        bot: 'WhatsApp AI Bot',
        version: '1.0.0'
    });
});

// Webhook routes
app.use('/webhook', webhookRouter);

// Start server
app.listen(PORT, () => {
    console.log(`✅ WhatsApp AI Bot running on port ${PORT}`);
});
