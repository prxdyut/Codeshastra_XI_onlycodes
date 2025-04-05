"use client";
import React, { useState } from "react";
import { IoSend } from "react-icons/io5";
import { FiFile } from "react-icons/fi";

interface Message {
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

const page = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    const quickQuestions = [
        "How can I analyze my data?",
        "What patterns can you find?",
        "Help me understand my dataset",
        "Generate insights from my data",
    ];

    const handleSend = () => {
        if (inputText.trim()) {
            const newMessage: Message = {
                text: inputText,
                sender: "user",
                timestamp: new Date(),
            };
            setMessages([...messages, newMessage]);
            setInputText("");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) {
            const newFiles = Array.from(fileList).filter((file) => {
                const ext = file.name.split(".").pop()?.toLowerCase();
                return ext === "csv" || ext === "xlsx" || ext === "xls";
            });
            setFiles([...files, ...newFiles]);
        }
    };

    return (
        <div className="h-[calc(100vh-9rem)] flex flex-col bg-[#F5F9F3] p-6">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[#2D3A3A] mb-2">
                        Socrates AI
                    </h1>
                    <p className="text-[#5E5F6E] text-lg">
                        Your intelligent data analysis assistant
                    </p>
                </div>

                {/* Main Chat Container */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Quick Questions */}
                    {messages.length === 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {quickQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    className="bg-white px-6 py-4 rounded-xl text-base font-medium shadow-sm hover:shadow-lg transition-all duration-200 border border-[#E0E6E3] text-[#2D3A3A] hover:bg-[#78A083] hover:text-white"
                                    onClick={() => setInputText(question)}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${
                                    message.sender === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                        message.sender === "user"
                                            ? "bg-[#78A083] text-white rounded-br-none"
                                            : "bg-white text-[#2D3A3A] rounded-bl-none shadow-sm border border-[#E0E6E3]"
                                    }`}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Input Area */}
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-[#E0E6E3]">
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="file-input"
                                className="hidden"
                                multiple
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="file-input"
                                className="p-2 hover:bg-[#F5F9F3] rounded-full cursor-pointer transition-colors duration-200"
                            >
                                <FiFile className="w-5 h-5 text-[#5E5F6E]" />
                            </label>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleSend()
                                }
                                placeholder="Type your message here..."
                                className="flex-1 outline-none text-[#2D3A3A] placeholder-[#5E5F6E]"
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 hover:bg-[#F5F9F3] rounded-full transition-colors duration-200"
                            >
                                <IoSend className="w-5 h-5 text-[#78A083]" />
                            </button>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="text-sm text-[#5E5F6E] bg-[#F5F9F3] px-2 py-1 rounded"
                                    >
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default page;
