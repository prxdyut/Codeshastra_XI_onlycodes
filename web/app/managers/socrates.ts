import { Groq } from 'groq-sdk';

interface Tool {
    title: string;
    description: string;
    arguments: {
        name: string;
        type: string;
        description: string;
        required: boolean;
        default?: any;
    }[];
}

interface StepAnalysis {
    stepNumber: number;
    title: string;
    isHuman: boolean;
    toolCount: number;
    substepCount: number;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ProcessResult {
    step: string;
    result: any;
    timestamp: string;
    skippedRemaining?: boolean;
    humanInput?: {
        question: string;
        answer: string;
    };
    toolOutput?: {
        tool: string;
        output: any;
    };
}

interface AnalysisResult {
    steps: any[];
    analysis: {
        totalSteps: number;
        humanSteps: number;
        automatedSteps: number;
        toolsRequired: string[];
        totalSubsteps: number;
        stepAnalysis: StepAnalysis[];
        contextRelevance: {
            score: number;
            level: string;
        };
    };
    summary: {
        totalSteps: number;
        automationRate: string;
        complexityBreakdown: {
            LOW: number;
            MEDIUM: number;
            HIGH: number;
        };
        contextRelevance: string;
        requiredTools: string[];
    };
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

export class Socrates {
    private groq: Groq;
    private tools: Tool[];
    private processHistory: ProcessResult[];
    private cachedAnalysis: Map<string, AnalysisResult>;
    private currentPrompt: string | null;
    private isProcessing: boolean;
    private questionAnswerHistory: Array<{
        question: string;
        answer: string;
        timestamp: string;
    }>;
    private contextData: {
        originalPrompt: string;
        currentStep: number;
        totalSteps: number;
        humanInputs: Record<string, string>;
        toolOutputs: Array<{ tool: string, output: any }>;
    };

    constructor(apiKey: string) {
        this.groq = new Groq({
            apiKey: apiKey
        });
        this.processHistory = [];
        this.tools = this.initializeTools();
        this.cachedAnalysis = new Map();
        this.currentPrompt = null;
        this.isProcessing = false;
        this.questionAnswerHistory = [];
        this.contextData = {
            originalPrompt: '',
            currentStep: 0,
            totalSteps: 0,
            humanInputs: {},
            toolOutputs: []
        };
    }

    private initializeTools(): Tool[] {
        return [
            {
                title: "web_crawler",
                description: "Crawls web pages to extract information, follow links, and gather data",
                arguments: [
                    {
                        name: "url",
                        type: "string",
                        description: "Starting URL to begin crawling",
                        required: true
                    },
                    {
                        name: "depth",
                        type: "number",
                        description: "Maximum depth of pages to crawl from starting URL",
                        required: false,
                        default: 1
                    },
                    {
                        name: "selectors",
                        type: "string[]",
                        description: "CSS selectors to extract specific content from pages",
                        required: false
                    }
                ]
            }
            // Add other tools from tools.js here
        ];
    }

    async analyzePrompt(prompt: string): Promise<AnalysisResult> {
        // Return cached result if available
        if (this.cachedAnalysis.has(prompt)) {
            return this.cachedAnalysis.get(prompt)!;
        }

        // Prevent concurrent processing of the same prompt
        if (this.isProcessing && this.currentPrompt === prompt) {
            throw new Error("Analysis already in progress for this prompt");
        }

        try {
            this.isProcessing = true;
            this.currentPrompt = prompt;

            const analysisPrompt = `Role: You are a step-by-step implementation guide that provides structured, machine-readable implementation steps. Your goal is to break down user requests into clear steps that indicate which parts can be automated.

Stricly follow JSON grammar:
root ::= answer
answer ::= "{"   ws   "\\"title\\":"   ws   string   ","   ws   "\\"description\\":"   ws   string   ","   ws   "\\"humanStep\\":"   ws   boolean   ","   ws   "\\"tools\\":"   ws   stringlist   ","   ws   "\\"substeps\\":"   ws   stringlist   "}"
answerlist ::= "[]" | "["   ws   answer   (","   ws   answer)*   "]"
string ::= "\\""   ([^"]*)   "\\""
boolean ::= "true" | "false"
ws ::= [ \\t\\n]*
stringlist ::= "["   ws   "]" | "["   ws   string   (","   ws   string)*   ws   "]"

Response Format:
[
  {
    "title": "Brief step title",
    "description": "Detailed explanation of what needs to be done",
    "humanStep": true/false,
    "tools": ["tool1", "tool2"],
    "substeps": [
      "Substep 1 description",
      "Substep 2 description"
    ]
  }

Guidelines:
- Each step must follow exact JSON grammar
- Format the response in JSON format only.
- Dont give any other text or comments.
- No specific third-party tool or service names in descriptions
- humanStep: true if step requires human intervention
- humanStep: false if step can be automated with API calls
- tools array should list required tools for automation
- substeps is optional and only included when needed
- Focus on WHAT needs to be done, not HOW
- Maximum 10 steps only
- Once steps are generated, they should not be regenerated
]`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: analysisPrompt },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-r1-distill-llama-70b",
                temperature: 0.3,
                max_tokens: 2048,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error("No analysis generated");
            }

