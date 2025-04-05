'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
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
    options?: string[][];  // Array of options for each question
    toolCalls?: {
        tool: string;
        arguments: Record<string, any>;
    }[];
    explanation: string;
    humanInputs?: Record<string, string>;
    skippedRemaining?: boolean;
}

export default function ChainTool() {
    console.log('ChainTool component rendered');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [context, setContext] = useState<string>('');
    const [showStepConfirmation, setShowStepConfirmation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);

    useEffect(() => {
        console.log('Messages updated:', messages);
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        console.log('Current step updated:', currentStep);
    }, [currentStep]);

    useEffect(() => {
        console.log('Current question updated:', currentQuestion);
    }, [currentQuestion]);

    useEffect(() => {
        console.log('Context updated:', context);
    }, [context]);

    const scrollToBottom = () => {
        console.log('Scrolling to bottom');
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
        console.log('Adding message:', { role, content });
        const newMessage: Message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleInitialPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Handling initial prompt:', input);
        if (!input.trim()) return;

        setIsProcessing(true);
        addMessage('user', input);
        setInput('');

        try {
            console.log('Sending analyze request');
            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: input,
                    action: 'analyze'
                })
            });

            const data = await response.json();
            console.log('Analyze response:', data);

            if (data.result) {
                console.log('Setting analysis and steps');
                setAnalysis(data.result.summary);
                setSteps(data.result.steps);
                setContext(input);
                
                const stepList = data.result.steps
                    .map((step: Step, index: number) => `${index + 1}. ${step.title}`)
                    .join('\n');
                
                addMessage('system', `I've analyzed your request and broken it down into the following steps:\n\n${stepList}\n\nWould you like to proceed with these steps? (yes/no)`);
                setShowStepConfirmation(true);
            }
        } catch (error) {
            console.error('Error in handleInitialPrompt:', error);
            addMessage('system', 'Sorry, there was an error analyzing your request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const processStep = async (step: Step) => {
        console.log('Processing step:', step);
        try {
            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'process_step',
                    step,
                    context
                })
            });

            const data = await response.json();
            console.log('Process step response:', data);
            return data.result as StepResult;
        } catch (error) {
            console.error('Error in processStep:', error);
            throw error;
        }
    };

    const handleStepConfirmation = async (proceed: boolean) => {
        console.log('Step confirmation:', proceed);
        setShowStepConfirmation(false);
        if (proceed) {
            setCurrentStep(0);
            addMessage('system', 'Great! Let\'s start with the first step.');
            await startNextStep();
        } else {
            addMessage('system', 'Process cancelled. Feel free to start over with a new request.');
            resetState();
        }
    };

    const handleOptionClick = (option: string) => {
        setInput(prev => {
            const newValue = prev.trim() ? `${prev} ${option}` : option;
            return newValue;
        });
    };

    const startNextStep = async () => {
        console.log('Starting next step, current step:', currentStep);
        if (currentStep >= 0 && currentStep < steps.length) {
            const step = steps[currentStep];
            console.log('Current step details:', step);
            addMessage('system', `Step ${currentStep + 1}: ${step.title}\n${step.description}`);
            
            try {
                const stepResult = await processStep(step);
                console.log('Step result:', stepResult);
                
                if (stepResult.needsHumanInput && stepResult.requiredInput) {
                    console.log('Human input required:', stepResult.requiredInput);
                    setCurrentQuestion(0);
                    addMessage('system', stepResult.requiredInput[0]);
                    // Set options for the current question if available
                    setCurrentOptions(stepResult.options?.[0] || []);
                } else if (stepResult.toolCalls) {
                    console.log('Automated step with tool calls:', stepResult.toolCalls);
                    addMessage('system', 'Processing automated step...');
                    addMessage('system', stepResult.explanation);
                    moveToNextStep();
                }
            } catch (error) {
                console.error('Error in startNextStep:', error);
                addMessage('system', 'Error processing this step. Would you like to try again? (yes/no)');
            }
        } else if (currentStep === steps.length) {
            console.log('All steps completed, generating final summary');
            await generateFinalSummary();
            resetState();
        }
    };

    const handleAnswer = async (answer: string) => {
        console.log('Handling answer:', answer);
        if (!answer.trim() || isProcessing) return;

        setIsProcessing(true);
        addMessage('user', answer);
        setInput('');

        try {
            const step = steps[currentStep];
            console.log('Current step for answer:', step);
            
            // Get the cached step result or process step
            let stepResult = step.cachedResult;
            if (!stepResult) {
                stepResult = await processStep(step);
                step.cachedResult = stepResult; // Cache the result
            }
            console.log('Step result for answer:', stepResult);

            if (!stepResult.needsHumanInput || !stepResult.requiredInput) {
                console.error('Invalid step result:', stepResult);
                addMessage('system', 'Error: Invalid step result');
                return;
            }

            const lowerAnswer = answer.toLowerCase().trim();
            console.log('Checking special commands:', lowerAnswer);
            if (lowerAnswer === 'am done') {
                console.log('User requested early termination');
                addMessage('system', 'Process terminated early by user.');
                await generateFinalSummary();
                resetState();
                return;
            } else if (lowerAnswer === 'next step') {
                console.log('User requested to skip to next step');
                addMessage('system', 'Skipping to next step...');
                await moveToNextStep();
                return;
            }

            const currentQuestionText = stepResult.requiredInput[currentQuestion];
            console.log('Current question:', currentQuestionText);
            setContext(prev => `${prev}\nUser answer for "${currentQuestionText}": ${answer}`);

            // Check if there are more questions in this step
            if (currentQuestion < stepResult.requiredInput.length - 1) {
                const nextQuestionText = stepResult.requiredInput[currentQuestion + 1];
                console.log('Next question available:', nextQuestionText);
                
                // Set options for the next question if available
                const nextOptions = stepResult.options?.[currentQuestion + 1] || [];
                setCurrentOptions(nextOptions);
                
                // Only check for skip if it's not the last question
                if (currentQuestion < stepResult.requiredInput.length - 2) {
                    try {
                        console.log('Checking if should skip next question');
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
                        console.log('Skip question response:', skipData);

                        if (skipData.result.shouldSkip && skipData.result.inferredAnswer) {
                            console.log('Skipping question with inferred answer');
                            addMessage('system', `Automatically answering: ${nextQuestionText}\nInferred answer: ${skipData.result.inferredAnswer}`);
                            setContext(prev => `${prev}\nInferred answer for "${nextQuestionText}": ${skipData.result.inferredAnswer}`);
                            
                            // Move to the question after the skipped one
                            const newQuestionIndex = currentQuestion + 2;
                            if (newQuestionIndex < stepResult.requiredInput.length) {
                                setCurrentQuestion(newQuestionIndex);
                                addMessage('system', stepResult.requiredInput[newQuestionIndex]);
                            } else {
                                await moveToNextStep();
                            }
                        } else {
                            // Move to next question
                            setCurrentQuestion(currentQuestion + 1);
                            addMessage('system', nextQuestionText);
                        }
                    } catch (error) {
                        console.error('Error checking question skip:', error);
                        setCurrentQuestion(currentQuestion + 1);
                        addMessage('system', nextQuestionText);
                    }
                } else {
                    // Last question in the step, just move to it
                    setCurrentQuestion(currentQuestion + 1);
                    addMessage('system', nextQuestionText);
                }
            } else {
                console.log('No more questions in current step');
                setCurrentOptions([]); // Clear options when moving to next step
                await moveToNextStep();
            }
        } catch (error) {
            console.error('Error processing answer:', error);
            addMessage('system', 'Error processing your answer. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const moveToNextStep = async () => {
        const nextStepIndex = currentStep + 1;
        console.log('Moving to next step:', nextStepIndex);
        
        if (nextStepIndex < steps.length) {
            setCurrentStep(nextStepIndex);
            setCurrentQuestion(0);
            const nextStep = steps[nextStepIndex];
            console.log('Next step details:', nextStep);
            
            addMessage('system', `Moving to Step ${nextStepIndex + 1}: ${nextStep.title}\n${nextStep.description}`);
            
            try {
                const stepResult = await processStep(nextStep);
                nextStep.cachedResult = stepResult; // Cache the result
                console.log('Next step result:', stepResult);
                
                if (stepResult.needsHumanInput && stepResult.requiredInput && stepResult.requiredInput.length > 0) {
                    console.log('Next step requires human input');
                    addMessage('system', stepResult.requiredInput[0]);
                    // Set options for the first question of the next step
                    setCurrentOptions(stepResult.options?.[0] || []);
                } else if (stepResult.toolCalls) {
                    console.log('Next step is automated');
                    addMessage('system', 'Processing automated step...');
                    addMessage('system', stepResult.explanation);
                    await moveToNextStep(); // Use await here
                }
            } catch (error) {
                console.error('Error starting next step:', error);
                addMessage('system', 'Error processing the next step. Please try again.');
            }
        } else {
            console.log('All steps completed');
            addMessage('system', 'All steps completed! Generating final summary...');
            await generateFinalSummary();
            resetState();
        }
    };

    const generateFinalSummary = async () => {
        console.log('=== Starting Final Summary Generation ===');
        console.log('Current state:', {
            stepsCount: steps.length,
            currentStep,
            context,
            messagesCount: messages.length,
            analysisState: analysis
        });

        try {
            // Collect all step results and answers
            console.log('Collecting step results...');
            const stepResults = steps.map(step => {
                console.log('Processing step:', step.title);
                return {
                    title: step.title,
                    description: step.description,
                    result: step.cachedResult,
                    isHumanStep: step.humanStep
                };
            });
            console.log('Collected step results:', stepResults);

            const originalPrompt = messages[0]?.content || '';
            console.log('Original prompt:', originalPrompt);

            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
            console.log('Conversation history:', conversationHistory);

            const toolOutputs = steps
                .filter(step => !step.humanStep && step.cachedResult?.toolCalls)
                .map(step => {
                    console.log('Processing tool output for step:', step.title);
                    return {
                        step: step.title,
                        tools: step.cachedResult?.toolCalls
                    };
                });
            console.log('Tool outputs:', toolOutputs);

            console.log('Preparing API request payload...');
            const payload = {
                action: 'generate_final',
                context,
                prompt: originalPrompt,
                steps: stepResults,
                analysis,
                conversationHistory,
                toolOutputs
            };
            const response = await fetch('/api/chain_tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Received API response:', response.status, response.statusText);
            const data = await response.json();
            console.log('API response data:', data);
            
            if (!data.result) {
                throw new Error('No result in API response');
            }

            // Display the summary in a more structured way
            console.log('Processing final summary...');
            const summary = data.result;
            console.log('Final summary content:', summary);

            console.log('Adding summary to messages...');
            addMessage('system', 'Process completed! Here\'s the final analysis:\n\n' + summary);
            
            addMessage('system', '\nTip: You can copy this report or save it for future reference. The report includes technical details and optimization suggestions that may be valuable for implementation.');
            
            console.log('Resetting state...');
            resetState();
            console.log('=== Final Summary Generation Completed ===');
        } catch (error) {
            console.error('=== Error in Final Summary Generation ===');
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            console.error('State at error:', {
                stepsCount: steps.length,
                currentStep,
                context,
                messagesCount: messages.length
            });
            const errorMessage = error instanceof Error ? error.message : String(error);
            addMessage('system', `Error generating final summary. Please try again or contact support if the issue persists.\nError: ${errorMessage}`);
        }
    };

    const resetState = () => {
        console.log('Resetting state');
        setSteps([]);
        setCurrentStep(-1);
        setCurrentQuestion(0);
        setContext('');
        setShowStepConfirmation(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        if (showStepConfirmation) {
            handleStepConfirmation(input.toLowerCase() === 'yes');
            setInput('');
        } else if (currentStep >= 0) {
            handleAnswer(input);
            setInput('');
        } else {
            handleInitialPrompt(e);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg ${
                            message.role === 'user'
                                ? 'bg-blue-100 ml-auto max-w-[80%]'
                                : message.role === 'system'
                                ? 'bg-gray-100 mr-auto max-w-[80%]'
                                : 'bg-green-100 mr-auto max-w-[80%]'
                        }`}
                    >
                        <div className="text-sm text-gray-500 mb-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                ))}
                {analysis && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="font-bold mb-2">Analysis</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Steps: {analysis.totalSteps}</div>
                            <div>Automation Rate: {analysis.automationRate}</div>
                            <div>Context Relevance: {analysis.contextRelevance}</div>
                            <div>
                                Complexity:
                                <ul className="list-disc list-inside">
                                    <li>Low: {analysis.complexityBreakdown.LOW}</li>
                                    <li>Medium: {analysis.complexityBreakdown.MEDIUM}</li>
                                    <li>High: {analysis.complexityBreakdown.HIGH}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            showStepConfirmation
                                ? "Type 'yes' to proceed or 'no' to cancel"
                                : currentStep >= 0
                                ? "Type your answer or select an option below..."
                                : "Type your request..."
                        }
                        className="flex-1 p-2 border rounded-lg"
                        disabled={isProcessing}
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !input.trim()}
                        className={`px-4 py-2 rounded-lg ${
                            isProcessing || !input.trim()
                                ? 'bg-gray-300'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        {isProcessing ? 'Processing...' : 'Send'}
                    </button>
                </form>
                {currentOptions.length > 0 && currentStep >= 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentOptions.map((option, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleOptionClick(option)}
                                disabled={isProcessing}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                    isProcessing 
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
