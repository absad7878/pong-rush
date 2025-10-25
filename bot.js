import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const gameUrl = process.env.WEBAPP_URL;

  bot.sendMessage(chatId, "🎮 Welcome to Pong Rush!\nTap below to start your match.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Play Now 🏓", web_app: { url: gameUrl } }]
      ]
    }
  });
});

console.log("✅ Telegram bot is running...");
