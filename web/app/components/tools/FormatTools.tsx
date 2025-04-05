"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function FormatTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let endpoint = "http://localhost:5000";
        switch (tool) {
            case "json-formatter":
                endpoint += "/json/format";
                break;
            case "markdown-formatter":
                endpoint += "/api/format-markdown";
                break;
            case "yaml-formatter":
                endpoint += "/api/format-yaml";
                break;
            case "xml-formatter":
                endpoint += "/api/format-xml";
                break;
            case "toml-formatter":
                endpoint += "/api/format-toml";
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input }),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: "Formatting failed" });
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">
                {tool
                    ?.split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text to format..."
                    className="w-full h-48 p-2 border rounded font-mono"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74]"
                >
                    Format
                </button>
            </form>
            {result && (
                <pre className="p-4 bg-gray-100 rounded overflow-auto font-mono">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}
