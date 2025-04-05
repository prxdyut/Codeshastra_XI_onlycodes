"use client";
import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { FiFile } from "react-icons/fi";

interface Message {
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

interface Analysis {
    totalSteps: number;
    automationRate: string;
    complexityBreakdown: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
    };
    contextRelevance: string;
    requiredTools: string[];
}

interface Step {
    title: string;
    description: string;
    humanStep: boolean;
    tools: string[];
    substeps?: string[];
    cachedResult?: StepResult;
}

interface StepResult {
    needsHumanInput: boolean;
    requiredInput?: string[];
    options?: string[][];
    toolCalls?: {
        tool: string;
        arguments: Record<string, any>;
    }[];
    explanation: string;
    humanInputs?: Record<string, string>;
    skippedRemaining?: boolean;
}

const page = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [context, setContext] = useState<string>("");
    const [showStepConfirmation, setShowStepConfirmation] = useState(false);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickQuestions = [
        "How can I analyze my data?",
        "What patterns can you find?",
        "Help me understand my dataset",
        "Generate insights from my data",
    ];

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addMessage = (text: string, sender: "user" | "bot") => {
        const newMessage: Message = {
            text,
            sender,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleInitialPrompt = async () => {
        if (!inputText.trim() || isProcessing) return;

        setIsProcessing(true);
        addMessage(inputText, "user");
        setInputText("");

        try {
            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: inputText,
                    action: 'analyze',
                    files: files.map(f => ({ name: f.name, type: f.type }))
                })
            });

            const data = await response.json();

            if (data.result) {
                setSteps(data.result.steps);
                setContext(inputText);
                
                const stepList = data.result.steps
                    .map((step: Step, index: number) => `${index + 1}. ${step.title}`)
                    .join('\n');
                
                addMessage(`I've analyzed your request and broken it down into the following steps:\n\n${stepList}\n\nWould you like to proceed with these steps? (yes/no)`, "bot");
                setShowStepConfirmation(true);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error analyzing your request.', "bot");
        } finally {
            setIsProcessing(false);
        }
    };

    const processStep = async (step: Step) => {
        try {
            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'process_step',
                    step,
                    context,
                    files: files.map(f => ({ name: f.name, type: f.type }))
                })
            });

            const data = await response.json();
            return data.result as StepResult;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };

    const handleStepConfirmation = async (proceed: boolean) => {
        setShowStepConfirmation(false);
        if (proceed) {
            setCurrentStep(0);
            addMessage('Great! Let\'s start with the first step.', "bot");
            await startNextStep();
        } else {
            addMessage('Process cancelled. Feel free to start over with a new request.', "bot");
            resetState();
        }
    };

    const startNextStep = async () => {
        if (currentStep >= 0 && currentStep < steps.length) {
            const step = steps[currentStep];
            addMessage(`Step ${currentStep + 1}: ${step.title}\n${step.description}`, "bot");
            
            try {
                const stepResult = await processStep(step);
                
                if (stepResult.needsHumanInput && stepResult.requiredInput) {
                    setCurrentQuestion(0);
                    addMessage(stepResult.requiredInput[0], "bot");
                    setCurrentOptions(stepResult.options?.[0] || []);
                } else if (stepResult.toolCalls) {
                    addMessage('Processing automated step...', "bot");
                    addMessage(stepResult.explanation, "bot");
                    moveToNextStep();
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('Error processing this step. Would you like to try again? (yes/no)', "bot");
            }
        } else if (currentStep === steps.length) {
            await generateFinalSummary();
            resetState();
        }
    };

    const handleAnswer = async () => {
        if (!inputText.trim() || isProcessing) return;

        setIsProcessing(true);
        addMessage(inputText, "user");
        const answer = inputText;
        setInputText("");

        try {
            if (showStepConfirmation) {
                handleStepConfirmation(answer.toLowerCase() === 'yes');
                return;
            }

            const step = steps[currentStep];
            let stepResult = step.cachedResult;
            if (!stepResult) {
                stepResult = await processStep(step);
                step.cachedResult = stepResult;
            }

            if (!stepResult.needsHumanInput || !stepResult.requiredInput) {
                addMessage('Error: Invalid step result', "bot");
                return;
            }

            const lowerAnswer = answer.toLowerCase().trim();
            if (lowerAnswer === 'am done') {
                addMessage('Process terminated early by user.', "bot");
                await generateFinalSummary();
                resetState();
                return;
            } else if (lowerAnswer === 'next step') {
                addMessage('Skipping to next step...', "bot");
                await moveToNextStep();
                return;
            }

            const currentQuestionText = stepResult.requiredInput[currentQuestion];
            setContext(prev => `${prev}\nUser answer for "${currentQuestionText}": ${answer}`);

            if (currentQuestion < stepResult.requiredInput.length - 1) {
                const nextQuestionText = stepResult.requiredInput[currentQuestion + 1];
                const nextOptions = stepResult.options?.[currentQuestion + 1] || [];
                setCurrentOptions(nextOptions);
                
                if (currentQuestion < stepResult.requiredInput.length - 2) {
                    try {
                        const skipResponse = await fetch('/api/chain_tool', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'should_skip_question',
                                currentAnswer: answer,
                                nextQuestion: nextQuestionText,
                                context
                            })
                        });

                        const skipData = await skipResponse.json();

                        if (skipData.result.shouldSkip && skipData.result.inferredAnswer) {
                            addMessage(`Automatically answering: ${nextQuestionText}\nInferred answer: ${skipData.result.inferredAnswer}`, "bot");
                            setContext(prev => `${prev}\nInferred answer for "${nextQuestionText}": ${skipData.result.inferredAnswer}`);
                            
                            const newQuestionIndex = currentQuestion + 2;
                            if (newQuestionIndex < stepResult.requiredInput.length) {
                                setCurrentQuestion(newQuestionIndex);
                                addMessage(stepResult.requiredInput[newQuestionIndex], "bot");
                            } else {
                                await moveToNextStep();
                            }
                        } else {
                            setCurrentQuestion(currentQuestion + 1);
                            addMessage(nextQuestionText, "bot");
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        setCurrentQuestion(currentQuestion + 1);
                        addMessage(nextQuestionText, "bot");
                    }
                } else {
                    setCurrentQuestion(currentQuestion + 1);
                    addMessage(nextQuestionText, "bot");
                }
            } else {
                setCurrentOptions([]);
                await moveToNextStep();
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Error processing your answer. Please try again.', "bot");
        } finally {
            setIsProcessing(false);
        }
    };

    const moveToNextStep = async () => {
        const nextStepIndex = currentStep + 1;
        
        if (nextStepIndex < steps.length) {
            setCurrentStep(nextStepIndex);
            setCurrentQuestion(0);
            const nextStep = steps[nextStepIndex];
            
            addMessage(`Moving to Step ${nextStepIndex + 1}: ${nextStep.title}\n${nextStep.description}`, "bot");
            
            try {
                const stepResult = await processStep(nextStep);
                nextStep.cachedResult = stepResult;
                
                if (stepResult.needsHumanInput && stepResult.requiredInput && stepResult.requiredInput.length > 0) {
                    addMessage(stepResult.requiredInput[0], "bot");
                    setCurrentOptions(stepResult.options?.[0] || []);
                } else if (stepResult.toolCalls) {
                    addMessage('Processing automated step...', "bot");
                    addMessage(stepResult.explanation, "bot");
                    await moveToNextStep();
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('Error processing the next step. Please try again.', "bot");
            }
        } else {
            addMessage('All steps completed! Generating final summary...', "bot");
            await generateFinalSummary();
            resetState();
        }
    };

    const generateFinalSummary = async () => {
        try {
            const stepResults = steps.map(step => ({
                title: step.title,
                description: step.description,
                result: step.cachedResult,
                isHumanStep: step.humanStep
            }));

            const originalPrompt = messages[0]?.text || '';
            const conversationHistory = messages.map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text,
                timestamp: msg.timestamp
            }));

            const toolOutputs = steps
                .filter(step => !step.humanStep && step.cachedResult?.toolCalls)
                .map(step => ({
                    step: step.title,
                    tools: step.cachedResult?.toolCalls
                }));

            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_final',
                    context,
                    prompt: originalPrompt,
                    steps: stepResults,
                    conversationHistory,
                    toolOutputs,
                    files: files.map(f => ({ name: f.name, type: f.type }))
                })
            });

            const data = await response.json();
            
            if (!data.result) {
                throw new Error('No result in API response');
            }

            addMessage('Process completed! Here\'s the final analysis:\n\n' + data.result, "bot");
            addMessage('\nTip: You can copy this report or save it for future reference. The report includes technical details and optimization suggestions that may be valuable for implementation.', "bot");
            
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            addMessage(`Error generating final summary. Please try again or contact support if the issue persists.\nError: ${errorMessage}`, "bot");
        }
    };

    const resetState = () => {
        setSteps([]);
        setCurrentStep(-1);
        setCurrentQuestion(0);
        setContext("");
        setShowStepConfirmation(false);
        setCurrentOptions([]);
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

    const handleSend = () => {
        if (showStepConfirmation) {
            handleStepConfirmation(inputText.toLowerCase() === 'yes');
            setInputText("");
        } else if (currentStep >= 0) {
            handleAnswer();
        } else {
            handleInitialPrompt();
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
                                    <div className="text-sm opacity-75 mb-1">
                                        {message.timestamp.toLocaleTimeString()}
                                    </div>
                                    <div className="whitespace-pre-wrap">{message.text}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
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
                                placeholder={
                                    showStepConfirmation
                                        ? "Type 'yes' to proceed or 'no' to cancel"
                                        : currentStep >= 0
                                        ? "Type your answer or select an option below..."
                                        : "Type your message here..."
                                }
                                className="flex-1 outline-none text-[#2D3A3A] placeholder-[#5E5F6E]"
                                disabled={isProcessing}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isProcessing || !inputText.trim()}
                                className={`p-2 rounded-full transition-colors duration-200 ${
                                    isProcessing || !inputText.trim()
                                        ? "text-[#5E5F6E]"
                                        : "text-[#78A083] hover:bg-[#F5F9F3]"
                                }`}
                            >
                                <IoSend className="w-5 h-5" />
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
                        {currentOptions.length > 0 && currentStep >= 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {currentOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInputText(option)}
                                        disabled={isProcessing}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            isProcessing 
                                                ? "bg-[#F5F9F3] text-[#5E5F6E]"
                                                : "bg-[#F5F9F3] hover:bg-[#E0E6E3] text-[#2D3A3A]"
                                        }`}
                                    >
                                        {option}
                                    </button>
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
