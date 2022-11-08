import { parseUrl } from "next/dist/shared/lib/router/utils/parse-url";
import Router from "next/router";

export namespace BatchRouterTypes {
    export type NextQueryValue = string | string[] | undefined;
    export type WriteQueryValue =
        | NextQueryValue
        | number
        | boolean
        | (string | number | boolean)[]
        | null;

    export type NextQueryObject = Record<string, NextQueryValue>;
    export type WriteQueryObject = Record<string, WriteQueryValue>;

    export type SetQueryAction =
        | WriteQueryObject
        | ((prev: NextQueryObject) => WriteQueryObject);
    export type QueueItem = {
        query: SetQueryAction;
        asQuery: SetQueryAction;
        hash?: string | null;
    };
    export type PartialUrlObject = {
        query?: SetQueryAction;
        hash?: string | null;
    };

    export type TransitionOptions = {
        shallow?: boolean;
        locale?: string; // false requires setting locale in the url, but BatchRouter only allows query and hash changes.
        scroll?: boolean;
    };
}

/**
 * Subset of next/router that allows for multiple consecutive query string changes by batch updating and functinoal update.
 *
 * `push` and `replace` calls are merged together and applied at the start of the next render cycle.
 *
 * `push` and `replace` calls only take `query` object and `hash` of the route.
 * Use original next/router for changing pathname or inserting query as a string.
 *
 * Unlike next/router, it preserves hash unless overwritten as `null`.
 */
export type BatchRouter = Pick<BatchRouterCore, "push" | "replace">;

export class BatchRouterCore {
    private forceRender: () => void;
    private queue: BatchRouterTypes.QueueItem[] = [];
    private pushHistory = false;
    private shallow: boolean = false;
    private scroll: boolean = false;
    private locale: string | undefined = undefined;
    private renderTriggered = false;

    private routePromise?: Promise<boolean> = undefined;
    private resolveRoutePromise?: (
        value: boolean | PromiseLike<boolean>
    ) => void = undefined;

    public constructor(forceRender: () => void) {
        this.forceRender = forceRender;
    }

    public async push(
        url: BatchRouterTypes.PartialUrlObject,
        as?: BatchRouterTypes.PartialUrlObject,
        options: BatchRouterTypes.TransitionOptions = {}
    ) {
        return this.change("push", url, as, options);
    }

    public async replace(
        url: BatchRouterTypes.PartialUrlObject,
        as?: BatchRouterTypes.PartialUrlObject,
        options: BatchRouterTypes.TransitionOptions = {}
    ) {
        return this.change("replace", url, as, options);
    }

    private async change(
        history: "push" | "replace",
        url: BatchRouterTypes.PartialUrlObject,
        as?: BatchRouterTypes.PartialUrlObject,
        options: BatchRouterTypes.TransitionOptions = {}
    ) {
        // Add to queue for batching
        this.queue.push({
            query: url.query ?? {},
            asQuery: as?.query ?? url.query ?? {},
            hash: as?.hash !== undefined ? as.hash : url.hash,
        });

        // Merge options instead of queueing them
        if (history === "push") this.pushHistory = true;
        if (options.scroll !== false) this.scroll = true; // All must be false to be false.
        if (options.shallow !== true) this.shallow = false; // All must be true to be true.
        if (options.locale !== undefined) this.locale = options.locale;

        // Trigger force render so that flush() would be called.
        // Needs to queueMicrotask because rerender happened between multiple calls to this method.
        // This problem occured when using lodash.debounce.
        // Might need to use setTimeout if other timing issues occur.
        if (!this.renderTriggered) {
            queueMicrotask(() => this.forceRender());
            // this.renderTriggered is required for triggering rerender once.
            // using queueMicrotask caused multiple unneeded rerenders.
            this.renderTriggered = true;
        }

        return this.routePromise;
    }
    public async flush() {
        if (!this.queue.length) return;

        let newQuery: BatchRouterTypes.NextQueryObject = { ...Router.query };
        let newAsQuery: BatchRouterTypes.NextQueryObject = parseUrl(
            Router.asPath
        ).query;
        let newHash: string | null = window.location.hash;

        for (const { query, asQuery, hash } of this.queue) {
            if (isUpdaterFunction(query))
                newQuery = turnWriteQueryObjectToNextQueryObject(
                    query(newQuery)
                );
            else applyWriteQueryObjectToNextQueryObject(query, newQuery);

            if (isUpdaterFunction(asQuery))
                newAsQuery = turnWriteQueryObjectToNextQueryObject(
                    asQuery(newAsQuery)
                );
            else applyWriteQueryObjectToNextQueryObject(asQuery, newAsQuery);

            if (hash !== undefined) newHash = hash;
        }

        const routePromise = (this.pushHistory ? Router.push : Router.replace)(
            { query: newQuery },
            { query: newAsQuery, hash: newHash },
            { scroll: this.scroll, shallow: this.shallow, locale: this.locale }
        );

        this.resolveRoutePromise?.(routePromise);

        this.clear();

        return routePromise;
    }

    private clear() {
        this.pushHistory = false;
        this.queue = [];
        this.renderTriggered = false;
        this.shallow = true;
        this.scroll = false;
        this.locale = undefined;
        this.routePromise = new Promise(
            (resolve) => (this.resolveRoutePromise = resolve)
        );
    }
}

function isUpdaterFunction(
    input:
        | BatchRouterTypes.WriteQueryObject
        | ((
              prevState: BatchRouterTypes.NextQueryObject
          ) => BatchRouterTypes.WriteQueryObject)
): input is (
    prevState: BatchRouterTypes.NextQueryObject
) => BatchRouterTypes.WriteQueryObject {
    return typeof input === "function";
}

function turnWriteQueryObjectToNextQueryObject(
    obj: BatchRouterTypes.WriteQueryObject
) {
    const nextQueryObj: BatchRouterTypes.NextQueryObject = {};
    for (const [k, v] of Object.entries(obj))
        if (v != null)
            nextQueryObj[k] = Array.isArray(v) ? v.map(String) : String(v);

    return nextQueryObj;
}

function applyWriteQueryObjectToNextQueryObject(
    write: BatchRouterTypes.WriteQueryObject,
    obj: BatchRouterTypes.NextQueryObject
) {
    // TODO: Should clone?
    for (const [k, v] of Object.entries(write)) {
        if (v === undefined) continue;
        else if (v === null) delete obj[k];
        else obj[k] = Array.isArray(v) ? v.map(String) : String(v);
    }
}
