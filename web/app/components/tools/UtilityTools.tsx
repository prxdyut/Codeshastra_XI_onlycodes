"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

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

interface CurrencyConfig {
    amount: string;
    fromCurrency: string;
    toCurrency: string;
}

interface TimeConfig {
    time: string;
    fromTimezone: string;
    toTimezone: string;
}

export default function UtilityTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state for API Tester
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

    const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>({
        amount: "",
        fromCurrency: "USD",
        toCurrency: "EUR"
    });

    const [timeConfig, setTimeConfig] = useState<TimeConfig>({
        time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        fromTimezone: "UTC",
        toTimezone: "UTC"
    });

    const [timezones, setTimezones] = useState<string[]>([]);
    const [currencies] = useState<string[]>([
        "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"
    ]);

    useEffect(() => {
        if (tool === 'time-converter') {
            fetch('http://localhost:5000/api/list-timezones')
                .then(res => res.json())
                .then(data => setTimezones(data.timezones));
        }
    }, [tool]);

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
                const headers: Record<string, string> = apiConfig.headers
                    .filter((h) => h.key && h.value)
                    .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

                const queryString = apiConfig.queryParams
                    .filter((p) => p.key && p.value)
                    .map(
                        (p) =>
                            `${encodeURIComponent(p.key)}=${encodeURIComponent(
                                p.value
                            )}`
                    )
                    .join("&");

                // Add authentication
                if (apiConfig.authType === "bearer") {
                    headers["Authorization"] = `Bearer ${apiConfig.authToken}`;
                } else if (apiConfig.authType === "basic") {
                    headers["Authorization"] = `Basic ${btoa(
                        `${apiConfig.username}:${apiConfig.password}`
                    )}`;
                }

                body = {
                    url: `${apiConfig.url}${
                        queryString ? `?${queryString}` : ""
                    }`,
                    method: apiConfig.method,
                    headers,
                    body: apiConfig.body || undefined,
                };
                break;
            case "currency-converter":
                endpoint += "/api/currency-convert";
                body = {
                    amount: parseFloat(currencyConfig.amount),
                    from: currencyConfig.fromCurrency,
                    to: currencyConfig.toCurrency
                };
                break;
            case "time-converter":
                endpoint += "/api/convert-timezone";
                body = {
                    time: timeConfig.time,
                    from_timezone: timeConfig.fromTimezone,
                    to_timezone: timeConfig.toTimezone
                };
                break;
            case "email-lookup":
                endpoint += "/api/lookup/email";
                body = { email: input };
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method,
                headers:
                    method === "POST"
                        ? { "Content-Type": "application/json" }
                        : undefined,
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

    const renderCurrencyConverter = () => {
        return (
            <div className="space-y-4">
                <input
                    type="number"
                    value={currencyConfig.amount}
                    onChange={(e) => setCurrencyConfig(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="w-full p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={currencyConfig.fromCurrency}
                        onChange={(e) => setCurrencyConfig(prev => ({ ...prev, fromCurrency: e.target.value }))}
                        className="p-2 border rounded bg-white"
                    >
                        {currencies.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                    <select
                        value={currencyConfig.toCurrency}
                        onChange={(e) => setCurrencyConfig(prev => ({ ...prev, toCurrency: e.target.value }))}
                        className="p-2 border rounded bg-white"
                    >
                        {currencies.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    const renderTimeConverter = () => {
        return (
            <div className="space-y-4">
                <input
                    type="datetime-local"
                    value={timeConfig.time.replace(' ', 'T')}
                    onChange={(e) => setTimeConfig(prev => ({ ...prev, time: e.target.value.replace('T', ' ') }))}
                    className="w-full p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={timeConfig.fromTimezone}
                        onChange={(e) => setTimeConfig(prev => ({ ...prev, fromTimezone: e.target.value }))}
                        className="p-2 border rounded bg-white"
                    >
                        {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                    <select
                        value={timeConfig.toTimezone}
                        onChange={(e) => setTimeConfig(prev => ({ ...prev, toTimezone: e.target.value }))}
                        className="p-2 border rounded bg-white"
                    >
                        {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>
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

    const renderEmailLookupResult = (data: any) => {
        if (!data?.success) return null;

        return (
            <div className="space-y-6">
                {/* Email Overview Card */}
                <div className="grid gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {data.email}
                            </h2>
                            <p className="text-sm text-gray-500">{data.domain}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${data.format_valid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm font-medium ${data.format_valid ? 'text-green-700' : 'text-red-700'}`}>
                                {data.format_valid ? 'Valid Format' : 'Invalid Format'}
                            </span>
                        </div>
                    </div>

                    {/* Security Score */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Security Score</span>
                            <span className={`text-sm font-bold ${
                                data.security_score >= 80 ? 'text-green-600' : 
                                data.security_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{data.security_score}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${
                                    data.security_score >= 80 ? 'bg-green-500' : 
                                    data.security_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${data.security_score}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Domain Information */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Domain Information</h3>
                        <div className="space-y-3">
                            {Object.entries(data.domain_info).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <span className="text-lg">
                                        {key === 'ip' ? '🌐' : 
                                         key === 'isp' ? '🏢' :
                                         key === 'org' ? '🏛️' :
                                         key === 'country' ? '🌍' :
                                         key === 'region' ? '📍' :
                                         key === 'city' ? '🏙️' : '📋'}
                                    </span>
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                                        <p className="text-sm font-medium">{value as string}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Features */}
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Security Features</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'SPF', value: data.email_security.has_spf },
                                    { label: 'DMARC', value: data.email_security.has_dmarc },
                                    { label: 'MX Records', value: data.has_mail_server }
                                ].map((feature) => (
                                    <div key={feature.label} className="p-3 bg-gray-50 rounded-lg text-center">
                                        <div className={`text-2xl mb-1 ${feature.value ? 'text-green-500' : 'text-red-500'}`}>
                                            {feature.value ? '✓' : '×'}
                                        </div>
                                        <p className="text-xs font-medium">{feature.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Mail Servers */}
                            <div className="mt-6">
                                <h4 className="text-xs font-medium text-gray-600 mb-2">Mail Servers</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {data.mx_records.map((server: string, index: number) => (
                                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                                            {server}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Details */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Technical Records</h3>
                    {Object.entries(data.email_security)
                        .filter(([key, value]) => typeof value === 'string')
                        .map(([key, value]) => (
                            <div key={key} className="mb-4">
                                <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                                    {key.replace('_', ' ')}
                                </p>
                                <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                                    {value as string}
                                </pre>
                            </div>
                        ))}
                </div>
            </div>
        );
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
                            onClick={() =>
                                navigator.clipboard.writeText(result.password)
                            }
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

            case "api-tester":
                return renderApiTestResult(result);

            case "email-lookup":
                return renderEmailLookupResult(result);

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
            ) : tool === "currency-converter" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderCurrencyConverter()}
                    <button
                        type="submit"
                        disabled={loading || !currencyConfig.amount}
                        className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                 hover:bg-[#6a8f74] disabled:opacity-50 
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Converting..." : "Convert"}
                    </button>
                </form>
            ) : tool === "time-converter" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderTimeConverter()}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                 hover:bg-[#6a8f74] disabled:opacity-50 
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Converting..." : "Convert"}
                    </button>
                </form>
            ) : tool === "email-lookup" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter email address to lookup..."
                        className="w-full p-2 border rounded"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-full px-4 py-2 bg-[#78A083] text-white rounded 
                                 hover:bg-[#6a8f74] disabled:opacity-50 
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Looking up..." : "Lookup"}
                    </button>
                </form>
            ) : (
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
