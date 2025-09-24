// otpController.js

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import  redisClient  from '../config/redis.js'; // Adjust path


dotenv.config();

// Email transporter setup (using real SMTP credentials in .env)
const transporter = nodemailer.createTransport({
   host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps in local dev
  },
});

// Twilio client setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate 6-digit OTP as string
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email) {
  if (!email) {
    return { success: false, status: 400, message: 'Email is required' };
  }

  const otp = generateOTP();
  try {
    // Save OTP to Redis with 15 min expiry
    await redisClient.setEx(`otp:email:${email}`, 900, otp);

    // Send email
    await transporter.sendMail({
      from: `"HealNest" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for HealNest',
      text: `Your OTP is: ${otp}. It is valid for 15 minutes.`,
      html: `<p>Your OTP is: <b>${otp}</b></p><p>It is valid for 15 minutes.</p>`,
    });

    return { success: true, message: 'OTP sent to email' };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, status: 500, message: 'Failed to send OTP email' };
  }
}

export async function sendOTPPhone(phoneNumber) {
  if (!phoneNumber) {
    return { success: false, status: 400, message: 'Phone number is required' };
  }

  const otp = generateOTP();
  try {
    await redisClient.setEx(`otp:phone:${phoneNumber}`, 900, otp);

    const message = await twilioClient.messages.create({
      body: `Your HealNest OTP is: ${otp}. It is valid for 15 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS sent:', message.sid);
    return { success: true, message: 'OTP sent to phone' };
  } catch (error) {
    console.error('Failed to send OTP SMS:', error);
    return { success: false, status: 500, message: 'Failed to send OTP SMS' };
  }
}

