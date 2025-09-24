import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/usermodel.js"; // ✅ Import your User model

dotenv.config();

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Stop server if DB fails
  }
};




export default connectDB;
