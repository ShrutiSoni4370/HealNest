import Doctormodel from '../models/Doctorsmodel.js';
import { getuserbyid } from './userservice.js';
import Appointment from '../models/appointment.js'
import mongoose from 'mongoose'
import User from '../models/usermodel.js'





// Register a new doctor
export const registerDoctor = async (doctorData) => {
  try {
    const { personalInfo, contactInfo, professionalInfo, specializations, education } = doctorData;

    // Check if doctor already exists
    const existingDoctor = await Doctormodel.findOne({
      $or: [
        { 'contactInfo.email': contactInfo.email },
        { 'professionalInfo.medicalLicenseNumber': professionalInfo.medicalLicenseNumber }
      ]
    });

    if (existingDoctor) {
      return {
        success: false,
        error: 'Doctor already exists with this email or medical license number'
      };
    }

    // Create a new doctor instance (password will be hashed by pre-save middleware)
    const newDoctor = new Doctormodel({
      personalInfo,
      contactInfo,
      professionalInfo,
      specializations,
      education
    });

    // Save the doctor to the database
    const savedDoctor = await newDoctor.save();

    // Generate JWT token
    const token = savedDoctor.generateJWT();

    // Remove password from response
    const doctorResponse = savedDoctor.toObject();
    delete doctorResponse.personalInfo.password;

    return {
      success: true,
      data: doctorResponse,
      token
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

// Login doctor
export const loginDoctor = async (email, password) => {
  try {
    // Find doctor by email
    const doctor = await Doctormodel.findOne({ 'contactInfo.email': email });

    if (!doctor) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Check password
    const isPasswordValid = await doctor.comparePassword(password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Update last login
    doctor.platformSettings.lastLogin = new Date();
    await doctor.save();

    // Generate JWT token
    const token = doctor.generateJWT();

    // Remove password from response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.personalInfo.password;

    return {
      success: true,
      data: doctorResponse,
      token
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
};

export const getDoctorById = async (doctorId) => {
  try {
    const doctor = await Doctormodel.findById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }
    const doctorResponse = doctor.toObject();
    if (doctorResponse.personalInfo && doctorResponse.personalInfo.password) {
      delete doctorResponse.personalInfo.password;
    }
    return { success: true, data: doctorResponse };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to get doctor' };
  }
};




export const getalldoctors = async () => {
  try {
    const doctors = await Doctormodel.find({});
    // Remove password from each doctor object
    const sanitizedDoctors = doctors.map(doc => {
      const doctorObj = doc.toObject();
      if (doctorObj.personalInfo && doctorObj.personalInfo.password) {
        delete doctorObj.personalInfo.password;
      }
      return doctorObj;
    });
    return { success: true, doctors: sanitizedDoctors, total: sanitizedDoctors.length };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to get doctors' };
  }
};

// ✅ Create new appointment
export const createAppointment = async (appointmentData) => {
  try {
    const {
      patientId,
      doctorId,
      scheduledTime,
      appointmentDetails
    } = appointmentData;

    console.log('📝 Creating appointment:', { patientId, doctorId, scheduledTime });

    // ✅ Validate patient and doctor exist
    const [patient, doctor] = await Promise.all([
      User.findById(patientId),
      Doctormodel.findById(doctorId)
    ]);

    if (!patient) {
      throw new Error('Patient not found');
    }
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // ✅ Check for scheduling conflicts (within 1 hour window)
    const scheduledDate = new Date(scheduledTime);
    const conflictStart = new Date(scheduledDate.getTime() - 30 * 60 * 1000); // 30 min before
    const conflictEnd = new Date(scheduledDate.getTime() + 30 * 60 * 1000); // 30 min after

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      scheduledTime: {
        $gte: conflictStart,
        $lte: conflictEnd
      },
      status: { $in: ['confirmed', 'pending'] }
    });

    if (conflict) {
      throw new Error('Doctor has a scheduling conflict at this time');
    }

    // ✅ Generate unique appointment ID
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ✅ Create appointment with auto-expiry (2 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    const appointment = new Appointment({
      appointmentId,
      patient: patientId,
      doctor: doctorId,
      scheduledTime: scheduledDate,
      appointmentDetails,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await appointment.save();

    // ✅ Populate related data
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email phoneNumber')
      .populate({
        path: 'doctor',
        model: Doctormodel, // ✅ Use your imported Doctormodel directly
        select: 'personalInfo specializations contactInfo'
      })

    console.log('✅ Appointment created successfully:', appointmentId);

    return {
      success: true,
      appointment: populatedAppointment
    };

  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


// ✅ Get all appointments (replacing Redis version)
export const getallappointments = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all appointments from MongoDB...');

    const query = {};

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.doctorId) query.doctor = filters.doctorId;
    if (filters.patientId) query.patient = filters.patientId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.scheduledTime = {};
      if (filters.startDate) query.scheduledTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.scheduledTime.$lte = new Date(filters.endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phoneNumber')
      .populate('doctor', 'personalInfo specializations contactInfo')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);

    console.log(`✅ Retrieved ${appointments.length} appointments from MongoDB`);

    return {
      success: true,
      appointments,
      total: appointments.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return {
      success: false,
      error: error.message,
      appointments: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ Get doctor appointments
// backend/service/doctorservice.js
export const getdoctorsappointments = async (doctorId, filters = {}) => {
  try {
    console.log('🔍 Getting doctor appointments for:', doctorId);
    
    // ✅ FIXED: Use .find() instead of .findByDoctor()
    const appointments = await Appointment.find({
      doctor: doctorId,
      ...filters
    })
    .populate({
      path: 'patient',
      model: User,
      select: 'firstName lastName email phoneNumber'
    })
    .populate({
      path: 'doctor', 
      model: Doctormodel,
      select: 'personalInfo specializations contactInfo'
    })
    .sort({ scheduledTime: -1 }); // Most recent first

    console.log(`✅ Found ${appointments.length} appointments for doctor ${doctorId}`);

    return {
      success: true,
      appointments,
      total: appointments.length
    };
  } catch (error) {
    console.error(`❌ Error getting doctor appointments for ${doctorId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};


// ✅ Get patient appointments
export const getpatientappointments = async (patientId, filters = {}) => {
  try {
    console.log(`🔍 Fetching appointments for patient: ${patientId}`);

    // ✅ FIXED: Use correct Mongoose query
    const appointments = await Appointment.find({
      patient: patientId,
      ...filters
    })
    .populate({
      path: 'patient',
      model: User,
      select: 'firstName lastName email phoneNumber'
    })
    .populate({
      path: 'doctor', 
      model: Doctormodel,
      select: 'personalInfo specializations contactInfo'
    })
    .sort({ scheduledTime: -1 });

    console.log(`✅ Found ${appointments.length} appointments for patient ${patientId}`);

    return {
      success: true,
      appointments,
      patientId,
      total: appointments.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error fetching patient appointments for ${patientId}:`, error);
    return {
      success: false,
      error: error.message,
      patientId,
      appointments: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
  }
};


// ✅ Get single appointment
export const getappointment = async (appointmentId) => {
  try {
    console.log(`🔍 Fetching appointment: ${appointmentId}`);

    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId },
        { _id: mongoose.Types.ObjectId.isValid(appointmentId) ? appointmentId : null }
      ]
    })
    .populate({
      path: 'patient',
      model: User, // ✅ Use imported User model
      select: 'firstName lastName email phoneNumber'
    })
    .populate({
      path: 'doctor',
      model: Doctormodel, // ✅ Use imported Doctormodel
      select: 'personalInfo specializations contactInfo'
    });

    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found',
        appointmentId
      };
    }

    console.log(`✅ Retrieved appointment: ${appointmentId}`);

    return {
      success: true,
      appointment,
      appointmentId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error fetching appointment ${appointmentId}:`, error);
    return {
      success: false,
      error: error.message,
      appointmentId,
      timestamp: new Date().toISOString()
    };
  }
};


// ✅ Update appointment status
export const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
  try {
    console.log(`📝 Updating appointment ${appointmentId} to status: ${status}`);

    const updateData = {
      status,
      lastUpdated: new Date(),
      ...additionalData
    };

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: updateData },
      { new: true }
    )
    .populate({
      path: 'patient',
      model: User, // ✅ Use imported User model
      select: 'firstName lastName email phoneNumber'
    })
    .populate({
      path: 'doctor',
      model: Doctormodel, // ✅ Use imported Doctormodel (not "Doctor")
      select: 'personalInfo specializations contactInfo'
    });

    if (!updatedAppointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    console.log(`✅ Appointment ${appointmentId} updated to ${status}`);

    return {
      success: true,
      appointment: updatedAppointment
    };

  } catch (error) {
    console.error(`❌ Error updating appointment ${appointmentId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};


// ✅ Search appointments
export const searchappointments = async (searchCriteria = {}) => {
  try {
    console.log('🔍 Searching appointments with criteria:', searchCriteria);

    const query = {};

    // Text search
    if (searchCriteria.searchTerm) {
      const searchRegex = new RegExp(searchCriteria.searchTerm, 'i');
      query.$or = [
        { 'appointmentDetails.concern': searchRegex },
        { 'appointmentDetails.symptoms': searchRegex }
      ];
    }

    // Status filter
    if (searchCriteria.status) {
      query.status = searchCriteria.status;
    }

    // Urgency filter
    if (searchCriteria.urgency) {
      query['appointmentDetails.urgency'] = searchCriteria.urgency;
    }

    // Date range
    if (searchCriteria.dateFrom || searchCriteria.dateTo) {
      query.scheduledTime = {};
      if (searchCriteria.dateFrom) {
        query.scheduledTime.$gte = new Date(searchCriteria.dateFrom);
      }
      if (searchCriteria.dateTo) {
        query.scheduledTime.$lte = new Date(searchCriteria.dateTo);
      }
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'personalInfo')
      .sort({ createdAt: -1 })
      .limit(searchCriteria.limit || 50);

    return {
      success: true,
      appointments,
      total: appointments.length,
      searchCriteria,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Search appointments error:', error);
    return {
      success: false,
      error: error.message,
      appointments: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ Get appointment statistics
export const getAppointmentStats = async () => {
  try {
    console.log('📊 Getting appointment statistics...');

    const stats = await Appointment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0
    };

    return {
      success: true,
      stats: result,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Get appointment stats error:', error);
    return {
      success: false,
      error: error.message,
      stats: null,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ Respond to appointment (accept/reject)
// backend/service/doctorservice.js
export const respondToAppointment = async (appointmentId, accepted, message = '') => {
  try {
    console.log(`✅ ${accepted ? 'Accepting' : 'Rejecting'} appointment: ${appointmentId}`);

    // ✅ Find the appointment first
    const appointment = await Appointment.findOne({ 
      appointmentId: appointmentId 
    })
    .populate({
      path: 'patient',
      model: User,
      select: 'firstName lastName email phoneNumber'
    })
    .populate({
      path: 'doctor',
      model: Doctormodel,
      select: 'personalInfo specializations contactInfo'
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new Error('Appointment is not in pending status');
    }

    // ✅ FIXED: Update appointment status directly
    const newStatus = accepted ? 'confirmed' : 'rejected';
    
    appointment.status = newStatus;
    appointment.updatedAt = new Date();
    
    // Add response details
    appointment.responseMessage = message;
    appointment.respondedAt = new Date();

    // ✅ FIXED: Use .save() instead of custom method
    await appointment.save();

    console.log(`✅ Appointment ${appointmentId} ${newStatus} successfully`);

    return {
      success: true,
      appointment
    };

  } catch (error) {
    console.error(`❌ Error responding to appointment ${appointmentId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const cancelAppointment = async (appointmentId, cancelledBy, reason = '') => {
  try {
    console.log(`❌ Cancelling appointment: ${appointmentId}`);

    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId },
        { _id: mongoose.Types.ObjectId.isValid(appointmentId) ? appointmentId : null }
      ]
    });

    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return {
        success: false,
        error: `Cannot cancel appointment with status: ${appointment.status}`
      };
    }

    await appointment.cancelAppointment(cancelledBy, reason);
    await appointment.populate('patient doctor');

    return {
      success: true,
      appointment
    };

  } catch (error) {
    console.error(`❌ Error cancelling appointment ${appointmentId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export all functions
export default {
  createAppointment,
  getallappointments,
  getdoctorsappointments,
  getpatientappointments,
  getappointment,
  updateAppointmentStatus,
  searchappointments,
  getAppointmentStats,
  respondToAppointment,
  cancelAppointment
};