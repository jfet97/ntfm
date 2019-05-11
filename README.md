# Node Telegram Bots Flow Manager

This is a little module to help telegram bot devs correctly manage a flow of actions that have to be executed in row. The module is framework agnostic, but you'll find examples of its use with the main wrappers of the Telegram Bot API for Node.js developers.

```sh
npm install --save ntfm
```

## Main features
The module can handle both sync and asycn actions and let you force the repeat of the last one if something goes wrong, e.g. an user that sends an uncorrect reply.

## Examples
The built bot is a simple images generator. It will ask, **in order**, to the user: the width, the height, the background color, the foreground color, the format and an optional text. Each step has constrains, so we will take full advantage of the possibility to repeat each action if the constrains are not respected.

What are you waiting for? Check the examples folder!

## API

### Hashable
It's a `number` or a `string`.

### TelegramFlowFactory(): TelegramFlow
This is the main constructor function, because let us to retrieve a `TelegramFlow` instance where actions will be registered.

```js
const { TelegramFlowFactory } = require("ntfm");

const flow = TelegramFlowFactory();
```

### TelegramFlow.register(id: Hashable, ...actions: Array<Action>): void
This is the method used for actions registering. It does need an unique `id` because each user needs its own actions list.
I strongly advise you to use the telegram _userId_.

```js
flow.register(id, function firstAction(){}, async function secondAction(), ...)
```

It's important to know that only one flow at time, composed by any number of actions, is allowed. Consecutive calls to this method will be ignored until each actions of the current flow has been performed. For special needs, use more than one `TelegramFlow` instance.

### Actions
Each action must be a function, anonymous or not, asynchronous or not. An action represents a single step in our bot flow, with the possibility to receive some data from the previous step. If an action ends successfully, the returned value will be passed to the next waiting action. To force the replay of an action, you must return a specific object: `{ repeat: true }`.

Each action will be called passing her a **data object** with the following properties:
- `previousResult`: `null` initially, is the value returned from the previous successfully ended action. If an action returns `{ repeat: true }` to replay itself, `previousResult` won't be overriden.
- `executeCallData`: data sent by the user to let the flow run (more on the next section).
  
```js
const validSyncAction = () => { 
    // ...
}

const validASyncAction = async () => { 
    // ...
}

const validSyncActionWithData = data => { 
    // ...
}

const validASyncActionWithData = async data => { 
    // ...
}
```

### TelegramFlow.execute(id: Hashable, data: any): void
After some actions has been registered, we need a way to let the user interact with them because the execution of each action needs user's data, regardless of how they arrive (e.g. direct message, keyboard, inline keyboard, etc).
The `execute` method is present for this purpose. It requires the `id` associated with the list of actions to execute and the `data` to pass to the next action.

```js
bot.onMessage(function messagesListener(message) {
    flow.execute(message.senderId, message);
})
```

If no actions are registered when the `execute` call is performed, the call will be automatically ignored, though we'll see soon a better approach.

### TelegramFlow.hasInQueue(id: Hashable): boolean;
Call this method to know if there are some actions in queue for a specific `id`. It could be really useful in two situations:
1. Avoid useless call to the `execute` method, call that would be internally discarded:

```js
bot.onMessage(function messagesListener(message) {
    if(flow.hasInQueue()) {
        flow.execute(message.senderId, message);
    }
})
```

2. Avoid useless call to the `register` method when previous registered actions are still in pending:

```js
bot.onCommand('register', function commandListener(message) {
    if(flow.hasInQueue()) {
        bot.reply(message.senderId, "Unable to perform this operation. You must end the previous started flow.");
        return;
    }

    flow.register(message.senderId, ...);
})
```

### TelegramFlow.getActionsQueueLength(id: Hashable): number;
Call this method to know how many actions are in queue for a specific `id`. Could be used instead of the `hasInQueue` method.

### TelegramFlow.clear(id: Hashable): void
What if an user forgot to reply to the bot, maybe even eliminating the messages chronology? What if you want to let the user abort the current flow? In both cases the `clear` method let you to clean up the situation. You can choose to create a bot command for it and/or to start a timeout after the registration of some actions.

```js
bot.onCommand('register', function commandListener(message) {

    flow.register(message.senderId, ...);

    setTimeout(flow.clear.bind(flow), 30000, message.senderId);
});

bot.onCommand('clear', function commandListener(message) {
     flow.clear(message.senderId);
});
```