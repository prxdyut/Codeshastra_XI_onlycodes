import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export const Footer = () => {
    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle feedback submission here
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setEmail("");
        setFeedback("");
    };

    return (
        <footer className="bg-[#2D3A3A] text-white">
            <div className="container mx-auto px-6 py-12">
                {/* Feedback Section */}
                <div className="mb-12 border-b border-[#78A083]/20 pb-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-2xl font-bold mb-2">
                            Share Your Thoughts
                        </h3>
                        <p className="text-[#B4C7AE] mb-6">
                            Help us improve ZenTools with your valuable feedback
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email"
                                className="w-full p-3 rounded-lg bg-white/10 border border-[#78A083]/20 focus:border-[#78A083] text-white placeholder:text-[#B4C7AE] outline-none transition"
                                required
                            />
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Your feedback..."
                                className="w-full p-3 rounded-lg bg-white/10 border border-[#78A083]/20 focus:border-[#78A083] text-white placeholder:text-[#B4C7AE] outline-none transition min-h-[100px]"
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#78A083] hover:bg-[#B4C7AE] text-white rounded-lg transition-colors"
                            >
                                {submitted
                                    ? "Thanks for your feedback!"
                                    : "Submit Feedback"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h4 className="font-semibold mb-4">Platform</h4>
                        <ul className="space-y-2 text-[#B4C7AE]">
                            <li>
                                <Link href="/features">Features</Link>
                            </li>
                            <li>
                                <Link href="/pricing">Pricing</Link>
                            </li>
                            <li>
                                <Link href="/dashboard">Dashboard</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2 text-[#B4C7AE]">
                            <li>
                                <Link href="/docs">Documentation</Link>
                            </li>
                            <li>
                                <Link href="/tutorials">Tutorials</Link>
                            </li>
                            <li>
                                <Link href="/blog">Blog</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-[#B4C7AE]">
                            <li>
                                <Link href="/about">About</Link>
                            </li>
                            <li>
                                <Link href="/careers">Careers</Link>
                            </li>
                            <li>
                                <Link href="/contact">Contact</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-[#B4C7AE]">
                            <li>
                                <Link href="/privacy">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link href="/terms">Terms of Service</Link>
                            </li>
                            <li>
                                <Link href="/cookies">Cookie Policy</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-[#78A083]/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-[#B4C7AE] text-sm">
                        © {new Date().getFullYear()} ZenTools. All rights
                        reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link
                            href="#"
                            className="text-[#B4C7AE] hover:text-white transition-colors"
                        >
                            Twitter
                        </Link>
                        <Link
                            href="#"
                            className="text-[#B4C7AE] hover:text-white transition-colors"
                        >
                            GitHub
                        </Link>
                        <Link
                            href="#"
                            className="text-[#B4C7AE] hover:text-white transition-colors"
                        >
                            Discord
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
