"use client";

import { useState, useEffect } from "react";
import {
    add,
    format,
    sub,
    isSameMonth,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
} from "date-fns";

interface Item {
    _id: string;
    type: string;
    timestamp: string;
    data: {
        text: string;
        action?: {
            reminder?: {
                message: string;
                dateTime: string;
                recurring?: string;
                priority?: string;
            };
            todo?: {
                message: string;
                dueDate: string;
                priority: string;
                category: string;
            };
        };
    };
    completed?: boolean;
}

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({ text: "" });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch("/api/tasks/list");
            const result = await response.json();

            if (result.success) {
                setItems(result.data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: newTask.text }),
            });

            const result = await response.json();
            if (result.success) {
                setIsModalOpen(false);
                setNewTask({ text: "" });
                fetchItems();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
            });
            if (response.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleClearAll = async () => {
        try {
            const response = await fetch("/api/tasks/clear", {
                method: "DELETE",
            });
            if (response.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const nextMonth = () => setCurrentMonth(add(currentMonth, { months: 1 }));
    const prevMonth = () => setCurrentMonth(sub(currentMonth, { months: 1 }));

    const renderItem = (item: Item) => (
        <div
            key={item._id}
            className={`flex items-center gap-4 p-4 ${
                item.completed ? "bg-gray-100" : "bg-[#F5F9F3]"
            } rounded-lg`}
        >
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                <span className="text-xl">
                    {item.type === "reminder" ? "⏰" : "✓"}
                </span>
            </div>
            <div className="flex-1">
                <h3
                    className={`font-medium ${
                        item.completed ? "line-through text-gray-500" : ""
                    }`}
                >
                    {item.data.action?.reminder?.message ||
                        item.data.action?.todo?.message ||
                        item.data.text}
                </h3>
                <p className="text-sm text-[#5E5F6E]">
                    {format(new Date(item.timestamp), "MMM d")} at{" "}
                    {format(new Date(item.timestamp), "h:mm a")}
                    {item.data.action?.reminder?.recurring &&
                        ` • Recurring: ${item.data.action.reminder.recurring}`}
                    {item.data.action?.reminder?.priority &&
                        ` • Priority: ${item.data.action.reminder.priority}`}
                </p>
            </div>
            <div className="flex gap-2">
                {!item.completed && (
                    <button
                        onClick={() => handleComplete(item._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Complete"
                    >
                        ✓
                    </button>
                )}
                <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                >
                    ×
                </button>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Task Overview */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Today's Schedule
                        </h2>
                        <button
                            onClick={handleClearAll}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="space-y-4">
                        {items
                            .filter((item) =>
                                isSameDay(
                                    new Date(item.timestamp),
                                    selectedDate
                                )
                            )
                            .map(renderItem)}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-xl font-semibold mb-4">
                        Upcoming Tasks
                    </h2>
                    <div className="space-y-4">
                        {items
                            .filter(
                                (item) =>
                                    new Date(item.timestamp) > selectedDate &&
                                    isSameMonth(
                                        new Date(item.timestamp),
                                        currentMonth
                                    )
                            )
                            .map(renderItem)}
                    </div>
                </div>
            </div>

            {/* Right Column - Calendar */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-[#F5F9F3] rounded-lg"
                        >
                            ←
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-[#F5F9F3] rounded-lg"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                            <div
                                key={day}
                                className="text-center text-sm font-medium text-[#5E5F6E]"
                            >
                                {day}
                            </div>
                        )
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((date, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(date)}
                            className={`
                                aspect-square p-2 rounded-lg text-sm relative
                                ${
                                    isSameDay(date, selectedDate)
                                        ? "bg-[#78A083] text-white"
                                        : isSameMonth(date, currentMonth)
                                        ? "hover:bg-[#F5F9F3]"
                                        : "text-[#5E5F6E] opacity-50"
                                }
                                ${
                                    items.some((item) =>
                                        isSameDay(
                                            new Date(item.timestamp),
                                            date
                                        )
                                    )
                                        ? "font-bold"
                                        : ""
                                }
                            `}
                        >
                            {format(date, "d")}
                            {items.some((item) =>
                                isSameDay(new Date(item.timestamp), date)
                            ) && (
                                <span className="absolute bottom-1 left-1/2 w-1 h-1 bg-[#78A083] rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Add Task Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full mt-6 py-2 bg-[#78A083] text-white rounded-lg hover:bg-[#6a8f74] transition-colors"
                >
                    Add New Task
                </button>
            </div>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-96">
                        <h2 className="text-xl font-semibold mb-4">
                            Add New Task
                        </h2>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.text}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            text: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                    rows={4}
                                    placeholder="Example: Remind me to call John tomorrow at 3pm&#10;Example: Add a todo to buy groceries by next Friday"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-[#78A083] text-white rounded-lg"
                                >
                                    Add Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
