"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function ConversionTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        let endpoint = "http://localhost:5000";
        switch (tool) {
            case "csv-to-excel":
                endpoint += "/convert/csv-to-excel";
                break;
            case "excel-to-csv":
                endpoint += "/api/excel-to-csv";
                break;
            case "image-converter":
                endpoint += "/api/convert-image";
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: "Conversion failed" });
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
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74]"
                >
                    Convert
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
