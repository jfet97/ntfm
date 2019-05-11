import { FlowElement, FlowElementFactory } from "./interfaces/FlowElement";
import { Hashable } from "../Types/HashableType";
import { ExecuteCall } from "../Types/ExecuteCallType";
import { Action } from "../Types/ActionType";

export interface TelegramFlowConstructor {
  new(
    FlowElementFactory: FlowElementFactory,
  ): TelegramFlow;
}

export interface TelegramFlow {
  register(id: Hashable, ...actions: Array<Action>): void;
  hasInQueue(id: Hashable): boolean;
  getActionsQueueLength(id: Hashable): number;
  execute(id: Hashable, data: any): void;
  clear(id: Hashable): void;
}

export class TelegramFlowImp implements TelegramFlow {
  private flowElementsArray: Array<FlowElement> = [];

  public constructor(
    private FlowElementFactory: FlowElementFactory,
  ) { }

  public register(id: Hashable, ...actions: Array<Action>): void {
    // if the internal flowElementsArray has not a flowElement with the received id
    // we are going to create a new one, then we will insert the received actions
    if (!this.isThereAnElementWithId(id)) {
      const newFlowElement = this.FlowElementFactory(id);
      actions.forEach(act => newFlowElement.enqueueAction(act));
      // lock the insertion of actions
      newFlowElement.setActionLockedState(true);
      this.flowElementsArray.push(newFlowElement);

    } else {
      // was already there one, so we insert actions only if it the insertion of actions is not locked
      const el = this.findElementById(id);
      if (el && !el.isActionQueueLocked()) {
        actions.forEach(act => el.enqueueAction(act));
        // lock the insertion of actions
        el.setActionLockedState(true);
      }
    }
  }

  public hasInQueue(id: Hashable): boolean {
    // check if a flowElement exists
    // and, if so, if there are actions in queue
    // otherwise return false
    const el = this.findElementById(id);
    return !!(el && el.getActionsSize() !== 0);
  }

  public execute(id: Hashable, data: any): void {
    const el = this.findElementById(id);

    // if an element with that id was not present
    // or no actions were registered
    if (typeof el === "undefined" || el.getActionsSize() === 0) {
      // do nothing, discard the call to execute
      // because no actions were registered
      return;
    }

    // check if we an action is under execution
    if (el.isInExecution()) {
      // if so, only register the call to execute
      el.enqueueExecuteCall(data);
    } else {
      // if no action is under execution but some actions were present
      // it means that we have to trigger the execution of the oldest action

      // turn on the execution state
      el.setExecutionState(true);

      //register the call to execute
      el.enqueueExecuteCall(data);

      // call the internal do() async function
      this.do(el); // no need to await it, only start the async process
    }

  }

  private async do(el: FlowElement): Promise<any> {
    // the real async execution function

    // until there are some actions to execute...
    while (el.getActionsSize() !== 0) {

      // peek the oldest action
      const act = el.peekFirstAction();

      // var for store the current result given by
      // each call to an action 
      let res: any;

      do {
        // are there any registered calls to execute?
        if (el.getExecuteCallsSize() !== 0) {
          // use the oldest executeCall data and
          // the previous result to execute the action
          const executeCallData: ExecuteCall = el.dequeueExecuteCall();

          // because of the while check is impossible that act would be undefined
          // but TS is a mess
          res = await (act ? act({
            executeCallData,
            previousResult: el.prevResult,
          }) : null);
        } else {
          // no? we have to stop the actions execution
          el.setExecutionState(false);
          return;
        }

        // until the action won't fail (fail == return {repeat:true})
      } while (typeof res === "object" && res && res.repeat === true);


      // if the action was successfully executed
      // we can remove it
      el.dequeueAction();

      // and we can update the previous result
      el.prevResult = res;
    }

    // no more actions to execute
    // unlock the insertion of other actions
    // exit from the execution state
    // clear all the queues to erase other unuseful data
    // like other executeCalls data
    this.clear(el.getId());

    // reset prevResult to null
    el.prevResult = null;
  }

  public clear(id: Hashable): void {
    const el = this.findElementById(id);

    if (typeof el !== "undefined") {
      el.clearExecuteCallsQueue();
      el.clearActionsQueue();
      el.setActionLockedState(false);
      el.setExecutionState(false);
    }
  }

  public getActionsQueueLength(id: Hashable): number {
    const el = this.findElementById(id);
    return el ? el.getActionsSize() : 0;
  }

  private findElementById(id: Hashable) {
    return this.flowElementsArray.find(el => el.getId() === id);
  }

  private isThereAnElementWithId(id: Hashable) {
    return this.flowElementsArray.some(el => el.getId() === id);
  }

}



