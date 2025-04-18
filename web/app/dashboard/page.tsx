"use client";

import Groq from "groq-sdk";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
    add,
    format,
    sub,
    isSameMonth,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
} from "date-fns";

// Using the theme from landing page
const THEME = {
    primary: "#2D3A3A",
    secondary: "#78A083",
    accent: "#B4C7AE",
    background: "#F5F9F3",
    text: "#2D3A3A",
    border: "#E0E6E3",
    muted: "#5E5F6E",
};

const FREQUENTLY_USED = [
    {
        name: "JSON Formatter",
        uses: 15,
        credits: 2,
        category: "Developer Essentials",
    },
    {
        name: "Markdown Editor",
        uses: 12,
        credits: 1,
        category: "Text & Documentation",
    },
    {
        name: "Image Compressor",
        uses: 8,
        credits: 3,
        category: "Design & Media",
    },
];

interface ToolCategory {
    title: string;
    tools: string[];
    description: string;
    icon: string;
    endpoints: string[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
    {
        title: "Format Tools",
        tools: [
            "JSON Formatter",
            "Markdown Formatter",
            "YAML Formatter",
            "XML Formatter",
            "TOML Formatter",
        ],
        description: "Format and validate various data formats",
        icon: "🔧",
        endpoints: [
            "/dashboard/tools/json-formatter",
            "/dashboard/tools/markdown-formatter",
            "/dashboard/tools/yaml-formatter",
            "/dashboard/tools/xml-formatter",
            "/dashboard/tools/toml-formatter",
        ],
    },
    {
        title: "Network Tools",
        tools: ["IP Lookup", "DNS Lookup", "Ping Test", "Traceroute"],
        description: "Analyze and test network connectivity",
        icon: "🌐",
        endpoints: [
            "/dashboard/tools/ip-lookup",
            "/dashboard/tools/dns-lookup",
            "/dashboard/tools/ping-test",
            "/dashboard/tools/traceroute",
        ],
    },
    {
        title: "Random Tools",
        tools: ["Random Number", "UUID Generator", "Dice Roll", "Coin Flip"],
        description: "Generate random values and make decisions",
        icon: "🎲",
        endpoints: [
            "/dashboard/tools/random-number",
            "/dashboard/tools/uuid-generator",
            "/dashboard/tools/dice-roll",
            "/dashboard/tools/coin-flip",
        ],
    },
    {
        title: "Utility Tools",
        tools: [
            "QR Generator",
            "Password Generator",
            "URL Shortener",
            "API Tester",
        ],
        description: "Essential developer utilities",
        icon: "🛠️",
        endpoints: [
            "/dashboard/tools/qr-generator",
            "/dashboard/tools/password-generator",
            "/dashboard/tools/url-shortener",
            "/dashboard/tools/api-tester",
        ],
    },
    {
        title: "Misc Tools",
        tools: ["Currency Converter", "Time Converter", "Email Lookup"],
        description: "Additional helpful utilities",
        icon: "🔍",
        endpoints: [
            "/dashboard/tools/currency-converter",
            "/dashboard/tools/time-converter",
            "/dashboard/tools/email-lookup",
        ],
    },
    {
        title: "Socrates",
        tools: ["Socratic learning AI assistant"],
        description:
            "It answers your queries by asking you questions, and gives better answers.",
        icon: "🔍",
        endpoints: ["/dashboard/socrates"],
    },
];

interface AIResponse {
    action: "redirect" | "answer";
    destination?: string;
    answer?: string;
    toolName?: string;
}

interface Item {
    _id: string;
    type: string;
    timestamp: string;
    data: {
        text: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [aiQuery, setAiQuery] = useState("");
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ text: "" });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch("/api/tasks/list");
            const result = await response.json();

