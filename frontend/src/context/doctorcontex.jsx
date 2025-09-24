// contexts/DoctorContext.jsx - SIMPLIFIED VERSION
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

const DoctorContext = createContext();

export const DoctorProvider = ({ children }) => {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On first load, restore doctor from localStorage if token exists
  useEffect(() => {
    const savedDoctor = localStorage.getItem("doctorData");
    const savedToken = localStorage.getItem("doctorToken");
    
    console.log("🔍 Doctor Context init - Restoring from localStorage:", {
      hasDoctorData: !!savedDoctor,
      hasToken: !!savedToken,
      doctorData: savedDoctor ? JSON.parse(savedDoctor) : null
    });
    
    if (savedDoctor && savedToken) {
      try {
        const parsedDoctor = JSON.parse(savedDoctor);
        setDoctorData(parsedDoctor);
        console.log("✅ Doctor Context restored doctorData:", parsedDoctor);
      } catch (error) {
        console.error("❌ Error parsing saved doctorData:", error);
        localStorage.removeItem("doctorData");
        localStorage.removeItem("doctorToken");
        localStorage.removeItem("doctorId");
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login function inside component
  const login = (data) => {
    console.log("🔧 Doctor Context login called with:", data);
    
    // ✅ Store the complete data structure
    setDoctorData(data);
    
    // ✅ Store doctor data (preserve the full structure)
    localStorage.setItem("doctorData", JSON.stringify(data));
    
    // ✅ Extract and store doctor token
    const token = data.token || data.data?.token;
    if (token) {
      localStorage.setItem("doctorToken", token);
      localStorage.setItem("doctorId", data._id || data.doctor?._id);
      console.log("✅ Doctor Context stored token:", token.substring(0, 20) + '...');
    } else {
      console.error("❌ No token found in doctor login data:", data);
    }
    
    // Verify storage
    const storedToken = localStorage.getItem("doctorToken");
    const storedDoctor = localStorage.getItem("doctorData");
    console.log("🔍 Doctor Context verification:", {
      tokenStored: !!storedToken,
      doctorDataStored: !!storedDoctor
    });

    // Navigate to dashboard
    navigate('/doctor/dashboard');
  };

  // ✅ Logout function
  const logout = () => {
    console.log("🚪 Doctor Context logout called");
    
    setDoctorData(null);
    localStorage.removeItem("doctorData");
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorId");
    
    console.log("✅ Doctor Context cleared all data");
    navigate('/doctor/login');
  };

  // ✅ Update function for profile updates
  const updateDoctorData = (updates) => {
    setDoctorData(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("doctorData", JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Helper functions
  const getDoctorName = () => {
    if (!doctorData?.personalInfo) return 'Doctor';
    return `Dr. ${doctorData.personalInfo.firstName} ${doctorData.personalInfo.lastName}`;
  };

  const isProfileComplete = () => {
    if (!doctorData) return false;
    return doctorData.profileCompletionPercentage >= 80;
  };

  const isAccountActive = () => {
    if (!doctorData?.platformSettings) return false;
    return doctorData.platformSettings.isActive && doctorData.platformSettings.accountStatus === 'active';
  };

  const value = {
    doctorData,
    setDoctorData,
    login,
    logout,
    updateDoctorData,
    loading,
    isAuthenticated: !!doctorData,
    
    // Helper functions
    getDoctorName,
    isProfileComplete,
    isAccountActive,
    
    // Computed values
    doctorId: doctorData?._id,
    doctorEmail: doctorData?.contactInfo?.email,
    specialization: doctorData?.specializations?.primarySpecialization,
    accountStatus: doctorData?.platformSettings?.accountStatus,
    emailVerified: doctorData?.emailVerified || false,
    phoneVerified: doctorData?.phoneVerified || false
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};
