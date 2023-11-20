import { Bot as TelegramBot } from "grammy";
import * as dotenv from "dotenv";
import { showBotActivity } from "./actions/show-bot-activity";
import fs from "fs";
import path from "path";
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
	throw new Error("TELEGRAM_BOT_TOKEN env variable is not defined");
}
export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
import "./commands";
import { Data } from "./helper";

export let _data: null | Data[] = null;
export let _pin: any = null;

export const loadPin = () => {
	fs.readFile(path.join(__dirname, "./pin.txt"), "utf8", (err, data) => {
		if (data) _pin = JSON.parse(data);
	});
};

export const loadData = () => {
	fs.readFile(path.join(__dirname, "./data.txt"), "utf8", (err, data) => {
		if (data) _data = JSON.parse(data);
	});
};

try {
	bot.api.setMyCommands([
		{
			command: "start",
			description: "Starting with our bot.",
		},
		{
			command: "setting",
			description: "Setting your portal.",
		},
		{
			command: "setup",
			description: "Setup your portal.",
		},
		{
			command: "help",
			description: "Instructions on how to use the bot.",
		},
	]);
} catch (error) {
	console.error("[Error] Could not set bot commands.", error);
}
bot.start().catch((error) => {
	console.error("[Error] Could not start bot.", error);
});

const textCheck = [
	"The channel has been forwared to this group!",
	"To setup the portal forward this message into a channel which I have admin in",
	"Automatically forwarded to group",
];

bot.on("channel_post", async (ctx) => {
	if (!ctx.msg) return;
	// term.yellow(JSON.stringify(ctx, null, 2) + '\n');
	const channelId = ctx.update.channel_post?.sender_chat?.id;
	const messageId = ctx.update.channel_post?.message_id;
	const chatId = ctx.msg.chat.id;
	const text = ctx.update.channel_post?.text;
	if (text && textCheck.includes(text)) return;
		_data?.forEach((d) => {
			if (channelId == d.channelId) {
				d.groupId.forEach((g) => {
                    ctx.api.forwardMessage(g, channelId, messageId).catch(() => { }).then(_ctx => {
                        const messageId = _ctx?.message_id
                        if (_pin.includes(g) && messageId) {
                            ctx.api.pinChatMessage(g, _ctx?.message_id, { disable_notification: false }).catch((er) => {console.log("Err Pin: ", er);
                        })
                    }
                })
				});
				return;
			}
		});
		showBotActivity(ctx, chatId);
});
loadData();
loadPin();
console.log("Bot is running....");
