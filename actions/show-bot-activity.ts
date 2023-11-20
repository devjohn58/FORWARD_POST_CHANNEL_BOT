import { Context } from "grammy";
import { bot } from "..";

export const showBotActivity = async (ctx: Context, chatId: number) => {
  try {
    const topicId = ctx.msg?.message_thread_id;
    bot.api
      .sendChatAction(chatId, "typing", {
        message_thread_id: topicId ?? undefined,
      })
      .catch((error) => {
        console.error(`[Error] Could not display bot activity indicator.`);
        console.error(error);
        return;
      });
  } catch (error) {
    console.error(`[Error] Could not display bot activity indicator.`);
    return;
  }
};
