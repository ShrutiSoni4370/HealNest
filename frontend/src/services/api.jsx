// import axios from "axios";

// export const api = axios.create({
//   baseURL: "http://localhost:3000/users",
//   headers: { "Content-Type": "application/json" },
// });

// export const aiApi = axios.create({
//   baseURL: "http://localhost:3000/ai",
//   headers: { "Content-Type": "application/json" },
// });

// export const moodApi = axios.create({
//   baseURL: "http://localhost:3000/mood",
//   headers: { "Content-Type": "application/json" },
// });

// export const doctorApi = axios.create({
//   baseURL: "http://localhost:3000/doctor",
//   headers: { "Content-Type": "application/json" },
// });

// // Enhanced request interceptor for aiApi
// aiApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     console.log("🤖 AI-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
//     console.log("🤖 AI-API Request:", config.method?.toUpperCase(), config.url);
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log("✅ AI-API Authorization header set");
//     } else {
//       console.log("❌ AI-API No token found in localStorage");
//       console.log("📋 Available localStorage keys:", Object.keys(localStorage));
//     }
    
//     return config;
//   },
//   (error) => {
//     console.error("❌ AI-API Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// // Enhanced request interceptor for api
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     console.log("👤 USER-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
//     console.log("👤 USER-API Request:", config.method?.toUpperCase(), config.url);
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log("✅ USER-API Authorization header set");
//     } else {
//       console.log("❌ USER-API No token found in localStorage");
//       console.log("📋 Available localStorage keys:", Object.keys(localStorage));
//     }
    
//     return config;
//   },
//   (error) => {
//     console.error("❌ USER-API Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// moodApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     console.log("😊 MOOD-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
//     console.log("😊 MOOD-API Request:", config.method?.toUpperCase(), config.url);
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log("✅ MOOD-API Authorization header set");
//     } else {
//       console.log("❌ MOOD-API No token found in localStorage");
//       console.log("📋 Available localStorage keys:", Object.keys(localStorage));
//     }
//     return config;
//   },
//   (error) => {
//     console.error("❌ MOOD-API Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// doctorApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     console.log("👨‍⚕️ DOCTOR-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
//     console.log("👨‍⚕️ DOCTOR-API Request:", config.method?.toUpperCase(), config.url);
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log("✅ DOCTOR-API Authorization header set");
//     }
//     else {
//       console.log("❌ DOCTOR-API No token found in localStorage");
//       console.log("📋 Available localStorage keys:", Object.keys(localStorage));
//     }
//     return config;
//   },
//   (error) => {
//     console.error("❌ DOCTOR-API Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// // Enhanced response error handler
// const handleAuthError = (apiName) => (error) => {
//   console.log(`🔍 ${apiName} Response Error:`, error.response?.status, error.response?.data?.message);
  
//   if (error.response?.status === 401) {
//     const errorData = error.response.data;
    
//     // Handle specific auth error codes from your enhanced middleware
//     const forceLogoutCodes = [
//       'ACCOUNT_DELETED',
//       'TOKEN_EXPIRED', 
//       'INVALID_TOKEN',
//       'BLACKLISTED_TOKEN',
//       'NO_TOKEN'
//     ];
    
//     if (forceLogoutCodes.includes(errorData.code)) {
//       console.log(`🚪 ${apiName} Auth issue detected:`, errorData.code, '-', errorData.message);
      
//       // Clear stored data
//       localStorage.removeItem('token');
//       localStorage.removeItem('userData');
      
//       // Show appropriate message based on error
//       let userMessage = 'Please log in again.';
      
//       switch (errorData.code) {
//         case 'ACCOUNT_DELETED':
//           userMessage = '⚠️ Your account was updated. Please log in again.';
//           break;
//         case 'TOKEN_EXPIRED':
//           userMessage = '⏰ Your session has expired. Please log in again.';
//           break;
//         case 'BLACKLISTED_TOKEN':
//           userMessage = '🔒 Your session is no longer valid. Please log in again.';
//           break;
//         case 'INVALID_TOKEN':
//           userMessage = '🔐 Authentication error. Please log in again.';
//           break;
//         default:
//           userMessage = 'Please log in again.';
//       }
      
//       // Show user-friendly notification
//       alert(userMessage);
//       window.location.href = '/login';
      
//       // Return a resolved promise to prevent further error propagation
//       return Promise.resolve({
//         data: {
//           success: false,
//           message: userMessage,
//           redirected: true
//         }
//       });
//     } else {
//       // Handle generic 401 errors (like "No Bearer token found")
//       console.log(`🚪 ${apiName} Generic 401 error - redirecting to login`);
//       localStorage.removeItem('token');
//       localStorage.removeItem('userData');
//       alert('Your session has expired. Please log in again.');
//       window.location.href = '/login';
      
//       return Promise.resolve({
//         data: {
//           success: false,
//           message: 'Session expired',
//           redirected: true
//         }
//       });
//     }
//   }
  
//   return Promise.reject(error);
// };

// // Apply response interceptors with different names for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log("✅ USER-API Response:", response.status, response.config.url);
//     return response;
//   },
//   handleAuthError('USER-API')
// );

// aiApi.interceptors.response.use(
//   (response) => {
//     console.log("✅ AI-API Response:", response.status, response.config.url);
//     return response;
//   },
//   handleAuthError('AI-API')
// );

// moodApi.interceptors.response.use(
//   (response) => {
//     console.log("✅ MOOD-API Response:", response.status, response.config.url);
//     return response;
//   },
//   handleAuthError('MOOD-API')
// );

// // Enhanced authentication check
// export const isAuthenticated = () => {
//   const token = localStorage.getItem('token');
//   const hasToken = !!token;
//   console.log('🔍 Auth Check:', hasToken ? `Authenticated (${token.length} chars)` : 'Not authenticated');
//   return hasToken;
// };

// // Enhanced user data retrieval
// export const getCurrentUser = () => {
//   try {
//     const userData = localStorage.getItem('userData');
//     const parsed = userData ? JSON.parse(userData) : null;
//     console.log('🔍 Current User:', parsed ? `Found (${parsed.firstName} ${parsed.lastName})` : 'Not found');
//     return parsed;
//   } catch (error) {
//     console.error('Error parsing user data:', error);
//     localStorage.removeItem('userData');
//     return null;
//   }
// };

// // Force logout with debugging
// export const forceLogout = (message = 'Session ended') => {
//   console.log('🚪 Force logout triggered:', message);
//   localStorage.removeItem('token');
//   localStorage.removeItem('userData');
//   window.location.href = '/login';
// };

// // Add debugging utility
// export const debugAuth = () => {
//   const token = localStorage.getItem('token');
//   const userData = localStorage.getItem('userData');
  
//   console.log('🔍 Auth Debug Report:', {
//     token: {
//       exists: !!token,
//       length: token?.length || 0,
//       preview: token?.substring(0, 20) + '...' || 'none'
//     },
//     userData: {
//       exists: !!userData,
//       parsed: userData ? JSON.parse(userData) : null
//     },
//     allLocalStorageKeys: Object.keys(localStorage)
//   });
// };

// export default { api, aiApi, moodApi ,forceLogout, isAuthenticated, getCurrentUser, debugAuth };


// services/authService.js

import axios from "axios";

const API_BASE_URL =  "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: { "Content-Type": "application/json" },
});

