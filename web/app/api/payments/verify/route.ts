// app/api/payments/verify/route.js
import { User } from '@/app/models/User';
import { Transaction } from '@/app/models/Transactions';
import connectDB from '@/app/lib/mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request: Request) {
  await connectDB();

  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      clerkUserId 
    } = await request.json();

    if(!process.env.RAZORPAY_KEY_SECRET) {
      return Response.json({ 
        success: false, 
        error: 'Razorpay key secret not configured' 
      }, { status: 500 });
    }
    // 1. Verify the payment signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return Response.json({ 
        success: false, 
        error: 'Invalid payment signature' 
      }, { status: 400 });
    }

    // 2. Find the user
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // 3. Find and update the transaction
    const transaction = await Transaction.findOneAndUpdate(
      { 
        razorpayOrderId: razorpay_order_id,
        user: user._id,
        status: 'pending'
      },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: 'completed',
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { new: true, upsert: false }
    );

    if (!transaction) {
      return Response.json({ 
        success: false, 
        error: 'Pending transaction not found' 
      }, { status: 404 });
    }

    // 4. Update user credits
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: transaction.creditsPurchased } },
      { new: true }
    );

    return Response.json({ 
      success: true,
      creditsAdded: transaction.creditsPurchased,
      newBalance: updatedUser.credits,
      transactionId: transaction._id
    });

  } catch (error: any) {
    console.error('Payment verification failed:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Payment verification failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}