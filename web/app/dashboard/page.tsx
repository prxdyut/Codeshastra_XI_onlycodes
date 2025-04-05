"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

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
}

const TOOL_CATEGORIES: ToolCategory[] = [
    {
        title: "Code Tools",
        tools: ["Code Formatter"],
        description: "Tools for coding and formatting.",
        icon: "💻",
    },
    {
        title: "Network Tools",
        tools: ["IP Lookup", "DNS Lookup", "Ping Test", "Traceroute"],
        description: "Tools for network diagnostics and analysis.",
        icon: "🌐",
    },
    {
        title: "Random Tools",
        tools: ["Random Number", "UUID Generator", "Dice Roll", "Coin Flip"],
        description: "Tools for generating random values and outcomes.",
        icon: "🎲",
    },
    {
        title: "Conversion Tools",
        tools: ["CSV-Excel Editor", "Image Converter"],
        description: "Tools for converting files and formats.",
        icon: "🔄",
    },
    {
        title: "Format Tools",
        tools: [
            "JSON Formatter",
            "Markdown Formatter",
            "YAML Formatter",
            "XML Formatter",
            "TOML Formatter",
        ],
        description: "Tools for formatting various data types.",
        icon: "🛠️",
    },
    {
        title: "Utility Tools",
        tools: [
            "QR Generator",
            "Password Generator",
            "URL Shortener",
            "API Tester",
        ],
        description: "Tools for various utility purposes.",
        icon: "🔧",
    },
];

export default function DashboardPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Credit and Tool Usage */}
            <div className="lg:col-span-2 space-y-6">
                {/* Credit Status Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Daily Credits</h2>
                            <p className="text-sm text-[#5E5F6E]">15 of 25 credits remaining</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            Pro Plan
                        </span>
                    </div>
                    <div className="w-full bg-[#F5F9F3] rounded-full h-2.5 mb-2">
                        <div className="bg-[#78A083] h-2.5 rounded-full w-3/5"></div>
                    </div>
                    <p className="text-xs text-[#5E5F6E]">Daily limit resets at midnight (25 credits/day)</p>
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
                                        <span className="text-xl">
                                            🛠️
                                        </span>
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

                {/* Quick Access Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOOL_CATEGORIES.slice(0, 4).map((category) => (
                        <div
                            key={category.title}
                            className="bg-white rounded-xl p-4 shadow-sm border border-[#E0E6E3] hover:border-[#78A083] transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                    {category.icon}
                                </span>
                                <h3 className="font-medium">
                                    {category.title}
                                </h3>
                            </div>
                            <p className="text-sm text-[#5E5F6E]">
                                {category.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column - AI Tool Finder */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3] h-fit">
                <h2 className="text-lg font-semibold mb-4">
                    AI Tool Finder
                </h2>
                <div className="space-y-4">
                    <div className="bg-[#F5F9F3] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#78A083] flex items-center justify-center text-white">
                                AI
                            </div>
                            <p className="text-sm">
                                How can I help you today?
                            </p>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-lg border border-[#E0E6E3] text-sm"
                            placeholder="Describe what you want to do..."
                            rows={3}
                        ></textarea>
                        <button className="w-full mt-2 py-2 bg-[#2D3A3A] text-white rounded-lg text-sm hover:bg-[#78A083] transition-colors">
                            Find Tools
                        </button>
                    </div>

                    <div className="border-t border-[#E0E6E3] pt-4"></div>
                        <h3 className="text-sm font-medium mb-2">
                            Suggested Tools
                        </h3>
                        <div className="space-y-2">
                            {TOOL_CATEGORIES[0].tools
                                .slice(0, 3)
                                .map((tool) => (
                                    <div
                                        key={tool}
                                        className="flex items-center gap-2 text-sm p-2 hover:bg-[#F5F9F3] rounded-lg cursor-pointer"
                                    >
                                        <span className="text-[#78A083]">
                                            •
                                        </span>
                                        {tool}
                                    </div>
                                ))}
                        {/* </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
