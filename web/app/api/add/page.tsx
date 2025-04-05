'use client';

import { useState } from 'react';

export default function AddPage() {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('');
    const [prediction, setPrediction] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Processing...');
        setPrediction(null);

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const result = await response.json();
            if (result.success) {
                setText('');
                setPrediction(result.data);
                setStatus('Saved successfully!');
                setTimeout(() => {
                    setStatus('');
                    setPrediction(null);
                }, 5000);
            } else {
                setStatus(`Error: ${result.error}`);
            }
        } catch (error) {
            setStatus('Error saving data');
            console.error('Error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-8">Add Task or Reminder</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            What would you like to do?
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows={4}
                            placeholder="Example: Remind me to call John tomorrow at 3pm&#10;Example: Add a todo to buy groceries by next Friday"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save
                    </button>

                    {status && (
                        <div className={`text-center ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                            {status}
                        </div>
                    )}

                    {prediction && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Detected {prediction.type}:
                            </h3>
                            <div className="text-sm text-gray-600">
                                {prediction.type === 'todo' ? (
                                    <>
                                        <p><strong>Task:</strong> {prediction.data.action.todo?.message}</p>
                                        <p><strong>Due:</strong> {prediction.data.action.todo?.dueDate || 'Not specified'}</p>
                                        <p><strong>Priority:</strong> {prediction.data.action.todo?.priority}</p>
                                        <p><strong>Category:</strong> {prediction.data.action.todo?.category}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>Reminder:</strong> {prediction.data.action.reminder?.message || 'Not specified'}</p>
                                        <p><strong>When:</strong> {prediction.data.action.reminder?.dateTime || 'Not specified'}</p>
                                        <p><strong>Recurring:</strong> {prediction.data.action.reminder?.recurring || 'Not specified'}</p>
                                        <p><strong>Priority:</strong> {prediction.data.action.reminder?.priority || 'Not specified'}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
} 