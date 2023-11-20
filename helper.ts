import fs from "fs";
import path from "path";

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
    channelTitle: string
};


export const getData = () => {
	return fs.promises.readFile(path.join(__dirname, "./data.txt"), "utf8")
};

export const setData = (data:any) => {
	return fs.promises.writeFile(path.join(__dirname, "./data.txt"),JSON.stringify(data), "utf8")
};

export const getSetup = () => {
	return fs.promises.readFile(path.join(__dirname, "./setup.txt"), "utf8")
};

export const setSetup = (data:any) => {
	return fs.promises.writeFile(path.join(__dirname, "./setup.txt"), JSON.stringify(data),"utf8")
};
