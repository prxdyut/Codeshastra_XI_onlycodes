"use client";

import { useState, useRef } from "react";

const LANGUAGES = [
    { id: "python", label: "Python", aceMode: "python" },
    { id: "javascript", label: "JavaScript", aceMode: "javascript" },
    { id: "typescript", label: "TypeScript", aceMode: "typescript" },
    { id: "html", label: "HTML", aceMode: "html" },
    { id: "css", label: "CSS", aceMode: "css" },
    { id: "java", label: "Java", aceMode: "java" },
    { id: "cpp", label: "C++", aceMode: "c_cpp" },
    { id: "csharp", label: "C#", aceMode: "csharp" },
];

export default function CodeFormatter() {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("python");
    const [result, setResult] = useState("");
    const resultRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/code/format", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    options: {
                        indentSize: 4,
                        insertSpaces: true,
                    },
                }),
            });
            const data = await response.json();
            setResult(data.formatted_code);

            // Auto scroll to result
            setTimeout(() => {
                resultRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }, 100);
        } catch (error) {
            setResult("Error formatting code");
        }
    };

    return (
        <div className="min-h-screen pb-8">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Code Formatter</h1>

                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors
                                ${
                                    language === lang.id
                                        ? "bg-[#78A083] text-white"
                                        : "bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`Enter your ${
                                LANGUAGES.find((l) => l.id === language)
                                    ?.label || ""
                            } code here...`}
                            className="w-full h-[60vh] p-4 border rounded font-mono 
                                     bg-gray-50 focus:bg-white
                                     transition-colors
                                     text-sm leading-relaxed
                                     resize-none
                                     focus:outline-none focus:ring-2 focus:ring-[#78A083]"
                        />
                        <div className="absolute top-2 right-2 text-xs text-gray-400">
                            Language:{" "}
                            {LANGUAGES.find((l) => l.id === language)?.label}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-3 bg-[#78A083] text-white rounded 
                                 hover:bg-[#6a8f74] transition-colors
                                 font-medium"
                    >
                        Format Code
                    </button>
                </form>

                {result && (
                    <div ref={resultRef} className="rounded border">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                            <h3 className="text-sm font-medium">
                                Formatted Code
                            </h3>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(result);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                        <pre className="p-4 overflow-auto font-mono text-sm">
                            {result}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
