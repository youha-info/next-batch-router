import Router from "next/router";
import { useBatchRouter } from "src/BatchRouterContext";

export default function TestPage() {
    const batchRouter = useBatchRouter();

    return (
        <div>
            <button
                onClick={() => {
                    batchRouter.push({ query: ()=>({})});
                }}
            >
                reset
            </button>
            <button
                onClick={() => {
                    batchRouter.push({ query: { a: 1 } });
                    batchRouter.push({ query: { b: 2 } });
                    batchRouter.push({ query: { c: 3 } });
                    Router.push("/test2")
                }}
            >
                test
            </button>
        </div>
    );
}
