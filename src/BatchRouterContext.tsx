import React, { ReactNode, useContext, useReducer, useRef } from "react";
import { BatchRouter, BatchRouterCore } from "./BatchRouterCore";

const BatchRouterContext = React.createContext<BatchRouterCore | null>(null);

type Props = {
    children?: ReactNode | undefined;
};

/** Provider required to use useBatchRouter hook */
export function BatchRouterProvider(props: Props) {
    const [, forceRender] = useReducer((prev) =>  prev + 1, 0);
    const batchRouter = useRef(new BatchRouterCore(forceRender));

    batchRouter.current.flush();

    return (
        <BatchRouterContext.Provider value={batchRouter.current}>
            {props.children}
        </BatchRouterContext.Provider>
    );
}

/** Get the BatchRouter instance. */
export function useBatchRouter() {
    const batchRouter = useContext(BatchRouterContext);
    if (batchRouter === null)
        throw Error(
            "Could not find BatchRouter. Please ensure the component is wrapped in a <BatchRouterProvider>"
        );
    return batchRouter as BatchRouter;
}
