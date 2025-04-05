"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import CodeFormatter from "@/app/components/tools/CodeFormatter";
import NetworkTools from "@/app/components/tools/NetworkTools";
import RandomTools from "@/app/components/tools/RandomTools";
import ConversionTools from "@/app/components/tools/ConversionTools";
import FormatTools from "@/app/components/tools/FormatTools";
import UtilityTools from "@/app/components/tools/UtilityTools";

const toolComponents: Record<string, React.ComponentType> = {
    "code-formatter": CodeFormatter,
    "ip-lookup": NetworkTools,
    "dns-lookup": NetworkTools,
    "ping-test": NetworkTools,
    traceroute: NetworkTools,
    "random-number": RandomTools,
    "uuid-generator": RandomTools,
    "dice-roll": RandomTools,
    "coin-flip": RandomTools,
    "csv-excel-editor": ConversionTools, // Keep only this one, remove "excel-to-csv"
    "image-converter": ConversionTools,
    "json-formatter": FormatTools,
    "markdown-formatter": FormatTools,
    "yaml-formatter": FormatTools,
    "xml-formatter": FormatTools,
    "toml-formatter": FormatTools,
    "qr-generator": UtilityTools,
    "password-generator": UtilityTools,
    "url-shortener": UtilityTools,
    "api-tester": UtilityTools,
};

export default function ToolPage({
    params,
}: {
    params: Promise<{ tool: string }>;
}) {
    const resolvedParams = use(params);
    const Component = toolComponents[resolvedParams.tool];

    if (!Component) {
        return notFound();
    }

    return (
        <div className="p-6">
            <Component />
        </div>
    );
}
