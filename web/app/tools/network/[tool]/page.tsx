import { Suspense } from "react";
import ContentWrapper from "@/app/components/layout/ContentWrapper";
import NetworkTools from "@/app/components/tools/NetworkTools";

export default function NetworkToolPage({
    params,
}: {
    params: { tool: string };
}) {
    return (
        <ContentWrapper>
            <Suspense fallback={<div>Loading...</div>}>
                <NetworkTools />
            </Suspense>
        </ContentWrapper>
    );
}
