import { useBatchRouter } from "src/BatchRouterContext";

export default function ErrorOnNoProviderPage() {
    try {
        const batchRouter = useBatchRouter();
        return <div>This will fail to render on client.</div>;
    } catch (e: any) {
        return (
            <div id="caught_error">
                {e.name}: {e.message}
            </div>
        );
    }
}

ErrorOnNoProviderPage.noProvider = true;
