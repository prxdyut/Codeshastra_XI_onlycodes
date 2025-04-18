"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOL_CATEGORIES } from "@/app/consts/cards";
import { useState } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const toggleCategory = (title: string) => {
        setOpenCategories((prev) =>
            prev.includes(title)
                ? prev.filter((cat) => cat !== title)
                : [...prev, title]
        );
    };

    return (
        <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-[#E0E6E3]">
            <nav className="h-full overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* AI Assistants */}
                    <Link
                        href="/dashboard/socrates"
                        className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg ${
                            pathname === "/dashboard/socrates"
                                ? "bg-amber-50 text-amber-600 font-medium"
                                : "text-amber-600 hover:bg-amber-50"
                        }`}
                    >
                        <span>🤖</span>
                        <span className="font-semibold">Socrates AI</span>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                            Beta
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/aristotle"
                        className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg ${
                            pathname === "/dashboard/aristotle"
                                ? "bg-purple-50 text-purple-600 font-medium"
                                : "text-purple-600 hover:bg-purple-50"
                        }`}
                    >
                        <span>⚡</span>
                        <span className="font-semibold">Aristotle AI</span>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                            Beta
                        </span>
                    </Link>

                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-2 text-sm ${
                            pathname === "/dashboard"
                                ? "text-[#78A083] font-medium"
                                : "text-[#5E5F6E]"
                        }`}
                    >
                        <span>🏠</span>
                        Dashboard
                    </Link>

                    <Link
                        href="/dashboard/schedule"
                        className={`flex items-center gap-2 text-sm ${
                            pathname === "/dashboard/schedule"
                                ? "text-[#78A083] font-medium"
                                : "text-[#5E5F6E]"
                        }`}
                    >
                        <span>📅</span>
                        Schedule
                    </Link>

                    {TOOL_CATEGORIES.map((category) => (
                        <div key={category.title} className="space-y-2">
                            <button
                                onClick={() => toggleCategory(category.title)}
                                className="flex items-center justify-between w-full text-xs font-medium text-[#5E5F6E] uppercase"
                            >
                                <span>{category.title}</span>
                                <span className="text-sm">
                                    {openCategories.includes(category.title)
                                        ? "▼"
                                        : "▶"}
                                </span>
                            </button>
                            {openCategories.includes(category.title) && (
                                <div className="space-y-1 pl-2">
                                    {category.tools.map((tool, index) => (
                                        <Link
                                            key={tool}
                                            href={`/dashboard/tools/${
                                                category.routes?.[index] ||
                                                tool
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")
                                            }`}
                                            className={`block text-sm py-1 px-2 rounded-lg ${
                                                pathname ===
                                                `/dashboard/tools/${
                                                    category.routes?.[index] ||
                                                    tool
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "-")
                                                }`
                                                    ? "bg-[#F5F9F3] text-[#78A083]"
                                                    : "text-[#5E5F6E] hover:bg-[#F5F9F3]"
                                            }`}
                                        >
                                            {tool}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {/* AI Assistants */}
                    <Link
                        href="/dashboard/contribute"
                        className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg ${
                            pathname === "/dashboard/contribute"
                                ? "bg-emerald-50 text-emerald-600 font-medium"
                                : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                    >
                        <span>❤️</span>
                        <span className="font-semibold">Contribute</span>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                            Support
                        </span>
                    </Link>
                </div>
            </nav>
        </aside>
    );
}
