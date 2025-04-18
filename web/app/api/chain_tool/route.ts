import { NextRequest, NextResponse } from 'next/server';
import { Socrates } from '@/app/managers/socrates';

const socrates = new Socrates(process.env.GROQ_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { prompt, context = '', action, step, currentAnswer, nextQuestion } = await req.json();
        if (!action) {
            return NextResponse.json(
                { error: 'Action is required' },
                { status: 400 }
            );
        }

        let result;
        switch (action) {
            case 'analyze':
                if (!prompt) {
                    return NextResponse.json(
                        { error: 'Prompt is required' },
                        { status: 400 }
                    );
                }
                result = await socrates.analyzePrompt(prompt);
                break;

            case 'process_step':
                if (!step || !context) {
                    return NextResponse.json(
                        { error: 'Step and context are required' },
                        { status: 400 }
                    );
                }
                result = await socrates.processStep(step, context);
                break;

            case 'should_skip_question':
                if (!currentAnswer || !nextQuestion || !context) {
                    return NextResponse.json(
                        { error: 'Current answer, next question, and context are required' },
                        { status: 400 }
                    );
                }
                result = await socrates.shouldSkipNextQuestion(currentAnswer, nextQuestion, context);
                break;

            case 'generate_final':
                if (!context || !prompt) {
                    console.log('Context and prompt are required');
                    return NextResponse.json(
                        { error: 'Context and prompt are required' },
                        { status: 400 }
                    );
                }
                console.log('Generating final response');
                result = await socrates.generateFinalResponse(context, prompt);
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const history = socrates.getProcessHistory();
        return NextResponse.json({ history });
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        socrates.clearProcessHistory();
        return NextResponse.json({ message: 'History cleared' });
    } catch (error) {
        console.error('Error clearing history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
