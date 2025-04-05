'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Item {
    _id: string;
    type: string;
    timestamp: string;
    data: {
        text: string;
    };
}

export default function ListPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/tasks/list');
            const result = await response.json();
            
            if (result.success) {
                setItems(result.data);
            } else {
                setError('Failed to load items');
            }
        } catch (error) {
            setError('Failed to load items');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <p className="text-center">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <p className="text-center text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Your Reminders & Todos</h1>
                    <Link 
                        href="/add"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Add New
                    </Link>
                </div>

                {items.length === 0 ? (
                    <p className="text-center text-gray-500">No items yet. Add your first one!</p>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div 
                                key={item._id}
                                className="bg-white p-6 rounded-lg shadow-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                            item.type === 'reminder' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {item.type}
                                        </span>
                                        <p className="mt-2 text-gray-700">{item.data.text}</p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 