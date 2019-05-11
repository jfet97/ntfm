import { Queue } from "../interfaces/QueueInterface";
import { FlowElement, FlowElementConstructor } from "../interfaces/FlowElement";
import { Hashable } from "../../Types/HashableType"
import { ExecuteCall } from "../../Types/ExecuteCallType";
import { Action } from "../../Types/ActionType";

import { staticImplements } from "../../Decorators/staticImplements"

// implementation of the QueueSetElement interface

// when any UserFlowData will be instantiated, e.g. new UserFlowData(...),
// UserFlowData.prototype.constructor (CHECKED_CONSTRUCTOR_TYPE) will be checked
// and it will have to be of type QueueSetElementConstructor (WANTED_CONSTRUCTOR_TYPE)
// or a more specific extension of it
// so if UserFlowData.prototype.constructor will implement correctly QueueSetElementConstructor
// the check will end successfully
// anyway, because of the type signature of the decorator, a check is done also at compiletime

@staticImplements<FlowElementConstructor>()
export class UserFlowData implements FlowElement {


    private inExecution: boolean;

    // true when a flow of actions is being executed
    // false otherwise
    private lockActionQueue: boolean;

    // store te result of an action
    // between two possible different calls to
    // async do()
    public prevResult: any = null;

    public constructor(
        private executeCalls: Queue<ExecuteCall>,
        private actions: Queue<Action>,
        private id: Hashable) {

        this.inExecution = false;
        this.lockActionQueue = false;
    }

    public getId(): Hashable {
        return this.id;
    }

    public enqueueExecuteCall(ec: ExecuteCall): void {
        return this.executeCalls.enqueue(ec);
    }
    public dequeueExecuteCall(): ExecuteCall | undefined {
        return this.executeCalls.dequeue();
    }
    public peekFirstExecuteCall(): ExecuteCall | undefined {
        return this.executeCalls.peekFirst();
    }
    public getExecuteCallsSize(): number {
        return this.executeCalls.getSize();
    }
    public enqueueAction(ac: Action): void {
        return this.actions.enqueue(ac);
    }
    public dequeueAction(): Action | undefined {
        return this.actions.dequeue();
    }
    public peekFirstAction(): Action | undefined {
        return this.actions.peekFirst();
    }
    public getActionsSize(): number {
        return this.actions.getSize();
    }
  

    public clearExecuteCallsQueue(): void {
        this.executeCalls.clear();
    }
    public clearActionsQueue(): void {
        this.actions.clear();
    }

    public getExecuteCallIterator(): IterableIterator<ExecuteCall> {
        return this.executeCalls[Symbol.iterator]();
    }
    public getActionIterator(): IterableIterator<Action> {
        return this.actions[Symbol.iterator]();
    }

    public isInExecution(): boolean {
        return this.inExecution;
    }

    public setExecutionState(state: boolean): void {
        if (typeof state === "boolean") {
            this.inExecution = state;
        } else {
            throw new TypeError("setExecutionState() method require a boolean parameter");
        }
    }

    public isActionQueueLocked(): boolean {
        return this.lockActionQueue;
    }

    public setActionLockedState(state: boolean): void {
        if (typeof state === "boolean") {
            this.lockActionQueue = state;
        } else {
            throw new TypeError("setActionLockedState() method require a boolean parameter");
        }
    }

}