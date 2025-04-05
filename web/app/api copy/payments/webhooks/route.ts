// app/api/payments/webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { User } from '@/app/models/User';
import { Transaction } from '@/app/models/Transactions';
import connectDB from '@/app/lib/mongoose';

export async function POST(request: Request) {
  await connectDB();

  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'payment.authorized') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    console.log(event.payload);

    // Find the transaction
    const transaction = await Transaction.findOne({ razorpayOrderId: orderId }).populate('user');
    console.log(transaction);
    if (transaction && transaction.status === 'pending') {
      // Update transaction
      transaction.razorpayPaymentId = payment.id;
      transaction.status = 'completed';
      await transaction.save();
      console.log(transaction);
      // Update user credits
      const user = await User.findById(
        transaction.user._id
      )
      console.log(user);
      user.credits += transaction.creditsPurchased;
      await user.save();
      console.log(user);
    }
  }

  return NextResponse.json({ success: true });
}