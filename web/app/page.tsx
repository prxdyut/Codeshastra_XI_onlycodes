"use client";
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton,
    useUser,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "./components/footer";
import { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";

// Placeholder images - replace with actual images for your platform
import logo from "./images/logo.png";
import heroImage from "./images/hero-image.png";
import toolsImage from "./images/tools-showcase.png";
import creditSystem from "./images/credit-system.png";

// Update the color theme with more consistent values
const THEME = {
    primary: "#2D3A3A", // Deep zen green
    secondary: "#78A083", // Sage green
    accent: "#B4C7AE", // Light sage
    background: "#F5F9F3", // Off white with slight green tint
    text: "#2D3A3A", // Deep zen green for text
    border: "#E0E6E3", // Light sage border
    muted: "#5E5F6E", // Muted text
};

// Updated tool categories with more specific tools
const TOOL_CATEGORIES = [
    {
        title: "Text & Documentation",
        description: "Transform and organize your text content",
        tools: [
            "Markdown Editor & Preview",
            "JSON/XML/YAML Formatter",
            "Text Case Converter",
            "Code Beautifier",
            "Regex Tester",
            "HTML to Markdown",
            "Documentation Generator",
            "Note Organizer",
        ],
        icon: "📝",
    },
    {
        title: "Developer Essentials",
        description: "Streamline your development workflow",
        tools: [
            "API Request Builder",
            "GraphQL Playground",
            "JWT Debugger",
            "Base64 Encoder/Decoder",
            "Code Minifier",
            "Git Command Helper",
            "Docker Compose Builder",
            "Environment Variable Manager",
        ],
        icon: "💻",
    },
    {
        title: "Data & Analytics",
        description: "Process and visualize your data",
        tools: [
            "CSV/Excel Converter",
            "SQL Query Builder",
            "Data Visualizer",
            "Statistics Calculator",
            "Data Cleaner",
            "Schema Designer",
            "Mock Data Generator",
            "Time Series Analyzer",
        ],
        icon: "📊",
    },
    {
        title: "Design & Media",
        description: "Create and edit visual content",
        tools: [
            "Image Format Converter",
            "SVG Editor",
            "Color Palette Generator",
            "Image Compressor",
            "Social Media Templates",
            "Icon Generator",
            "Placeholder Generator",
            "Favicon Creator",
        ],
        icon: "🎨",
    },
    {
        title: "Productivity",
        description: "Optimize your daily workflow",
        tools: [
            "Todo List Manager",
            "Pomodoro Timer",
            "Note Taking",
            "Calendar Planner",
            "Time Zone Converter",
            "Meeting Scheduler",
            "Project Timer",
            "Habit Tracker",
        ],
        icon: "⏱️",
    },
    {
        title: "Security & Privacy",
        description: "Protect your digital assets",
        tools: [
            "Password Generator",
            "Hash Generator",
            "File Encryptor",
            "SSL Checker",
            "Security Headers Tester",
            "CORS Tester",
            "Privacy Policy Generator",
            "Cookie Scanner",
        ],
        icon: "🔒",
    },
];

// User types
const USER_TYPES = [
    {
        title: "Developers",
        description:
            "Access coding, API and database tools tailored for software development",
        icon: "👨‍💻",
        color: "bg-blue-50 border-blue-200",
    },
    {
        title: "Creators",
        description:
            "Utilize design, media and content creation tools for your projects",
        icon: "🎨",
        color: "bg-purple-50 border-purple-200",
    },
    {
        title: "Professionals",
        description:
            "Boost productivity with business, analytics and organizational tools",
        icon: "👔",
        color: "bg-green-50 border-green-200",
    },
];

// Pricing plans
const PRICING_PLANS = [
    {
        title: "Free",
        price: "0",
        features: [
            "5 daily credits",
            "Basic tool access",
            "Standard processing limits",
            "Community support",
        ],
        color: "border-gray-200",
        buttonColor: "bg-gray-700",
    },
    {
        title: "Pro",
        price: "9.99",
        period: "monthly",
        features: [
            "25 daily credits",
            "Full tool access",
            "Priority processing",
            "Email support",
            "Save tool configurations",
        ],
        color: "border-blue-200",
        buttonColor: "bg-blue-600",
        recommended: true,
    },
    {
        title: "Enterprise",
        price: "29.99",
        period: "monthly",
        features: [
            "Unlimited credits",
            "Advanced tool features",
            "Maximum processing capacity",
            "Priority support",
            "API access",
            "Custom tool development",
        ],
        color: "border-purple-200",
        buttonColor: "bg-purple-600",
    },
];

export default function Home() {
    const [activeTab, setActiveTab] = useState("developers");
    const { user, isLoaded } = useUser();

    return (
        <main className="bg-[#F5F9F3]">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-sm border-b border-[#E0E6E3]">
                <div className="container mx-auto px-6">
                    <nav className="py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Image
                                src={logo}
                                alt="Logo"
                                width={36}
                                height={36}
                            />
                            <span className="font-bold text-xl text-[#131316]">
                                ZenTools
                            </span>
                        </div>
                        <div className="flex gap-6 items-center">
                            <Link
                                href="/features"
                                className="text-[#5E5F6E] hover:text-[#131316] text-sm"
                            >
                                Features
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-[#5E5F6E] hover:text-[#131316] text-sm"
                            >
                                Pricing
                            </Link>
                            <SignedIn>
                                <div className="flex items-center gap-6">
                                    <Link href="/dashboard">
                                        <button className="px-4 py-2 rounded-full bg-[#78A083] text-white text-sm font-semibold hover:bg-[#2D3A3A] transition-colors">
                                            Dashboard
                                        </button>
                                    </Link>
                                    <div className="flex items-center gap-3 border-l border-[#E0E6E3] pl-6">
                                        <div className="flex flex-col">
                                            {isLoaded ? (
                                                <>
                                                    <span className="text-sm font-medium text-[#2D3A3A]">
                                                        {user?.firstName ||
                                                            user?.username}
                                                    </span>
                                                    <span className="text-xs text-[#5E5F6E]">
                                                        {
                                                            user
                                                                ?.primaryEmailAddress
                                                                ?.emailAddress
                                                        }
                                                    </span>
                                                </>
                                            ) : (
                                                <div className="h-8 w-24 animate-pulse bg-gray-200 rounded"></div>
                                            )}
                                        </div>
                                        <UserButton
                                            appearance={{
                                                elements: {
                                                    avatarBox:
                                                        "w-8 h-8 rounded-full",
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <SignInButton>
                                    <button className="px-4 py-2 rounded-full bg-[#78A083] text-white text-sm font-semibold hover:bg-[#2D3A3A] transition-colors">
                                        Sign in
                                    </button>
                                </SignInButton>
                            </SignedOut>
                        </div>
                    </nav>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="min-h-screen flex items-center pt-24 border-b border-[#E0E6E3]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#2D3A3A] mb-6">
                            <TypeAnimation
                                sequence={[
                                    "Declutter Your Workflow",
                                    2000,
                                    "All You Need, Made Available",
                                    2000,
                                    "Keeps You Productive",
                                    2000,
                                ]}
                                wrapper="span"
                                cursor={true}
                                repeat={Infinity}
                            />
                            <span className="text-[#78A083] block mt-2">
                                One Unified Platform.
                            </span>
                        </h1>

                        <p className="text-[#5E5F6E] mb-8 text-lg max-w-[30rem]">
                            A unified AI-powered platform for all your needs.
                            Complete tasks, earn credits, and unlock powerful
                            tools tailored just for you.
                        </p>

                        <div className="flex gap-4">
                            <SignedOut>
                                <SignInButton>
                                    <button className="px-6 py-3 rounded-full bg-[#131316] text-white font-semibold text-sm">
                                        Get Started Free
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Link href="/dashboard">
                                    <button className="px-6 py-3 rounded-full bg-[#131316] text-white font-semibold text-sm">
                                        Go to Dashboard
                                    </button>
                                </Link>
                            </SignedIn>
                            <Link href="/learn-more">
                                <button className="px-6 py-3 rounded-full border border-[#E0E0E0] text-[#131316] font-semibold text-sm">
                                    Learn More
                                </button>
                            </Link>
                        </div>

                        <div className="mt-8 text-sm text-[#5E5F6E]">
                            <p>
                                No credit card required for free access • Cancel
                                anytime
                            </p>
                        </div>
                    </div>

                    <div className="md:w-1/2 relative">
                        <div className="bg-blue-50 rounded-lg p-6 md:p-10 shadow-lg">
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        AI
                                    </div>
                                    <div className="ml-3 text-sm text-gray-700">
                                        How can I help you today?
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded p-3 text-sm">
                                    "I need to format a JSON file and generate a
                                    QR code from it"
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700">
                                        Format JSON
                                    </div>
                                    <div className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700">
                                        Generate QR
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-sm font-medium">
                                        Today's Credits
                                    </div>
                                    <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                        +3 Completed Tasks
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full w-3/4"></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-600">
                                    <div>0</div>
                                    <div>15/20 Credits</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add user status in hero section for signed in users */}
            <SignedIn>
                <div className="absolute top-24 right-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-[#E0E6E3]">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            {isLoaded && user ? (
                                <span className="text-[#5E5F6E]">
                                    Welcome back,{" "}
                                    {user.firstName || user.username}!
                                </span>
                            ) : (
                                <div className="h-4 w-32 animate-pulse bg-gray-200 rounded"></div>
                            )}
                        </div>
                    </div>
                </div>
            </SignedIn>

            {/* User Types Section */}
            <div className="container mx-auto px-6 py-20 border-b border-[#E0E6E3]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[#131316] mb-4">
                        Tailored for Every User
                    </h2>
                    <p className="text-[#5E5F6E] max-w-2xl mx-auto">
                        Our platform adapts to your needs with specialized tools
                        for different user types
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    {USER_TYPES.map((user) => (
                        <div
                            key={user.title}
                            className={`rounded-xl p-6 border ${user.color} flex-1 max-w-sm cursor-pointer transition-all hover:shadow-md`}
                            onClick={() =>
                                setActiveTab(user.title.toLowerCase())
                            }
                        >
                            <div className="text-4xl mb-4">{user.icon}</div>
                            <h3 className="text-xl font-bold mb-2">
                                {user.title}
                            </h3>
                            <p className="text-[#5E5F6E]">{user.description}</p>

                            <div
                                className={`mt-4 h-1 w-16 rounded-full ${
                                    activeTab === user.title.toLowerCase()
                                        ? "bg-blue-600"
                                        : "bg-gray-200"
                                }`}
                            ></div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-[#F5F9F3] rounded-xl p-8 border border-[#E0E6E3]">
                    <h3 className="text-xl font-bold mb-4">
                        {
                            USER_TYPES.find(
                                (u) => u.title.toLowerCase() === activeTab
                            )?.title
                        }{" "}
                        Toolkit
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TOOL_CATEGORIES.slice(0, 6).map((category) => (
                            <div
                                key={category.title}
                                className="bg-white rounded-lg p-4 shadow-sm"
                            >
                                <div className="text-2xl mb-2">
                                    {category.icon}
                                </div>
                                <h4 className="font-semibold mb-1">
                                    {category.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    {category.description}
                                </p>
                                <ul className="text-xs text-gray-500">
                                    {category.tools.slice(0, 2).map((tool) => (
                                        <li key={tool} className="mb-1">
                                            • {tool}
                                        </li>
                                    ))}
                                    <li className="text-blue-600">
                                        + more tools
                                    </li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Credit System */}
            <div className="px-6 py-20 border-b border-[#E0E6E3] bg-gradient-to-br from-[#F5F9F3] to-white">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-[#78A083] text-sm font-semibold tracking-wider uppercase">
                            Rewards System
                        </span>
                        <h2 className="text-3xl font-bold text-[#131316] mb-4">
                            Earn As You Create
                        </h2>
                        <p className="text-[#5E5F6E] max-w-2xl mx-auto">
                            Our unique credit system rewards you for being
                            productive. Complete tasks, earn credits, and unlock
                            premium features instantly.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        {/* Left Column - Credit Earning */}
                        <div className="md:w-1/2">
                            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-[#E0E6E3] pb-4">
                                    <h3 className="font-bold text-lg text-[#2D3A3A]">
                                        Credit Earning Guide
                                    </h3>
                                    <span className="text-xs text-[#78A083] font-medium bg-[#F5F9F3] px-3 py-1 rounded-full">
                                        Updated Daily
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {/* Activity Types */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-[#F5F9F3] flex items-center justify-center">
                                            <span className="text-xl">🎯</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-[#2D3A3A]">
                                                    Task Completion
                                                </h4>
                                                <span className="text-sm font-bold text-[#78A083]">
                                                    +5 credits
                                                </span>
                                            </div>
                                            <div className="w-full bg-[#F5F9F3] rounded-full h-2">
                                                <div className="bg-[#78A083] h-2 rounded-full w-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-[#F5F9F3] flex items-center justify-center">
                                            <span className="text-xl">✨</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-[#2D3A3A]">
                                                    Daily Streak
                                                </h4>
                                                <span className="text-sm font-bold text-[#78A083]">
                                                    +2 credits/day
                                                </span>
                                            </div>
                                            <div className="w-full bg-[#F5F9F3] rounded-full h-2">
                                                <div className="bg-[#78A083] h-2 rounded-full w-4/5"></div>
                                            </div>
                                            <p className="text-xs text-[#5E5F6E] mt-1">
                                                Current streak: 4 days
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-[#F5F9F3] flex items-center justify-center">
                                            <span className="text-xl">💭</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-[#2D3A3A]">
                                                    Feedback & Reviews
                                                </h4>
                                                <span className="text-sm font-bold text-[#78A083]">
                                                    +1 credit
                                                </span>
                                            </div>
                                            <div className="w-full bg-[#F5F9F3] rounded-full h-2">
                                                <div className="bg-[#78A083] h-2 rounded-full w-2/3"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Balance Card */}
                                <div className="bg-gradient-to-r from-[#78A083] to-[#2D3A3A] rounded-lg p-6 text-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-sm opacity-80">
                                                Available Credits
                                            </p>
                                            <p className="text-3xl font-bold mt-1">
                                                {isLoaded ? "12" : "..."}
                                            </p>
                                        </div>
                                        <div className="bg-white/20 rounded-lg px-3 py-1">
                                            <p className="text-xs">
                                                Tier: {isLoaded ? "Pro" : "..."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs opacity-80">
                                        Next reset:{" "}
                                        {new Date().toLocaleDateString()} at
                                        midnight
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Premium Features */}
                        <div className="md:w-1/2">
                            <div className="bg-[#F5F9F3] rounded-xl p-6 border border-[#E0E6E3]">
                                <h3 className="font-bold text-xl mb-6 text-[#2D3A3A]">
                                    Unlock Premium Features
                                </h3>
                                <div className="grid gap-4">
                                    {/* Feature cards */}
                                    {/* ...existing premium feature cards... */}
                                </div>
                                <Link href="/pricing" className="mt-6 block">
                                    <button className="w-full py-3 px-4 rounded-lg bg-[#2D3A3A] text-white font-medium hover:bg-[#78A083] transition-colors">
                                        View All Premium Features
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="container mx-auto px-6 py-20 border-b border-[#E0E6E3]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[#131316] mb-4">
                        Choose Your Plan
                    </h2>
                    <p className="text-[#5E5F6E] max-w-2xl mx-auto">
                        Select the perfect plan to access the tools and features
                        you need
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    {PRICING_PLANS.map((plan) => (
                        <div
                            key={plan.title}
                            className={`rounded-xl p-6 border-2 ${
                                plan.recommended
                                    ? "border-[#78A083]"
                                    : "border-[#E0E6E3]"
                            } flex-1 max-w-sm relative ${
                                plan.recommended ? "shadow-lg" : "shadow-sm"
                            }`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#78A083] text-white text-xs font-bold py-1 px-3 rounded-full">
                                    RECOMMENDED
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-1">
                                {plan.title}
                            </h3>
                            <div className="mb-4">
                                <span className="text-3xl font-bold">
                                    ${plan.price}
                                </span>
                                {plan.period && (
                                    <span className="text-sm text-gray-600">
                                        /{plan.period}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5">
                                            ✓
                                        </div>
                                        <span className="text-sm">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <SignedOut>
                                <SignInButton>
                                    <button
                                        className={`w-full py-2 rounded-lg ${plan.buttonColor} text-white font-medium`}
                                    >
                                        {plan.title === "Free"
                                            ? "Get Started"
                                            : "Subscribe"}
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Link
                                    href={`/subscription/${plan.title.toLowerCase()}`}
                                >
                                    <button
                                        className={`w-full py-2 rounded-lg ${plan.buttonColor} text-white font-medium`}
                                    >
                                        {plan.title === "Free"
                                            ? "Current Plan"
                                            : "Upgrade"}
                                    </button>
                                </Link>
                            </SignedIn>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="container mx-auto px-6 py-20 text-center bg-[#F5F9F3]">
                <h2 className="text-3xl font-bold text-[#131316] mb-6">
                    Ready to Boost Your Productivity?
                </h2>
                <p className="text-[#5E5F6E] max-w-2xl mx-auto mb-8">
                    Join thousands of users already simplifying their workflow
                    with our all-in-one platform
                </p>

                <SignedOut>
                    <SignInButton>
                        <button className="px-8 py-3 rounded-full bg-[#131316] text-white font-semibold text-sm">
                            Get Started Free
                        </button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <Link href="/dashboard">
                        <button className="px-8 py-3 rounded-full bg-[#131316] text-white font-semibold text-sm">
                            Go to Dashboard
                        </button>
                    </Link>
                </SignedIn>
            </div>

            <Footer />
        </main>
    );
}
