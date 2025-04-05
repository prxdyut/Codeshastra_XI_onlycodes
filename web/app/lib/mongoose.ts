// lib/mongoose.js
import mongoose from "mongoose";

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://admin:secret@localhost:27069/mydatabase?authSource=admin";

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
    //@ts-ignore
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        console.log(
            "MongoDB connection already established:",
            cached.conn.connection.host
        );
        console.log(
            "MongoDB connection state:",
            cached.conn.connection.readyState
        );
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((mongoose) => {
                return mongoose;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    console.log("MongoDB connection established:", cached.conn.connection.host);
    console.log("MongoDB connection state:", cached.conn.connection.readyState);
    console.log("Connected to MongoDB:", cached.conn.connection.host);
    console.log("MongoDB connection state:", cached.conn.connection.readyState);
    return cached.conn;
}

export default connectDB;
