import { bot, _data, loadData, loadPin } from "..";
import { Context } from "grammy";
import { Menu } from "@grammyjs/menu";
import {
	Data,
	checkIsAdmin,
	deleteMess,
	getData,
	isStopBot,
	replyDelete,
	setData,
} from "../helper";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const term = require("terminal-kit").terminal;

//setting command menu

const ConfirmDelete = new Menu("ConfirmDelete")
	.text("Yes", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		if (!idFrom) return;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			const groupId = ctx.update?.callback_query?.message?.chat?.id;
			const text = ctx.update?.callback_query?.message?.text;
			const messageId = ctx.update.callback_query?.message?.message_id;
			const channelId = text?.split(":")?.[text?.split(":").length - 1];
			getData().then((d) => {
				if (d && JSON.parse(d)) {
					const _dataParse: Data[] = JSON.parse(d);
					if (_dataParse.length > 0) {
						const _dataFilter: Data[] = _dataParse.map((dd) => {
							if (
								channelId &&
								dd.channelId.toString() == channelId
							) {
								const groupIdFilter: number[] =
									dd.groupId.filter((_dd) => _dd !== groupId);
								return { ...dd, groupId: groupIdFilter };
							} else {
								return dd;
							}
						});
						setData(_dataFilter).then(() => {
							loadData();
							if (groupId && messageId)
								try {
									ctx.api
										.deleteMessage(groupId, messageId)
										.catch(() => {});
									ctx.reply("Channel list:", {
										reply_markup: ChannelList,
									});
								} catch (error) {}
						});
					}
				}
			});
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	})
	.row()
	.back("⬅️ Go Back", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		if (!idFrom) return;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			ctx.editMessageText("Channel List:", { parse_mode: "HTML" });
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	});

const ChannelDetails = new Menu("ChannelDetails")
	.submenu("❌ Delete", "ConfirmDelete")
	.row()
	.back("⬅️ Go Back", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		if (!idFrom) return;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			ctx.editMessageText("Channel List:", { parse_mode: "HTML" });
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	});

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
						(ctx) => {
							ctx.editMessageText(
								`${l.channelTitle}:${l.channelId}`,
								{ parse_mode: "HTML" }
							);
						}
					)
					.row();
			});
		}
		range
			.text("🖊 Add channel with id", (ctx) => {
				const idFrom = ctx.update?.callback_query?.from?.id;
				const chatId = ctx.update?.callback_query?.message?.chat?.id;
				const messageId =
					ctx.update?.callback_query?.message?.message_id;
				if (!idFrom) return;
				checkIsAdmin(ctx, idFrom).then((_adm) => {
					if (!_adm) return;
					ctx.reply("Reply this message and enter channel id:", {
						reply_markup: { force_reply: true },
						reply_to_message_id: ctx.msg?.message_thread_id,
                    }).catch(err => {
                        console.error("ERROR Setting.ts 136: ", err);
                    })
					deleteMess(ctx, chatId, messageId);
				});
			})
			.row();
		return range;
	})
	.back("⬅️ Go Back", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			ctx.editMessageText(
				"Setting bot automatically forward posts from channels:",
				{ parse_mode: "HTML" }
			);
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	});

const Setting = new Menu("root-menu")
	.submenu("🌏 Channel list", "channelList", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			ctx.editMessageText("Channel list", { parse_mode: "HTML" });
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	})
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
			const idFrom = ctx.update?.callback_query?.from?.id;
			checkIsAdmin(ctx, idFrom).then((_adm) => {
				if (!_adm) return;
				const groupId = ctx.update?.callback_query?.message?.chat?.id;
				const messageId =
					ctx.update.callback_query?.message?.message_id;
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
								loadPin();
								ctx.api
									.deleteMessage(groupId, messageId)
									.catch(() => {});
								ctx.reply(
									"Setting bot automatically forward posts from channels:",
									{
										reply_markup: Setting,
									}
								);
							} catch (error) {}
					});
			}).catch(err => {
                console.error("ERROR Setting.ts 136: ", err);
            })
		}
	)
	.row()
	.text("⚔️ Close", (ctx) => {
		const idFrom = ctx.update?.callback_query?.from?.id;
		checkIsAdmin(ctx, idFrom).then((_adm) => {
			if (!_adm) return;
			try {
				ctx.msg?.chat.id &&
					ctx.api
						.deleteMessage(ctx.msg?.chat.id, ctx.msg?.message_id)
						.catch(() => {});
			} catch (error) {}
		}).catch(err => {
            console.error("ERROR Setting.ts 136: ", err);
        })
	});

ChannelDetails.register(ConfirmDelete);
ChannelList.register(ChannelDetails);
Setting.register(ChannelList);
bot.use(Setting);

