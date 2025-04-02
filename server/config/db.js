import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB connected successfully!");

        // Handle disconnections and attempt to reconnect
        mongoose.connection.on("disconnected", () => {
            console.error(" MongoDB disconnected! Attempting to reconnect...");
            setTimeout(connectDB, 2000); // Retry after 2 seconds
        });

    } catch (err) {
        console.error("Database connection error:", err.message);
        console.error("Full error details:", err);

        // Retry only on network errors
        if (err.name === "MongoNetworkError" || err.message.includes("ETIMEDOUT")) {
            console.log(" Retrying connection in 2 seconds...");
            setTimeout(connectDB, 2000); // Retry after 2 seconds
        }
    }
};

// Call function to establish the connection
connectDB();

export default connectDB;