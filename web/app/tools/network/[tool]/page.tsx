import { use, Suspense } from "react";
import ContentWrapper from "@/app/components/layout/ContentWrapper";
import NetworkTools from "@/app/components/tools/NetworkTools";

export default function NetworkToolPage({
    params,
}: {
    params: Promise<{ tool: string }>;
}) {
    const resolvedParams = use(params);

    return (
        <ContentWrapper>
            <Suspense fallback={<div>Loading...</div>}>
                <NetworkTools />
            </Suspense>
        </ContentWrapper>
    );
}
