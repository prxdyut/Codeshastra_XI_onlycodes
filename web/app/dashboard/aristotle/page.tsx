"use client";
import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { FiFile } from "react-icons/fi";
import { FaPlay } from "react-icons/fa";

interface Message {
    text: string | React.ReactNode;
    sender: "user" | "bot";
    timestamp: Date;
}

interface ToolCall {
    tool: string;
    arguments: Record<string, any>;
    expectedReturn: string;
    dependsOn?: {
        toolCall: number;
        outputMapping: {
            from: string;
            to: string;
        }[];
    };
}

interface ToolResult {
    toolCall: ToolCall;
    result: any;
    timestamp: string;
    success: boolean;
    error?: string;
}

interface ProcessResult {
    step: string;
    toolCalls: ToolCall[];
    results: ToolResult[];
    timestamp: string;
}

const Page = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
    const [currentToolIndex, setCurrentToolIndex] = useState<number>(-1);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        "Analyze this code file",
        "Read and process this data",
        "Make an API call with this data",
        "Analyze and transform this content",
    ];

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addMessage = (text: string | React.ReactNode, sender: "user" | "bot") => {
        const newMessage: Message = {
            text,
            sender,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            return data.filePath; // Returns the path where file was saved
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    const handleInitialPrompt = async () => {
        if (!inputText.trim() || isProcessing) return;

        setIsProcessing(true);
        addMessage(inputText, "user");
        setInputText("");

        try {
            // Upload files first if any
            const uploadedPaths = await Promise.all(
                files.map(file => handleFileUpload(file))
            );

            const response = await fetch('/api/aristotle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: inputText,
                    action: 'analyze',
                    files: uploadedPaths
                })
            });

            const data = await response.json();

            if (data.toolCalls) {
                setToolCalls(data.toolCalls);
                
                addMessage(
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>I've analyzed your request and determined the following tool calls:</div>
                            <button
                                onClick={() => handleExecuteAllTools(data.toolCalls)}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                                title="Execute all tools in sequence"
                            >
                                <FaPlay className="w-3 h-3" />
                                <span>Run All</span>
                            </button>
                        </div>
                        <div className="space-y-1">
                            {data.toolCalls.map((tool: ToolCall, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div>
                                        {index + 1}. {tool.tool} ({Object.keys(tool.arguments).join(', ')})
                                    </div>
                                    <button
                                        onClick={() => handleExecuteSingleTool(tool)}
                                        className="p-1 text-green-600 hover:text-green-800"
                                        title="Execute this tool"
                                    >
                                        <FaPlay className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">Would you like to proceed with these operations? (yes/no)</div>
                    </div>,
                    "bot"
                );
                setShowConfirmation(true);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error analyzing your request.', "bot");
        } finally {
            setIsProcessing(false);
        }
    };

    const executeTool = async (toolCall: ToolCall) => {
        console.log('🔄 Executing tool:', toolCall.tool);
        console.log('📝 Tool arguments:', toolCall.arguments);
        
        try {
            const response = await fetch('/api/aristotle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'execute_tool',
                    toolCall
                })
            });

            console.log('📡 API Response status:', response.status);
            const data = await response.json();
            console.log('📦 API Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to execute tool');
            }

            return data.result as ToolResult;
        } catch (error) {
            console.error('❌ Tool execution error:', error);
            throw error;
        }
    };

    const handleConfirmation = async (proceed: boolean) => {
        setShowConfirmation(false);
        if (proceed) {
            setCurrentToolIndex(0);
            addMessage('Starting tool execution sequence.', "bot");
            await executeNextTool();
        } else {
            addMessage('Operation cancelled. Feel free to start over with a new request.', "bot");
            resetState();
        }
    };

    const executeNextTool = async () => {
        if (currentToolIndex >= 0 && currentToolIndex < toolCalls.length) {
            const toolCall = toolCalls[currentToolIndex];
            console.log(`\n🔄 Starting tool ${currentToolIndex + 1}/${toolCalls.length}: ${toolCall.tool}`);
            
            // If this tool depends on previous results, show the mapping
            if (toolCall.dependsOn) {
                console.log('🔗 Tool has dependencies:', toolCall.dependsOn);
                addMessage(`Tool ${toolCall.tool} requires data from previous tool. Mapping data...`, "bot");
            }

            try {
                addMessage(`Executing ${toolCall.tool}...`, "bot");
                console.log('⚡ Calling executeTool...');
                const result = await executeTool(toolCall);
                console.log('✅ Tool execution result:', result);
                
                if (result.success) {
                    addMessage(`Successfully executed ${toolCall.tool}`, "bot");
                    if (result.result) {
                        const resultStr = typeof result.result === 'string' 
                            ? result.result 
                            : JSON.stringify(result.result, null, 2);
                        addMessage(`Result: ${resultStr}`, "bot");
                    }
                } else {
                    console.error('❌ Tool execution failed:', result.error);
                    addMessage(`Error executing ${toolCall.tool}: ${result.error}`, "bot");
                    return;
                }

                const nextIndex = currentToolIndex + 1;
                console.log(`📊 Current tool index: ${currentToolIndex}, Next index: ${nextIndex}, Total tools: ${toolCalls.length}`);
                setCurrentToolIndex(nextIndex);

                if (nextIndex < toolCalls.length) {
                    console.log('🔄 Moving to next tool...');
                    await executeNextTool();
                } else {
                    console.log('✅ All tools executed, generating summary...');
                    await generateFinalSummary();
                }
            } catch (error) {
                console.error('❌ Error in executeNextTool:', error);
                addMessage(`Error executing ${toolCall.tool}. Would you like to retry? (yes/no)`, "bot");
            }
        } else {
            console.log('⚠️ Invalid tool index:', currentToolIndex);
        }
    };

    const generateFinalSummary = async () => {
        try {
            const response = await fetch('/api/aristotle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_summary',
                    toolCalls,
                })
            });

            const data = await response.json();
            addMessage(data.summary, "bot");
        } catch (error) {
            console.error('Error generating summary:', error);
            addMessage('Error generating final summary.', "bot");
        } finally {
            resetState();
        }
    };

    const resetState = () => {
        setToolCalls([]);
        setCurrentToolIndex(-1);
        setShowConfirmation(false);
        setFiles([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSend = () => {
        if (showConfirmation) {
            handleConfirmation(inputText.toLowerCase() === 'yes');
        } else {
            handleInitialPrompt();
        }
    };

    const handleExecuteSingleTool = async (toolCall: ToolCall) => {
        try {
            addMessage(`Executing single tool: ${toolCall.tool}...`, "bot");
            const result = await executeTool(toolCall);
            
            if (result.success) {
                addMessage(`Successfully executed ${toolCall.tool}`, "bot");
                if (result.result) {
                    const resultStr = typeof result.result === 'string' 
                        ? result.result 
                        : JSON.stringify(result.result, null, 2);
                    addMessage(`Result: ${resultStr}`, "bot");
                }
            } else {
                addMessage(`Error executing ${toolCall.tool}: ${result.error}`, "bot");
            }
        } catch (error) {
            console.error('Error executing single tool:', error);
            addMessage(`Error executing ${toolCall.tool}. Please try again.`, "bot");
        }
    };

    const handleExecuteAllTools = async (toolCalls: ToolCall[]) => {
        try {
            addMessage(`Executing all tools in sequence...`, "bot");
            const response = await fetch('/api/aristotle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'execute_tool',
                    toolCalls: toolCalls
                })
            });

            const data = await response.json();
            console.log('All tools execution response:', data);

            if (data.result) {
                addMessage(`Successfully executed all tools`, "bot");
                const resultStr = typeof data.result === 'string'
                    ? data.result
                    : JSON.stringify(data.result, null, 2);
                addMessage(`Result: ${resultStr}`, "bot");
            }
        } catch (error) {
            console.error('Error executing all tools:', error);
            addMessage(`Error executing tools sequence. Please try again.`, "bot");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                                message.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-800"
                            }`}
                        >
                            {typeof message.text === 'string' ? (
                                <pre className="whitespace-pre-wrap font-sans">
                                    {message.text}
                                </pre>
                            ) : (
                                message.text
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
                <div className="flex space-x-2 mb-2">
                    {quickPrompts.map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => setInputText(prompt)}
                            className="px-3 py-1 text-sm bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                <div className="flex items-center space-x-2">
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <FiFile className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </label>
                    
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded-lg"
                    />
                    
                    <button
                        onClick={handleSend}
                        disabled={isProcessing}
                        className={`p-2 rounded-lg ${
                            isProcessing
                                ? "bg-gray-300"
                                : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                        <IoSend className="w-6 h-6 text-white" />
                    </button>
                </div>

                {files.length > 0 && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">
                            Selected files: {files.map(f => f.name).join(", ")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;
