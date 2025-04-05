"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function RandomTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [result, setResult] = useState<any>(null);

    const generateRandom = async () => {
        let endpoint = "http://localhost:5000";
        switch (tool) {
            case "random-number":
                endpoint += "/random/number";
                break;
            case "uuid-generator":
                endpoint += "/random/uuid/v4";
                break;
            case "dice-roll":
                endpoint += "/random/dice";
                break;
            case "coin-flip":
                endpoint += "/random/coin";
                break;
        }

        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: "Failed to generate" });
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
            <button
                onClick={generateRandom}
                className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74]"
            >
                Generate
            </button>
            {result && (
                <pre className="p-4 bg-gray-100 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}
