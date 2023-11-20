import { bot, _data, loadData, loadPin } from "..";
import { Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import { Data, getData, setData } from "../helper";
import fs from "fs";
import path from "path";

const term = require("terminal-kit").terminal;

//setting command menu

const ConfirmDelete = new Menu("ConfirmDelete")
	.text("Yes", (ctx) => {
		const groupId = ctx.update?.callback_query?.message?.chat?.id;
		const text = ctx.update?.callback_query?.message?.text;
		const messageId = ctx.update.callback_query?.message?.message_id;
		const channelId = text?.split(":")?.[text?.split(":").length - 1];
		getData().then((d) => {
			if (d && JSON.parse(d)) {
				const _dataParse: Data[] = JSON.parse(d);
				if (_dataParse.length > 0) {
					const _dataFilter: Data[] = _dataParse.map((dd) => {
						if (channelId && dd.channelId.toString() == channelId) {
							const groupIdFilter: number[] = dd.groupId.filter(
								(_dd) => _dd !== groupId
							);
							return { ...dd, groupId: groupIdFilter };
						} else {
							return dd;
						}
					});
					setData(_dataFilter).then(() => {
						loadData();
						if (groupId && messageId)
							try {
								ctx.api.deleteMessage(groupId, messageId).catch(() => {})
								ctx.reply("Channel list:", {
									reply_markup: ChannelList,
								});
							} catch (error) {}
					});
				}
			}
		});
	})
	.row()
	.back("⬅️ Go Back", (ctx) =>
		ctx.editMessageText("Channel List:", { parse_mode: "HTML" })
	);

const ChannelDetails = new Menu("ChannelDetails")
	.submenu("❌ Delete", "ConfirmDelete")
	.row()
	.back("⬅️ Go Back", (ctx) =>
		ctx.editMessageText("Channel List:", { parse_mode: "HTML" })
	);

const ChannelList = new Menu("channelList")
	.dynamic((ctx, range) => {
		const d = fs.readFileSync(path.join(__dirname, "../data.txt"), "utf8");
		const dataParse: Data[] = d && JSON.parse(d);
		const listChannelJoined: any = [];
		if (dataParse) {
			dataParse.forEach((_data) => {
				if (
					ctx.update?.callback_query?.message?.chat.id &&
					_data.groupId.includes(
						ctx.update?.callback_query?.message?.chat.id
					)
				) {
					listChannelJoined.push({
						channelTitle: _data.channelTitle,
						channelId: _data.channelId,
					});
				}
			});
		}
		if (listChannelJoined.length > 0) {
			listChannelJoined.forEach((l: any) => {
				range
					.submenu(
						`${l.channelTitle} : ${l.channelId}`,
						"ChannelDetails",
						(ctx) =>
							ctx.editMessageText(
								`${l.channelTitle}:${l.channelId}`,
								{ parse_mode: "HTML" }
							)
					)
					.row();
			});
		}
		return range;
	})
	.back("⬅️ Go Back", (ctx) =>
		ctx.editMessageText(
			"Setting bot automatically forward posts from channels:",
			{ parse_mode: "HTML" }
		)
	);

const Setting = new Menu("root-menu")
	.submenu("🌏 Channel list", "channelList", (ctx) =>
		ctx.editMessageText("Channel list", { parse_mode: "HTML" })
	)
	.text(
		(ctx) => {
			let groupId: any = "";
			if (ctx.update?.message?.chat?.id) {
				groupId = ctx.update?.message?.chat?.id;
			} else {
				groupId = ctx.update?.callback_query?.message?.chat?.id;
			}
			const d = fs.readFileSync(
				path.join(__dirname, "../pin.txt"),
				"utf8"
			);
			let isPin = false;
			if (d && groupId) {
				const dataparse = JSON.parse(d);
				if (dataparse && dataparse.includes(groupId)) {
					isPin = true;
				}
			}

			return isPin ? "✅ Auto pin" : "❌ Auto pin";
		},
		(ctx) => {
			const groupId = ctx.update?.callback_query?.message?.chat?.id;
			const messageId = ctx.update.callback_query?.message?.message_id;
			let dataSave: any = null;
			const data = fs.readFileSync(
				path.join(__dirname, "../pin.txt"),
				"utf8"
			);
			if (data) {
				const dataparse = JSON.parse(data);
				if (dataparse && dataparse.includes(groupId)) {
					dataSave = dataparse.filter((d: any) => d != groupId);
				} else {
					dataparse.push(groupId);
					dataSave = dataparse;
				}
			} else {
				dataSave = [groupId];
			}
			fs.promises
				.writeFile(
					path.join(__dirname, "../pin.txt"),
					JSON.stringify(dataSave),
					"utf8"
				)
				.then(() => {
					if (groupId && messageId)
                        try {
                            loadPin()
							ctx.api.deleteMessage(groupId, messageId).catch(() => {})
							ctx.reply(
								"Setting bot automatically forward posts from channels:",
								{
									reply_markup: Setting,
								}
							);
						} catch (error) {}
				});
		}
	)
	.row()
	.text("⚔️ Close", (ctx) => {
		try {
			ctx.msg?.chat.id &&
				ctx.api.deleteMessage(ctx.msg?.chat.id, ctx.msg?.message_id).catch(() => {})
		} catch (error) {}
	});
ChannelDetails.register(ConfirmDelete);
ChannelList.register(ChannelDetails);
Setting.register(ChannelList);
bot.use(Setting);
//command
bot.command("setting", async (ctx: Context) => {
	const msg = ctx.update.message;
	const type = msg?.chat?.type;
	if (type === "private") {
		ctx.reply("You have to setting in group!");
		return;
	}
	//@ts-ignore
	ctx.data = _data;
	ctx.reply("Setting bot automatically forward posts from channels:", {
		reply_markup: Setting,
		parse_mode: "HTML",
	});
});
