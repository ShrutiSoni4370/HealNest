// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import User from "../models/usermodel.js"; // ✅ Import your User model

// dotenv.config();

// const connectDB = async () => {
//   try {
//     const connect = await mongoose.connect(process.env.MONGO_URI1);
//     console.log(`✅ MongoDB connected: ${connect.connection.host}`);
//   } catch (error) {
//     console.error(`❌ Error: ${error.message}`);
//     process.exit(1); // Stop server if DB fails
//   }
// };




// export default connectDB;


// db.js or mongo_connect.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI2) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const connect = await mongoose.connect(process.env.MONGO_URI2, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;
