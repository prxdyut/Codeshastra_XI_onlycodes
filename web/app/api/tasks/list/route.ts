import { Tasks } from '@/app/models/Tasks';
import connectDB from '@/app/lib/mongoose';

export async function GET() {
    await connectDB();

    try {
        const items = await Tasks.find()
            .sort({ timestamp: -1 })
            .limit(50);
        
        return Response.json({ success: true, data: items });
    } catch (error: any) {
        console.error('Error fetching data:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
} 