            const subprompts = this.parseJsonResponse(content);
            const analysis = this.analyzeSubprompts(subprompts, prompt);

            const result = {
                steps: subprompts,
                analysis: analysis,
                summary: {
                    totalSteps: analysis.totalSteps,
                    automationRate: `${((analysis.automatedSteps / analysis.totalSteps) * 100).toFixed(1)}%`,
                    complexityBreakdown: this.getComplexityBreakdown(analysis.stepAnalysis),
                    contextRelevance: analysis.contextRelevance.level,
                    requiredTools: analysis.toolsRequired
                }
            };

            // Cache the result
            this.cachedAnalysis.set(prompt, result);
            return result;
        } catch (error) {
            console.error("Error analyzing prompt:", error);
            throw error;
        } finally {
            this.isProcessing = false;
            if (this.currentPrompt === prompt) {
                this.currentPrompt = null;
            }
        }
    }

    async processStep(step: any, context: string): Promise<StepResult> {
        console.log("context", context)
        console.log("step", step)
        console.log("this.contextData", this.contextData)
        const systemPrompt = `You are an AI assistant that helps execute steps in a process.
Available tools and their arguments:
${JSON.stringify(this.tools, null, 2)}

Context:
Current Step: ${this.contextData.currentStep + 1} of ${this.contextData.totalSteps}
Conversation History: ${context}
Dont ask the same question again and again.
First check if the answer is already in the conversation history.

Current step to process:
${JSON.stringify(step, null, 2)}

Your task is to:
1. Determine if this step needs human input
2. If human input is needed:
   - Specify what questions to ask
   - For each question, provide 2-4 suggested options/answers that the user can choose from
3. If automated, identify which tools to use and what arguments they need

Respond in JSON format:
{
    "needsHumanInput": boolean,
    "requiredInput": ["question1", "question2"],
    "options": [
        ["option1 for q1", "option2 for q1", "option3 for q1"],
        ["option1 for q2", "option2 for q2"]
    ],
    "toolCalls": [
        {
            "tool": "tool_name",
            "arguments": {
                "arg1": "value1"
            }
        }
    ],
    "explanation": "Explanation of what needs to be done"
}

Guidelines for options:
- Provide 2-4 relevant options for each question
- Options should be concise but descriptive
- Include common/likely answers
- Make options contextually relevant to the step
- Options are suggestions only, user can still type their own answer`;

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Process this step and determine required actions." }
            ],
            model: "llama3-70b-8192",
            temperature: 0.3,
            max_tokens: 2048,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        this.contextData.currentStep++;
        return result;
    }

    async shouldSkipNextQuestion(currentAnswer: string, nextQuestion: string, context: string): Promise<{ shouldSkip: boolean; inferredAnswer: string | null }> {
        const analysisPrompt = `Given the following:
Current answer: "${currentAnswer}"
Next question: "${nextQuestion}"
Context: "${context}"

Determine if:
1. The current answer already contains the information needed for the next question
2. The next question can be logically inferred from the current answer

Respond in JSON format:
{
    "shouldSkip": boolean,
    "inferredAnswer": string or null,
    "explanation": "Brief explanation of the decision"
}`;

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: "system", content: analysisPrompt },
                { role: "user", content: "Analyze if the next question can be skipped." }
            ],
            model: "llama3-70b-8192",
            temperature: 0.3,
            max_tokens: 1024,
        });

        try {
            const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
            return {
                shouldSkip: result.shouldSkip || false,
                inferredAnswer: result.inferredAnswer || null
            };
        } catch (error) {
            console.error('Error parsing question skip analysis:', error);
            return { shouldSkip: false, inferredAnswer: null };
        }
    }

    async generateFinalResponse(context: string, prompt: string): Promise<string> {
        try {
            const summaryPrompt = `You are an expert AI assistant providing a comprehensive technical analysis and solution summary. Your task is to analyze the completed process and generate a detailed, value-added report for developers.

Conversation History:
${context}

Steps Performed:
${JSON.stringify(this.cachedAnalysis.get(prompt)?.steps, null, 2)}

Generate a comprehensive technical report that includes:

1. Executive Summary
   - Original request/problem statement
   - Key findings and recommendations
   - Value proposition and benefits

2. Technical Analysis
   - Architecture and design considerations
   - Implementation approach
   - Key technical decisions and rationales
   - Potential challenges and mitigations

3. Solution Details
   - Step-by-step implementation guide
   - Code patterns and best practices
   - Integration points and dependencies
   - Error handling and edge cases

4. Optimization Opportunities
   - Performance improvements
   - Code quality enhancements
   - Scalability considerations
   - Security best practices

5. Developer Guidelines
   - Setup and configuration
   - Development workflow
   - Testing strategy
   - Deployment considerations

6. Additional Recommendations
   - Future improvements
   - Alternative approaches
   - Resource optimization
   - Maintenance guidelines

Format Guidelines:
- Use markdown formatting for better readability
- Include code snippets where relevant
- Highlight critical points and warnings
- Provide clear, actionable steps
- Focus on practical, implementable solutions
- Include specific technical details and examples
- Emphasize value-add aspects for developers

Remember to:
1. Be specific and technical rather than general
2. Provide actionable insights rather than obvious statements
3. Include practical examples and code patterns
4. Consider both immediate implementation and long-term maintenance
5. Focus on developer experience and efficiency
6. Highlight optimization opportunities and best practices`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: summaryPrompt },
                    { role: "user", content: "Generate a comprehensive technical report based on the provided information." }
                ],
                model: "deepseek-r1-distill-llama-70b",
                temperature: 0.3,
                max_tokens: 4096,
            });


            const result = completion.choices[0]?.message?.content || "Unable to generate summary";

            if (result === "Unable to generate summary") {
                console.error('No valid content in Groq response');
                throw new Error('Failed to generate summary content');
            }

            console.log('Summary generation successful');
            console.log('=== Final Response Generation Completed ===');

            return result;
        } catch (error) {
            console.error('=== Error in Final Response Generation ===');
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            throw error; // Re-throw to handle in the calling code
        }
    }

    private parseJsonResponse(content: string): any[] {
        try {
            const firstBrace = content.indexOf('[');
            const lastBrace = content.lastIndexOf(']');

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No valid JSON array found in response");
            }

            const jsonContent = content.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonContent);
        } catch (error: any) {
            console.error("Original content:", content);
            throw new Error("Failed to parse response as JSON: " + error.message);
        }
    }

    private analyzeSubprompts(subprompts: any[], context: string) {
        const analysis = {
            totalSteps: subprompts.length,
            humanSteps: 0,
            automatedSteps: 0,
            toolsRequired: [] as string[],
            totalSubsteps: 0,
            stepAnalysis: [] as StepAnalysis[],
            contextRelevance: { score: 0, level: 'LOW' }
        };

        subprompts.forEach((step, index) => {
            this.validateStep(step, index);
            this.updateAnalysis(step, analysis);
        });

        analysis.contextRelevance = this.analyzeContextRelevance(subprompts, context);

        return analysis;
    }

    private validateStep(step: any, index: number): void {
        if (!step.title || typeof step.title !== 'string') {
            throw new Error(`Step ${index + 1}: Missing or invalid title`);
        }
        if (!step.description || typeof step.description !== 'string') {
            throw new Error(`Step ${index + 1}: Missing or invalid description`);
        }
        if (typeof step.humanStep !== 'boolean') {
            throw new Error(`Step ${index + 1}: Missing or invalid humanStep flag`);
        }
        if (!Array.isArray(step.tools)) {
            throw new Error(`Step ${index + 1}: Tools must be an array`);
        }
    }

    private updateAnalysis(step: any, analysis: any): void {
        if (step.humanStep) {
            analysis.humanSteps++;
        } else {
            analysis.automatedSteps++;
        }

        step.tools.forEach((tool: string) => {
            if (!analysis.toolsRequired.includes(tool)) {
                analysis.toolsRequired.push(tool);
            }
        });

        const substepsCount = Array.isArray(step.substeps) ? step.substeps.length : 0;
        analysis.totalSubsteps += substepsCount;

        analysis.stepAnalysis.push({
            stepNumber: analysis.stepAnalysis.length + 1,
            title: step.title,
            isHuman: step.humanStep,
            toolCount: step.tools.length,
            substepCount: substepsCount,
            complexity: this.calculateStepComplexity(step)
        });
    }

    private calculateStepComplexity(step: any): 'LOW' | 'MEDIUM' | 'HIGH' {
        let complexityScore = 0;
        complexityScore += step.description.length / 100;
        complexityScore += step.tools.length * 2;

        if (step.substeps) {
            complexityScore += step.substeps.length * 1.5;
        }

        if (complexityScore <= 5) return 'LOW';
        if (complexityScore <= 10) return 'MEDIUM';
        return 'HIGH';
    }

    private analyzeContextRelevance(subprompts: any[], context: string) {
        const contextWords = new Set(context.toLowerCase().split(/\s+/));
        let relevanceScore = 0;

        subprompts.forEach(step => {
            const stepWords = new Set([
                ...step.title.toLowerCase().split(/\s+/),
                ...step.description.toLowerCase().split(/\s+/)
            ]);

            const intersection = new Set(
                Array.from(stepWords).filter(word => contextWords.has(word))
            );

            relevanceScore += intersection.size / stepWords.size;
        });

        return {
            score: relevanceScore / subprompts.length,
            level: relevanceScore / subprompts.length > 0.3 ? 'HIGH' : 'LOW'
        };
    }

    private getComplexityBreakdown(stepAnalysis: StepAnalysis[]) {
        const breakdown = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0
        };

        stepAnalysis.forEach(step => {
            breakdown[step.complexity]++;
        });

        return breakdown;
    }

    validateToolArguments(toolTitle: string, args: Record<string, any>) {
        const tool = this.tools.find(t => t.title === toolTitle);
        if (!tool) {
            return {
                isValid: false,
                errors: [`Tool '${toolTitle}' not found`]
            };
        }

        const errors: string[] = [];

        tool.arguments
            .filter(arg => arg.required)
            .forEach(arg => {
                if (!(arg.name in args)) {
                    errors.push(`Missing required argument: ${arg.name}`);
                }
            });

        Object.entries(args).forEach(([name, value]) => {
            const argDef = tool.arguments.find(a => a.name === name);
            if (!argDef) {
                errors.push(`Unknown argument: ${name}`);
                return;
            }

            const actualType = Array.isArray(value) ? 'array' : typeof value;
            const expectedType = argDef.type.replace('[]', '');
            if (argDef.type.includes('[]')) {
                if (!Array.isArray(value)) {
                    errors.push(`Argument ${name} should be an array`);
                }
            } else if (actualType !== expectedType) {
                errors.push(`Argument ${name} should be of type ${expectedType}, got ${actualType}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getProcessHistory(): ProcessResult[] {
        return this.processHistory;
    }

    clearProcessHistory(): void {
        this.processHistory = [];
    }

    addToHistory(result: ProcessResult): void {
        this.processHistory.push(result);
    }

    clearCache(): void {
        this.cachedAnalysis.clear();
        this.currentPrompt = null;
        this.isProcessing = false;
    }

    addHumanInteraction(question: string, answer: string): void {
        const timestamp = new Date().toISOString();
        this.questionAnswerHistory.push({ question, answer, timestamp });
        this.contextData.humanInputs[question] = answer;
    }

    addToolOutput(tool: string, output: any): void {
        this.contextData.toolOutputs.push({ tool, output });
    }

    initializeContext(prompt: string, totalSteps: number): void {
        this.contextData = {
            originalPrompt: prompt,
            currentStep: 0,
            totalSteps,
            humanInputs: {},
            toolOutputs: []
        };
        this.questionAnswerHistory = [];
    }
}
