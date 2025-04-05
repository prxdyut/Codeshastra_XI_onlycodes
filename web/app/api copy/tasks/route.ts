import { Tasks } from '@/app/models/Tasks';
import connectDB from '@/app/lib/mongoose';
import { predictTaskType } from '@/app/lib/groq';

export async function POST(request: Request) {
    await connectDB();

    try {
        const { text } = await request.json();
        
        if (!text || typeof text !== 'string') {
            return Response.json({ 
                success: false, 
                error: 'Text input is required' 
            }, { status: 400 });
        }

        // Get prediction from Groq API
        const prediction = await predictTaskType(text);
        console.log(prediction);
        // Create the task record
        const newData = await Tasks.create({
            type: prediction.type,
            timestamp: new Date(),
            data: {
                text: text,  // Store original text
                ...prediction  // Store all prediction data
            }
        });

        return Response.json({ success: true, data: newData });
    } catch (error: any) {
        console.error('Error processing task:', error);
        return Response.json({ 
            success: false, 
            error: error.message,
            errorType: error.name 
        }, { status: 500 });
    }
} 