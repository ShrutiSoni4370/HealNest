// authService.js
import { api, aiApi , moodApi , doctorApi} from "./api";

// Register user
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/register", userData);
    console.log("Registration Success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Registration Error:", err.response?.data || err.message);
    throw err;
  }
};

// Generate email OTP
export const generateEmailOtp = async (email) => {
  try {
    const response = await api.post("/generate-email-otp", { email });
    console.log("Email OTP Generation Success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Email OTP Error:", err.response?.data || err.message);
    throw err;
  }
};

// Generate phone OTP
export const generatePhoneOtp = async (phoneNumber) => {
  try {
    const response = await api.post("/generate-phone-otp", { phoneNumber });
    console.log("Phone OTP Generation Success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Phone OTP Error:", err.response?.data || err.message);
    throw err;
  }
};

// Verify email OTP
export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await api.post("/verify-email-otp", { email, otp });
    console.log("Email OTP Verification Success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Email OTP Verification Error:", err.response?.data || err.message);
    throw err;
  }
};

// Verify phone OTP
export const verifyPhoneOtp = async (phoneNumber, otp) => {
  try {
    const response = await api.post("/verify-phone-otp", { phoneNumber, otp });
    console.log("Phone OTP Verification Success:", response.data);
    return response.data;
  } catch (err) {
    console.error("Phone OTP Verification Error:", err.response?.data || err.message);
    throw err;
  }
};

// Login user - ENHANCED with token storage

// authService.js - FIXED loginUser function
// authService.js - FIXED loginUser function
export const loginUser = async (credentials) => {
  try {
    console.log('🔑 Login request with:', credentials);
    const response = await api.post("/login", credentials);
    console.log("📥 Login response:", response.data);
    
    const result = response.data;
    
    // ✅ FIXED: Check for token directly (not result.success)
    if (result.token && result.message === 'Login successful') {
      console.log('💾 Storing token and user data...');
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      // Verify storage immediately
      const stored = localStorage.getItem('token');
      console.log('🔍 Storage verification:', stored ? 'SUCCESS' : 'FAILED');
      
    } else {
      console.error('❌ Invalid response structure:', result);
    }
    
    return result;
    
  } catch (err) {
    console.error("❌ Login Error:", err.response?.data || err.message);
    throw err;
  }
};




// SIMPLIFIED: AI Calmi (token added automatically by interceptor)
export const aicalmi = async (message) => {
  try {
    const response = await aiApi.post("/calmi", { message });
    console.log("AI Calmi Success:", response.data);
    return response.data.response;
  } catch (error) {
    console.error("AI Calmi Error:", error.response?.data || error.message);
    throw error;
  }
};

// SIMPLIFIED: Get online users (token added automatically)
export const getonlineusers = async () => {
  try {
    const response = await api.post("/getonlineusers");
    console.log("Get Online Users Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Online Users Error:", error.response?.data || error.message);
    throw error;
  }
};

// SIMPLIFIED: Get all users (token added automatically)
export const getAllUsers = async () => {
  try {
    const response = await api.post("/getallusers");
    console.log("Get All Users Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Users Error:", error.response?.data || error.message);
    throw error;
  }
};

// SIMPLIFIED: Fetch reports (token added automatically)
// authService.js - FIXED fetchReports function
export const fetchReports = async (data) => {
  try {
    console.log('🔍 fetchReports called with:', data);
    
    // ✅ FIXED: Use GET with params instead of POST with body
    const response = await aiApi.get("/fetchreports", { 
      params: data // Send userId as query parameter
    });
    
    console.log("Fetch Reports Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Fetch Reports Error:", error.response?.data || error.message);
    throw error;
  }
};


// SIMPLIFIED: Generate report (token added automatically)
export const generateReport = async (data) => {
  try {
    const response = await aiApi.post("/generatereport", data);
    console.log("Generate Report Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Generate Report Error:", error.response?.data || error.message);
    throw error;
  }
};

// SIMPLIFIED: Get report by ID (token added automatically)
export const getReportById = async (data) => {
  try {
    const reportId = data.reportId || data; // Handle both formats
    
    console.log('🔍 getReportById called with reportId:', reportId);
    
    // ✅ CHANGED: Use POST request with body data (matches your backend)
    const response = await aiApi.post("/getreportbyid", { 
      reportId // This sends in request body: { reportId: "68c43bc714..." }
    });
    
    console.log("✅ Get Report By ID Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Get Report By ID Error:", error.response?.data || error.message);
    throw error;
  }
};



