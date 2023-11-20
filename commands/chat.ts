//@ts-ignore
import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { Context } from "grammy";
let responseError = "You talk too fast. Please say it again!";
bot.command("chat", async (ctx: Context) => {
	const msg = ctx.update.message;
	const msgId = msg?.message_id;
	const chatId = msg?.chat.id;
	if (!msgId || !chatId) return;
    ctx.reply("Please ask me a few questions!");
});
