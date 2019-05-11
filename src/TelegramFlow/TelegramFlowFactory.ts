import { TelegramFlow, TelegramFlowImp } from "./TelegramFlow";
import { UserFlowData } from "./implementations/UserFlowData";
import { ArrayQueue } from "./implementations/ArrayQueue";

import { FlowElementFactory } from "./interfaces/FlowElement";
import { Hashable } from "../Types/HashableType";
import { ExecuteCall } from "../Types/ExecuteCallType";
import { Action } from "../Types/ActionType";

const TelegramFlowElementFactory: FlowElementFactory = function (id: Hashable) {
    return new UserFlowData(
        new ArrayQueue<ExecuteCall>(),
        new ArrayQueue<Action>(),
        id);
}

function TelegramFlowFactory(): TelegramFlow {
    return new TelegramFlowImp(TelegramFlowElementFactory);
}

export { TelegramFlowFactory, TelegramFlow };
