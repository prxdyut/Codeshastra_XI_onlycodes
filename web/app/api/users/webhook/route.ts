// app/api/clerk-webhook/route.js
import { User } from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';

export async function POST(request: Request) {
  await connectDB();
  
  try {
    const payload = await request.json();
    const eventType = payload.type;
    const userData = payload.data;

    // Only handle user creation
    if (eventType === 'user.created') {
      // Check if user already exists
      const existingUser = await User.findOne({ clerkUserId: userData.id });
      if (existingUser) return Response.json({ success: true });

      // Create simple user document
      await User.create({
        clerkUserId: userData.id,
        credits: 0,
        
        createdAt: new Date()
      });

      return Response.json({ success: true });
    }

    return Response.json({ success: false, message: 'Event not handled' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}