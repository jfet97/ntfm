// run "npm i -S node-telegram-bot-api node-telegram-keyboard-wrapper ntfm node-fetch"
const BotConstructor = require("node-telegram-bot-api");
const { TelegramFlowFactory } = require("ntfm");
const { InlineKeyboard } = require("node-telegram-keyboard-wrapper");
const fetch = require('node-fetch');

const bot = new BotConstructor(process.env.TOKEN, {
    polling: true,
});

const flow = TelegramFlowFactory();



bot.on("message", msg => {

    // if the message is a bot_command or if there are no actions in queue
    // flow.execute() won't be called
    if (!hasEntity("bot_command", msg.entities) && flow.hasInQueue(msg.from.id)) {
        // data sent with each execute call is the msg object
        // so each action will have all the information it might need
        flow.execute(msg.from.id, msg);
    }

    function hasEntity(entity, entities) {
        if (!entities || !entities.length) {
            return false;
        }
        return entities.some(e => e.type === entity);
    }
});

bot.on("callback_query", msg => {

    // if there are no actions in queue 
    // flow.execute() won't be called
    if (flow.hasInQueue(msg.from.id)) {
        // data sent with each execute call is the msg object
        // so each action will have all the information it might need
        flow.execute(msg.from.id, msg);
        return;
    }
});

// /generate bot_command listener
bot.onText(/\/generate/, msg => {

    const userId = msg.from.id;

    // flow guard
    if (!flow.hasInQueue(userId)) {

        // the bot will reply to the /generate bot_command asking the first parameter to generate the image: the width
        bot.sendMessage(userId, `Send me the width of the image to be generated`);

        flow.register(
            userId,
            data => {
                // first action: check the validity of the width
                // replay if it was not valid
                // ask for the height in the other case
                const msg = data.executeCallData;

                let width = parseInt(msg && msg.text, 10);
                if(!Number.isNaN(width)) {
                    bot.sendMessage(userId, `Send me the height of the image to be generated`);

                    // I'll return an object containing the just inserted width
                    return { width };
                } else {
                    bot.sendMessage(userId, `The width was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // second action: check the validity of the height
                // replay if it was not valid
                // ask for the background color in the other case
                const msg = data.executeCallData;

                let height = parseInt(msg && msg.text, 10);
                if (!Number.isNaN(height)) {
                    bot.sendMessage(userId, `Send me the background-color of the image to be generated (RGB)`);

                    // I'll return an object containing the just inserted height and the width
                    return { height, ...data.previousResult };
                } else {
                    bot.sendMessage(userId, `The height was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // third action: check the validity of the bg-color
                // replay if it was not valid
                // ask for the foreground color in the other case
                const msg = data.executeCallData;
                const rgbRegexp = /^[0-9a-f]{6}\b/gi;

                let backgroundColor;
                if (rgbRegexp.test(msg && msg.text)) {
                    backgroundColor = msg.text;
                    bot.sendMessage(userId, `Send me the foreground-color of the image to be generated (RGB)`);

                    // I'll return an object containing the just inserted backgroundColor and the previous inserted settings
                    return { backgroundColor, ...data.previousResult };
                } else {
                    bot.sendMessage(userId, `The background-color was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // fourth action: check the validity of the fg-color
                // replay if it was not valid
                // ask for the format in the other case
                const msg = data.executeCallData;
                const rgbRegexp = /^[0-9a-f]{6}\b/gi;

                let foregroundColor;
                if (rgbRegexp.test(msg && msg.text)) {
                    foregroundColor = msg.text;

                    const ik = new InlineKeyboard();
                    ik.addRow(...["png", "gif", "jpg"].map(format => ({
                        text: format,
                        callback_data: format,
                    })));
                    bot.sendMessage(userId, `Choose a format for the image to be generated`, ik.build());

                    // I'll return an object containing the just inserted foregroundColor and the previous inserted settings
                    return { foregroundColor, ...data.previousResult };
                } else {
                    bot.sendMessage(userId, `The foreground-color was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            data => {
                // fifth action: check the validity of the chosen format
                // replay if it was not valid
                // ask for the text in the other case

                const chosenFormat = data.executeCallData.data;
                const queryId = data.executeCallData.id;

                if (!chosenFormat && !queryId) { 
                    // if those data are missing, it means that the current action was wrongly triggered
                    // by a normal message instead of a callback_query

                    const ik = new InlineKeyboard();
                    ik.addRow(...["png", "gif", "jpg"].map(format => ({
                        text: format,
                        callback_data: format,
                    })));
                    bot.sendMessage(userId, `Use the keyboard to choose a format please`, ik.build());
                    return { repeat: true };
                }

                bot.editMessageText("Thanks!", {
                    message_id: data.executeCallData.message.message_id,
                    chat_id: data.executeCallData.message.chat.id,
                });
                bot.answerCallbackQuery(queryId, { text: `You chose the following format: ${chosenFormat}` });
                bot.sendMessage(userId, `Send me a custom text`);
                // I'll return an object containing the just selected format and the previous inserted settings
                return { chosenFormat, ...data.previousResult };
            },
            async data => {
                // sixth action: check the validity of the custom text
                // replay if it was not valid
                // show to the user the chosen settings in the other case
                const msg = data.executeCallData;

                let text;
                if (msg && msg.text) {
                    text = msg.text;

                    await bot.sendMessage(userId, `
                        An image with the following traits will be generated:
                        width: ${data.previousResult.width},
                        height: ${data.previousResult.height},
                        background-color: ${data.previousResult.backgroundColor},
                        foreground-color: ${data.previousResult.foregroundColor},
                        format: ${data.previousResult.chosenFormat},
                        text: ${text}
                    `);
                    bot.sendMessage(userId, `Send any message to confirm or type /clear to abort.`);

                    // I'll return an object containing the just inserted text and the previous inserted settings
                    return { text, ...data.previousResult };
                } else {
                    bot.sendMessage(userId, `The text was an invalid value. Try again, please`);
                    return { repeat: true };
                }
            },
            async data => {
                // seventh action: generate the image
                const url = `https://dummyimage.com/${data.previousResult.width}x${data.previousResult.height}/${data.previousResult.backgroundColor}/${
                    data.previousResult.foregroundColor}.${data.previousResult.chosenFormat}&text=${data.previousResult.text}`;
                
                try {
                    // generate the image
                    await fetch(url);
                    // send the image to the user
                    bot.sendDocument(userId, url)
                } catch(e) {
                    bot.sendMessage(userId, `Something went wrong in the generation process: type anything to retry or send /clear to abort`);
                    return { repeat: true };
                }
            }
        );

        // after 60 second, the operation will be forcibly cleared
        setTimeout(flow.clear.bind(flow), 180000, userId);

    } else {
        bot.sendMessage(userId, "Unable to execute this command. First complete the previous operation or type /clear.");
    }

});

// /clear bot command listener
bot.onText(/\/clear/, msg => {

    let messageToBeSent = "";

    if (!flow.hasInQueue(msg.from.id)) {
        messageToBeSent += "Nothing to clear.";
    } else {
        flow.clear(msg.from.id);
        messageToBeSent += "You have successfully aborted the operation.";
    }

    bot.sendMessage(msg.from.id, messageToBeSent);
});

bot.on("polling_error", (msg) => console.log("polling_error: ", msg));