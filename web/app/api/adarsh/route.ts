import { MCPData } from '@/app/models/MCPData';
import connectDB from '@/app/lib/mongoose';

export async function POST(request: Request) {
    await connectDB();

    try {
        const { type, timestamp, data } = await request.json();
        
        const newData = await MCPData.create({
            type,
            timestamp: new Date(timestamp),
            data
        });

        return Response.json({ success: true, data: newData });
    } catch (error: any) {
        console.error('Error saving data:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}