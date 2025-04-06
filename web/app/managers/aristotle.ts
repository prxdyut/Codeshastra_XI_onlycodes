import { Groq } from 'groq-sdk';

interface Tool {
    title: string;
    description: string;
    arguments: {
        label: string;
        type: string;
        description: string;
        required?: boolean;
        acceptsOutput?: string[]; // List of tool titles whose output this argument can accept
    }[];
    returnType: string;
}

interface ToolCall {
    tool: string;
    arguments: Record<string, any>;
    expectedReturn: string;
    dependsOn?: {
        toolCall: number;  // Index of the tool call this depends on
        outputMapping: {
            from: string;  // Path in the output object
            to: string;    // Argument name to map to
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

export class Aristotle {
    private groq: Groq;
    private tools: Tool[];
    private processHistory: ProcessResult[];
    private isProcessing: boolean;
    private currentResults: Map<number, ToolResult>;
    private baseUrl = 'http://localhost:5000';

    constructor(apiKey: string) {
        this.groq = new Groq({
            apiKey: apiKey
        });
        this.tools = this.initializeTools();
        this.processHistory = [];
        this.isProcessing = false;
        this.currentResults = new Map();
    }

    private initializeTools(): Tool[] {
        const existingTools = [
            {
                title: "file_reader",
                description: "Reads contents of a file from the filesystem",
                arguments: [
                    {
                        label: "path",
                        type: "string",
                        description: "Path to the file to read",
                        required: true
                    },
                    {
                        label: "encoding",
                        type: "string",
                        description: "File encoding (default: utf-8)",
                        required: false
                    }
                ],
                returnType: "string"
            },
            {
                title: "code_analyzer",
                description: "Analyzes code for patterns, complexity, and potential issues",
                arguments: [
                    {
                        label: "code",
                        type: "string",
                        description: "Source code to analyze",
                        required: true,
                        acceptsOutput: ["file_reader"]  // Can accept output from file_reader
                    },
                    {
                        label: "language",
                        type: "string",
                        description: "Programming language of the code",
                        required: true
                    },
                    {
                        label: "metrics",
                        type: "string[]",
                        description: "Metrics to analyze (e.g., complexity, maintainability)",
                        required: false
                    }
                ],
                returnType: "object"
            },
            {
                title: "api_caller",
                description: "Makes HTTP requests to external APIs",
                arguments: [
                    {
                        label: "url",
                        type: "string",
                        description: "API endpoint URL",
                        required: true
                    },
                    {
                        label: "method",
                        type: "string",
                        description: "HTTP method (GET, POST, etc.)",
                        required: true
                    },
                    {
                        label: "headers",
                        type: "object",
                        description: "Request headers",
                        required: false
                    },
                    {
                        label: "body",
                        type: "object",
                        description: "Request body for POST/PUT requests",
                        required: false,
                        acceptsOutput: ["code_analyzer", "file_reader"]  // Can accept output from multiple tools
                    }
                ],
                returnType: "object"
            }
        ];

        // Add format tools
        const formatTools = [
            {
                title: "json_formatter",
                description: "Format and validate JSON data",
                arguments: [
                    {
                        label: "input",
                        type: "string",
                        description: "JSON string to format",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "markdown_formatter",
                description: "Format and validate Markdown content",
                arguments: [
                    {
                        label: "input",
                        type: "string",
                        description: "Markdown content to format",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "yaml_formatter",
                description: "Format and validate YAML content",
                arguments: [
                    {
                        label: "input",
                        type: "string",
                        description: "YAML content to format",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "xml_formatter",
                description: "Format and validate XML content",
                arguments: [
                    {
                        label: "input",
                        type: "string",
                        description: "XML content to format",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "toml_formatter",
                description: "Format and validate TOML content",
                arguments: [
                    {
                        label: "input",
                        type: "string",
                        description: "TOML content to format",
                        required: true
                    }
                ],
                returnType: "string"
            }
        ];

        // Add network tools
        const networkTools = [
            {
                title: "ip_lookup",
                description: "Look up information about an IP address",
                arguments: [
                    {
                        label: "ip",
                        type: "string",
                        description: "IP address to look up",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "a_lookup",
                description: "Look up information about an A Record (not a domain)(like 142.251.42.46)",
                arguments: [
                    {
                        label: "a",
                        type: "string",
                        description: "A Record to look up (not a domain)(like 142.251.42.46)",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "dns_lookup",
                description: "Perform DNS lookup for a domain",
                arguments: [
                    {
                        label: "domain",
                        type: "string",
                        description: "Domain name to look up",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "ping_test",
                description: "Test network connectivity to a host",
                arguments: [
                    {
                        label: "host",
                        type: "string",
                        description: "Host to ping",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "traceroute",
                description: "Trace network route to a host",
                arguments: [
                    {
                        label: "host",
                        type: "string",
                        description: "Host to trace route to",
                        required: true
                    }
                ],
                returnType: "object"
            }
        ];

        // Add random tools
        const randomTools = [
            {
                title: "random_number",
                description: "Generate a random number",
                arguments: [
                    {
                        label: "min",
                        type: "number",
                        description: "Minimum value",
                        required: true
                    },
                    {
                        label: "max",
                        type: "number",
                        description: "Maximum value",
                        required: true
                    }
                ],
                returnType: "number"
            },
            {
                title: "uuid_generator",
                description: "Generate a UUID",
                arguments: [],
                returnType: "string"
            },
            {
                title: "dice_roll",
                description: "Simulate rolling dice",
                arguments: [
                    {
                        label: "sides",
                        type: "number",
                        description: "Number of sides on the dice",
                        required: false
                    }
                ],
                returnType: "number"
            },
            {
                title: "coin_flip",
                description: "Simulate flipping a coin",
                arguments: [],
                returnType: "string"
            }
        ];

        // Add utility tools
        const utilityTools = [
            {
                title: "qr_generator",
                description: "Generate a QR code",
                arguments: [
                    {
                        label: "content",
                        type: "string",
                        description: "Content to encode in QR code",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "password_generator",
                description: "Generate a secure password",
                arguments: [
                    {
                        label: "length",
                        type: "number",
                        description: "Password length",
                        required: false
                    },
                    {
                        label: "options",
                        type: "object",
                        description: "Password generation options",
                        required: false
                    }
                ],
                returnType: "string"
            },
            {
                title: "url_shortener",
                description: "Shorten a URL",
                arguments: [
                    {
                        label: "url",
                        type: "string",
                        description: "URL to shorten",
                        required: true
                    }
                ],
                returnType: "string"
            },
            {
                title: "api_tester",
                description: "Test API endpoints",
                arguments: [
                    {
                        label: "url",
                        type: "string",
                        description: "API endpoint URL",
                        required: true
                    },
                    {
                        label: "method",
                        type: "string",
                        description: "HTTP method",
                        required: true
                    }
                ],
                returnType: "object"
            }
        ];

        // Add misc tools
        const miscTools = [
            {
                title: "currency_converter",
                description: "Convert between currencies",
                arguments: [
                    {
                        label: "amount",
                        type: "number",
                        description: "Amount to convert",
                        required: true
                    },
                    {
                        label: "from",
                        type: "string",
                        description: "Source currency code",
                        required: true
                    },
                    {
                        label: "to",
                        type: "string",
                        description: "Target currency code",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "time_converter",
                description: "Convert between time zones",
                arguments: [
                    {
                        label: "time",
                        type: "string",
                        description: "Time to convert",
                        required: true
                    },
                    {
                        label: "from_zone",
                        type: "string",
                        description: "Source time zone",
                        required: true
                    },
                    {
                        label: "to_zone",
                        type: "string",
                        description: "Target time zone",
                        required: true
                    }
                ],
                returnType: "object"
            },
            {
                title: "email_lookup",
                description: "Look up information about an email address",
                arguments: [
                    {
                        label: "email",
                        type: "string",
                        description: "Email address to look up",
                        required: true
                    }
                ],
                returnType: "object"
            }
        ];

        return [
            ...existingTools,
            ...formatTools,
            ...networkTools,
            ...randomTools,
            ...utilityTools,
            ...miscTools
        ];
    }

    async analyzePrompt(prompt: string): Promise<ToolCall[]> {
        if (this.isProcessing) {
            throw new Error("Analysis already in progress");
        }

        try {
            this.isProcessing = true;
            this.currentResults.clear();

            const analysisPrompt = `You are a specialized tool orchestrator. Your goal is to break down user requests into specific tool calls using the available tools.

Available tools:
${JSON.stringify(this.tools, null, 2)}

Guidelines:
- Analyze the prompt and determine which tools need to be called
- For each tool call, specify the exact arguments needed
- Ensure argument types match the tool specifications
- Consider dependencies between tool calls
- If a tool's output can be used as input for another tool, specify the dependency
- Optimize for minimal number of tool calls
- Return a valid JSON array of tool calls

Response Format:
[
  {
    "tool": "tool_name",
    "arguments": {
      "arg1": "value1",
      "arg2": "value2"
    },
    "expectedReturn": "return_type",
  }
]`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: analysisPrompt },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-r1-distill-llama-70b",
                temperature: 0,
                max_tokens: 2048,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error("No analysis generated");
            }

            const toolCalls = this.parseJsonResponse(content);
            this.validateToolCalls(toolCalls);
            this.validateDependencies(toolCalls);

            // Log the tool calls for demonstration
            console.log('Generated Tool Calls:', JSON.stringify(toolCalls, null, 2));

            return toolCalls;
        } catch (error) {
            console.error("Error analyzing prompt:", error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private validateDependencies(toolCalls: ToolCall[]): void {
        toolCalls.forEach((call, index) => {
            if (call.dependsOn) {
                // Check if dependent tool call exists
                if (call.dependsOn.toolCall >= index) {
                    throw new Error(`Tool call ${index + 1} depends on a future tool call ${call.dependsOn.toolCall + 1}`);
                }

                const dependentTool = toolCalls[call.dependsOn.toolCall];
                const currentTool = this.tools.find(t => t.title === call.tool)!;

                // Validate output mappings
                call.dependsOn.outputMapping.forEach(mapping => {
                    const targetArg = currentTool.arguments.find(arg => arg.label === mapping.to);
                    if (!targetArg) {
                        throw new Error(`Invalid output mapping: argument '${mapping.to}' not found in tool '${call.tool}'`);
                    }

                    // Check if the argument accepts output from the dependent tool
                    if (targetArg.acceptsOutput && !targetArg.acceptsOutput.includes(dependentTool.tool)) {
                        throw new Error(`Argument '${mapping.to}' of tool '${call.tool}' cannot accept output from '${dependentTool.tool}'`);
                    }
                });
            }
        });
    }
    private cleanJsonResponse(content: string): string {
        // Remove everything before the first { and after the last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No valid JSON object found in response");
        }

        // Extract just the JSON portion
        let jsonContent = content.substring(firstBrace, lastBrace + 1);

        // Remove any <think> tags and their content
        jsonContent = jsonContent.replace(/<think>.*?<\/think>/gs, '');

        // Remove any other non-JSON text that might remain
        jsonContent = jsonContent.trim();

        // Final validation
        if (!jsonContent.startsWith('{') || !jsonContent.endsWith('}')) {
            throw new Error("Response is not a valid JSON object");
        }

        return jsonContent;
    }
    private async generateToolArguments(
        currentTool: Tool,
        previousResult: any,
        previousTool: Tool
    ): Promise<Record<string, any>> {
        // Create a structured summary of the previous tool's output
        const previousSummary = await this.summarizeToolOutput(previousResult, previousTool);
        console.log(previousSummary)
        // Create a structured summary of the current tool's requirements
        const currentRequirements = await this.summarizeToolRequirements(currentTool);
        console.log(currentRequirements)

        // Generate the prompt with clear structure
        const prompt = `You are an AI assistant that connects tool outputs to new tool inputs. Follow these steps:
    
    1. PREVIOUS TOOL OUTPUT ANALYSIS:
    Tool: ${previousTool.title}
    Description: ${previousTool.description}
    Output Summary: ${previousSummary}
    
    2. CURRENT TOOL REQUIREMENTS:
    Tool: ${currentTool.title}
    Description: ${currentTool.description}
    Arguments: ${currentRequirements}
    
    3. CONNECTION ANALYSIS:
    - Identify which parts of the previous output can satisfy the current tool's requirements
    - Map fields logically (e.g., "code" output → "input" argument)
    - Only include arguments that can be reasonably derived from the previous output
    
    4. OUTPUT FORMAT:
    Return ONLY a JSON object with the arguments you've determined should be passed to the current tool.
    Include ONLY arguments that can be reasonably derived from the previous output.
    If no clear connection exists, return an empty object {}.
    
    Now generate the argument mapping based on the above information.`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: prompt },
                ],
                model: "deepseek-r1-distill-llama-70b",
                temperature: 0,
                max_tokens: 2048,
            });

            const content = this.cleanJsonResponse(completion.choices[0]?.message?.content as string);

            if (!content) {
                throw new Error("No argument suggestions generated");
            }

            try {
                const result = JSON.parse(content);
                console.log('Generated tool arguments:', result);
                return result;
            } catch (e) {
                console.error("Failed to parse LLM response as JSON:", content);
                return {}; // Return empty object if parsing fails
            }
        } catch (error) {
            console.error("Failed to generate tool arguments:", error);
            return {}; // Return empty object on error
        }
    }

    // Summarize tool output using Groq
    private async summarizeToolOutput(result: any, tool: Tool): Promise<string> {
        const prompt = `Summarize the following tool output in a concise and structured format:\n\n${JSON.stringify(result, null, 2)}`;

        const completion = await this.groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192"
        });

        return completion.choices[0]?.message?.content || "No summary generated.";
    }

    // Summarize tool requirements using Groq
    private async summarizeToolRequirements(tool: Tool): Promise<{
        requiredArgs: string;
        optionalArgs: string;
    }> {
        const prompt = `You are analyzing a tool definition. Summarize the required and optional arguments from the list below.\n` +
            `For each argument, include label, type, and description.\nReturn two sections: Required and Optional.\n\n` +
            `${JSON.stringify(tool.arguments, null, 2)}`;

        const completion = await this.groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192"
        });

        const summary = completion.choices[0]?.message?.content || "No summary generated.";

        return {
            requiredArgs: summary,
            optionalArgs: '' // You can parse further if needed, or return the full text
        };
    }


    async executeToolSequence(toolCalls: ToolCall[]): Promise<any[]> {
        console.log('\n🚀 Starting tool execution sequence');
        console.log(`📋 Total tools to execute: ${toolCalls.length}`);

        const results: any[] = [];
        const resultMap = new Map<number, any>();

        for (let i = 0; i < toolCalls.length; i++) {
            const toolCall = toolCalls[i];
            console.log(`\n📍 Step ${i + 1}/${toolCalls.length}: Executing ${toolCall.tool}`);
            console.log('📝 Initial arguments:', JSON.stringify(toolCall.arguments, null, 2));

            // Get the tool definition
            const currentTool = this.tools.find(t => t.title === toolCall.tool);
            if (!currentTool) {
                console.error(`❌ Tool definition not found for: ${toolCall.tool}`);
                throw new Error(`Tool definition not found for: ${toolCall.tool}`);
            }
            console.log('🔍 Found tool definition:', {
                title: currentTool.title,
                description: currentTool.description,
                requiredArgs: currentTool.arguments.filter(arg => arg.required).map(arg => arg.label)
            });


            if (i > 0) {
                console.log('\n🤖 Attempting to generate arguments using LLM');
                const previousResult = results[i - 1].result;
                const previousTool = this.tools.find(t => t.title === results[i - 1].tool);
                if (previousTool) {
                    try {
                        console.log('Previous tool result:', JSON.stringify(previousResult, null, 2));
                        const suggestedArgs = await this.generateToolArguments(
                            currentTool,
                            previousResult,
                            previousTool
                        );
                        console.log('✨ LLM suggested arguments:', JSON.stringify(suggestedArgs, null, 2));
                        toolCall.arguments = { ...toolCall.arguments, ...suggestedArgs };
                        console.log(toolCall)
                        console.log('🔄 Updated arguments:', JSON.stringify(toolCall.arguments, null, 2));
                    } catch (error) {
                        console.warn('⚠️ Failed to generate arguments:', error);
                        console.log('⚠️ Continuing with original arguments');
                    }
                }
            }

            // Execute the tool based on its type
            console.log('\n⚡ Executing tool with final arguments: 2', JSON.stringify(toolCall.arguments, null, 2));
            let result;
            try {
                switch (toolCall.tool) {
                    case 'dns_lookup':
                        console.log('🔍 Performing DNS lookup...');
                        result += await this.dnsLookup(toolCall.arguments.domain);
                        break;
                    case 'ip_lookup':
                        result += await this.lookupIp(toolCall.arguments.ip, toolCall.arguments.api_key);
                        break;
                    case 'a_lookup':
                        result += await this.lookupA(toolCall.arguments.a);
                        break;
                    case 'traceroute':
                        result += await this.tracerouteHost(toolCall.arguments.host);
                        break;
                    case 'ping':
                        result += await this.pingHost(toolCall.arguments.host, toolCall.arguments.count);
                        break;
                    case 'json_formatter':
                        result += await this.formatJson(toolCall.arguments.input);
                        break;
                    case 'markdown_formatter':
                        result += await this.formatMarkdown(toolCall.arguments.input);
                        break;
                    case 'yaml_formatter':
                        result += await this.formatYaml(toolCall.arguments.input);
                        break;
                    case 'xml_formatter':
                        result += await this.formatXml(toolCall.arguments.input);
                        break;
                    case 'toml_formatter':
                        result += await this.formatToml(toolCall.arguments.input);
                        break;
                    case 'currency_converter':
                        result += await this.convertCurrency(
                            toolCall.arguments.amount,
                            toolCall.arguments.from,
                            toolCall.arguments.to
                        );
                        break;
                    case 'time_converter':
                        result += await this.convertTimezone(
                            toolCall.arguments.time,
                            toolCall.arguments.from_zone,
                            toolCall.arguments.to_zone
                        );
                        break;
                    case 'email_lookup':
                        result += await this.lookupEmail(toolCall.arguments.email);
                        break;
                    case 'random_number':
                        result += await this.getRandomNumber(
                            toolCall.arguments.min,
                            toolCall.arguments.max,
                            toolCall.arguments.seed
                        );
                        break;
                    case 'uuid_generator':
                        result += await this.generateUuidV4();
                        break;
                    case 'dice_roll':
                        result += await this.rollDice(toolCall.arguments.notation, toolCall.arguments.seed);
                        break;
                    case 'coin_flip':
                        result += await this.flipCoin(toolCall.arguments.seed);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${toolCall.tool}`);
                }

                console.log('\n✅ Tool execution successful');
                console.log('📊 Result:', JSON.stringify(result, null, 2));

                const resultEntry = {
                    tool: toolCall.tool,
                    success: true,
                    result: result
                };
                results.push(resultEntry);
                resultMap.set(i, result);
                console.log(`📝 Added result to position ${i} in sequence`);

            } catch (error: any) {
                console.error(`\n❌ Error executing tool ${toolCall.tool}:`, error);
                const errorEntry = {
                    tool: toolCall.tool,
                    success: false,
                    error: error.message
                };
                results.push(errorEntry);
                console.log('📝 Added error entry to results');

                if (this.hasDependent(toolCalls, i)) {
                    console.error('❌ This tool has dependents, must stop execution');
                    throw new Error(`Failed to execute tool ${toolCall.tool} which has dependent tools`);
                }
                console.warn('⚠️ Tool failed but no dependents, continuing sequence');
            }
        }

        // Format the results as HTML using Groq's DeepSeek
        const htmlResponse = await this.formatResultsAsHTML(results);

        // Sanitize the HTML response by removing "thinking" content
        const sanitizedResponse = this.sanitizeHTMLResponse(htmlResponse);
        console.log('\n🏁 Tool sequence execution completed');
        console.log('📊 Final results:', JSON.stringify(results, null, 2));
        return [sanitizedResponse];
    }

    private async formatResultsAsHTML(results: any[]): Promise<string> {
        try {
            const prompt = `
            Please format the following tool execution results into a clean, well-structured HTML document.
            The HTML should include:
            - A title (h1) "Tool Execution Results"
            - A summary section showing total tools run and success/failure counts
            - A detailed section for each tool with:
              * Tool name (h3)
              * Status (success/failure)
              * Arguments used
              * Results or error message
            - Proper styling with CSS classes for good readability
            - Responsive design that works on mobile and desktop
            
            Here are the results to format:
            ${JSON.stringify(results, null, 2)}
            `;

            // Call to Groq's DeepSeek API
            const response = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert HTML developer. Generate clean, well-structured HTML5 documents with responsive design."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "deepseek-r1-distill-llama-70b"
            });

            return response.choices[0]?.message?.content || '<div>Failed to generate HTML response</div>';
        } catch (error) {
            console.error('Error formatting HTML response:', error);
            return '<div>Error generating formatted results</div>';
        }
    }

    private sanitizeHTMLResponse(html: string): string {
        // Extract content between <html> tags
        const htmlMatch = html.match(/<html>([\s\S]*?)<\/html>/);
        if (!htmlMatch) {
            return ''; // Return empty string if no <html> tags found
        }

        const htmlContent = htmlMatch[1];

        // Remove any "thinking" or internal processing content
        const sanitized = htmlContent
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
            .replace(/<internal[\s\S]*?<\/internal>/g, '')
            .replace(/<!--[\s\S]*?-->/g, '');

        // Remove empty paragraphs that might have been left behind
        return sanitized.replace(/<p>\s*<\/p>/g, '').trim();
    }


    private getValueFromPath(obj: any, path: string): any {
        return path.split('.').reduce((current, part) => {
            if (current === null || current === undefined) {
                throw new Error(`Invalid path: ${path}`);
            }
            return current[part];
        }, obj);
    }

    private hasDependent(toolCalls: ToolCall[], index: number): boolean {
        return toolCalls.some(call =>
            call.dependsOn && call.dependsOn.toolCall === index
        );
    }

    private parseJsonResponse(content: string): ToolCall[] {
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

    private validateToolCalls(toolCalls: ToolCall[]): void {
        toolCalls.forEach((call, index) => {
            const tool = this.tools.find(t => t.title === call.tool);
            if (!tool) {
                throw new Error(`Tool '${call.tool}' not found in tool call ${index + 1}`);
            }

            // Validate required arguments
            tool.arguments
                .filter(arg => arg.required)
                .forEach(arg => {
                    if (!(arg.label in call.arguments)) {
                        throw new Error(`Missing required argument '${arg.label}' for tool '${call.tool}' in call ${index + 1}`);
                    }
                });

            // Validate argument types
            Object.entries(call.arguments).forEach(([name, value]) => {
                const argDef = tool.arguments.find(a => a.label === name);
                if (!argDef) {
                    throw new Error(`Unknown argument '${name}' for tool '${call.tool}' in call ${index + 1}`);
                }

                const actualType = Array.isArray(value) ? 'array' : typeof value;
                const expectedType = argDef.type.replace('[]', '');
                if (argDef.type.includes('[]')) {
                    if (!Array.isArray(value)) {
                        throw new Error(`Argument '${name}' should be an array in tool call ${index + 1}`);
                    }
                } else if (actualType !== expectedType) {
                    throw new Error(`Argument '${name}' should be of type ${expectedType}, got ${actualType} in tool call ${index + 1}`);
                }
            });

            // Validate return type
            if (call.expectedReturn !== tool.returnType) {
                throw new Error(`Invalid return type for tool '${call.tool}' in call ${index + 1}`);
            }
        });
    }

    addToHistory(result: ProcessResult): void {
        this.processHistory.push(result);
    }

    getProcessHistory(): ProcessResult[] {
        return this.processHistory;
    }

    clearHistory(): void {
        this.processHistory = [];
    }

    private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });
            return await response.json();
        } catch (error: any) {
            console.error('API request failed:', error);
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    private async makeFileRequest(endpoint: string, file: File, additionalData?: Record<string, any>) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (additionalData) {
                Object.entries(additionalData).forEach(([key, value]) => {
                    formData.append(key, value.toString());
                });
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                body: formData,
            });
            return await response.json();
        } catch (error: any) {
            console.error('File upload failed:', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    // API Tools
    async testApiEndpoint(url: string) {
        return this.makeRequest('/api/test-endpoint', 'POST', { url });
    }

    // Code Formatting
    async formatCode(code: string, language: string) {
        return this.makeRequest('/code/format', 'POST', { code, language });
    }

    // CSV/Excel Conversion
    async convertCsvToExcel(csvData: string) {
        const formData = new FormData();
        formData.append('csv', csvData);
        return this.makeRequest('/convert/csv-to-excel', 'POST', formData);
    }

    async convertExcelToCsv(file: File) {
        return this.makeFileRequest('/api/excel-to-csv', file);
    }

    // Currency Conversion
    async convertCurrency(amount: number, from: string, to: string) {
        return this.makeRequest('/api/currency-convert', 'POST', { amount, from, to });
    }

    // Document Tools
    async convertDocxToPdf(file: File) {
        return this.makeFileRequest('/api/docx-to-pdf', file);
    }

    async convertPdfToDocx(file: File) {
        return this.makeFileRequest('/api/pdf-to-docx', file);
    }

    async generatePdfFromText(text: string) {
        return this.makeRequest('/api/text-to-pdf', 'POST', { text });
    }

    async compressPdf(file: File) {
        return this.makeFileRequest('/api/compress-pdf', file);
    }

    // Domain Lookup
    async lookupDomain(domain: string, apiKey: string) {
        return this.makeRequest('/api/lookup/domain', 'POST', { domain, apiKey });
    }

    // Email Lookup
    async lookupEmail(email: string) {
        return this.makeRequest('/api/lookup/email', 'POST', { email });
    }

    // Image Processing
    async convertImage(file: File, outputFormat: string, width?: number, height?: number) {
        return this.makeFileRequest('/api/convert-image', file, { output_format: outputFormat, width, height });
    }

    // IP Lookup
    async lookupIp(ip: string, apiKey: string) {
        return this.makeRequest('/api/lookup/ip', 'POST', { ip, apiKey });
    }

    // A Lookup
    async lookupA(a: string) {
        return this.makeRequest('/api/lookup/ip', 'POST', { ip: a });
    }

    // JSON Formatter
    async formatJson(jsonString: string) {
        return this.makeRequest('/json/format', 'POST', { json: jsonString });
    }

    // Link Shortener
    async shortenUrl(url: string) {
        return this.makeRequest('/api/shorten-url', 'POST', { url });
    }

    // Markdown Formatting
    async formatMarkdown(text: string) {
        return this.makeRequest('/api/format-markdown', 'POST', { text });
    }

    async formatYaml(text: string) {
        return this.makeRequest('/api/format-yaml', 'POST', { text });
    }

    async formatXml(text: string) {
        return this.makeRequest('/api/format-xml', 'POST', { text });
    }

    async formatToml(text: string) {
        return this.makeRequest('/api/format-toml', 'POST', { text });
    }

    // Network Tools
    async getPublicIp() {
        return this.makeRequest('/network/ip/public');
    }

    async resolveHostname(domain: string) {
        return this.makeRequest('/network/ip/resolve', 'POST', { domain });
    }

    async reverseDns(ip: string) {
        return this.makeRequest('/network/ip/reverse', 'POST', { ip });
    }

    async dnsLookup(domain: string, recordType: string = 'A') {
        return this.makeRequest('/network/dns', 'POST', { domain, type: recordType });
    }

    async pingHost(host: string, count: number = 4) {
        return this.makeRequest('/network/ping', 'POST', { host, count });
    }

    async tracerouteHost(host: string) {
        return this.makeRequest('/network/traceroute', 'POST', { host });
    }

    // Password Tools
    async generatePassword(length: number = 12) {
        return this.makeRequest(`/generate/password?length=${length}`);
    }

    // QR Code
    async generateQrCode(text: string) {
        return this.makeRequest(`/api/generate-qrcode?text=${encodeURIComponent(text)}`);
    }

    // Random Tools
    async getRandomNumber(min: number = 0, max: number = 100, seed?: string) {
        const params = new URLSearchParams({ min: min.toString(), max: max.toString() });
        if (seed) params.append('seed', seed);
        return this.makeRequest(`/random/number?${params.toString()}`);
    }

    async generateUuidV4() {
        return this.makeRequest('/random/uuid/v4');
    }

    async generateUuidV5(namespace: string, name: string) {
        return this.makeRequest(`/random/uuid/v5?namespace=${namespace}&name=${name}`);
    }

    async rollDice(notation: string = '1d6', seed?: string) {
        const params = new URLSearchParams({ notation });
        if (seed) params.append('seed', seed);
        return this.makeRequest(`/random/dice?${params.toString()}`);
    }

    async flipCoin(seed?: string) {
        const params = new URLSearchParams();
        if (seed) params.append('seed', seed);
        return this.makeRequest(`/random/coin?${params.toString()}`);
    }

    // Time Converter
    async convertTimezone(time: string, fromTimezone: string, toTimezone: string) {
        return this.makeRequest('/api/convert-timezone', 'POST', {
            time,
            from_timezone: fromTimezone,
            to_timezone: toTimezone
        });
    }

    async listTimezones() {
        return this.makeRequest('/api/list-timezones');
    }
}
