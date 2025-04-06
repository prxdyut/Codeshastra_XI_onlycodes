"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useToolCredits } from "@/app/hooks/useToolCredits";
import { toast } from "react-hot-toast";

export default function FormatTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { deductCredits, isProcessing } = useToolCredits();

    const getEndpoint = () => {
        switch (tool) {
            case "json-formatter":
                return "/json/format";
            case "markdown-formatter":
                return "/api/format-markdown";
            case "yaml-formatter":
                return "/api/format-yaml";
            case "xml-formatter":
                return "/api/format-xml";
            case "toml-formatter":
                return "/api/format-toml";
            default:
                return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First try to deduct credits
            await deductCredits();

            const response = await fetch(
                `http://localhost:5000${getEndpoint()}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: input }),
                }
            );
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to format");
            }
            setResult(data.formatted || data.html);
        } catch (err: any) {
            if (err.message === "Insufficient credits") {
                toast.error("You do not have enough credits to use this tool");
                return;
            }
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        return tool
            ?.split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{getTitle()}</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter ${tool?.split("-")[0]} to format...`}
                    className="w-full h-60 p-4 border rounded font-mono text-sm"
                    required
                />

                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                             hover:bg-[#6a8f74] disabled:opacity-50 
                             disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "Formatting..." : "Format"}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
                    {error}
                </div>
            )}

            {result && (
                <div className="border rounded-lg">
                    <div className="border-b bg-gray-50 p-2 flex justify-between items-center">
                        <span className="text-sm font-medium">
                            Formatted Result
                        </span>
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(result)
                            }
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <pre className="p-4 overflow-auto max-h-[400px] font-mono text-sm">
                        {result}
                    </pre>
                </div>
            )}
        </div>
    );
}
