import {registerUser , loginUser , logoutUser , getAllUsers ,getAllOnlineUsers , getuserbyid} from "../service/userservice.js"
import { sendOTPEmail , sendOTPPhone } from "../utils/otp.js";
import User from "../models/usermodel.js"
import  redisClient  from '../config/redis.js'; // Adjust path


export const registerUserController = async (req, res) => {
  try {
    // Call service to create user in DB
    const user = await registerUser(req.body);

    // Generate JWT token here
   const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      data: user,
      token, // send token back
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



export async function sendOTPEmailcontrollers(req, res) {
  try {
    const { email } = req.body;

    const response = await sendOTPEmail(email);

    // If sendOTPEmail was successful
    res.status(200).json({ message: response.message });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    res.status(500).json({
      message: "Failed to send OTP email in controllers",
      error: error.message,
    });
  }
}


export async function sendOTPPhonecontrollers(req, res) {
  try {
    const { phoneNumber } = req.body;

    const response = await sendOTPPhone(phoneNumber);

    // Always send a valid HTTP status
    res.status(200).json({ message: response.message });
  } catch (error) {
    console.error("Failed to send OTP phone:", error);
    res.status(500).json({
      message: "Failed to send OTP phone",
      error: error.message,
    });
  }
}
export async function verifyOTPEmail(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const savedOTP = await redisClient.get(`otp:email:${email}`);
    if (savedOTP === otp) {
      await redisClient.set(`emailVerified:${email}`, "true");
      // Delete OTP after successful verification
      await redisClient.del(`otp:email:${email}`);

      res.json({ message: 'Email verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
}

// Verify OTP for phone and update user record


export async function verifyOTPPhone(req, res) {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }

  try {
    const normalizedPhone = phoneNumber.replace(/\s+/g, ''); // remove spaces
    const savedOTP = await redisClient.get(`otp:phone:${normalizedPhone}`);

    if (savedOTP === otp) {
      await redisClient.set(`phoneVerified:${normalizedPhone}`, "true");
      await redisClient.del(`otp:phone:${normalizedPhone}`);
      return res.json({ message: 'Phone number verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
}



export async function loginUserController(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    
    // Call your existing login service
    const response = await loginUser({ emailOrUsername, password });
    
    // If login successful, add user to online users
    if (response.success && response.user) {
      const userId = response.user._id || response.user.id; // Handle both _id and id
      const timestamp = Date.now();
      
      console.log('Adding user to online tracking:', userId); // Debug log
      
      try {
        // Add to online users sorted set (Redis v5+ syntax)
        await redisClient.zAdd('online_users', { 
          score: timestamp, 
          value: userId.toString() 
        });
        
        // Store detailed session info in Redis hash
        await redisClient.hSet(`user:${userId}:session`, {
          lastActivity: timestamp.toString(),
          status: 'online',
          loginTime: timestamp.toString(),
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          sessionId: response.token || response.sessionId || 'unknown'
        });
        
        console.log('Successfully added user to Redis'); // Debug log
        
      } catch (redisError) {
        console.error('Redis error during login:', redisError);
        // Don't fail the login if Redis fails, just log the error
      }
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}


export async function logoutUserController(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const response = await logoutUser(authHeader);
    
    if (response.success && response.userId) {
      const userId = response.userId;
      
      // CORRECT syntax for Redis v5+
      await redisClient.zRem('online_users', userId);
      await redisClient.del(`user:${userId}:session`);
    }
    
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}


export async function getAllUsersController(req, res) {
  try {
    const users = await getAllUsers();
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAllOnlineUsersController(req , res){
  try {
    const onlineUsers = await getAllOnlineUsers();
    res.status(200).json({
      success: true,
      message: "Online users fetched successfully",
      data: onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}



 export async function getuserbyidcontroller(req, res){
  try {
    const { id } = req.params;
    const user = await getuserbyid(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

