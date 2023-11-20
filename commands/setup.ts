//@ts-ignore
import { bot, loadData } from "..";
import { Context } from "grammy";
import crypto from "crypto";
const term = require("terminal-kit").terminal;
import * as dotenv from "dotenv";
import {
	Data,
	DataSetup,
	getData,
	getSetup,
	setData,
	setSetup,
} from "../helper";
dotenv.config();

// helper function
let responseMess = (password: string) =>
	`To setup the portal forward this message into a channel which I have admin in <pre>_${password}</pre>`;

const generatePassword = (
	length = 20,
	characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$"
) =>
	Array.from(crypto.randomFillSync(new Uint32Array(length)))
		.map((x: any) => characters[x % characters.length])
		.join("");

const deleteMess = (ctx: Context, chatId: any, messageId: any) => {
	ctx.api
		.deleteMessage(chatId, messageId)
		.then()
		.catch(() => {
			ctx.reply("You have to set bot as admin in group!");
		});
};

const replyDelete = (ctx: Context, text: string) => {
	ctx.reply(text, {
		parse_mode: "HTML",
	}).then((_ctx) => {
		setTimeout(() => {
			if (ctx.msg?.chat.id && _ctx.message_id)
				deleteMess(ctx, ctx.msg?.chat.id, _ctx?.message_id);
		}, 5000);
	});
};

//bot command
bot.command("setup", async (ctx: Context) => {
	const msg = ctx.update.message;
	const chatId = msg?.chat.id;
	const type = msg?.chat?.type;
	//@ts-ignore
	const { id, first_name, username } = msg?.from;
	//@ts-ignore
	const { title } = msg?.chat;
	if (type === "private" || !chatId) {
		ctx.reply("You have to setting in group!");
		return;
	}
	const password = generatePassword();
	const dataSetup = {
		id,
		first_name,
		username,
		password,
		groupTitle: title,
		groupId: chatId,
	};
	ctx.api.getChatMember(chatId, bot.botInfo.id).then((_bot) => {
		if (_bot.status !== "administrator") {
			ctx.reply("You have to set bot as admin in group!");
			return;
		}
		getSetup().then((data) => {
			if (data == "" || data.length == 0) {
				ctx.reply(responseMess(password), { parse_mode: "HTML" })
					.then((_ctx) => {
						ctx.api.deleteMessage(chatId, msg.message_id).catch(() => {})
						setSetup([
							{ ...dataSetup, messageId: _ctx.message_id },
						]);
					})
					.catch((err) => {
						console.error("Error writing file:", err);
						ctx.reply("Error! Please try again!");
						return;
					});
			} else {
				const dataArray = JSON.parse(data);
				ctx.reply(responseMess(password), { parse_mode: "HTML" }).then(
					(_ctx) => {
						ctx.api.deleteMessage(chatId, msg.message_id).catch(() => {})
						dataArray.push({
							...dataSetup,
							messageId: _ctx.message_id,
						});
						setSetup(dataArray)
							.then((d) => {})
							.catch((err) => {
								console.error("Error writing file:", err);
								ctx.reply("Error! Please try again!");
								return;
							});
					}
				);
			}
		});
	}).catch(() => {})
});

