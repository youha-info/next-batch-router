import { parseUrl } from "next/dist/shared/lib/router/utils/parse-url";
import Router from "next/router";

type QueryValue =
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | null;
type QueryObject = Record<string, QueryValue | undefined>;

type SetQueryAction = QueryObject | ((prev: QueryObject) => QueryObject);
type QueueItem = {
    query: SetQueryAction;
    asQuery: SetQueryAction;
    hash?: string | null;
};
type PartialUrlObject = {
    query?: SetQueryAction;
    hash?: string | null;
};

type TransitionOptions = {
    shallow?: boolean;
    locale?: string; // false requires setting locale in the url, but BatchRouter only allows query and hash changes.
    scroll?: boolean;
};

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
    private queue: QueueItem[] = [];
    private pushHistory = false;
    private shallow: boolean = false;
    private scroll: boolean = false;
    private locale: string | undefined = undefined;
    private renderTriggered = false;

    private routePromise?: Promise<boolean> = undefined;
    private resolveRoutePromise?: (
        value: boolean | PromiseLike<boolean>
    ) => void = undefined;

    /** next/router pushed or replaced during this render cycle.
     * BatchRouter should not flush because pathname could have been changed.
     */
    private cancelled = false;

    public constructor(forceRender: () => void) {
        this.forceRender = forceRender;
    }

    public async push(
        url: PartialUrlObject,
        as?: PartialUrlObject,
        options: TransitionOptions = {}
    ) {
        return this.change("push", url, as, options);
    }

    public async replace(
        url: PartialUrlObject,
        as?: PartialUrlObject,
        options: TransitionOptions = {}
    ) {
        return this.change("replace", url, as, options);
    }

    private async change(
        history: "push" | "replace",
        url: PartialUrlObject,
        as?: PartialUrlObject,
        options: TransitionOptions = {}
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
        // No need for clear() if nothing has been push/replaced.
        if (!this.queue.length) {
            // this.cancelled must be changed to false on every flush.
            this.cancelled = false;
            return;
        }

        // If query change has been cancelled, ignore everything in queue, and resolve false just like next/router does.
        if (this.cancelled) {
            this.resolveRoutePromise?.(false);
            this.clear();
            return;
        }

        let newQuery: QueryObject = { ...Router.query };
        let newAsQuery: QueryObject = parseUrl(Router.asPath).query;
        let newHash: string | null = window.location.hash;

        for (const { query, asQuery, hash } of this.queue) {
            if (isUpdaterFunction(query)) newQuery = query(newQuery);
            else
                Object.entries(query)
                    .filter(([k, v]) => v !== undefined)
                    .forEach(([k, v]) => (newQuery[k] = v));

            if (isUpdaterFunction(asQuery)) newAsQuery = asQuery(newAsQuery);
            else
                Object.entries(asQuery)
                    .filter(([k, v]) => v !== undefined)
                    .forEach(([k, v]) => (newAsQuery[k] = v));

            if (hash !== undefined) newHash = hash;
        }

        Object.entries(newQuery).forEach(
            ([k, v]) => v == null && delete newQuery[k]
        );

        Object.entries(newAsQuery).forEach(
            ([k, v]) => v == null && delete newAsQuery[k]
        );

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
        this.cancelled = false;
    }

    /** Cancel query changes in this render cycle.
     * Called when route has been changed.
     */
    public cancel() {
        this.cancelled = true;
    }
}

function isUpdaterFunction<T extends QueryObject>(
    input: T | ((prevState: T) => T)
): input is (prevState: T) => T {
    return typeof input === "function";
}
