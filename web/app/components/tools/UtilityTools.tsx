"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useToolCredits } from "@/app/hooks/useToolCredits";
import { toast } from "react-hot-toast";

interface ApiTestConfig {
    url: string;
    method: string;
    headers: { key: string; value: string }[];
    queryParams: { key: string; value: string }[];
    body: string;
    authType: string;
    authToken: string;
    username: string;
    password: string;
}

export default function UtilityTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const { deductCredits, isProcessing } = useToolCredits();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only keep API Tester config
    const [apiConfig, setApiConfig] = useState<ApiTestConfig>({
        url: "",
        method: "GET",
        headers: [{ key: "", value: "" }],
        queryParams: [{ key: "", value: "" }],
        body: "",
        authType: "none",
        authToken: "",
        username: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First try to deduct credits
            await deductCredits();

            let endpoint = "http://localhost:5000";
            let requestOptions: RequestInit = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };

            switch (tool) {
                case "qr-generator":
                    endpoint += `/api/generate-qrcode?text=${encodeURIComponent(
                        input
                    )}`;
                    const qrResponse = await fetch(endpoint);
                    if (!qrResponse.ok)
                        throw new Error("Failed to generate QR code");
                    const blob = await qrResponse.blob();
                    setResult(URL.createObjectURL(blob));
                    setLoading(false);
                    return;

                case "password-generator":
                    endpoint += `/generate/password?length=${
                        parseInt(input) || 12
                    }`;
                    break;

                case "url-shortener":
                    endpoint += "/api/shorten-url";
                    requestOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: input }),
                    };
                    break;

                case "api-tester":
                    endpoint += "/api/test-endpoint";

                    const headers: Record<string, string> = apiConfig.headers
                        .filter((h) => h.key && h.value)
                        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

                    const queryParams = apiConfig.queryParams
                        .filter((p) => p.key && p.value)
                        .reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {});

                    if (apiConfig.authType === "bearer") {
                        headers[
                            "Authorization"
                        ] = `Bearer ${apiConfig.authToken}`;
                    } else if (apiConfig.authType === "basic") {
                        headers["Authorization"] = `Basic ${btoa(
                            `${apiConfig.username}:${apiConfig.password}`
                        )}`;
                    }

                    requestOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            url: apiConfig.url,
                            method: apiConfig.method,
                            headers,
                            params: queryParams,
                            body: apiConfig.body
                                ? JSON.parse(apiConfig.body)
                                : undefined,
                        }),
                    };
                    break;
            }

            const response = await fetch(endpoint, requestOptions);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            setResult(data);
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

    const renderApiTester = () => {
        return (
            <div className="space-y-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={apiConfig.url}
                        onChange={(e) =>
                            setApiConfig((prev) => ({
                                ...prev,
                                url: e.target.value,
                            }))
                        }
                        placeholder="Enter URL"
                        className="flex-1 p-2 border rounded"
                    />
                    <select
                        value={apiConfig.method}
                        onChange={(e) =>
                            setApiConfig((prev) => ({
                                ...prev,
                                method: e.target.value,
                            }))
                        }
                        className="p-2 border rounded bg-white"
                    >
                        {["GET", "POST", "PUT", "DELETE", "PATCH"].map(
                            (method) => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* Authentication */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                    <h3 className="font-medium">Authentication</h3>
                    <select
                        value={apiConfig.authType}
                        onChange={(e) =>
                            setApiConfig((prev) => ({
                                ...prev,
                                authType: e.target.value,
                            }))
                        }
                        className="w-full p-2 border rounded bg-white"
                    >
                        <option value="none">No Auth</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="basic">Basic Auth</option>
                    </select>

                    {apiConfig.authType === "bearer" && (
                        <input
                            type="text"
                            value={apiConfig.authToken}
                            onChange={(e) =>
                                setApiConfig((prev) => ({
                                    ...prev,
                                    authToken: e.target.value,
                                }))
                            }
                            placeholder="Bearer Token"
                            className="w-full p-2 border rounded"
                        />
                    )}

                    {apiConfig.authType === "basic" && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={apiConfig.username}
                                onChange={(e) =>
                                    setApiConfig((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                placeholder="Username"
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="password"
                                value={apiConfig.password}
                                onChange={(e) =>
                                    setApiConfig((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                placeholder="Password"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    )}
                </div>

                {/* Headers */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Headers</h3>
                        <button
                            onClick={() =>
                                setApiConfig((prev) => ({
                                    ...prev,
                                    headers: [
                                        ...prev.headers,
                                        { key: "", value: "" },
                                    ],
                                }))
                            }
                            className="text-sm text-blue-500 hover:underline"
                        >
                            + Add Header
                        </button>
                    </div>
                    <div className="space-y-2">
                        {apiConfig.headers.map((header, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={header.key}
                                    onChange={(e) => {
                                        const newHeaders = [
                                            ...apiConfig.headers,
                                        ];
                                        newHeaders[index].key = e.target.value;
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            headers: newHeaders,
                                        }));
                                    }}
                                    placeholder="Header Key"
                                    className="flex-1 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    value={header.value}
                                    onChange={(e) => {
                                        const newHeaders = [
                                            ...apiConfig.headers,
                                        ];
                                        newHeaders[index].value =
                                            e.target.value;
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            headers: newHeaders,
                                        }));
                                    }}
                                    placeholder="Header Value"
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    onClick={() => {
                                        const newHeaders =
                                            apiConfig.headers.filter(
                                                (_, i) => i !== index
                                            );
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            headers: newHeaders,
                                        }));
                                    }}
                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Query Parameters */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Query Parameters</h3>
                        <button
                            onClick={() =>
                                setApiConfig((prev) => ({
                                    ...prev,
                                    queryParams: [
                                        ...prev.queryParams,
                                        { key: "", value: "" },
                                    ],
                                }))
                            }
                            className="text-sm text-blue-500 hover:underline"
                        >
                            + Add Parameter
                        </button>
                    </div>
                    <div className="space-y-2">
                        {apiConfig.queryParams.map((param, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={param.key}
                                    onChange={(e) => {
                                        const newParams = [
                                            ...apiConfig.queryParams,
                                        ];
                                        newParams[index].key = e.target.value;
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            queryParams: newParams,
                                        }));
                                    }}
                                    placeholder="Parameter Key"
                                    className="flex-1 p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    value={param.value}
                                    onChange={(e) => {
                                        const newParams = [
                                            ...apiConfig.queryParams,
                                        ];
                                        newParams[index].value = e.target.value;
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            queryParams: newParams,
                                        }));
                                    }}
                                    placeholder="Parameter Value"
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    onClick={() => {
                                        const newParams =
                                            apiConfig.queryParams.filter(
                                                (_, i) => i !== index
                                            );
                                        setApiConfig((prev) => ({
                                            ...prev,
                                            queryParams: newParams,
                                        }));
                                    }}
                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Request Body */}
                {apiConfig.method !== "GET" && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-medium mb-4">Request Body</h3>
                        <textarea
                            value={apiConfig.body}
                            onChange={(e) =>
                                setApiConfig((prev) => ({
                                    ...prev,
                                    body: e.target.value,
                                }))
                            }
                            placeholder="Enter request body (JSON)"
                            rows={5}
                            className="w-full p-2 border rounded font-mono text-sm"
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderApiTestResult = (data: any) => {
        const formatHeaders = (headers: any) => {
            if (!headers) return null;
            return Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium min-w-[150px]">{key}:</span>
                    <span className="text-gray-600 break-all">
                        {value as string}
                    </span>
                </div>
            ));
        };

        if (!data) return <div>No response data available</div>;

        // Extract results from nested structure if present
        const result = data.results || data;

        return (
            <div className="space-y-6">
                {/* Status and Time - Add flex-wrap */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-medium 
                        ${
                            result.status_code >= 200 &&
                            result.status_code < 300
                                ? "bg-green-100 text-green-800"
                                : result.status_code >= 400
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                        Status: {result.status_code || "Unknown"}
                    </div>
                    {typeof data?.average_time_ms === "number" && (
                        <div className="text-sm text-gray-500">
                            Average Time: {data.average_time_ms.toFixed(2)}ms
                        </div>
                    )}
                    {data?.redirects_total > 0 && (
                        <div className="text-sm text-gray-500">
                            Redirects: {data.redirects_total}
                        </div>
                    )}
                </div>

                {/* URL - Add word-break */}
                {result?.url && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">
                            URL
                        </h3>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-mono break-all">
                                {result.url}
                            </p>
                        </div>
                    </div>
                )}

                {/* Headers - Improve wrapping */}
                {result?.headers && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">
                            Response Headers
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                            {Object.entries(result.headers).map(
                                ([key, value]) => (
                                    <div
                                        key={key}
                                        className="grid grid-cols-[150px,1fr] gap-2 text-sm"
                                    >
                                        <span className="font-medium truncate">
                                            {key}:
                                        </span>
                                        <span className="text-gray-600 break-all">
                                            {value as string}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Body - Fix word wrapping */}
                {result?.body && (
                    <div className="space-y-2">
                        {/* ...existing copy button code... */}
                        <div className="bg-gray-50 rounded-lg border">
                            <div className="max-h-[400px] overflow-auto">
                                <pre className="p-4 text-sm whitespace-pre-wrap break-words font-mono">
                                    {typeof result.body === "string"
                                        ? result.body
                                        : JSON.stringify(result.body, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Summary - Fix display */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Request Summary
                    </h3>
                    <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                Total Requests:
                            </span>
                            <span>{data?.total_requests || 1}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Redirects:</span>
                            <span>{data?.redirects_total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                Response Time:
                            </span>
                            <span>
                                {typeof data?.average_time_ms === "number"
                                    ? `${data.average_time_ms.toFixed(2)}ms`
                                    : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span>{result?.status_code || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResult = () => {
        if (!result) return null;

        switch (tool) {
            case "qr-generator":
                return (
                    <div className="flex justify-center">
                        <img
                            src={result}
                            alt="Generated QR Code"
                            className="max-w-[300px]"
                        />
                    </div>
                );
            case "password-generator":
                return (
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="font-mono text-lg">{result.password}</p>
                    </div>
                );
            case "url-shortener":
                return (
                    <div className="p-4 bg-gray-50 rounded border">
                        <a
                            href={result.short_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            {result.short_url}
                        </a>
                    </div>
                );
            case "api-tester":
                return renderApiTestResult(result);
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
                {tool
                    ?.split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
            </h1>

            {tool === "api-tester" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderApiTester()}
                    <button
                        type="submit"
                        disabled={loading || !apiConfig.url}
                        className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                 hover:bg-[#6a8f74] disabled:opacity-50 
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Sending Request..." : "Send Request"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={renderPlaceholder()}
                        rows={3}
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
            )}

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
                    <div className="p-4">{renderResult()}</div>
                </div>
            )}
        </div>
    );
}
