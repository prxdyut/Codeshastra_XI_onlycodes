"use client";
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
    "csv-to-excel": ConversionTools,
    "excel-to-csv": ConversionTools,
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

export default function ToolPage({ params }: { params: { tool: string } }) {
    const Component = toolComponents[params.tool];

    if (!Component) {
        return notFound();
    }

    return (
        <div className="p-6">
            <Component />
        </div>
    );
}
