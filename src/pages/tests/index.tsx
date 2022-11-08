import { useRouter } from "next/router";
import { nextTick } from "process";
import { useBatchRouter } from "src/BatchRouterContext";

export default function TestPage() {
    const router = useRouter();
    const batchRouter = useBatchRouter();

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div id="query">{JSON.stringify(router.query)}</div>

            {Object.entries<(e: any) => void>({
                // single calls
                singlePush: () => batchRouter.push({ query: { foo: "bar" } }),
                singleReplace: () =>
                    batchRouter.replace({ query: { foo: "bar" } }),

                // multiple calls in one component
                multiplePush: () => {
                    batchRouter.push({ query: { f1: 1 } });
                    batchRouter.push({ query: { f2: 2 } });
                    batchRouter.push({ query: { f3: 3 } });
                },
                multipleReplace: () => {
                    batchRouter.replace({ query: { f1: 1 } });
                    batchRouter.replace({ query: { f2: 2 } });
                    batchRouter.replace({ query: { f3: 3 } });
                },
                multipleMixed: () => {
                    batchRouter.replace({ query: { f1: 1 } });
                    batchRouter.push({ query: { f2: 2 } });
                    batchRouter.replace({ query: { f3: 3 } });
                },

                // calling from outside of render loop
                pushWithSetTimeout: () => {
                    setTimeout(() => {
                        batchRouter.push({ query: { f1: 1 } });
                        batchRouter.push({ query: { f2: 2 } });
                        batchRouter.push({ query: { f3: 3 } });
                    }, 500);
                },
                pushWithNextTick: () => {
                    nextTick(() => {
                        batchRouter.push({ query: { f1: 1 } });
                        batchRouter.push({ query: { f2: 2 } });
                        batchRouter.push({ query: { f3: 3 } });
                    });
                },
                pushWithQueueMicrotask: () => {
                    queueMicrotask(() => {
                        batchRouter.push({ query: { f1: 1 } });
                        batchRouter.push({ query: { f2: 2 } });
                        batchRouter.push({ query: { f3: 3 } });
                    });
                },

                // functional update
                clearQuery: () => batchRouter.push({ query: () => ({}) }),
                appendFoo: () =>
                    batchRouter.push({
                        query: (prev) => ({
                            ...prev,
                            foo: (prev.foo ?? "") + "bar",
                        }),
                    }),
                
                // array value
                setArrayValues:()=>{
                    batchRouter.push({query:{a:[1,2]}})
                    batchRouter.push({query:{b:[3,4]}})
                },
                arrayValueFunctionalUpdate:()=>{
                    batchRouter.push({
                        query: (prev) => ({ a: [...(prev.a || []), 10,11] }),
                    });
                },

                // nextjs hash bug related
                clearQueryWithNextjs: () =>
                    router.push({ query: {}, hash: window.location.hash }),
                clearQueryAndHash: () =>
                    batchRouter.push({ query: () => ({}), hash: null }),

                // hash behavior
                setHashTogether: () => {
                    batchRouter.push({ query: { f1: 1 }, hash: "h1" });
                    batchRouter.push({ query: { f2: 2 }, hash: "h2" });
                    batchRouter.push({ query: { f3: 3 }, hash: "h3" });
                },
                setHashWithLastNull: () => {
                    batchRouter.push({ query: { f1: 1 }, hash: "h1" });
                    batchRouter.push({ query: { f2: 2 }, hash: "h2" });
                    batchRouter.push({ query: { f3: 3 }, hash: null });
                },
                setHashWithLastEmpty: () => {
                    batchRouter.push({ query: { f1: 1 }, hash: "h1" });
                    batchRouter.push({ query: { f2: 2 }, hash: "h2" });
                    batchRouter.push({ query: { f3: 3 }, hash: "" });
                },

                // as behavior
                testAs: () =>
                    batchRouter.push({ query: { q: 1 } }, { query: { a: 2 } }),
                hideQueryFromURL: () =>
                    batchRouter.push({ query: { q: 1 } }, { query: {} }),
                onlyChangeAs: () => batchRouter.push({}, { query: { a: 2 } }),
                asAttributesDefaultsToQuery: () => {
                    batchRouter.push({ query: { q: 1 } }, { query: { a: 2 } });
                    batchRouter.push(
                        { query: { a: 3 }, hash: "hash" },
                        { query: { b: 4 } }
                    );
                    // results in query: q=1&a=3 / url: a=2&b=4 / hash: #hash
                },
                functionalUpdateOnAs: () => {
                    batchRouter.push(
                        { query: { q: 1 } },
                        {
                            query: (prev) => ({
                                ...prev,
                                a: (prev.a ?? "") + "append",
                            }),
                        }
                    );
                },

                // edge case
                emptyArgs: () => batchRouter.push({}, {}),
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </div>
    );
}
