import { bot } from "..";
import { Context } from "grammy";
import { showBotActivity } from "../actions/show-bot-activity";

bot.command("start", async (ctx: Context) => {
	if (!ctx.msg) return;
	const chatId = ctx?.msg?.chat.id;
	const privateChat = ctx?.msg?.chat.type === "private";
	const topicId = ctx.msg?.message_thread_id;
	if (!privateChat) return;
	try {
		showBotActivity(ctx, chatId);
		ctx.reply(
			`Hello <b>${ctx?.msg?.from?.username}</b>,

I am <b>GrokXAI BOT</b>, and I am delighted to meet you here. We can talk about anything you want, from interesting topics to important matters in life. I am ready to listen and assist you in any way I can.
Use command /grok { your content } to chat with me.`,
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
