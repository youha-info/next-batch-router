import { useRouter } from "next/router";
import { useRef } from "react";
import { useBatchRouter } from "src/BatchRouterContext";

export default function CheckRenderTerminationOnURLChangePage() {
    const router = useRouter();
    const batchRouter = useBatchRouter();
    const counter = useRef(0);

    counter.current++;

    return (
        <div>
            <div id="query">{JSON.stringify(router.query)}</div>
            <div id="counter">{counter.current}</div>
            <button
                id="checkRenderTerminationOnURLChange"
                onClick={() => {
                    batchRouter.push({ query: { foo: "bar" } });
                }}
            >
                checkRenderTerminationOnURLChange
            </button>
        </div>
    );
}
