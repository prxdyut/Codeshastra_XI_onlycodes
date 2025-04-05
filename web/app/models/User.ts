import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  credits: { type: Number, default: 25 },
  createdAt: { type: Date, default: Date.now },
});

userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'user',
});

userSchema.set('toJSON', { virtuals: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);