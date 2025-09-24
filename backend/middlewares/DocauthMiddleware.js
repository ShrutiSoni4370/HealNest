// middleware/doctorAuth.js
import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctorsmodel.js';


const doctorAuth = async (req, res, next) => {
  try {
    console.log('👨‍⚕️ Doctor Auth Middleware - Checking authentication...');
    
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ Doctor Auth - No Authorization header found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_DOCTOR_TOKEN'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Doctor Auth - No Bearer token found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
        code: 'NO_DOCTOR_TOKEN'
      });
    }

    console.log('🔍 Doctor Auth - Token found, verifying...');

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Doctor Auth - Token verified for doctor ID:', decoded.doctorId || decoded.id);

    // Find doctor in database
    const doctor = await Doctor.findById(decoded.doctorId || decoded.id).select('-password');
    
    if (!doctor) {
      console.log('❌ Doctor Auth - Doctor not found in database');
      return res.status(401).json({
        success: false,
        message: 'Doctor not found.',
        code: 'DOCTOR_NOT_FOUND'
      });
    }

    // Check if doctor account is active
    if (!doctor.platformSettings?.isActive) {
      console.log('❌ Doctor Auth - Doctor account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Doctor account is inactive.',
        code: 'DOCTOR_ACCOUNT_DEACTIVATED'
      });
    }

    // Check account status
    if (doctor.platformSettings?.accountStatus === 'suspended') {
      console.log('❌ Doctor Auth - Doctor account is suspended');
      return res.status(401).json({
        success: false,
        message: 'Doctor account has been suspended.',
        code: 'DOCTOR_ACCOUNT_SUSPENDED'
      });
    }

    // Add doctor info to request object
    req.doctor = doctor;
    req.doctorId = doctor._id;
    
    console.log('✅ Doctor Auth - Authentication successful');
    next();

  } catch (error) {
    console.error('❌ Doctor Auth Error:', error.message);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_DOCTOR_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        code: 'DOCTOR_TOKEN_EXPIRED'
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = doctorAuth;
