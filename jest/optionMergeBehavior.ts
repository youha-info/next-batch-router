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

describe("BatchRouterCore option merge behavior", () => {
    test("Scroll defaults to true", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].scroll).toBe(true);
    });

    test("Mixed scroll options result in scroll", async () => {
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            scroll: true,
        });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            scroll: false,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].scroll).toBe(true);
    });

    test("All scroll options false results in no scroll", async () => {
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            scroll: false,
        });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            scroll: false,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].scroll).toBe(false);
    });

    test("No scroll option handled as true", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            scroll: false,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].scroll).toBe(true);
    });

    test("Shallow defaults to false", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].shallow).toBe(false);
    });

    test("Mixed shallow options result in no shallow routing", async () => {
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            shallow: true,
        });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            shallow: false,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].shallow).toBe(false);
    });

    test("All shallow options true results in shallow routing", async () => {
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            shallow: true,
        });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            shallow: true,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].shallow).toBe(true);
    });

    test("No shallow option handled as false", async () => {
        batchRouter.push({ query: { foo: "bar" } });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            shallow: true,
        });
        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].shallow).toBe(false);
    });

    test("Locale doesn't change if not specified", async () => {
        batchRouter.push({ query: { foo: "bar" } });

        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].locale).toBe(undefined);
    });

    test("Last defined locale is used", async () => {
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            locale: "en",
        });
        batchRouter.push({ query: { foo: "bar" } }, undefined, {
            locale: "ko",
        });
        batchRouter.push({ query: { foo: "bar" } });

        await batchRouter.flush();

        expect(mockRouter.push.mock.lastCall[2].locale).toBe("ko");
    });
});
