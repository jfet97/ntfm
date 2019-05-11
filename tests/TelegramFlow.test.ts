import { TelegramFlowFactory, TelegramFlow } from "../src/index"
const delay = (ms: number) => new Promise(ok => setTimeout(ok, ms));

describe("sanity check", () => {
    it("should work", () => {
        expect(true).toBe(true);
    });
});

describe("executeCalls registration: ", () => {

    const id = "12345678";

    let flow: TelegramFlow;
    beforeEach(() => {
        flow = TelegramFlowFactory();
    });

    it("registers a new executeCall with some data", done => {
        const passedData = {};

        flow.register(id, data => {
            expect(data.executeCallData).toBe(passedData);
            done();
        });

        flow.execute(id, passedData);
    });
});

describe("actions registration: ", () => {

    const id = "12345678";

    let flow: TelegramFlow;
    beforeEach(() => {
        flow = TelegramFlowFactory();
    });

    it("registers a new action", () => {
        flow.register(id, () => { });

        expect(flow.hasInQueue(id)).toBe(true);
        expect(flow.getActionsQueueLength(id)).toBe(1);
    });

    it("registers and executes an action", done => {
        flow.register(id, () => {
            done();
        });
        flow.execute(id, null);
    });

    it("registers and executes an async action", done => {
        flow.register(id, async () => {
            await delay(300);
            done();
        });
        flow.execute(id, null);
    });

    it("registers and executes an action with some data", done => {

        const passedData = {};

        flow.register(id, data => {
            expect(passedData).toBe(data.executeCallData);
            done();
        });

        flow.execute(id, passedData);
    });

    it("registers and executes an async action with some data", done => {

        const passedData = {};

        flow.register(id, async data => {
            expect(passedData).toBe(data.executeCallData);
            await delay(300);
            done();
        });

        flow.execute(id, passedData);
    });

    it("registers and executes a series of actions, with proper executeCall data and previousResult correctly stored", done => {

        const passedData1 = {};
        const returnedData1 = {};
        const passedData2 = {};

        flow.register(id,
            data => {
                expect(passedData1).toBe(data.executeCallData);
                return returnedData1;
            },
            data => {
                expect(passedData2).toBe(data.executeCallData);
                expect(returnedData1).toBe(data.previousResult);
                done();
            });

        flow.execute(id, passedData1);
        flow.execute(id, passedData2);
    });

    it("registers and executes a series of async actions, with proper executeCall data and previousResult correctly stored", done => {

        const passedData1 = {};
        const returnedData1 = {};
        const passedData2 = {};

        flow.register(id,
            async data => {
                expect(passedData1).toBe(data.executeCallData);
                await delay(300);
                return returnedData1;
            },
            async data => {
                expect(passedData2).toBe(data.executeCallData);
                expect(returnedData1).toBe(data.previousResult);
                await delay(300);
                done();
            });

        flow.execute(id, passedData1);
        flow.execute(id, passedData2);
    });

    it("repeat a registered action", done => {

        let counter = 0;

        flow.register(id, () => {
            if (counter++ < 5) {
                return { repeat: true }
            } else {
                done();
            }
        });

        setInterval(flow.execute.bind(flow), 100, id, null);
    });

    it("clear actions queue", () => {
        flow.register(id, () => { });
        flow.clear(id);

        expect(flow.hasInQueue(id)).toBe(false);
        expect(flow.getActionsQueueLength(id)).toBe(0);
    });

});
