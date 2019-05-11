// run "npm i -S telegraf ntfm node-fetch"
const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const { TelegramFlowFactory } = require("ntfm");
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.TOKEN)
const flow = TelegramFlowFactory();


//generate bot_command listener
bot.command("generate", ctx => {

    const userId = ctx.message.from.id;

    // flow guard
    if (!flow.hasInQueue(userId)) {

        // the bot will reply to the /generate bot_command asking the first parameter to generate the image: the width
        ctx.reply(`Send me the width of the image to be generated`);

        flow.register(
            userId,
            data => {
                // first action: check the validity of the width
                // replay if it was not valid
                // ask for the height in the other case
                const ctx = data.executeCallData;
                const msg = ctx.message;

                let width = parseInt(msg && msg.text, 10);
                if (!Number.isNaN(width)) {
                    ctx.reply(`Send me the height of the image to be generated`);

                    // I'll return an object containing the just inserted width
                    return { width };
                } else {
                    ctx.reply(`The width was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // second action: check the validity of the height
                // replay if it was not valid
                // ask for the background color in the other case
                const ctx = data.executeCallData;
                const msg = ctx.message;

                let height = parseInt(msg && msg.text, 10);
                if (!Number.isNaN(height)) {
                    ctx.reply(`Send me the background-color of the image to be generated (RGB)`);

                    // I'll return an object containing the just inserted height and the width
                    return { height, ...data.previousResult };
                } else {
                    ctx.reply(`The height was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // third action: check the validity of the bg-color
                // replay if it was not valid
                // ask for the foreground color in the other case
                const ctx = data.executeCallData;
                const msg = ctx.message;
                const rgbRegexp = /^[0-9a-f]{6}\b/gi;

                let backgroundColor;
                if (rgbRegexp.test(msg && msg.text)) {
                    backgroundColor = msg.text;
                    ctx.reply(`Send me the foreground-color of the image to be generated (RGB)`);

                    // I'll return an object containing the just inserted backgroundColor and the previous inserted settings
                    return { backgroundColor, ...data.previousResult };
                } else {
                    ctx.reply(`The background-color was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // fourth action: check the validity of the fg-color
                // replay if it was not valid
                // ask for the format in the other case
                const ctx = data.executeCallData;
                const msg = ctx.message;
                const rgbRegexp = /^[0-9a-f]{6}\b/gi;

                let foregroundColor;
                if (rgbRegexp.test(msg && msg.text)) {
                    foregroundColor = msg.text;

                    const ik = Markup.inlineKeyboard([
                        Markup.callbackButton('png', 'png'),
                        Markup.callbackButton('gif', 'gif'),
                        Markup.callbackButton('jpg', 'jpg')
                    ]).extra();

                    ctx.reply(`Choose a format for the image to be generated`, ik);

                    // I'll return an object containing the just inserted foregroundColor and the previous inserted settings
                    return { foregroundColor, ...data.previousResult };
                } else {
                    ctx.reply(`The foreground-color was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // fifth action: check the validity of the chosen format
                // replay if it was not valid
                // ask for the text in the other case
                const ctx = data.executeCallData;

                if (ctx.updateType !== 'callback_query') {
                    // if those data are missing, it means that the current action was wrongly triggered
                    // by a normal message instead of a callback_query

                    const ik = Markup.inlineKeyboard([
                        Markup.callbackButton('png', 'png'),
                        Markup.callbackButton('gif', 'gif'),
                        Markup.callbackButton('jpg', 'jpg')
                    ]).extra();
                    ctx.reply(`Use the keyboard to choose a format please`, ik);
                    return { repeat: true };
                }

                const chosenFormat = ctx.update.callback_query.data;
                const msg = ctx.update.callback_query.message;

                ctx.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, "Thanks!");

                ctx.answerCbQuery(`You chose the following format: ${chosenFormat}`);
                ctx.reply(`Send me a custom text`);
                // I'll return an object containing the just selected format and the previous inserted settings
                return { chosenFormat, ...data.previousResult };
            },
            async data => {
                // sixth action: check the validity of the custom text
                // replay if it was not valid
                // show to the user the chosen settings in the other case
                const ctx = data.executeCallData;
                const msg = ctx.message;

                let text;
                if (msg && msg.text) {
                    text = msg.text;

                    await ctx.reply(`
                        An image with the following traits will be generated:
                        width: ${data.previousResult.width},
                        height: ${data.previousResult.height},
                        background-color: ${data.previousResult.backgroundColor},
                        foreground-color: ${data.previousResult.foregroundColor},
                        format: ${data.previousResult.chosenFormat},
                        text: ${text}
                    `);
                    ctx.reply(`Send any message to confirm or type /clear to abort.`);

                    // I'll return an object containing the just inserted text and the previous inserted settings
                    return { text, ...data.previousResult };
                } else {
                    ctx.reply(`The text was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            async data => {
                // seventh action: generate the image
                const ctx = data.executeCallData;

                const url = `https://dummyimage.com/${data.previousResult.width}x${data.previousResult.height}/${data.previousResult.backgroundColor}/${
                    data.previousResult.foregroundColor}.${data.previousResult.chosenFormat}&text=${data.previousResult.text}`;

                try {
                    // generate the image
                    await fetch(url);
                    // send the image to the user
                    ctx.telegram.sendDocument(ctx.message.chat.id, url)
                } catch (e) {
                    ctx.reply(`Something went wrong in the generation process: type anything to retry or send /clear to abort`);
                    return { repeat: true };
                }
            }
        );

        // after 60 second, the operation will be forcibly cleared
        setTimeout(flow.clear.bind(flow), 180000, userId);

    } else {
        ctx.reply("Unable to execute this command. First complete the previous operation or type /clear.");
    }

});


bot.command('clear', (ctx) => {

    let messageToBeSent = "";

    if (!flow.hasInQueue(ctx.message.from.id)) {
        messageToBeSent += "Nothing to clear.";
    } else {
        flow.clear(ctx.message.from.id);
        messageToBeSent += "You have successfully aborted the operation.";
    }

    ctx.reply(messageToBeSent);
});


bot.on("message", ctx => {

    // if the message is a bot_command or if there are no actions in queue
    // flow.execute() won't be called
    if (!hasEntity("bot_command", ctx.message.entities) && flow.hasInQueue(ctx.message.from.id)) {
        // data sent with each execute call is the ctx object
        // so each action will have all the information it might need

        flow.execute(ctx.message.from.id, ctx);
    }

    function hasEntity(entity, entities) {
        if (!entities || !entities.length) {
            return false;
        }
        return entities.some(e => e.type === entity);
    }
});

bot.on("callback_query", ctx => {
    // if there are no actions in queue 
    // flow.execute() won't be called
    if (flow.hasInQueue(ctx.update.callback_query.from.id)) {
        // data sent with each execute call is the ctx object
        // so each action will have all the information it might need
        flow.execute(ctx.update.callback_query.from.id, ctx);
        return;
    }
});


bot.launch();
