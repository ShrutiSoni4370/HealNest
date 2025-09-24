// routes/doctorRoutes.js
import {
  registerDoctorController,
  loginDoctorController,
  getalldoctorsControllers,
  appointmentsController,
  getappointmentsController,
  getallappointmentsController,
  getdoctorbyidcontroller,
  getpatientappointmentsController,
  getdoctorappointmentsController,
  updateAppointmentStatusController,
  respondToAppointmentController,
  cancelAppointmentController,
  searchAppointmentsController,
  getAppointmentStatsController,
  getFilteredAppointmentsController
} from '../controllers/doctorcontroller.js';

import express from 'express';
const router = express.Router();

// ✅ Doctor Authentication & Management Routes
router.post('/doctorregister', registerDoctorController);
router.post('/doctorlogin', loginDoctorController);
router.get('/getdoctors', getalldoctorsControllers);
router.get('/getdoctorbyid/:id', getdoctorbyidcontroller); // ✅ Fixed path syntax

// ✅ Appointment CRUD Routes
router.post('/appointments', appointmentsController); // Create appointment
router.get('/getallappointments', getallappointmentsController); // Get all appointments
router.get('/getappointments/:id', getappointmentsController); // Get single appointment by ID

// ✅ User-specific Appointment Routes
router.get('/getdoctorappointments/:doctorId', getdoctorappointmentsController); // Get doctor's appointments
router.get('/getpatientappointments/:patientId', getpatientappointmentsController); // ✅ Fixed path syntax and name

// ✅ Appointment Management Routes
router.put('/appointments/:appointmentId/status', updateAppointmentStatusController); // Update appointment status
router.post('/appointments/:appointmentId/respond', respondToAppointmentController); // Doctor accept/reject
router.post('/appointments/:appointmentId/cancel', cancelAppointmentController); // Cancel appointment

// ✅ Advanced Appointment Routes
router.post('/appointments/search', searchAppointmentsController); // Search appointments
router.post('/appointments/filtered', getFilteredAppointmentsController); // Get filtered appointments
router.get('/appointments/stats', getAppointmentStatsController); // Get appointment statistics

// ✅ Additional useful routes for healthcare management
router.get('/appointments/doctor/:doctorId/pending', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await getdoctorappointmentsController({ params: { doctorId }, query: { status: 'pending' } }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pending appointments' });
  }
});

router.get('/appointments/patient/:patientId/upcoming', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await getpatientappointmentsController({ params: { patientId }, query: { upcoming: true } }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get upcoming appointments' });
  }
});

// ✅ Appointment status-based routes
router.get('/appointments/status/pending', async (req, res) => {
  try {
    const result = await getallappointmentsController({ query: { status: 'pending' } }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pending appointments' });
  }
});

router.get('/appointments/status/confirmed', async (req, res) => {
  try {
    const result = await getallappointmentsController({ query: { status: 'confirmed' } }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get confirmed appointments' });
  }
});

router.get('/appointments/status/completed', async (req, res) => {
  try {
    const result = await getallappointmentsController({ query: { status: 'completed' } }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get completed appointments' });
  }
});

// ✅ Appointment date-based routes
router.get('/appointments/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const result = await getallappointmentsController({ 
      query: { 
        startDate: startOfDay.toISOString(), 
        endDate: endOfDay.toISOString() 
      } 
    }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get today\'s appointments' });
  }
});

router.get('/appointments/week', async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const result = await getallappointmentsController({ 
      query: { 
        startDate: startOfWeek.toISOString(), 
        endDate: endOfWeek.toISOString() 
      } 
    }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get this week\'s appointments' });
  }
});

// ✅ Bulk operations routes
router.post('/appointments/bulk/cancel', async (req, res) => {
  try {
    const { appointmentIds, reason } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'appointmentIds array is required' 
      });
    }

    const results = [];
    for (const appointmentId of appointmentIds) {
      try {
        const result = await cancelAppointmentController({ 
          params: { appointmentId }, 
          body: { cancelledBy: 'system', reason } 
        }, res);
        results.push({ appointmentId, success: true });
      } catch (error) {
        results.push({ appointmentId, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Bulk cancel failed' });
  }
});

// ✅ Healthcare-specific routes
router.get('/doctors/specialization/:specialization', async (req, res) => {
  try {
    const { specialization } = req.params;
    // This would need a specialized function in your service
    res.json({ 
      success: true, 
      message: `Doctors with specialization: ${specialization}`,
      note: 'This endpoint needs implementation in the service layer'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get doctors by specialization' });
  }
});

router.get('/doctors/available', async (req, res) => {
  try {
    const { date, time } = req.query;
    // This would need a specialized function to check doctor availability
    res.json({ 
      success: true, 
      message: `Available doctors for ${date} at ${time}`,
      note: 'This endpoint needs implementation in the service layer'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get available doctors' });
  }
});

// ✅ Analytics and reporting routes
router.get('/analytics/appointments/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : new Date().getMonth(), 1);
    const endDate = new Date(year || new Date().getFullYear(), month ? month : new Date().getMonth() + 1, 0);
    
    const result = await getallappointmentsController({ 
      query: { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      } 
    }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get monthly analytics' });
  }
});

router.get('/analytics/doctors/performance', async (req, res) => {
  try {
    const stats = await getAppointmentStatsController(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get doctor performance analytics' });
  }
});

// ✅ Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Doctor service is healthy', 
    timestamp: new Date().toISOString(),
    service: 'HealNest Doctor & Appointment Management'
  });
});

// ✅ API documentation route
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'HealNest Doctor & Appointment API Documentation',
    endpoints: {
      doctors: {
        'POST /doctorregister': 'Register a new doctor',
        'POST /doctorlogin': 'Doctor login',
        'GET /getdoctors': 'Get all doctors',
        'GET /getdoctorbyid/:id': 'Get doctor by ID',
        'GET /doctors/specialization/:specialization': 'Get doctors by specialization',
        'GET /doctors/available': 'Get available doctors'
      },
      appointments: {
        'POST /appointments': 'Create new appointment',
        'GET /getallappointments': 'Get all appointments',
        'GET /getappointments/:id': 'Get appointment by ID',
        'GET /getdoctorappointments/:doctorId': 'Get doctor appointments',
        'GET /getpatientappointments/:patientId': 'Get patient appointments',
        'PUT /appointments/:appointmentId/status': 'Update appointment status',
        'POST /appointments/:appointmentId/respond': 'Doctor respond to appointment',
        'POST /appointments/:appointmentId/cancel': 'Cancel appointment',
        'POST /appointments/search': 'Search appointments',
        'POST /appointments/filtered': 'Get filtered appointments',
        'GET /appointments/stats': 'Get appointment statistics'
      },
      analytics: {
        'GET /analytics/appointments/monthly': 'Monthly appointment analytics',
        'GET /analytics/doctors/performance': 'Doctor performance analytics'
      }
    },
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  });
});

export default router;
