"use client";

import { Sidebar } from "@/app/components/dashboard/Sidebar";
import { Navbar } from "@/app/components/dashboard/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F5F9F3]">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
