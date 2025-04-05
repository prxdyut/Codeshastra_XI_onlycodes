import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
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
                            ZeMode
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="text-right bg-gray-100 px-4 rounded-xl">
                                <p className="inline-block m-2 font-semibold">
                                    &#8377;4500
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
