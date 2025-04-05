// components/CreditsDashboard.js
'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { loadRazorpay, initiateRazorpayPayment, RazorpayResponse } from '@/app/lib/razorpay';

export default function CreditsDashboard() {
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
        fetch(`/api/users/${clerkUser?.id}/transactions`)
      ]);
      
      const creditsData = await creditsRes.json();
      const transactionsData = await transactionsRes.json();
      
      setCredits(creditsData.credits);
      setTransactions(transactionsData.transactions);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (creditPackage: { credits: number; price: number }) => {
    setLoading(true);
    try {
      // Initialize payment
      const res = await fetch('/api/payments/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        name: 'Your App Name',
        description: `Purchase of ${creditPackage.credits} credits`,
        order_id: id,
        handler: async function(response: RazorpayResponse) {
          // Verify payment on your server
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
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
          color: '#3399cc',
        },
      };
      
      if (!options.key) {
        throw new Error('Razorpay key is not configured');
      }
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Credits</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="mb-8">
          <p className="text-4xl font-bold">{credits}</p>
          <p className="text-gray-600">credits available</p>
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-4">Buy More Credits</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {creditPackages.map((pkg) => (
          <div key={pkg.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <h4 className="font-bold text-lg">{pkg.credits} Credits</h4>
            <p className="text-gray-600 mb-2">₹{pkg.price}</p>
            <button
              onClick={() => handleBuyCredits(pkg)}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Credits</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn: any) => (
                <tr key={txn._id}>
                  <td className="py-2 px-4 border-b">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">₹{txn.amount}</td>
                  <td className="py-2 px-4 border-b">+{txn.creditsPurchased}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs ${
                      txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                      txn.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No transactions yet</p>
      )}
    </div>
  );
}