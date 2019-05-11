import { Queue, QueueConstructor } from "./QueueInterface";
import { Hashable } from "../../Types/HashableType"
import { ExecuteCall } from "../../Types/ExecuteCallType";
import { Action } from "../../Types/ActionType";
import { Result } from "../../Types/ResultType";

// interface for any element contained into the Flow
export interface FlowElement {
    prevResult: Result;
    
    getId(): Hashable;
    enqueueExecuteCall(ec: ExecuteCall): void;
    dequeueExecuteCall(): ExecuteCall | undefined;
    peekFirstExecuteCall(): ExecuteCall | undefined;
    getExecuteCallIterator(): IterableIterator<ExecuteCall>;
    getExecuteCallsSize(): number;
    clearExecuteCallsQueue():void;
    enqueueAction(ac: Action): void;
    dequeueAction(): Action | undefined;
    peekFirstAction(): Action | undefined;
    getActionIterator(): IterableIterator<Action>;
    getActionsSize(): number;
    clearActionsQueue():void;
    isInExecution(): boolean;
    setExecutionState(state: boolean): void;
    isActionQueueLocked(): boolean;
    setActionLockedState(state: boolean): void;
}

export interface FlowElementConstructor {
    new(
        executeCallsQueue: Queue<ExecuteCall>,
        actionQueue: Queue<Action>,
        id: Hashable
    ): FlowElement;
}

export interface FlowElementFactory {
    (id: Hashable): FlowElement;
}