export const aiApi = axios.create({
  baseURL: `${API_BASE_URL}/ai`,
  headers: { "Content-Type": "application/json" },
});

export const moodApi = axios.create({
  baseURL: `${API_BASE_URL}/mood`,
  headers: { "Content-Type": "application/json" },
});

export const doctorApi = axios.create({
  baseURL: `${API_BASE_URL}/doctor`,
  headers: { "Content-Type": "application/json" },
});


// Enhanced request interceptor for aiApi
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("🤖 AI-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
    console.log("🤖 AI-API Request:", config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ AI-API Authorization header set");
    } else {
      console.log("❌ AI-API No token found in localStorage");
      console.log("📋 Available localStorage keys:", Object.keys(localStorage));
    }
    
    return config;
  },
  (error) => {
    console.error("❌ AI-API Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced request interceptor for api
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("👤 USER-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
    console.log("👤 USER-API Request:", config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ USER-API Authorization header set");
    } else {
      console.log("❌ USER-API No token found in localStorage");
      console.log("📋 Available localStorage keys:", Object.keys(localStorage));
    }
    
    return config;
  },
  (error) => {
    console.error("❌ USER-API Request interceptor error:", error);
    return Promise.reject(error);
  }
);

moodApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("😊 MOOD-API Interceptor - Token from localStorage:", token ? `Found (${token.length} chars)` : "Not found");
    console.log("😊 MOOD-API Request:", config.method?.toUpperCase(), config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ MOOD-API Authorization header set");
    } else {
      console.log("❌ MOOD-API No token found in localStorage");
      console.log("📋 Available localStorage keys:", Object.keys(localStorage));
    }
    return config;
  },
  (error) => {
    console.error("❌ MOOD-API Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// DOCTOR API INTERCEPTORS - Using doctorToken
doctorApi.interceptors.request.use(
  (config) => {
    const doctorToken = localStorage.getItem("doctorToken");
    console.log("👨‍⚕️ DOCTOR-API Interceptor - Doctor Token from localStorage:", doctorToken ? `Found (${doctorToken.length} chars)` : "Not found");
    console.log("👨‍⚕️ DOCTOR-API Request:", config.method?.toUpperCase(), config.url);
    
    if (doctorToken) {
      config.headers.Authorization = `Bearer ${doctorToken}`;
      console.log("✅ DOCTOR-API Authorization header set with doctor token");
    } else {
      console.log("❌ DOCTOR-API No doctor token found in localStorage");
      console.log("📋 Available localStorage keys:", Object.keys(localStorage));
    }
    return config;
  },
  (error) => {
    console.error("❌ DOCTOR-API Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response error handler for user APIs
const handleAuthError = (apiName) => (error) => {
  console.log(`🔍 ${apiName} Response Error:`, error.response?.status, error.response?.data?.message);
  
  if (error.response?.status === 401) {
    const errorData = error.response.data;
    
    // Handle specific auth error codes from your enhanced middleware
    const forceLogoutCodes = [
      'ACCOUNT_DELETED',
      'TOKEN_EXPIRED', 
      'INVALID_TOKEN',
      'BLACKLISTED_TOKEN',
      'NO_TOKEN'
    ];
    
    if (forceLogoutCodes.includes(errorData.code)) {
      console.log(`🚪 ${apiName} Auth issue detected:`, errorData.code, '-', errorData.message);
      
      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      
      // Show appropriate message based on error
      let userMessage = 'Please log in again.';
      
      switch (errorData.code) {
        case 'ACCOUNT_DELETED':
          userMessage = '⚠️ Your account was updated. Please log in again.';
          break;
        case 'TOKEN_EXPIRED':
          userMessage = '⏰ Your session has expired. Please log in again.';
          break;
        case 'BLACKLISTED_TOKEN':
          userMessage = '🔒 Your session is no longer valid. Please log in again.';
          break;
        case 'INVALID_TOKEN':
          userMessage = '🔐 Authentication error. Please log in again.';
          break;
        default:
          userMessage = 'Please log in again.';
      }
      
      // Show user-friendly notification
      alert(userMessage);
      window.location.href = '/login';
      
      // Return a resolved promise to prevent further error propagation
      return Promise.resolve({
        data: {
          success: false,
          message: userMessage,
          redirected: true
        }
      });
    } else {
      // Handle generic 401 errors (like "No Bearer token found")
      console.log(`🚪 ${apiName} Generic 401 error - redirecting to login`);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
      
      return Promise.resolve({
        data: {
          success: false,
          message: 'Session expired',
          redirected: true
        }
      });
    }
  }
  
  return Promise.reject(error);
};

// Enhanced response error handler for doctor API
const handleDoctorAuthError = (error) => {
  console.log(`🔍 DOCTOR-API Response Error:`, error.response?.status, error.response?.data?.message);
  
  if (error.response?.status === 401) {
    const errorData = error.response.data || {};
    
    // Handle doctor-specific auth error codes
    const forceLogoutCodes = [
      'DOCTOR_ACCOUNT_SUSPENDED',
      'DOCTOR_TOKEN_EXPIRED', 
      'INVALID_DOCTOR_TOKEN',
      'DOCTOR_ACCOUNT_DEACTIVATED',
      'NO_DOCTOR_TOKEN'
    ];
    
    if (forceLogoutCodes.includes(errorData.code)) {
      console.log(`🚪 DOCTOR-API Auth issue detected:`, errorData.code, '-', errorData.message);
      
      // Clear doctor-specific stored data
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('doctorData');
      localStorage.removeItem('doctorId');
      
      // Show appropriate message based on error
      let userMessage = 'Please log in again.';
      
      switch (errorData.code) {
        case 'DOCTOR_ACCOUNT_SUSPENDED':
          userMessage = '⚠️ Your doctor account has been suspended. Please contact support.';
          break;
        case 'DOCTOR_TOKEN_EXPIRED':
          userMessage = '⏰ Your session has expired. Please log in again.';
          break;
        case 'DOCTOR_ACCOUNT_DEACTIVATED':
          userMessage = '🔒 Your doctor account has been deactivated. Please contact support.';
          break;
        case 'INVALID_DOCTOR_TOKEN':
          userMessage = '🔐 Authentication error. Please log in again.';
          break;
        default:
          userMessage = 'Please log in again.';
      }
      
      // Show user-friendly notification
      alert(userMessage);
      window.location.href = '/doctor/login';
      
      return Promise.resolve({
        data: {
          success: false,
          message: userMessage,
          redirected: true
        }
      });
    } else {
      // Handle generic 401 errors
      console.log(`🚪 DOCTOR-API Generic 401 error - redirecting to doctor login`);
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('doctorData');
      localStorage.removeItem('doctorId');
      alert('Your session has expired. Please log in again.');
      window.location.href = '/doctor/login';
      
      return Promise.resolve({
        data: {
          success: false,
          message: 'Session expired',
          redirected: true
        }
      });
    }
  }
  
  return Promise.reject(error);
};

// Apply response interceptors with different names for debugging
api.interceptors.response.use(
  (response) => {
    console.log("✅ USER-API Response:", response.status, response.config.url);
    return response;
  },
  handleAuthError('USER-API')
);

aiApi.interceptors.response.use(
  (response) => {
    console.log("✅ AI-API Response:", response.status, response.config.url);
    return response;
  },
  handleAuthError('AI-API')
);

moodApi.interceptors.response.use(
  (response) => {
    console.log("✅ MOOD-API Response:", response.status, response.config.url);
    return response;
  },
  handleAuthError('MOOD-API')
);

// DOCTOR API RESPONSE INTERCEPTOR
doctorApi.interceptors.response.use(
  (response) => {
    console.log("✅ DOCTOR-API Response:", response.status, response.config.url);
    return response;
  },
  handleDoctorAuthError
);

// Enhanced authentication check
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const hasToken = !!token;
  console.log('🔍 Auth Check:', hasToken ? `Authenticated (${token.length} chars)` : 'Not authenticated');
  return hasToken;
};

// Enhanced user data retrieval
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    const parsed = userData ? JSON.parse(userData) : null;
    console.log('🔍 Current User:', parsed ? `Found (${parsed.firstName} ${parsed.lastName})` : 'Not found');
    return parsed;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('userData');
    return null;
  }
};

// Force logout with debugging
export const forceLogout = (message = 'Session ended') => {
  console.log('🚪 Force logout triggered:', message);
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.href = '/login';
};

// Add debugging utility
export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  
  console.log('🔍 Auth Debug Report:', {
    token: {
      exists: !!token,
      length: token?.length || 0,
      preview: token?.substring(0, 20) + '...' || 'none'
    },
    userData: {
      exists: !!userData,
      parsed: userData ? JSON.parse(userData) : null
    },
    allLocalStorageKeys: Object.keys(localStorage)
  });
};

// Doctor-specific functions
export const doctorregister = async (doctorData) => {
  try {
    console.log("📝 Doctor registration API call...");
    const response = await doctorApi.post("/doctorregister", doctorData);
    console.log("✅ Doctor registration response:", response.data);
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Registration successful'
    };
  } catch (error) {
    console.error("❌ Doctor Registration Error:", error.response?.data || error.message);
    throw error;
  }
};

