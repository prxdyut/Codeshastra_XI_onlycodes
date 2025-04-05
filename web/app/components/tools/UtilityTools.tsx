"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function UtilityTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let endpoint = "http://localhost:5000";
        let method = "POST";
        let body: any = {};

        switch (tool) {
            case "qr-generator":
                endpoint += "/api/generate-qrcode";
                method = "GET";
                endpoint += `?text=${encodeURIComponent(input)}`;
                break;
            case "password-generator":
                endpoint += "/generate/password";
                method = "GET";
                endpoint += `?length=${parseInt(input) || 12}`;
                break;
            case "url-shortener":
                endpoint += "/api/shorten-url";
                body = { url: input };
                break;
            case "api-tester":
                endpoint += "/api/test-endpoint";
                try {
                    body = JSON.parse(input);
                } catch {
                    setError("Invalid JSON input");
                    setLoading(false);
                    return;
                }
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method,
                headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
                body: method === "POST" ? JSON.stringify(body) : undefined,
            });

            if (tool === "qr-generator") {
                const blob = await response.blob();
                setResult(URL.createObjectURL(blob));
            } else {
                const data = await response.json();
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPlaceholder = () => {
        switch (tool) {
            case "qr-generator":
                return "Enter text or URL to generate QR code...";
            case "password-generator":
                return "Enter password length (default: 12)...";
            case "url-shortener":
                return "Enter URL to shorten...";
            case "api-tester":
                return "Enter API test configuration in JSON format...";
            default:
                return "Enter input...";
        }
    };

    const renderResult = () => {
        if (!result) return null;

        switch (tool) {
            case "qr-generator":
                return (
                    <div className="flex flex-col items-center gap-4">
                        <img 
                            src={result} 
                            alt="Generated QR Code"
                            className="max-w-[300px] border rounded p-2" 
                        />
                        <a 
                            href={result}
                            download="qrcode.png"
                            className="text-blue-500 hover:underline text-sm"
                        >
                            Download QR Code
                        </a>
                    </div>
                );
            
            case "password-generator":
                return (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded border">
                        <span className="font-mono">{result.password}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(result.password)}
                            className="text-xs text-blue-500 hover:underline"
                        >
                            Copy
                        </button>
                    </div>
                );

            case "url-shortener":
                return (
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="font-medium mb-2">Shortened URL:</p>
                        <a 
                            href={result.short_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline break-all"
                        >
                            {result.short_url}
                        </a>
                    </div>
                );

            default:
                return (
                    <pre className="p-4 bg-gray-50 rounded border overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                );
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">
                {tool?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={renderPlaceholder()}
                    rows={tool === "api-tester" ? 10 : 3}
                    className="w-full p-3 border rounded font-mono text-sm"
                    required
                />

                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                             hover:bg-[#6a8f74] disabled:opacity-50 
                             disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "Processing..." : "Submit"}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
                    {error}
                </div>
            )}

            {result && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="border-b bg-gray-50 p-2">
                        <span className="text-sm font-medium">Result</span>
                    </div>
                    <div className="p-4">
                        {renderResult()}
                    </div>
                </div>
            )}
        </div>
    );
}
