"use client";

import { useState } from "react";
import {
    add,
    format,
    sub,
    isSameMonth,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSunday,
} from "date-fns";

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        date: new Date(),
        time: "",
        type: "task",
    });

    // Sample holidays data
    const holidays = [
        { date: new Date(2024, 1, 14), name: "Valentine's Day" },
        { date: new Date(2024, 0, 26), name: "Republic Day" },
        // Add more holidays as needed
    ];

    const [tasks, setTasks] = useState([
        {
            id: 1,
            title: "Project Review",
            date: new Date(2024, 1, 15),
            time: "10:00 AM",
            type: "meeting",
        },
        {
            id: 2,
            title: "Code Deployment",
            date: new Date(2024, 1, 16),
            time: "2:00 PM",
            type: "task",
        },
    ]);

    const handleAddTask = (e) => {
        e.preventDefault();
        const newTaskWithId = {
            ...newTask,
            id: tasks.length + 1,
            date: selectedDate,
        };
        setTasks([...tasks, newTaskWithId]);
        setIsModalOpen(false);
        setNewTask({ title: "", date: new Date(), time: "", type: "task" });
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const nextMonth = () => setCurrentMonth(add(currentMonth, { months: 1 }));
    const prevMonth = () => setCurrentMonth(sub(currentMonth, { months: 1 }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Task Overview */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-xl font-semibold mb-4">
                        Today's Schedule
                    </h2>
                    <div className="space-y-4">
                        {tasks
                            .filter((task) =>
                                isSameDay(task.date, selectedDate)
                            )
                            .map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 bg-[#F5F9F3] rounded-lg"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                        <span className="text-xl">
                                            {task.type === "meeting"
                                                ? "👥"
                                                : "✓"}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">
                                            {task.title}
                                        </h3>
                                        <p className="text-sm text-[#5E5F6E]">
                                            {task.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {tasks.filter((task) =>
                            isSameDay(task.date, selectedDate)
                        ).length === 0 && (
                            <p className="text-center text-[#5E5F6E] py-4">
                                No tasks scheduled for this day
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E0E6E3]">
                    <h2 className="text-xl font-semibold mb-4">
                        Upcoming Tasks
                    </h2>
                    <div className="space-y-4">
                        {tasks
                            .filter(
                                (task) =>
                                    task.date > selectedDate &&
                                    isSameMonth(task.date, currentMonth)
                            )
                            .map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 bg-[#F5F9F3] rounded-lg"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                        <span className="text-xl">
                                            {task.type === "meeting"
                                                ? "👥"
                                                : "✓"}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">
                                            {task.title}
                                        </h3>
                                        <p className="text-sm text-[#5E5F6E]">
                                            {format(task.date, "MMM d")} at{" "}
                                            {task.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
                                    holidays.some((h) =>
                                        isSameDay(h.date, date)
                                    )
                                        ? "bg-red-100"
                                        : ""
                                }
                                ${
                                    tasks.some((task) =>
                                        isSameDay(task.date, date)
                                    )
                                        ? "font-bold"
                                        : ""
                                }
                            `}
                        >
                            {format(date, "d")}
                            {tasks.some((task) =>
                                isSameDay(task.date, date)
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
                                <label className="block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            title: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Time</label>
                                <input
                                    type="time"
                                    value={newTask.time}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            time: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Type</label>
                                <select
                                    value={newTask.type}
                                    onChange={(e) =>
                                        setNewTask({
                                            ...newTask,
                                            type: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="task">Task</option>
                                    <option value="meeting">Meeting</option>
                                </select>
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
