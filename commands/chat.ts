//@ts-ignore
import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { Context } from "grammy";
let responseError = "You talk too fast. Please say it again!";
bot.command("help", async (ctx: Context) => {
	const msg = ctx.update.message;
	const msgId = msg?.message_id;
	const chatId = msg?.chat.id;
	const type = msg?.chat?.type;
	if (!msgId || !chatId || type !== "private") return;
	ctx.reply(`Order to set up bot:
1. Add bot to group and channel as admin.
2. Go to the group and setup portal with command /setup.
3. Forwarding the post sent by the bot to the channel you want to forward.
4. You want to setting bot, go to the group then press /setting command`);
});
