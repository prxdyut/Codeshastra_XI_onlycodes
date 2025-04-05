import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { type: Number, required: true },
    creditsPurchased: { type: Number, required: true },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
    createdAt: { type: Date, default: Date.now },
  });
  
  export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);