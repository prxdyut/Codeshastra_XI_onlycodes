"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
    loadRazorpay,
    initiateRazorpayPayment,
    RazorpayResponse,
} from "@/app/lib/razorpay";

// Add theme colors matching landing and dashboard
const THEME = {
    primary: "#2D3A3A",
    secondary: "#78A083",
    accent: "#B4C7AE",
    background: "#F5F9F3",
    text: "#2D3A3A",
    border: "#E0E6E3",
    muted: "#5E5F6E",
};

// Add mock transactions data
const MOCK_TRANSACTIONS = [
    {
        _id: "1",
        createdAt: "2024-02-15T10:30:00Z",
        amount: 100,
        creditsPurchased: 100,
        status: "completed",
    },
    {
        _id: "2",
        createdAt: "2024-02-10T15:45:00Z",
        amount: 450,
        creditsPurchased: 500,
        status: "completed",
    },
    {
        _id: "3",
        createdAt: "2024-02-05T08:20:00Z",
        amount: 800,
        creditsPurchased: 1000,
        status: "completed",
    },
    {
        _id: "4",
        createdAt: "2024-01-28T12:15:00Z",
        amount: 100,
        creditsPurchased: 100,
        status: "failed",
    },
    {
        _id: "5",
        createdAt: "2024-01-20T09:00:00Z",
        amount: 450,
        creditsPurchased: 500,
        status: "completed",
    },
];

export default function Page() {
    const { user: clerkUser } = useUser();
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (clerkUser) {
            fetchUserData();
        }
    }, [clerkUser]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const [creditsRes, transactionsRes] = await Promise.all([
                fetch(`/api/users/${clerkUser?.id}/credits`),
                fetch(`/api/users/${clerkUser?.id}/transactions`),
            ]);

            const creditsData = await creditsRes.json();
            const transactionsData = await transactionsRes.json();

            setCredits(creditsData.credits);
            // Use mock data if no transactions are returned from API
            setTransactions(
                transactionsData.transactions?.length > 0
                    ? transactionsData.transactions
                    : MOCK_TRANSACTIONS
            );
        } catch (err) {
            console.error("Error fetching user data:", err);
            // Fallback to mock data on error
            setTransactions(MOCK_TRANSACTIONS);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyCredits = async (creditPackage: {
        credits: number;
        price: number;
    }) => {
        setLoading(true);
        try {
            // Initialize payment
            const res = await fetch("/api/payments/init", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clerkUserId: clerkUser?.id,
                    credits: creditPackage.credits,
                }),
            });

            const { id, currency, amount } = await res.json();

            // Load Razorpay script
            await loadRazorpay();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount,
                currency: currency,
                name: "Your App Name",
                description: `Purchase of ${creditPackage.credits} credits`,
                order_id: id,
                handler: async function (response: RazorpayResponse) {
                    // Verify payment on your server
                    await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            clerkUserId: clerkUser?.id,
                        }),
                    });

                    // Refresh user data
                    await fetchUserData();
                },
                prefill: {
                    name: clerkUser?.fullName,
                    email: clerkUser?.primaryEmailAddress?.emailAddress,
                },
                theme: {
                    color: "#3399cc",
                },
            };

            if (!options.key) {
                throw new Error("Razorpay key is not configured");
            }

            // @ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment error:", err);
        } finally {
            setLoading(false);
        }
    };

    const creditPackages = [
        { id: 1, credits: 100, price: 100 },
        { id: 2, credits: 500, price: 450 },
        { id: 3, credits: 1000, price: 800 },
    ];

    return (
        <div className="min-h-screen bg-[#F5F9F3] p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Credits Card */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-2xl font-bold text-[#2D3A3A] mb-6">
                        Your Credits
                    </h2>

                    {loading ? (
                        <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
                    ) : (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1">
                                <p className="text-4xl font-bold text-[#2D3A3A]">
                                    {credits}
                                </p>
                                <p className="text-[#5E5F6E]">
                                    credits available
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Credit Packages */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E0E6E3]">
                    <h3 className="text-xl font-bold text-[#2D3A3A] mb-6">
                        Buy More Credits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {creditPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="border border-[#E0E6E3] rounded-xl p-6 hover:border-[#78A083] transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#F5F9F3] flex items-center justify-center">
                                        <span className="text-xl">💎</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#2D3A3A]">
                                            {pkg.credits} Credits
                                        </h4>
                                        <p className="text-[#78A083] font-medium">
                                            ₹{pkg.price}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleBuyCredits(pkg)}
                                    disabled={loading}
                                    className="w-full py-2 rounded-lg bg-[#2D3A3A] text-white font-medium hover:bg-[#78A083] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? "Processing..." : "Buy Now"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E0E6E3]">
                    <h3 className="text-xl font-bold text-[#2D3A3A] mb-6">
                        Transaction History
                    </h3>
                    {transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-[#E0E6E3]">
                                        <th className="pb-3 font-medium text-[#5E5F6E]">
                                            Date
                                        </th>
                                        <th className="pb-3 font-medium text-[#5E5F6E]">
                                            Amount
                                        </th>
                                        <th className="pb-3 font-medium text-[#5E5F6E]">
                                            Credits
                                        </th>
                                        <th className="pb-3 font-medium text-[#5E5F6E]">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn: any) => (
                                        <tr
                                            key={txn._id}
                                            className="border-b border-[#E0E6E3]"
                                        >
                                            <td className="py-4">
                                                {new Date(
                                                    txn.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                ₹{txn.amount}
                                            </td>
                                            <td className="py-4 text-[#78A083]">
                                                +{txn.creditsPurchased}
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        txn.status ===
                                                        "completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : txn.status ===
                                                              "failed"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[#5E5F6E]">
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
