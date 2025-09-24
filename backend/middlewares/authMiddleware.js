import jwt from "jsonwebtoken";
import UserModel from "../models/usermodel.js";
import redisClient from "../config/redis.js";

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("🔍 Full Auth Header:", authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ 
        success: false,
        message: "No token provided",
        code: "NO_TOKEN"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔍 Extracted Token:", token);
    console.log("🔍 Token length:", token ? token.length : 0);
    console.log("🔍 Token parts:", token ? token.split('.').length : 0);

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      console.log("❌ Token is blacklisted");
      return res.status(401).json({ 
        success: false,
        message: "Token is blacklisted",
        code: "BLACKLISTED_TOKEN",
        action: "FORCE_LOGOUT"
      });
    }

    // Check if token has 3 parts (valid JWT format)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log("❌ Invalid JWT structure - Expected 3 parts, got:", tokenParts.length);
      return res.status(401).json({ 
        success: false,
        message: "Invalid JWT format",
        code: "INVALID_FORMAT"
      });
    }

    console.log("🔍 Verifying token with JWT_SECRET...");
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified successfully:", decoded);

    // ENHANCED: Handle deleted/missing user accounts
    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) {
      console.log("❌ User not found for ID:", decoded.id, "(Account likely deleted)");
      
      // Optionally blacklist this token since user no longer exists
      try {
        await redisClient.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, 'deleted_user'); // 7 days
        console.log("🚫 Token blacklisted due to deleted user account");
      } catch (redisError) {
        console.warn("⚠️ Failed to blacklist token:", redisError.message);
      }
      
      return res.status(401).json({ 
        success: false,
        message: "User account no longer exists. Please log in again.",
        code: "ACCOUNT_DELETED",
        action: "FORCE_LOGOUT",
        userId: decoded.id
      });
    }

    console.log("✅ User found:", user.email);
    req.user = user;
    req.token = token; // Store token for potential blacklisting
    next();

  } catch (error) {
    console.error("❌ JWT Error Details:", {
      name: error.name,
      message: error.message,
      token: req.headers["authorization"] ? req.headers["authorization"].substring(0, 50) + "..." : "none"
    });

    // Handle specific JWT errors with appropriate responses
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token has expired. Please log in again.",
        code: "TOKEN_EXPIRED",
        action: "FORCE_LOGOUT"
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token. Please log in again.",
        code: "INVALID_TOKEN",
        action: "FORCE_LOGOUT"
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false,
        message: "Token not active yet.",
        code: "TOKEN_NOT_ACTIVE"
      });
    }

    // Generic error response
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token",
      code: "AUTH_ERROR"
    });
  }
};


// Logout function
export const logoutUser = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header missing or malformed");
  }
  const token = authHeader.split(" ")[1];

  const decoded = jwt.decode(token);
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

  if (expiresIn > 0) {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, "true");
  }

  return { 
    message: "Logout successful",
    userId: decoded.id // Return userId for cleanup
  };
};

export async function trackUserActivity(req, res, next) {
  try {
    if (req.user && req.user._id) { // Note: Use _id for MongoDB
      const userId = req.user._id.toString();
      const timestamp = Date.now();
      
      // Update user activity in Redis
      await redisClient.zAdd('online_users', { score: timestamp, value: userId });
      await redisClient.hSet(`user:${userId}:session`, 'lastActivity', timestamp.toString());
    }
  } catch (error) {
    console.error('Activity tracking error:', error);
  }
  next();
}