            if (result.success) {
                setItems(result.data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAIQuery = async () => {
        setIsProcessing(true);
        try {
            const groq = new Groq({
                apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
                dangerouslyAllowBrowser: true,
            });

            const categoryInfo = TOOL_CATEGORIES.map((cat) => ({
                title: cat.title,
                tools: cat.tools.map((tool, i) => ({
                    name: tool,
                    endpoint: cat.endpoints[i],
                })),
            }));

            const prompt = `
                You are a helpful AI assistant that guides users to the right tool. Here are all available tools:
                ${JSON.stringify(categoryInfo, null, 2)}

                If you can match the user's request to a specific tool, respond with:
                {
                    "action": "redirect",
                    "destination": "[matching tool endpoint]",
                    "toolName": "[matching tool name]"
                }

                If no specific tool matches, respond with:
                {
                    "action": "answer",
                    "answer": "[brief suggestion of relevant tools, under 100 chars]"
                }

                For example, if someone asks about formatting JSON, you would return:
                {
                    "action": "redirect",
                    "destination": "/dashboard/tools/json-formatter",
                    "toolName": "JSON Formatter"
                }
            `;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: aiQuery },
                ],
                model: "llama3-8b-8192",
                temperature: 0.5,
                max_tokens: 150,
                stream: false,
            });

            const content = completion.choices[0].message.content;
            let response: AIResponse;

            try {
                // Try to extract JSON from the content
                const jsonMatch = content?.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    response = JSON.parse(jsonMatch[0]);
                } else {
                    // If no JSON found, create a default answer response
                    response = {
                        action: "answer",
                        answer: content || "No response received",
                    };
                }

                if (!response.action) {
                    throw new Error("Invalid response format");
                }

                setAiResponse(response);

