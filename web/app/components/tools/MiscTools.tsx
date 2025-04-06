"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useToolCredits } from "@/app/hooks/useToolCredits";
import { toast } from "react-hot-toast";

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

export default function MiscTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // States
    const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>({
        amount: "",
        fromCurrency: "USD",
        toCurrency: "EUR",
    });

    const [timeConfig, setTimeConfig] = useState<TimeConfig>({
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
        fromTimezone: "UTC",
        toTimezone: "UTC",
    });

    const [timezones, setTimezones] = useState<string[]>(["UTC"]);
    const [currencies] = useState<string[]>([
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        "INR",
    ]);

    const { deductCredits, isProcessing } = useToolCredits();

    // Effects
    useEffect(() => {
        if (tool === "time-converter") {
            fetch("http://localhost:5000/api/list-timezones")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data.timezones)) {
                        setTimezones(data.timezones);
                    } else {
                        console.error("Invalid timezone data received:", data);
                        setTimezones(["UTC"]); // Fallback to UTC only
                    }
                })
                .catch((err) => {
                    console.error("Error loading timezones:", err);
                    setTimezones(["UTC"]); // Fallback to UTC only
                });
        }
    }, [tool]);

    // Handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First try to deduct credits
            await deductCredits();

            let endpoint = "http://localhost:5000";
            let method = "POST";
            let body: any = {};

            switch (tool) {
                case "currency-converter":
                    endpoint += "/api/currency-convert";
                    body = {
                        amount: parseFloat(currencyConfig.amount),
                        from: currencyConfig.fromCurrency,
                        to: currencyConfig.toCurrency,
                    };
                    break;
                case "time-converter":
                    endpoint += "/api/convert-timezone";
                    body = {
                        time: timeConfig.time,
                        from_timezone: timeConfig.fromTimezone,
                        to_timezone: timeConfig.toTimezone,
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
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                setResult(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
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

    const renderCurrencyConverter = () => {
        return (
            <div className="space-y-4">
                <input
                    type="number"
                    value={currencyConfig.amount}
                    onChange={(e) =>
                        setCurrencyConfig((prev) => ({
                            ...prev,
                            amount: e.target.value,
                        }))
                    }
                    placeholder="Enter amount"
                    className="w-full p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={currencyConfig.fromCurrency}
                        onChange={(e) =>
                            setCurrencyConfig((prev) => ({
                                ...prev,
                                fromCurrency: e.target.value,
                            }))
                        }
                        className="p-2 border rounded bg-white"
                    >
                        {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                                {currency}
                            </option>
                        ))}
                    </select>
                    <select
                        value={currencyConfig.toCurrency}
                        onChange={(e) =>
                            setCurrencyConfig((prev) => ({
                                ...prev,
                                toCurrency: e.target.value,
                            }))
                        }
                        className="p-2 border rounded bg-white"
                    >
                        {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                                {currency}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    const renderTimeConverter = () => {
        if (!Array.isArray(timezones) || timezones.length === 0) {
            return <div>Loading timezones...</div>;
        }

        return (
            <div className="space-y-4">
                <input
                    type="datetime-local"
                    value={timeConfig.time.replace(" ", "T")}
                    onChange={(e) =>
                        setTimeConfig((prev) => ({
                            ...prev,
                            time: e.target.value.replace("T", " "),
                        }))
                    }
                    className="w-full p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={timeConfig.fromTimezone}
                        onChange={(e) =>
                            setTimeConfig((prev) => ({
                                ...prev,
                                fromTimezone: e.target.value,
                            }))
                        }
                        className="p-2 border rounded bg-white"
                    >
                        {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz}
                            </option>
                        ))}
                    </select>
                    <select
                        value={timeConfig.toTimezone}
                        onChange={(e) =>
                            setTimeConfig((prev) => ({
                                ...prev,
                                toTimezone: e.target.value,
                            }))
                        }
                        className="p-2 border rounded bg-white"
                    >
                        {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    const renderCurrencyResult = (data: any) => {
        if (!data?.success) return null;

        return (
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#78A083] to-[#2D3A3A] p-6 text-white">
                        <h3 className="text-lg font-semibold mb-2">
                            Exchange Result
                        </h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm opacity-80">
                                    Exchange Rate
                                </p>
                                <p className="text-2xl font-bold">
                                    {data.rate}
                                </p>
                            </div>
                            <p className="text-xl">
                                {data.from} → {data.to}
                            </p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Original Amount
                                </p>
                                <p className="text-2xl font-bold">
                                    {data.original_amount} {data.from}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Converted Amount
                                </p>
                                <p className="text-2xl font-bold text-[#78A083]">
                                    {data.converted_amount} {data.to}
                                </p>
                            </div>
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
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold">{data.email}</h2>
                            <p className="text-gray-500">{data.domain}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-3 w-3 rounded-full ${
                                    data.format_valid
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                }`}
                            ></span>
                            <span className="text-sm font-medium">
                                {data.format_valid
                                    ? "Valid Format"
                                    : "Invalid Format"}
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* DNS Records */}
                            <div>
                                <h3 className="font-medium mb-2">
                                    DNS Records
                                </h3>
                                <div className="space-y-2">
                                    {data.mx_records.map(
                                        (record: string, i: number) => (
                                            <div
                                                key={i}
                                                className="text-sm bg-gray-50 p-2 rounded"
                                            >
                                                {record}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Security</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>SPF Record:</span>
                                    <span>
                                        {data.email_security.has_spf
                                            ? "✅"
                                            : "❌"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>DMARC Record:</span>
                                    <span>
                                        {data.email_security.has_dmarc
                                            ? "✅"
                                            : "❌"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Valid Mail Server:</span>
                                    <span>
                                        {data.has_mail_server ? "✅" : "❌"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResult = () => {
        if (!result) return null;

        switch (tool) {
            case "currency-converter":
                return renderCurrencyResult(result);
            case "time-converter":
                return (
                    <div className="p-4 bg-white rounded border">
                        <p className="text-lg">{result.converted_time}</p>
                    </div>
                );
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

            {tool === "currency-converter" ? (
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
            ) : (
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
