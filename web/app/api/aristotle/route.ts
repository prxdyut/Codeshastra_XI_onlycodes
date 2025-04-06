import { NextRequest, NextResponse } from 'next/server';
import { Aristotle } from '../../managers/aristotle';

// Initialize Aristotle with your API key
const aristotle = new Aristotle(process.env.GROQ_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, prompt, toolCall, toolCalls: existingToolCalls } = body;
        switch (action) {
            case 'analyze':
                const files = body.files || [];
                let enhancedPrompt = prompt;
                if (files && files.length > 0) {
                    enhancedPrompt = `${prompt}\nFiles provided: ${files.join(', ')}`;
                }

                const toolCalls = await aristotle.analyzePrompt(enhancedPrompt);
                return NextResponse.json({ toolCalls });

            case 'execute_tool':
                if (!existingToolCalls) {
                    return NextResponse.json(
                        { error: 'No tool call provided' },
                        { status: 400 }
                    );
                }

                // if (toolCall.arguments.path && toolCall.arguments.path.startsWith('uploads/')) {
                //     toolCall.arguments.path = process.cwd() + '/' + toolCall.arguments.path;
                // }

                try {
                    console.log('🚀 Starting tool execution:', existingToolCalls);
                    const results = await aristotle.executeToolSequence(existingToolCalls);
                    console.log('✅ Tool execution completed:', results);
                    return NextResponse.json({ result: results[0] }); // Return first result
                } catch (error) {
                    console.error('❌ Tool execution failed:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    return NextResponse.json(
                        { error: 'Tool execution failed', details: errorMessage },
                        { status: 500 }
                    );
                }

            case 'generate_summary':
                if (!existingToolCalls) {
                    return NextResponse.json(
                        { error: 'No tool calls provided for summary' },
                        { status: 400 }
                    );
                }

                const summary = `Completed execution of ${existingToolCalls.length} tools:\n` +
                    existingToolCalls.map((tc: any, i: number) => 
                        `${i + 1}. ${tc.tool} - ${tc.success ? 'Success' : 'Failed'}`
                    ).join('\n');

                return NextResponse.json({ summary });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Error in Aristotle API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
} 