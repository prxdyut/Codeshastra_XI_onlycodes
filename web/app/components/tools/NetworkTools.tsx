"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Add LeafletMap component (at the top)
const IpLocationMap = ({ lat, lng }: { lat: number; lng: number }) => {
    return (
        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-100">
            <iframe
                className="w-full h-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    lng - 0.01
                },${lat - 0.01},${lng + 0.01},${
                    lat + 0.01
                }&marker=${lat},${lng}`}
            />
        </div>
    );
};

// Add PingQualityIndicator component
const PingQualityIndicator = ({ time }: { time: number }) => {
    const getQuality = (time: number) => {
        if (time < 30)
            return {
                label: "Excellent",
                color: "bg-green-500",
                description: "Gaming/Real-time",
            };
        if (time < 50)
            return {
                label: "Very Good",
                color: "bg-green-400",
                description: "Video Calls",
            };
        if (time < 100)
            return {
                label: "Good",
                color: "bg-yellow-400",
                description: "Web Browsing",
            };
        if (time < 150)
            return {
                label: "Fair",
                color: "bg-orange-400",
                description: "Basic Usage",
            };
        return {
            label: "Poor",
            color: "bg-red-500",
            description: "High Latency",
        };
    };

    const quality = getQuality(time);

    return (
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${quality.color}`}></div>
            <span className="font-medium">{quality.label}</span>
            <span className="text-sm text-gray-500">
                ({quality.description})
            </span>
        </div>
    );
};

const TracerouteHop = ({ hop }: { hop: any }) => {
    const getTimeColor = (time: number) => {
        if (time < 50) return "text-green-600";
        if (time < 100) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-mono text-sm">
                {hop.hop}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {hop.host ? (
                        <span className="font-medium truncate">{hop.host}</span>
                    ) : hop.ip ? (
                        <span className="font-mono text-gray-500 truncate">
                            {hop.ip}
                        </span>
                    ) : (
                        <span className="text-gray-400">* * *</span>
                    )}
                    {hop.country && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {hop.country}
                        </span>
                    )}
                </div>
                {hop.isp && (
                    <p className="text-sm text-gray-500 truncate">{hop.isp}</p>
                )}
            </div>
            <div className="text-right space-y-1">
                {hop.times?.map((time: number, i: number) => (
                    <div
                        key={i}
                        className="flex items-center justify-end gap-2"
                    >
                        <span
                            className={`text-sm font-mono ${getTimeColor(
                                time
                            )}`}
                        >
                            {time}ms
                        </span>
                    </div>
                ))}
                {hop.packet_loss > 0 && (
                    <span className="text-xs text-red-500">
                        {hop.packet_loss}% loss
                    </span>
                )}
            </div>
        </div>
    );
};

