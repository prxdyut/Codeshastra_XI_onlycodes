import { NextResponse } from 'next/server';
import { User } from '@/app/models/User';
import { Transaction } from '@/app/models/Transactions';
import connectDB from '@/app/lib/mongoose';

export async function GET(request: Request, { params }: { params: { clerkUserId: string } }) {
  await connectDB();
  const clerkUserId = (await params).clerkUserId;
  try {
    const user = await User.findOne({ clerkUserId: clerkUserId });
    
    if (!user) {
      return NextResponse.json({ transactions: [] });
    }
    
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
