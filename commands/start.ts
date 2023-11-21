import { bot } from "..";
import { Context } from "grammy";
import { showBotActivity } from "../actions/show-bot-activity";
import { isStopBot } from "../helper";

bot.command("start", async (ctx: Context) => {
     //down bot
     if (isStopBot) {
        return;
    }
	if (!ctx.msg) return;
	const chatId = ctx?.msg?.chat.id;
	const privateChat = ctx?.msg?.chat.type === "private";
	const topicId = ctx.msg?.message_thread_id;
	if (!privateChat) return;
	try {
		showBotActivity(ctx, chatId);
		ctx.reply(
			`Hello <b>${ctx?.msg?.from?.username}</b>, use /help command to learn use bot!`,
			{
                message_thread_id: topicId ?? undefined,
                parse_mode: "HTML"
			}
		).catch(() => {
			console.error(
				`[Error] [start.ts:61] Failed to send start message.`
			);
			return;
		});
	} catch (error) {
		console.error({
			message: "Error replying to the start command",
			error,
		});
		return;
	}
});
