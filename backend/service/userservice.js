import User from "../models/usermodel.js"; 
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import redisClient from "../config/redis.js"


/**
 * Register a new user
 * @param {Object} userData - user registration data
 * @returns {Object} saved user
 */
export const registerUser = async (userData) => {
  const {
    firstName,
    lastName,
    username,
    email,
    phoneNumber,
    countryCode,
    password,
    gender,
    dob,
    emergencyContact,
  } = userData;

 
  console.log("Register request body:", userData);

  // 1️⃣ Check verification status in Redis
  const [emailStatus, phoneStatus] = await Promise.all([
    redisClient.get(`emailVerified:${email}`),
    redisClient.get(`phoneVerified:${countryCode+phoneNumber}`)
  ]);

  console.log('Redis email verification status:', emailStatus);
  console.log('Redis phone verification status:', phoneStatus);

  if (emailStatus !== "true") {
    throw new Error("Email is not verified yet");
  }
  if (phoneStatus !== "true") {
    throw new Error("Phone number is not verified yet");
  }

  // 2️⃣ Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }, { phoneNumber }],
  });

  if (existingUser) {
    throw new Error("User with this email/username/phone already exists");
  }

  console.log("Existing user check query:", { email, username, phoneNumber });
  console.log("Found existing user:", existingUser);


  // 3️⃣ Create new user (password will be hashed in User model)
  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    phoneNumber,
    countryCode,
    password, // ✅ will be hashed automatically in userModel
    gender,
    dob,
    emergencyContact,
  });

  // 4️⃣ Save to DB


  const savedUser = await newUser.save();

  // ✅ Return Mongoose document instance instead of plain object
  return savedUser;
};

export const loginUser = async ({ emailOrUsername, password }) => {
  // Find user by email OR username
  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });

  if (!user) {
    throw new Error("Invalid email/username or password");
  }

  // Compare password first
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error("Invalid email/username or password");
  }

  // Generate JWT token (after successful password check)
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Sanitize user object
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.__v;

  return {
    message: "Login successful",
    token,
    user: userResponse,
  };
};

export const logoutUser = async (authHeader) => {
  // Extract token from "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header missing or malformed");
  }
  const token = authHeader.split(" ")[1];

  // Add the token to a blacklist in Redis with its expiry
  const decoded = jwt.decode(token);
  // No need to check token expiry or blacklist if handling logout on client side (e.g., removing from localStorage)
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  if (expiresIn > 0) {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, "true");
  }
  return { message: "Logout successful" };
};

export const getAllUsers = async () => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    return users;
  } catch (error) {
    throw new Error("Error fetching users");
  }
};


export const getAllOnlineUsers = async () => {
  try {
    // CORRECT syntax for Redis v5+
    const onlineUserIds = await redisClient.zRange('online_users', 0, -1);
    
    if (onlineUserIds.length === 0) {
      return [];
    }
    
    // Get complete user data from MongoDB
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds }
    }).select('-password');
    
    // Add Redis session data to each user
    const usersWithCompleteData = await Promise.all(
      onlineUsers.map(async (user) => {
        // Use hGetAll for Redis v5+
        const sessionInfo = await redisClient.hGetAll(`user:${user._id}:session`);
        
        return {
          ...user.toObject(),
          sessionData: {
            lastActivity: sessionInfo.lastActivity ? new Date(parseInt(sessionInfo.lastActivity)) : null,
            loginTime: sessionInfo.loginTime ? new Date(parseInt(sessionInfo.loginTime)) : null,
            status: sessionInfo.status || 'online',
            ipAddress: sessionInfo.ipAddress || null,
            userAgent: sessionInfo.userAgent || null,
            sessionId: sessionInfo.sessionId || null
          }
        };
      })
    );
    
    return usersWithCompleteData;
  } catch (error) {
    throw new Error("Error fetching online users with complete data: " + error.message);
  }
}



// userservice.js
export const getuserbyid = async (userId) => {
  try {
    console.log('🔍 Looking for user with ID:', userId);
    
    // ✅ Validate userId format
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // ✅ Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      throw new Error("User not found");
    }
    
    console.log('✅ User found:', user.firstName, user.lastName);
    return user;
  } catch (error) {
    console.error('❌ Error in getuserbyid:', error.message);
    throw new Error("Error fetching user by ID: " + error.message);
  }
};