export const doctorlogin = async (loginData) => {
  try {
    console.log("🔐 Doctor login API call...");
    const response = await doctorApi.post("/doctorlogin", loginData);
    console.log("✅ Doctor login response:", response.data);
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Login successful'
    };
  } catch (error) {
    console.error("❌ Doctor Login Error:", error.response?.data || error.message);
    throw error;
  }
};

// Enhanced doctor authentication check
export const isDoctorAuthenticated = () => {
  const doctorToken = localStorage.getItem('doctorToken');
  const hasToken = !!doctorToken;
  console.log('🔍 Doctor Auth Check:', hasToken ? `Authenticated (${doctorToken.length} chars)` : 'Not authenticated');
  return hasToken;
};

// Enhanced doctor data retrieval
export const getCurrentDoctor = () => {
  try {
    const doctorData = localStorage.getItem('doctorData');
    const parsed = doctorData ? JSON.parse(doctorData) : null;
    console.log('🔍 Current Doctor:', parsed ? `Found (Dr. ${parsed.personalInfo?.firstName} ${parsed.personalInfo?.lastName})` : 'Not found');
    return parsed;
  } catch (error) {
    console.error('Error parsing doctor data:', error);
    localStorage.removeItem('doctorData');
    return null;
  }
};

// Force doctor logout
export const forceDoctorLogout = (message = 'Doctor session ended') => {
  console.log('🚪 Force doctor logout triggered:', message);
  localStorage.removeItem('doctorToken');
  localStorage.removeItem('doctorData');
  localStorage.removeItem('doctorId');
  window.location.href = '/doctor/login';
};

export default { 
  api, 
  aiApi, 
  moodApi, 
  doctorApi,
  forceLogout, 
  isAuthenticated, 
  getCurrentUser, 
  debugAuth,
  // Doctor-specific exports
  doctorregister,
  doctorlogin,
  isDoctorAuthenticated,
  getCurrentDoctor,
  forceDoctorLogout
};
