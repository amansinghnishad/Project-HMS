const mongoose = require("mongoose");
require("dotenv").config();

let cachedConnection = null;

const resolveMongoUri = () => {
    const uri = process.env.MONGODB_URL || process.env.DATABASE_URL;
    if (!uri) {
        throw new Error("MongoDB connection string missing. Set MONGODB_URL or DATABASE_URL.");
    }
    return uri;
};

const defaultOptions = {
    autoIndex: false,
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000),
};

const registerConnectionEvents = () => {
    const { connection } = mongoose;
    if (connection.listenerCount("error") === 0) {
        connection.on("error", (err) => {
            console.error("MongoDB connection error", err);
        });
    }
    if (connection.listenerCount("disconnected") === 0) {
        connection.on("disconnected", () => {
            console.warn("MongoDB disconnected. Waiting for reconnect...");
        });
    }
};

exports.connect = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (mongoose.connection.readyState === 1) {
        cachedConnection = mongoose.connection;
        return cachedConnection;
    }

    const uri = resolveMongoUri();

    try {
        cachedConnection = await mongoose.connect(uri, defaultOptions);
        registerConnectionEvents();
        if (process.env.MONGODB_DEBUG === "true") {
            mongoose.set("debug", true);
        }
        console.log("MongoDB connected successfully");
        return cachedConnection;
    } catch (error) {
        cachedConnection = null;
        console.error("MongoDB connection failed", error);
        throw error;
    }
};