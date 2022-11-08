import { describe, expect, test } from "@jest/globals";

import { BatchRouterCore } from "../src/BatchRouterCore";

import Router from "next/router";

const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    asPath: "http://localhost/",
};

Router.router = mockRouter as any;

globalThis.window = { location: { hash: "" } } as any;

const batchRouter = new BatchRouterCore(() => {});

describe("BatchRouterCore query merge behavior", () => {
    test("Prev state serialized to string", async () => {
        batchRouter.push({ query: { foo: 1, bar: true } });
        const updateFunction = jest.fn((prev) => prev);
        batchRouter.push({ query: updateFunction });
        await batchRouter.flush();

        expect(updateFunction.mock.lastCall?.[0]).toMatchObject({
            foo: "1",
            bar: "true",
        });
    });

    test("Prev state with array serialized to string array", async () => {
        batchRouter.push({ query: { foo: [1, 2], bar: [true, false] } });
        const updateFunction = jest.fn((prev) => prev);
        batchRouter.push({ query: updateFunction });
        await batchRouter.flush();

        expect(updateFunction.mock.lastCall?.[0]).toMatchObject({
            foo: ["1", "2"],
            bar: ["true", "false"],
        });
    });

    test("Prev state from functional update serialized to string", async () => {
        batchRouter.push({ query: () => ({ foo: 1, bar: true }) });
        const updateFunction = jest.fn((prev) => prev);
        batchRouter.push({ query: updateFunction });
        await batchRouter.flush();

        expect(updateFunction.mock.lastCall?.[0]).toMatchObject({
            foo: "1",
            bar: "true",
        });
    });

    test("Undefined is ignored", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        batchRouter.push({ query: { foo: undefined } });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[0]).toMatchObject({
            query: { foo: "bar" },
        });
    });

    test("Null removes param", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        batchRouter.push({ query: { foo: null } });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[0]).toMatchObject({});
    });
});
