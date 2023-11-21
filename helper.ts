import fs from "fs";
import path from "path";
import { Context } from "grammy";
import * as dotenv from "dotenv";
dotenv.config();

export const isStopBot = process.env.STOP_BOT !== "start"

export const deleteMess = (ctx: Context, chatId: any, messageId: any) => {
	ctx.api
		.deleteMessage(chatId, messageId)
		.then()
		.catch(() => {
			ctx.reply("Error! Please set bot as admin and try again!");
		});
};

export const replyDelete = (ctx: Context, text: string) => {
	ctx.reply(text, {
		parse_mode: "HTML",
	}).then((_ctx) => {
		setTimeout(() => {
			if (ctx.msg?.chat.id && _ctx.message_id)
				deleteMess(ctx, ctx.msg?.chat.id, _ctx?.message_id);
		}, 5000);
	});
};

export const checkIsAdmin = async (ctx: Context, id: number) => {
	const listAdmin = await ctx.getChatAdministrators();
	let isAdmin: boolean = false;
	listAdmin.forEach((a) => {
		if (a.user.id === id) {
			isAdmin = true;
		}
	});
    return isAdmin;
};

// typ data
export type DataSetup = {
	id: number;
	first_name: string;
	username: string;
	password: string;
	groupId: number;
	groupTitle: undefined | string;
	messageId: number;
};
export type Data = {
	channelId: number;
	groupId: number[];
	channelTitle: string;
};

export const getData = () => {
	return fs.promises.readFile(path.join(__dirname, "./data.txt"), "utf8");
};

export const setData = (data: any) => {
	return fs.promises.writeFile(
		path.join(__dirname, "./data.txt"),
		JSON.stringify(data),
		"utf8"
	);
};

export const getSetup = () => {
	return fs.promises.readFile(path.join(__dirname, "./setup.txt"), "utf8");
};

export const setSetup = (data: any) => {
	return fs.promises.writeFile(
		path.join(__dirname, "./setup.txt"),
		JSON.stringify(data),
		"utf8"
	);
};