const renderTracerouteResult = (data: any) => {
    if (!data?.host) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Traceroute to {data.host}
                        </h2>
                        {data.resolved_ip && (
                            <p className="text-sm text-gray-500">
                                Resolved IP: {data.resolved_ip}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">
                            {data.total_hops} hops
                        </p>
                        <p className="text-xs text-gray-500">
                            {data.execution_time}s
                        </p>
                    </div>
                </div>
            </div>

            {/* Hops List */}
            <div className="space-y-2">
                {data.hops?.map((hop: any, index: number) => (
                    <TracerouteHop key={index} hop={hop} />
                ))}
            </div>

            {/* Status */}
            <div
                className={`p-4 rounded-lg text-sm ${
                    data.complete
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}
            >
                {data.complete
                    ? "✅ Trace complete - destination reached"
                    : "⚠️ Trace incomplete - some hops may be missing"}
            </div>

            {/* Raw Output */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Raw Output</h3>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(data.raw_output);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        Copy to Clipboard
                    </button>
                </div>
                <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-[200px] font-mono">
                    {data.raw_output}
                </pre>
            </div>
        </div>
    );
};

export default function NetworkTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [input, setInput] = useState("");
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        let endpoint = "http://localhost:5000";
        let method = "POST";
        let body = {};

        switch (tool) {
            case "ip-lookup":
                endpoint += "/network/ip/public";
                method = "GET";
                break;
            case "dns-lookup":
                endpoint += "/network/dns";
                body = { domain: input, type: "A" };
                break;
            case "ping-test":
                endpoint += "/network/ping";
                body = { host: input, count: 4 };
                break;
            case "traceroute":
                endpoint += "/network/traceroute";
                body = { host: input };
                break;
        }

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: method === "POST" ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: "Failed to process request" });
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch for IP lookup on mount
    useEffect(() => {
        if (tool === "ip-lookup") {
            fetchData();
        }
    }, [tool]);

    const renderIpLookupResult = (data: any) => {
        if (!data) return null;

        const location = data.location || {};
        const network = data.network || {};
        const connection = data.connection || {};
        const timezone = data.timezone || {};

        return (
            <div className="grid gap-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        IP: {data.ip}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Location Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <span className="text-base">📍</span>
                                    <span className="flex-1">
                                        {location.city || "Unknown"},{" "}
                                        {location.region || "Unknown"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🌍</span>
                                    <span className="flex-1">
                                        {location.country || "Unknown"}
                                    </span>
                                </p>
                                {location.postal && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-base">📮</span>
                                        <span className="flex-1">
                                            {location.postal}
                                        </span>
                                    </p>
                                )}
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🎯</span>
                                    <span className="flex-1">
                                        {location.coordinates?.latitude || 0},{" "}
                                        {location.coordinates?.longitude || 0}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {location.coordinates?.latitude &&
                            location.coordinates?.longitude && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="font-medium text-gray-700 mb-3">
                                        Location Map
                                    </h3>
                                    <IpLocationMap
                                        lat={location.coordinates.latitude}
                                        lng={location.coordinates.longitude}
                                    />
                                    <a
                                        href={`https://www.google.com/maps?q=${location.coordinates.latitude},${location.coordinates.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 text-sm text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <span>Open in Google Maps</span>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                </div>
                            )}

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Network Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🌐</span>
                                    <span className="flex-1">
                                        {network.asn || "N/A"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🏢</span>
                                    <span className="flex-1">
                                        {network.org || "Unknown"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">📡</span>
                                    <span className="flex-1">
                                        {network.isp || "Unknown"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Connection Status
                            </h3>
                            <div className="space-y-2 text-sm">
                                {connection.type && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-base">🔌</span>
                                        <span className="flex-1">
                                            {connection.type}
                                        </span>
                                    </p>
                                )}
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🔗</span>
                                    <span className="flex-1">
                                        {connection.domain || "N/A"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🕵️</span>
                                    <span className="flex-1">
                                        Proxy:{" "}
                                        {connection.is_proxy ? "Yes" : "No"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🏨</span>
                                    <span className="flex-1">
                                        Hosting:{" "}
                                        {connection.is_hosting ? "Yes" : "No"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Time Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <span className="text-base">🕒</span>
                                    <span className="flex-1">
                                        {timezone.id || "Unknown"}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-base">⏰</span>
                                    <span className="flex-1">
                                        {timezone.current_time || "N/A"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDnsLookupResult = (data: any) => {
        if (!data?.domain) return null;

        return (
            <div className="grid gap-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        Domain: {data.domain}
                    </h2>
                    <div className="flex gap-2">
                        {Object.entries(data.dns_health || {}).map(
                            ([key, value]) => (
                                <span
                                    key={key}
                                    className={`px-2 py-1 rounded-full text-xs ${
                                        Boolean(value)
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {key.replace("has_", "").toUpperCase()}
                                </span>
                            )
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4 min-w-0">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Primary Records
                            </h3>
                            <div className="space-y-2 text-sm font-mono">
                                {data.records.length > 0 ? (
                                    data.records.map(
                                        (record: string, index: number) => (
                                            <p
                                                key={index}
                                                className="bg-white p-2 rounded break-all"
                                            >
                                                {record}
                                            </p>
                                        )
                                    )
                                ) : (
                                    <p className="text-gray-500 italic">
                                        No records found
                                    </p>
                                )}
                            </div>
                        </div>

                        {data.nameserver_response_times?.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h3 className="font-medium text-gray-700 mb-3">
                                    Nameserver Response Times
                                </h3>
                                <div className="space-y-2">
                                    {data.nameserver_response_times.map(
                                        (ns: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded"
                                            >
                                                <span className="font-mono text-sm truncate">
                                                    {ns.nameserver}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        typeof ns.response_time_ms ===
                                                        "number"
                                                            ? ns.response_time_ms <
                                                              100
                                                                ? "bg-green-100 text-green-800"
                                                                : ns.response_time_ms <
                                                                  300
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {typeof ns.response_time_ms ===
                                                    "number"
                                                        ? `${ns.response_time_ms}ms`
                                                        : "Timeout"}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 min-w-0">
                        {Object.entries(data.all_records || {}).map(
                            ([type, records]: [string, any]) =>
                                records.length > 0 && (
                                    <div
                                        key={type}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                        <h3 className="font-medium text-gray-700 mb-3">
                                            {type} Records
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            {records.map(
                                                (
                                                    record: string,
                                                    index: number
                                                ) => (
                                                    <p
                                                        key={index}
                                                        className="bg-white p-2 rounded break-all whitespace-pre-wrap"
                                                    >
                                                        {record}
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPingResult = (data: any) => {
        if (!data?.host) return null;

        const getStatusColor = (avg_time: number) => {
            if (avg_time < 50) return "text-green-600";
            if (avg_time < 100) return "text-yellow-600";
            return "text-red-600";
        };

        return (
            <div className="grid gap-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Host: {data.host}
                        </h2>
                        {data.resolved_ip && (
                            <p className="text-sm text-gray-500">
                                Resolved IP: {data.resolved_ip}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">
                            Total Time: {data.total_time}s
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {/* Packet Statistics */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Packet Statistics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded">
                                    <p className="text-sm text-gray-500">
                                        Transmitted
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {data.packets?.transmitted || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded">
                                    <p className="text-sm text-gray-500">
                                        Received
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {data.packets?.received || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded">
                                    <p className="text-sm text-gray-500">
                                        Lost
                                    </p>
                                    <p className="text-2xl font-bold text-red-500">
                                        {data.packets?.lost || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded">
                                    <p className="text-sm text-gray-500">
                                        Loss %
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {data.packets?.loss_percentage || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Response Times */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Response Times
                            </h3>
                            <div className="space-y-2">
                                {data.times?.map(
                                    (time: number, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-white p-2 rounded"
                                        >
                                            <span className="text-sm">
                                                Ping {index + 1}
                                            </span>
                                            <span
                                                className={`font-mono ${getStatusColor(
                                                    time
                                                )}`}
                                            >
                                                {time}ms
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Summary
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-white p-3 rounded">
                                    <span className="text-sm">Minimum</span>
                                    <span
                                        className={`font-mono ${getStatusColor(
                                            data.min_time || 0
                                        )}`}
                                    >
                                        {data.min_time?.toFixed(1) || 0}ms
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded">
                                    <span className="text-sm">Average</span>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`font-mono ${getStatusColor(
                                                data.avg_time || 0
                                            )}`}
                                        >
                                            {data.avg_time?.toFixed(1) || 0}ms
                                        </span>
                                        <PingQualityIndicator
                                            time={data.avg_time || 0}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded">
                                    <span className="text-sm">Maximum</span>
                                    <span
                                        className={`font-mono ${getStatusColor(
                                            data.max_time || 0
                                        )}`}
                                    >
                                        {data.max_time?.toFixed(1) || 0}ms
                                    </span>
                                </div>
                                {/* Add network health score */}
                                <div className="mt-4 p-4 bg-white rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">
                                            Network Health Score
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Based on packet loss and latency
                                        </span>
                                    </div>
                                    <div className="relative pt-1">
                                        {(() => {
                                            const score = Math.max(
                                                0,
                                                100 -
                                                    (data.packets
                                                        ?.loss_percentage ||
                                                        0) *
                                                        2 -
                                                    Math.min(
                                                        100,
                                                        (data.avg_time || 0) / 2
                                                    )
                                            );
                                            const getScoreColor = (
                                                s: number
                                            ) => {
                                                if (s >= 90)
                                                    return "bg-green-500";
                                                if (s >= 70)
                                                    return "bg-yellow-500";
                                                if (s >= 50)
                                                    return "bg-orange-500";
                                                return "bg-red-500";
                                            };
                                            return (
                                                <>
                                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                                        <div
                                                            style={{
                                                                width: `${score}%`,
                                                            }}
                                                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getScoreColor(
                                                                score
                                                            )}`}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span
                                                            className={`font-bold ${getScoreColor(
                                                                score
                                                            )}`}
                                                        >
                                                            {Math.round(score)}%
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {score >= 90
                                                                ? "Excellent"
                                                                : score >= 70
                                                                ? "Good"
                                                                : score >= 50
                                                                ? "Fair"
                                                                : "Poor"}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Raw Output */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Raw Output
                            </h3>
                            <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-[200px]">
                                {data.raw_output}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const LoadingSkeleton = () => (
        <div className="grid gap-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">
                {tool
                    ?.split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
            </h1>

            {tool !== "ip-lookup" ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        fetchData();
                    }}
                    className="space-y-4"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            tool === "ping-test"
                                ? "Enter domain name or IP address (e.g., google.com or 8.8.8.8)"
                                : "Enter hostname or domain"
                        }
                        className="w-full p-2 border rounded"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-[#78A083] text-white rounded hover:bg-[#6a8f74] 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? "Loading..." : "Submit"}
                    </button>
                </form>
            ) : null}

            {isLoading && tool === "ip-lookup" ? (
                <LoadingSkeleton />
            ) : (
                result &&
                (tool === "ip-lookup" ? (
                    renderIpLookupResult(result)
                ) : tool === "dns-lookup" ? (
                    renderDnsLookupResult(result)
                ) : tool === "ping-test" ? (
                    renderPingResult(result)
                ) : tool === "traceroute" ? (
                    renderTracerouteResult(result)
                ) : (
                    <pre className="p-4 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                ))
            )}
        </div>
    );
}
