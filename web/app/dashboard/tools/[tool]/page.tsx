"use client";
import { use, useEffect } from "react";
import { notFound } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CodeFormatter from "@/app/components/tools/CodeFormatter";
import NetworkTools from "@/app/components/tools/NetworkTools";
import RandomTools from "@/app/components/tools/RandomTools";
import ConversionTools from "@/app/components/tools/ConversionTools";
import FormatTools from "@/app/components/tools/FormatTools";
import UtilityTools from "@/app/components/tools/UtilityTools";
import MiscTools from "@/app/components/tools/MiscTools";

const toolComponents: Record<string, React.ComponentType> = {
    // Code Tools
    "code-formatter": CodeFormatter,

    // Network Tools
    "ip-lookup": NetworkTools,
    "dns-lookup": NetworkTools,
    "ping-test": NetworkTools,
    traceroute: NetworkTools,

    // Random Tools
    "random-number": RandomTools,
    "uuid-generator": RandomTools,
    "dice-roll": RandomTools,
    "coin-flip": RandomTools,

    // Conversion Tools
    "csv-excel": ConversionTools,
    "image-converter": ConversionTools,

    // Format Tools
    "json-formatter": FormatTools,
    "markdown-formatter": FormatTools,
    "yaml-formatter": FormatTools,
    "xml-formatter": FormatTools,
    "toml-formatter": FormatTools,

    // Separate Utility and Misc tools properly
    "qr-generator": UtilityTools,
    "password-generator": UtilityTools,
    "url-shortener": UtilityTools,
    "api-tester": UtilityTools,

    // Misc tools
    "currency-converter": MiscTools,
    "time-converter": MiscTools,
    "email-lookup": MiscTools,
};

export default function ToolPage({
    params,
}: {
    params: Promise<{ tool: string }>;
}) {
    const resolvedParams = use(params);
    const Component = toolComponents[resolvedParams.tool];
    const { user } = useUser();

    useEffect(() => {
        const decreaseCredits = async () => {
            try {
                if (!user) return;
                
                const response = await fetch(`/api/users/decrease-credits?clerkUserId=${user.id}&amount=0.5`);
                const data = await response.json();
                
                if (!response.ok) {
                    console.error('Failed to decrease credits:', data.error);
                    // You might want to handle insufficient credits here
                    if (data.error === 'Insufficient credits') {
                        // Handle insufficient credits (e.g., show a message or redirect)
                    }
                }
            } catch (error) {
                console.error('Error decreasing credits:', error);
            }
        };

        decreaseCredits();
    }, [user]); // Run once when component mounts and user is available

    if (!Component) {
        return notFound();
    }

    return (
        <div className="p-6">
            <Component />
        </div>
    );
}
