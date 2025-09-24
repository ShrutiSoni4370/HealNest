// src/context/UserContext.js - FIXED VERSION
import { createContext, useState, useContext, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore user from localStorage if token exists
  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    const savedToken = localStorage.getItem("token");
    
    console.log("🔍 Context init - Restoring from localStorage:", {
      hasUserData: !!savedUser,
      hasToken: !!savedToken,
      userData: savedUser ? JSON.parse(savedUser) : null
    });
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserData(parsedUser);
        console.log("✅ Context restored userData:", parsedUser);
      } catch (error) {
        console.error("❌ Error parsing saved userData:", error);
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // ✅ FIXED: Login function inside component
  const login = (data) => {
    console.log("🔧 Context login called with:", data);
    
    // ✅ Store the complete data structure
    setUserData(data);
    
    // ✅ Store user data (preserve the full structure)
    localStorage.setItem("userData", JSON.stringify(data));
    
    // ✅ Extract and store token
    const token = data.token || data.data?.token;
    if (token) {
      localStorage.setItem("token", token);
      console.log("✅ Context stored token:", token.substring(0, 20) + '...');
    } else {
      console.error("❌ No token found in login data:", data);
    }
    
    // Verify storage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("userData");
    console.log("🔍 Context verification:", {
      tokenStored: !!storedToken,
      userDataStored: !!storedUser
    });
  };

  // ✅ Logout function
  const logout = () => {
    console.log("🚪 Context logout called");
    
    setUserData(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    
    console.log("✅ Context cleared both userData and token");
  };

  // ✅ Update function for profile updates
  const updateUserData = (updates) => {
    setUserData(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("userData", JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    userData,
    setUserData,
    login,
    logout,
    updateUserData,
    loading,
    isAuthenticated: !!userData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