// ADD: Logout function
export const logout = () => {
  console.log("🚪 Logging out user...");
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  console.log("✅ Token and user data cleared from localStorage");

  // Redirect to login page
  window.location.href = '/login';
};

// ADD: Check if user is logged in
export const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// ADD: Get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('userData');
    return null;
  }
};

export const getquestions = async () => {
  try {
    const response = await moodApi.get("/questions");
    console.log("Get Questions Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Questions Error:", error.response?.data || error.message);
    throw error;
  }
};

export const analyzemood = async (responses) => {
  try {
    const response = await moodApi.post("/analyze", { responses });
    console.log("Analyze Mood Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Analyze Mood Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getmoodhistory = async (params) => {
  try {
    const response = await moodApi.get("/history", { params });
    console.log("Get Mood History Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Mood History Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getmoodreport = async (reportId) => {
  try {
    const response = await moodApi.get(`/report/${reportId}`);
    console.log("Get Mood Report Success:", response.data);
    return response.data;
  }catch (error) {
    console.error("Get Mood Report Error:", error.response?.data || error.message);
    throw error;
  }
};



export const getmoodanalytics = async (params) => {
  try {
    const response = await moodApi.get("/analytics", { params });
    console.log("Get Mood Analytics Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Mood Analytics Error:", error.response?.data || error.message);
    throw error;
  }
};


  export const deletereport = async (reportId) => {
    try {
      const response = await moodApi.delete(`/report/${reportId}`);
      console.log("Delete Report Success:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete Report Error:", error.response?.data || error.message);
      throw error;
    }
  };


// services/authService.js

export const doctorregister = async (doctorData) => {
  try {
    const response = await doctorApi.post("/doctorregister", doctorData); // Changed from PUT to POST
    console.log("Doctor Registration Success:", response.data);
    
    // Return the response data directly - don't throw error on success
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Registration successful'
    };
  } catch (error) {
    console.error("Doctor Registration Error:", error.response?.data || error.message);
    // Only throw the error, don't modify it
    throw error;
  }
};


 // services/authService.js - Fix the doctorlogin function
export const doctorlogin = async (credentials) => {
  try {
    console.log("🔐 Doctor login API call...");
    const response = await doctorApi.post("/doctorlogin", credentials);
    console.log("✅ Doctor login response:", response.data);

    const result = response.data;

    // ✅ Handle the actual response structure from your backend
    if (result.token) {
      console.log('💾 Storing doctor token and data...');
      
      localStorage.setItem('doctorToken', result.token);
      localStorage.setItem('doctorData', JSON.stringify(result.data)); // Use result.data
      localStorage.setItem('doctorId', result.data?._id);
      
      console.log('✅ Doctor token and data stored in localStorage');
      
      // Return in expected format for your frontend
      return {
        token: result.token,
        message: 'Login successful', // Add the expected message
        doctor: result.data, // Map result.data to doctor
        user: result.data    // Also map to user for compatibility
      };
    } else {
      console.error('❌ No token in doctor login response:', result);
      throw new Error('No token received from server');
    }

  } catch (error) {
    console.error("❌ Doctor Login Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllDoctors = async () => {
  try {
    const response = await doctorApi.get("/getdoctors");
    return response.data;
  } catch (error) {
    console.error("Get All Doctors Error:", error.response?.data || error.message);
    throw error;
  }
};



export const getuserbyid = async () => {
  try {
    // Get userId from localStorage userData
    const userData = localStorage.getItem('userData');
    const userId = userData ? JSON.parse(userData)._id : null;
    if (!userId) {
      throw new Error('Doctor ID not found in localStorage');
    }
    const response = await api.get(`/getuserbyid/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get User By ID Error:", error.response?.data || error.message);
    throw error;
  }
}


// services/appointmentService.js

// ===== APPOINTMENT CRUD =====
export const createAppointment = async (appointmentData) => {
  try {
    const response = await doctorApi.post("/appointments", appointmentData);
    console.log("Create Appointment Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Create Appointment Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllAppointments = async () => {
  try {
    const response = await doctorApi.get("/getallappointments");
    console.log("Get All Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAppointmentById = async (appointmentId) => {
  try {
    const response = await doctorApi.get(`/getappointments/${appointmentId}`);
    console.log("Get Appointment By ID Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Appointment By ID Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== USER-SPECIFIC APPOINTMENTS =====
export const getDoctorAppointments = async (doctorId) => {
  try {
    const response = await doctorApi.get(`/getdoctorappointments/${doctorId}`);
    console.log("Get Doctor Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Doctor Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getPatientAppointments = async (patientId) => {
  try {
    const response = await doctorApi.get(`/getpatientappointments/${patientId}`);
    console.log("Get Patient Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Patient Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== APPOINTMENT MANAGEMENT =====
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await doctorApi.put(`/appointments/${appointmentId}/status`, { status });
    console.log("Update Appointment Status Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Update Appointment Status Error:", error.response?.data || error.message);
    throw error;
  }
};

export const respondToAppointment = async (appointmentId, response, notes = '') => {
  try {
    const responseData = await doctorApi.post(`/appointments/${appointmentId}/respond`, {
      response,
      notes
    });
    console.log("Respond To Appointment Success:", responseData.data);
    return responseData.data;
  } catch (error) {
    console.error("Respond To Appointment Error:", error.response?.data || error.message);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId, reason, cancelledBy = 'patient') => {
  try {
    const response = await doctorApi.post(`/appointments/${appointmentId}/cancel`, {
      reason,
      cancelledBy
    });
    console.log("Cancel Appointment Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Cancel Appointment Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== ADVANCED APPOINTMENT FEATURES =====
export const searchAppointments = async (searchCriteria) => {
  try {
    const response = await doctorApi.post("/appointments/search", searchCriteria);
    console.log("Search Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Search Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getFilteredAppointments = async (filterCriteria) => {
  try {
    const response = await doctorApi.post("/appointments/filtered", filterCriteria);
    console.log("Get Filtered Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Filtered Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAppointmentStats = async () => {
  try {
    const response = await doctorApi.get("/appointments/stats");
    console.log("Get Appointment Stats Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Appointment Stats Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== STATUS-BASED APPOINTMENTS =====
export const getPendingAppointments = async () => {
  try {
    const response = await doctorApi.get("/appointments/status/pending");
    console.log("Get Pending Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Pending Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getConfirmedAppointments = async () => {
  try {
    const response = await doctorApi.get("/appointments/status/confirmed");
    console.log("Get Confirmed Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Confirmed Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getCompletedAppointments = async () => {
  try {
    const response = await doctorApi.get("/appointments/status/completed");
    console.log("Get Completed Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Completed Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== DATE-BASED APPOINTMENTS =====
export const getTodaysAppointments = async () => {
  try {
    const response = await doctorApi.get("/appointments/today");
    console.log("Get Today's Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Today's Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getWeeklyAppointments = async () => {
  try {
    const response = await doctorApi.get("/appointments/week");
    console.log("Get Weekly Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Weekly Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== BULK OPERATIONS =====
export const bulkCancelAppointments = async (appointmentIds, reason) => {
  try {
    const response = await doctorApi.post("/appointments/bulk/cancel", {
      appointmentIds,
      reason
    });
    console.log("Bulk Cancel Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Bulk Cancel Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== SPECIALIZED APPOINTMENT QUERIES =====
export const getDoctorPendingAppointments = async (doctorId) => {
  try {
    const response = await doctorApi.get(`/appointments/doctor/${doctorId}/pending`);
    console.log("Get Doctor Pending Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Doctor Pending Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getPatientUpcomingAppointments = async (patientId) => {
  try {
    const response = await doctorApi.get(`/appointments/patient/${patientId}/upcoming`);
    console.log("Get Patient Upcoming Appointments Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Patient Upcoming Appointments Error:", error.response?.data || error.message);
    throw error;
  }
};


// services/analyticsService.js

// ===== APPOINTMENT ANALYTICS =====
export const getMonthlyAppointmentAnalytics = async (year, month) => {
  try {
    const response = await doctorApi.get("/analytics/appointments/monthly", {
      params: { year, month }
    });
    console.log("Get Monthly Appointment Analytics Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Monthly Appointment Analytics Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getDoctorPerformanceAnalytics = async () => {
  try {
    const response = await doctorApi.get("/analytics/doctors/performance");
    console.log("Get Doctor Performance Analytics Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Doctor Performance Analytics Error:", error.response?.data || error.message);
    throw error;
  }
};

// ===== SYSTEM HEALTH =====
export const checkSystemHealth = async () => {
  try {
    const response = await doctorApi.get("/health");
    console.log("System Health Check Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("System Health Check Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getApiDocumentation = async () => {
  try {
    const response = await doctorApi.get("/docs");
    console.log("Get API Documentation Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get API Documentation Error:", error.response?.data || error.message);
    throw error;
  }
};



// ADD: Get current token
export const getCurrentToken = () => {
  return localStorage.getItem('token');
};


export const getCurrentDoctorToken = () => {
  return localStorage.getItem('doctorToken');
}