                if (response.action === "redirect" && response.destination) {
                    setAiResponse({
                        action: "redirect",
                        destination: response.destination,
                        answer: `Taking you to ${response.toolName}...`,
                    });

                    setTimeout(() => {
                        if (response.destination) {
                            router.push(response.destination);
                        }
                    }, 1000);
                }
            } catch (parseError) {
                console.error("Response parsing error:", parseError);
                setAiResponse({
                    action: "answer",
                    answer: "I couldn't process that request. Please try rephrasing it.",
                });
            }
        } catch (error) {
            console.error("AI Query Error:", error);
            setAiResponse({
                action: "answer",
                answer: "Sorry, I'm having trouble right now. Please try again.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Add Recent Todos section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-lg font-semibold mb-4">
                        Recent Todos & Reminders
                    </h2>
                    <div className="space-y-4">
                        {items.slice(0, 5).map((item) => (
                            <div
                                key={item._id}
                                className="flex items-center justify-between p-4 bg-[#F5F9F3] rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                        <span className="text-xl">
                                            {item.type === "reminder"
                                                ? "⏰"
                                                : "✓"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {item.data.text}
                                        </p>
                                        <p className="text-sm text-[#5E5F6E]">
                                            {new Date(
                                                item.timestamp
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm text-[#78A083] capitalize">
                                    {item.type}
                                </span>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p className="text-center text-gray-500">
                                No items yet
                            </p>
                        )}
                    </div>
                    <Link
                        href="/list"
                        className="mt-4 text-sm text-blue-600 hover:underline block text-center"
                    >
                        View all items
                    </Link>
                </div>

                {/* Credit Status Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">
                                Daily Credits
                            </h2>
                            <p className="text-sm text-[#5E5F6E]">
                                15 of 25 credits remaining
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            Pro Plan
                        </span>
                    </div>
                    <div className="w-full bg-[#F5F9F3] rounded-full h-2.5 mb-2">
                        <div className="bg-[#78A083] h-2.5 rounded-full w-3/5"></div>
                    </div>
                    <p className="text-xs text-[#5E5F6E]">
                        Daily limit resets at midnight (25 credits/day)
                    </p>
                </div>

                {/* Tool Usage Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-lg font-semibold mb-4">
                        Most Used Tools
                    </h2>
                    <div className="space-y-4">
                        {FREQUENTLY_USED.map((tool) => (
                            <div
                                key={tool.name}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#F5F9F3] flex items-center justify-center">
                                        <span className="text-xl">🛠️</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {tool.name}
                                        </p>
                                        <p className="text-sm text-[#5E5F6E]">
                                            {tool.category}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm text-[#78A083]">
                                    {tool.uses} uses
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tool Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {TOOL_CATEGORIES.map((category) => (
                        <div
                            key={category.title}
                            className="bg-white p-4 rounded-xl shadow-sm border border-[#E0E6E3]"
                        >
                            <div className="text-2xl mb-2">{category.icon}</div>
                            <h3 className="font-semibold mb-1">
                                {category.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">
                                {category.description}
                            </p>
                            <ul className="space-y-1">
                                {category.tools.map((tool, index) => (
                                    <li key={tool}>
                                        <a
                                            href={category.endpoints[index]}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            {tool}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column - AI Tool Finder and Calendar */}
            <div className="space-y-6">
                {/* AI Tool Finder */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-lg font-semibold mb-4">
                        AI Tool Finder
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-[#F5F9F3] rounded-lg p-4">
                            <textarea
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                placeholder="What would you like to do? (e.g., 'I need to format some JSON')"
                                className="w-full p-3 border rounded bg-white"
                                rows={3}
                            />
                            <button
                                onClick={handleAIQuery}
                                disabled={isProcessing || !aiQuery.trim()}
                                className="w-full mt-2 px-4 py-2 bg-[#78A083] text-white rounded 
                                         hover:bg-[#6a8f74] disabled:opacity-50 
                                         disabled:cursor-not-allowed transition-colors"
                            >
                                {isProcessing ? "Thinking..." : "Ask AI"}
                            </button>
                        </div>

                        {aiResponse && (
                            <div
                                className={`p-4 rounded-lg ${
                                    aiResponse.action === "redirect"
                                        ? "bg-blue-50 border border-blue-200"
                                        : "bg-gray-50 border border-gray-200"
                                }`}
                            >
                                {aiResponse.action === "redirect" ? (
                                    <div className="flex items-center gap-2">
                                        <span className="animate-spin">↻</span>
                                        <span>
                                            Redirecting to:{" "}
                                            {aiResponse.destination}
                                        </span>
                                    </div>
                                ) : (
                                    <p>{aiResponse.answer}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Component */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setCurrentMonth(
                                        sub(currentMonth, { months: 1 })
                                    )
                                }
                                className="p-2 hover:bg-[#F5F9F3] rounded-lg"
                            >
                                ←
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentMonth(
                                        add(currentMonth, { months: 1 })
                                    )
                                }
                                className="p-2 hover:bg-[#F5F9F3] rounded-lg"
                            >
                                →
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-[#5E5F6E]"
                                >
                                    {day}
                                </div>
                            )
                        )}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {eachDayOfInterval({
                            start: startOfMonth(currentMonth),
                            end: endOfMonth(currentMonth),
                        }).map((date, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    aspect-square p-2 rounded-lg text-sm relative
                                    ${
                                        isSameDay(date, selectedDate)
                                            ? "bg-[#78A083] text-white"
                                            : isSameMonth(date, currentMonth)
                                            ? "hover:bg-[#F5F9F3]"
                                            : "text-[#5E5F6E] opacity-50"
                                    }
                                    ${
                                        items.some((item) =>
                                            isSameDay(
                                                new Date(item.timestamp),
                                                date
                                            )
                                        )
                                            ? "font-bold"
                                            : ""
                                    }
                                `}
                            >
                                {format(date, "d")}
                                {items.some((item) =>
                                    isSameDay(new Date(item.timestamp), date)
                                ) && (
                                    <span className="absolute bottom-1 left-1/2 w-1 h-1 bg-[#78A083] rounded-full"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Today's Tasks */}
                    <div className="mt-6">
                        <h3 className="font-medium mb-3">
                            Tasks for {format(selectedDate, "MMM d, yyyy")}
                        </h3>
                        <div className="space-y-2">
                            {items
                                .filter((item) =>
                                    isSameDay(
                                        new Date(item.timestamp),
                                        selectedDate
                                    )
                                )
                                .map((item) => (
                                    <div
                                        key={item._id}
                                        className="p-2 bg-[#F5F9F3] rounded-lg text-sm"
                                    >
                                        {item.data.text}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
