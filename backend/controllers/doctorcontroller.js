// controllers/doctorController.js
import {
  registerDoctor,
  loginDoctor,
  getalldoctors,
  getDoctorById,
  // ✅ Import all appointment functions from doctorservice.js
  createAppointment,
  getallappointments,
  getdoctorsappointments,
  getpatientappointments,
  getappointment,
  updateAppointmentStatus,
  respondToAppointment,
  cancelAppointment,
  searchappointments,
  getAppointmentStats
} from '../service/doctorservice.js';

import { validationResult } from 'express-validator';

// ✅ Helper function for validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  return null;
};

// ✅ Register doctor
export const registerDoctorController = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const doctorData = req.body;
    console.log('📝 Registering doctor:', doctorData.contactInfo?.email);
    
    const result = await registerDoctor(doctorData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Doctor registered successfully',
        data: result.data,
        token: result.token
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Register Doctor Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Login doctor
export const loginDoctorController = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { email, password } = req.body;
    console.log('🔐 Doctor login attempt:', email);
    
    const result = await loginDoctor(email, password);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result.data,
        token: result.token
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Login Doctor Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get all doctors
export const getalldoctorsControllers = async (req, res) => {
  try {
    console.log('🔍 Fetching all doctors');
    
    const doctors = await getalldoctors();
    
    if (doctors.success) {
      res.status(200).json({
        success: true,
        message: 'Doctors fetched successfully',
        ...doctors
      });
    } else {
      res.status(500).json({
        success: false,
        error: doctors.error || 'Failed to fetch doctors'
      });
    }
  } catch (error) {
    console.error('❌ Get All Doctors Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Create appointment (using createAppointment from doctorservice.js)
export const appointmentsController = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const appointmentData = req.body;
    console.log('📝 Creating appointment:', appointmentData);
    
    const result = await createAppointment(appointmentData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Create Appointment Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get single appointment by ID (using getappointment from doctorservice.js)
export const getappointmentsController = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    console.log('🔍 Fetching appointment:', id);
    
    const result = await getappointment(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointment fetched successfully',
        appointment: result.appointment
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Appointment not found'
      });
    }
  } catch (error) {
    console.error('❌ Get Appointment Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get all appointments (using getallappointments from doctorservice.js)
export const getallappointmentsController = async (req, res) => {
  try {
    const filters = req.query;
    console.log('🔍 Fetching all appointments with filters:', filters);
    
    const result = await getallappointments(filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointments fetched successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch appointments'
      });
    }
  } catch (error) {
    console.error('❌ Get All Appointments Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get doctor by ID
export const getdoctorbyidcontroller = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID is required'
      });
    }

    console.log('🔍 Fetching doctor by ID:', id);
    
    const result = await getDoctorById(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Doctor fetched successfully',
        data: result.doctor
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Doctor not found'
      });
    }
  } catch (error) {
    console.error('❌ Get Doctor By ID Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get patient appointments (using getpatientappointments from doctorservice.js)
export const getpatientappointmentsController = async (req, res) => {
  try {
    const { patientId } = req.params;
    const filters = req.query;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
    }

    console.log('🔍 Fetching appointments for patient:', patientId);
    
    const result = await getpatientappointments(patientId, filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Patient appointments fetched successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch patient appointments'
      });
    }
  } catch (error) {
    console.error('❌ Get Patient Appointments Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get doctor appointments (using getdoctorsappointments from doctorservice.js)
export const getdoctorappointmentsController = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const filters = req.query;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID is required'
      });
    }

    console.log('🔍 Fetching appointments for doctor:', doctorId);
    
    const result = await getdoctorsappointments(doctorId, filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Doctor appointments fetched successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch doctor appointments'
      });
    }
  } catch (error) {
    console.error('❌ Get Doctor Appointments Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Update appointment status (using updateAppointmentStatus from doctorservice.js)
export const updateAppointmentStatusController = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, ...additionalData } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    console.log('📝 Updating appointment status:', appointmentId, 'to', status);
    
    const result = await updateAppointmentStatus(appointmentId, status, additionalData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointment status updated successfully',
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Update Appointment Status Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Respond to appointment (using respondToAppointment from doctorservice.js)
export const respondToAppointmentController = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { accepted, message } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Accepted field is required and must be boolean'
      });
    }

    console.log(`${accepted ? '✅' : '❌'} Responding to appointment:`, appointmentId);
    
    const result = await respondToAppointment(appointmentId, accepted, message);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Appointment ${accepted ? 'accepted' : 'rejected'} successfully`,
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Respond to Appointment Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Cancel appointment (using cancelAppointment from doctorservice.js)
export const cancelAppointmentController = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancelledBy, reason } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    if (!cancelledBy) {
      return res.status(400).json({
        success: false,
        error: 'CancelledBy field is required'
      });
    }

    const validCancelledBy = ['patient', 'doctor', 'system'];
    if (!validCancelledBy.includes(cancelledBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid cancelledBy. Must be one of: ${validCancelledBy.join(', ')}`
      });
    }

    console.log('❌ Cancelling appointment:', appointmentId, 'by:', cancelledBy);
    
    const result = await cancelAppointment(appointmentId, cancelledBy, reason);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Cancel Appointment Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Search appointments (using searchappointments from doctorservice.js)
export const searchAppointmentsController = async (req, res) => {
  try {
    const searchCriteria = req.body;
    console.log('🔍 Searching appointments with criteria:', searchCriteria);
    
    const result = await searchappointments(searchCriteria);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointments search completed successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Search failed'
      });
    }
  } catch (error) {
    console.error('❌ Search Appointments Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get appointment statistics (using getAppointmentStats from doctorservice.js)
export const getAppointmentStatsController = async (req, res) => {
  try {
    console.log('📊 Fetching appointment statistics');
    
    const result = await getAppointmentStats();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Appointment statistics fetched successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch statistics'
      });
    }
  } catch (error) {
    console.error('❌ Get Appointment Stats Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};

// ✅ Get filtered appointments (using getallappointments from doctorservice.js)
export const getFilteredAppointmentsController = async (req, res) => {
  try {
    const filters = req.body;
    console.log('🔍 Getting filtered appointments:', filters);
    
    const result = await getallappointments(filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Filtered appointments fetched successfully',
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch filtered appointments'
      });
    }
  } catch (error) {
    console.error('❌ Get Filtered Appointments Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
};