//command
bot.command("setting", async (ctx: Context) => {
     //down bot
     if (isStopBot) {
        return;
    }
	const msg = ctx.update.message;
	const type = msg?.chat?.type;
	const chatId = msg?.chat.id;
	const idFrom = msg?.from.id;
	if (type === "private") {
		ctx.reply("You have to setting in group!");
		return;
	}
	try {
		if (chatId && idFrom) {
			const userChatMember = await ctx.api.getChatMember(chatId, idFrom);
			if (userChatMember.status === "member") {
				return ctx.reply("You need admin privileges to do this");
			}
		}
	} catch (error) {
		console.error("Error fetching user status:", error);
	}
	//@ts-ignore
	ctx.data = _data;
	ctx.reply("Setting bot automatically forward posts from channels:", {
		reply_markup: Setting,
		parse_mode: "HTML",
	});
});

//hanlde add channel id
bot.hears(/^[0-9]*$/, async (ctx) => {
     //down bot
     if (isStopBot) {
        return;
    }
	const _isBot =
		ctx?.update?.message?.reply_to_message?.from?.username ===
		process.env.TELEGRAM_BOT_NAME;
	const _istext =
		ctx?.update?.message?.reply_to_message?.text ===
		"Reply this message and enter channel id:";
	if (!_isBot && _istext) return;
	if (ctx?.update?.message?.chat?.type === "private") return;
	const channelId = ctx?.update?.message?.text ?? 0;
	const groupId = ctx?.update?.message?.chat?.id;
	const messageId = ctx?.update?.message?.message_id;
	const messageReplyId = ctx?.update?.message?.reply_to_message?.message_id;
	if (!groupId || !messageId) return;
    const groupTitle = ctx?.update?.message?.chat?.title;
    const idFrom = ctx.update?.message?.from?.id;
    if (idFrom) {
        const _isAdmin = await checkIsAdmin(ctx, idFrom)
        if (!_isAdmin) return;
    }
	getData().then((data) => {
		if (data) {
			const dataArray: Data[] = JSON.parse(data);
			let flag: true | false = false;
			dataArray.forEach((_data, index) => {
				if (_data.channelId == channelId) {
					flag = true;
                    if (_data.groupId.includes(groupId)) {
                        if (messageId && messageReplyId) {
                            ctx.api
                                .deleteMessage(groupId, messageId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                            ctx.api
                                .deleteMessage(groupId, messageReplyId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                        }
                        replyDelete(
                            ctx,
                            "The channel has been forwared to this group!"
                        );
					} else {
						dataArray[index] = {
							...dataArray[index],
							groupId: [...dataArray[index].groupId, groupId],
						};
                        loadData();
                        if (messageId && messageReplyId) {
                            ctx.api
                                .deleteMessage(groupId, messageId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                            ctx.api
                                .deleteMessage(groupId, messageReplyId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                        }
						replyDelete(
							ctx,
							`Automatically forwarded to group <b>${groupTitle}</b> successfully!`
						);
					}
				}
			});

			if (!flag) {
				dataArray.push({
					groupId: [groupId],
					channelId: Number(channelId),
					channelTitle: "",
				});
				setData(dataArray)
					.then(() => {
                        loadData();
                        if (messageId && messageReplyId) {
                            ctx.api
                                .deleteMessage(groupId, messageId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                            ctx.api
                                .deleteMessage(groupId, messageReplyId)
                                .catch((err) => {
                                    console.log("ERROR DELETEMESSAGE: ", err);
                                });
                        }
						replyDelete(
							ctx,
							`Automatically forwarded to group <b>${groupTitle}</b> successfully!`
						);
					})
					.catch((err) => {
						console.error(
							"Error writing file in Forward Event:",
							err
						);
						ctx.reply("Error! Please try again!");
						return;
					});
			}
		} else {
			const dataWrite = [
				{
					groupId: [groupId],
					channelId: channelId,
					channelTitle: "",
				},
			];
			setData(dataWrite)
				.then(() => {
					loadData();
					if (messageId && messageReplyId) {
						ctx.api
							.deleteMessage(groupId, messageId)
							.catch((err) => {
								console.log("ERROR DELETEMESSAGE: ", err);
							});
						ctx.api
							.deleteMessage(groupId, messageReplyId)
							.catch((err) => {
								console.log("ERROR DELETEMESSAGE: ", err);
							});
					}
					replyDelete(
						ctx,
						`Automatically forwarded to group <b>${groupTitle}</b> successfully!`
					);
				})
				.catch((err) => {
					console.error("Error writing file in Forward Event:", err);
					ctx.reply("Error! Please try again!");
				});
		}
	});
});
