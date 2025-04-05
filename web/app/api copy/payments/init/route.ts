// app/api/payments/init/route.js
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { Transaction } from '@/app/models/Transactions';
import { User } from '@/app/models/User';
import connectDB from '@/app/lib/mongoose';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function GET(request: Request) {
  return NextResponse.json({status: 'ok'});
}

export async function POST(request: Request) {
  await connectDB();
  
  const { clerkUserId, credits } = await request.json();
  const amount = credits * 100;
  
  try {
    let user = await User.findOne({ clerkUserId });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const options = {
      amount: amount.toString(),
      currency: 'INR',
      receipt: `credits_${Date.now()}`,
      notes: {
        clerkUserId,
        credits,
      }
    };

    const order = await razorpay.orders.create(options);
    
    const transaction = new Transaction({
      user: user._id,
      amount: amount / 100,
      creditsPurchased: credits,
      razorpayOrderId: order.id,
      status: 'pending'
    });
    await transaction.save();
    
    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}