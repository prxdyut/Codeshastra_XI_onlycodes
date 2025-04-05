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
                </div>
            </nav>
        </aside>
    );
}
