import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Navbar() {
    const { user: clerkUser } = useUser();
    const [credits, setCredits] = useState(0);

    useEffect(() => {
        if (clerkUser) {
            fetch(`/api/users/${clerkUser?.id}/credits`)
                .then((res) => res.json())
                .then((data) => setCredits(data.credits))
                .catch((err) => console.error("Error fetching credits:", err));
        }
    }, [clerkUser]);

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-[#E0E6E3]">
            <div className="container mx-auto px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={36}
                            height={36}
                        />
                        <Link
                            href="/"
                            className="font-bold text-xl text-[#2D3A3A] hover:text-[#78A083]"
                        >
                            ZeMod
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="text-right bg-gray-100 px-4 rounded-xl">
                                <p className="inline-block m-2 font-semibold">
                                    {credits} credits
                                </p>
                            </div>
                            <Link
                                href="/credits"
                                className="px-4 py-2 bg-[#78A083] text-white rounded-lg text-sm hover:bg-[#2D3A3A] transition-colors"
                            >
                                Add Credits
                            </Link>
                        </div>

                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    rootBox: {
                                        boxShadow: "none",
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}
