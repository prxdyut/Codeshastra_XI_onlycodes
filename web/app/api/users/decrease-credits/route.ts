import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/app/models/User';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/mongoose';

export async function GET(request: NextRequest) {
    try {
        // Connect to the database
        await connectDB();

        // Get the clerk user ID and amount from search params
        const searchParams = request.nextUrl.searchParams;
        const clerkUserId = searchParams.get('clerkUserId');
        const amount = parseInt(searchParams.get('amount') || '0');

        // Validate inputs
        if (!clerkUserId) {
            console.log('Clerk user ID is required');
            return NextResponse.json({ error: 'Clerk user ID is required' }, { status: 400 });
        }

        if (!amount || amount <= 0) {
            console.log('Valid amount is required');
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        // Find and update the user's credits
        const user = await User.findOneAndUpdate(
            { clerkUserId },
            { $inc: { credits: -amount } },
            { new: true }
        );

        if (!user) {
            console.log('User not found');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user has sufficient credits
        if (user.credits < 0) {
            // Revert the credit deduction
            await User.findOneAndUpdate(
                { clerkUserId },
                { $inc: { credits: amount } }
            );
            console.log('Insufficient credits');
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            user: {
                clerkUserId: user.clerkUserId,
                credits: user.credits
            }
        });

    } catch (error) {
        console.error('Error decreasing credits:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 