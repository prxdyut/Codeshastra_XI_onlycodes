import mongoose from 'mongoose';

const mcpDataSchema = new mongoose.Schema({
    type: { type: String, required: true },
    timestamp: { type: Date, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const MCPData = mongoose.models.MCPData || mongoose.model('MCPData', mcpDataSchema); 