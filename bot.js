import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN not found in .env file! Add it and restart.");
  process.exit(1);
}

console.log("🔑 Bot token loaded (first 10 chars):", token.substring(0, 10) + "...");

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Starting polling...");

bot.on("polling_error", (error) => {
  console.error("🚨 Polling error:", error.code ? `${error.code}: ${error.message}` : error);
  // Don't crash on errors—keep polling
});

bot.on("message", (msg) => {
  console.log("📨 Incoming message:", msg.text || "Non-text message (e.g., sticker/photo)");
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`👋 /start received from chat ${chatId}`);
  
  const gameUrl = process.env.WEBAPP_URL;
  if (!gameUrl) {
    console.error("❌ WEBAPP_URL not found in .env file!");
    bot.sendMessage(chatId, "⚠️ Game URL not configured. Contact admin.");
    return;
  }

  bot.sendMessage(chatId, "🎮 Welcome to Pong Rush!\nTap below to start your match.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Play Now 🏓", web_app: { url: gameUrl } }]
      ]
    }
  }).then(() => {
    console.log(`✅ Sent welcome message to ${chatId}`);
  }).catch((err) => {
    console.error("❌ Error sending message:", err.message);
  });
});

console.log("✅ Telegram bot is running and listening...");