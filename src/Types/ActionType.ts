import { ExecuteCall } from "./ExecuteCallType";

export interface ActionData {
    executeCallData: ExecuteCall;
    previousResult: any;
}

export type Action = (data: ActionData) => any;