bot.on(":forward_date", async (ctx) => {
	if (
		process.env.TELEGRAM_BOT_NAME ==
		ctx.update.channel_post?.forward_from?.username
	) {
		const text = ctx.update.channel_post?.text;
		const channelId = ctx.update.channel_post?.chat?.id;
		const channelTitle = ctx.update.channel_post?.chat?.title;
		if (!channelId) {
			return;
		}
		ctx.api.getChatMember(channelId, bot.botInfo.id).then((_bot) => {
			if (_bot.status !== "administrator") {
				ctx.reply("You have to set bot as admin in group!");
				return;
			}
			const messageId = ctx.update.channel_post?.message_id;
			if (
				text?.includes(
					"To setup the portal forward this message into a channel which I have admin in"
				)
			) {
				const _pass = text.split("_")?.[1];
				getSetup()
					.then((data) => {
						if (data && JSON.parse(data).length > 0) {
                            const dataParse: DataSetup[] = JSON.parse(data);
                            let _isPassword: false | true = false;
							dataParse.forEach((_setup) => {
                                if (_setup.password == _pass) {
                                    _isPassword = true;
									getData().then((data) => {
										if (data) {
											const dataArray: Data[] =
												JSON.parse(data);
											let flag: true | false = false;
											dataArray.forEach(
												(_data, index) => {
													if (
														_data.channelId ==
														channelId
													) {
														flag = true;
														if (
															_data.groupId.includes(
																_setup.groupId
															)
														) {
															setSetup(
																dataParse.filter(
																	(a) =>
																		a.password !==
																		_setup.password
																)
															).then(() => {
																if (messageId) {
																	ctx.api.deleteMessage(
																		channelId,
																		messageId
																	).catch(() => {})
																	replyDelete(
																		ctx,
																		"The channel has been forwared to this group!"
																	);
																}
															});
														} else {
															dataArray[index] = {
																...dataArray[
																	index
																],
																groupId: [
																	...dataArray[
																		index
																	].groupId,
																	_setup.groupId,
																],
															};
															setData(
																dataArray
															).then(() => {
																setSetup(
																	dataParse.filter(
																		(a) =>
																			a.password !==
																			_setup.password
																	)
																)
																	.then(
																		() => {
																			loadData();
																			if (
																				messageId
																			) {
																				ctx.api
																					.deleteMessage(
																						channelId,
																						messageId
																					)
																					.catch(
																						(
																							err
																						) => {
																							console.log(
																								"ERROR DELETEMESSAGE: ",
																								err
																							);
																						}
																					);
																			}
																			replyDelete(
																				ctx,
																				`Automatically forwarded to group <b>${_setup.groupTitle}</b> successfully!`
																			);
																		}
																	)
																	.catch(
																		(
																			err
																		) => {
																			console.error(
																				"Error writing file in Forward Event:",
																				err
																			);
																			ctx.reply(
																				"Error! Please try again!"
																			);
																			return;
																		}
																	);
															});
														}
													}
												}
											);

											if (!flag) {
												dataArray.push({
													groupId: [_setup.groupId],
													channelId: channelId,
													channelTitle:
														channelTitle ?? "",
												});
												setData(dataArray)
													.then(() => {
														setSetup(
															dataParse.filter(
																(a) =>
																	a.password !==
																	_setup.password
															)
														).then(() => {
															loadData();
															if (messageId) {
																ctx.api
																	.deleteMessage(
																		channelId,
																		messageId
																	)
																	.catch(
																		(
																			err
																		) => {
																			console.log(
																				"ERROR DELETEMESSAGE: ",
																				err
																			);
																		}
																	);
															}
															replyDelete(
																ctx,
																`Automatically forwarded to group <b>${_setup.groupTitle}</b> successfully!`
															);
														});
													})
													.catch((err) => {
														console.error(
															"Error writing file in Forward Event:",
															err
														);
														ctx.reply(
															"Error! Please try again!"
														);
														return;
													});
											}
										} else {
											const dataWrite = [
												{
													groupId: [_setup.groupId],
													channelId: channelId,
													channelTitle: channelTitle,
												},
											];
											setData(dataWrite)
												.then(() => {
													setSetup(
														dataParse.filter(
															(a) =>
																a.password !==
																_setup.password
														)
													).then(() => {
														loadData();
														if (messageId) {
															ctx.api
																.deleteMessage(
																	channelId,
																	messageId
																)
																.catch(
																	(err) => {
																		console.log(
																			"ERROR DELETEMESSAGE: ",
																			err
																		);
																	}
																);
														}
														replyDelete(
															ctx,
															`Automatically forwarded to group <b>${_setup.groupTitle}</b> successfully!`
														);
													});
												})
												.catch((err) => {
													console.error(
														"Error writing file in Forward Event:",
														err
													);
													ctx.reply(
														"Error! Please try again!"
													);
												});
										}
										ctx.api.editMessageText(
											_setup.groupId,
											_setup.messageId,
											"✅ Your forward portal has been created!"
										).catch(() => {})
									});
								} 
                            });
                            if (!_isPassword) {
                                if (messageId) {
                                    ctx.api.deleteMessage(
                                        channelId,
                                        messageId
                                    ).catch(() => {})
                                    replyDelete(
                                        ctx,
                                        "The token has expired!"
                                    );
                                }
                            }
						} else {
							if (messageId) {
                                ctx.api.deleteMessage(channelId, messageId).catch(() => {})
                                replyDelete(
                                    ctx,
                                    "The token has expired!"
                                );

							}
						}
					})
					.catch((err) => {
						console.error("ERROR: get data setup", err);
					});
			}
		}).catch(() => {})
	}
});
