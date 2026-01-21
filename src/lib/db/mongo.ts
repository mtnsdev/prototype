import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

// Module-scoped cache (no global)
let cachedConn: typeof mongoose | null = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectMongo(): Promise<typeof mongoose> {
    // If already connected, return immediately
    if (cachedConn && mongoose.connection.readyState === 1) {
        return cachedConn;
    }

    // If a connection is in-flight, await it
    if (cachedPromise) {
        cachedConn = await cachedPromise;
        return cachedConn;
    }

    // Create a new connection promise
    cachedPromise = mongoose.connect(MONGO_URI, {
        bufferCommands: false,
    });

    cachedConn = await cachedPromise;
    return cachedConn;
}
