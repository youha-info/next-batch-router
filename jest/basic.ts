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

describe("BatchRouterCore", () => {
    test("Push and flush", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[0]).toMatchObject({
            query: { foo: "bar" },
        });
    });

    test("Replace and flush", async () => {
        batchRouter.replace({ query: { foo: "bar" } });
        await batchRouter.flush();

        expect(mockRouter.replace.mock.lastCall[0]).toMatchObject({
            query: { foo: "bar" },
        });
    });

    test("Flush with empty queue does nothing", async () => {
        mockRouter.push = jest.fn();
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall).toBe(undefined);
    });

    test("Only as changed", async () => {
        batchRouter.push({}, { query: { foo: "bar" } });

        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[0]).toMatchObject({
            query: {},
        });
        expect(mockRouter.push.mock.lastCall[1]).toMatchObject({
            query: { foo: "bar" },
            hash: "",
        });
    });

    test("Hash change", async () => {
        batchRouter.push({ hash: "hash" });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[1]).toMatchObject({
            query: {},
            hash: "hash",
        });
    });

    test("As hash is prioritized", async () => {
        batchRouter.push({ hash: "query" }, { hash: "as" });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[1]).toMatchObject({
            query: {},
            hash: "as",
        });
    });
});
