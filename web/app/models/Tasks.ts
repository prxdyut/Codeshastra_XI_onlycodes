import mongoose from 'mongoose';

const tasksSchema = new mongoose.Schema({
    type: { type: String, required: true },
    timestamp: { type: Date, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Tasks = mongoose.models.Tasks || mongoose.model('Tasks', tasksSchema); 