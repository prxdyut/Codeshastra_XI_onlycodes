"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function UtilityTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let endpoint = "http://localhost:5000";
        let body = {};

        switch (tool) {
            case "qr-generator":
                endpoint += "/api/qr-generator";
                body = { text: input };
                break;
            case "password-generator":
                endpoint += "/generate/password";
                body = { length: parseInt(input) || 12 };
                break;
            case "url-shortener":
                endpoint += "/api/shorten-url";
                body = { url: input };
                break;
            case "api-tester":
                endpoint += "/api/test-endpoint";
                body = { url: input };
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: "Operation failed" });
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
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input..."
                    className="w-full p-2 border rounded"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74]"
                >
                    Submit
                </button>
            </form>
            {result && (
                <pre className="p-4 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}
