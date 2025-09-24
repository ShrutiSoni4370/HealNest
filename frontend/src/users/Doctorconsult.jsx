// components/DoctorConsult.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/userContext";

import "remixicon/fonts/remixicon.css";
import VideoConsultation from './VideoConsultation';

// Import new services
import {
  getAllDoctors,
  createAppointment,
  getPatientAppointments,
  cancelAppointment,
} from "../services/authService";

import socket from '../services/socket-client'
const DoctorConsult = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { userData, logout, loading: userLoading, isAuthenticated } = useUser();

  // States for doctors and appointments
  const [doctors, setDoctors] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [incomingVideoCall, setIncomingVideoCall] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user ID and details - handle different userData structures
  const getUserId = () => {
    if (userData?.user?._id) return userData.user._id;
    if (userData?._id) return userData._id;
    if (userData?.id) return userData.id;
    return null;
  };

  const getUserName = () => {
    if (userData?.user?.firstName) {
      return `${userData.user.firstName} ${userData.user.lastName || ''}`.trim();
    }
    if (userData?.firstName) {
      return `${userData.firstName} ${userData.lastName || ''}`.trim();
    }
    return "User";
  };

  const currentUserId = getUserId();
  const currentUserName = getUserName();

  console.log("Final User ID:", currentUserId);
  console.log("Final User Name:", currentUserName);

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#70AAB4] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !userData || !currentUserId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F4F6]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Please log in to continue</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access doctor consultation</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#70AAB4] hover:bg-[#5a8b94] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Add this useEffect in DoctorConsult.jsx
useEffect(() => {
  if (socket) {
    console.log('🔧 Socket object exists, testing connection...');
    
    // Test basic socket events
    socket.on('connect', () => {
      console.log('✅ SOCKET CONNECTED with ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ SOCKET DISCONNECTED');
    });
    
    // Test if we can emit
    socket.emit('test_patient_connection', { 
      message: 'Testing from patient', 
      timestamp: Date.now() 
    });
    
    // Simple video call test listener
    socket.on('video:incoming_call', (data) => {
      console.log('📹 🚨 VIDEO CALL EVENT RECEIVED!', data);
      alert('📹 VIDEO CALL RECEIVED!');
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect'); 
      socket.off('video:incoming_call');
    };
  } else {
    console.log('❌ Socket object is null/undefined');
  }
}, []);


useEffect(() => {
  console.log("🔧 SOCKET SETUP ATTEMPT:", { 
    currentUserId: currentUserId, 
    socketExists: !!socket, 
    socketConnected: socket?.connected,
    userDataExists: !!userData 
  });
  
  if (currentUserId && socket) {
    console.log("✅ SETTING UP SOCKET FOR PATIENT:", currentUserId);
    
    // ... rest of the debug code I provided earlier
  } else {
    console.log("❌ SOCKET SETUP BLOCKED:", { 
      currentUserId: !!currentUserId, 
      socket: !!socket 
    });
  }
}, [currentUserId, userData, socket]); // ✅ Add socket to dependencies


// ✅ REMOVE WebRTC service callbacks - use pure socket events
useEffect(() => {
  // ✅ PURE SOCKET APPROACH - no WebRTC service mixing
  const handleIncomingVideoCall = (data) => {
    console.log('📹 Incoming video call (direct socket):', data);
    setIncomingVideoCall(data);
  };

  socket.on('video:incoming_call', handleIncomingVideoCall);

  return () => {
    socket.off('video:incoming_call', handleIncomingVideoCall);
  };
}, []);


// ✅ FIXED response function




  // ✅ Socket.io listeners setup for patient - UPDATED
 // In DoctorConsult.jsx - enhance the socket setup
useEffect(() => {
  if (currentUserId && socket) {
    console.log("🔧 Patient connecting with socket:", socket);
    console.log("👤 Setting up Socket.io listeners for patient:", currentUserId);

    // ✅ Enhanced user_online emit with debug
    const userOnlineData = {
      userId: currentUserId,
      firstName: userData?.user?.firstName || userData?.firstName || 'User',
      lastName: userData?.user?.lastName || userData?.lastName || '',
      userType: 'patient'
    };

    console.log("📡 Emitting user_online with:", userOnlineData);
    socket.emit('user_online', userOnlineData);

    // Enhanced appointment response handler with debug
    const handleAppointmentResponse = (data) => {
      console.log('🔔 ✅ PATIENT RECEIVED: Appointment response:', data);
      
      const notification = {
        id: `notif_${Date.now()}_${Math.random()}`,
        type: data.appointment.status === 'confirmed' ? 'appointment_confirmed' : 'appointment_rejected',
        title: data.appointment.status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Rejected',
        message: `Dr. ${data.doctorInfo?.firstName || 'Doctor'} has ${data.appointment.status} your appointment`,
        doctorInfo: data.doctorInfo,
        appointmentId: data.appointment.appointmentId,
        timestamp: Date.now(),
        isRead: false,
        data: data.appointment
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // ✅ Show browser alert for testing
      alert(`✅ Dr. ${data.doctorInfo?.firstName || 'Doctor'} ${data.appointment.status} your appointment!`);

      // Update appointments list
      setUserAppointments(prev => 
        prev.map(apt => 
          apt.appointmentId === data.appointment.appointmentId 
            ? { ...apt, status: data.appointment.status }
            : apt
        )
      );
    };

    // ✅ Attach listeners with debug
    console.log("🎧 Attaching socket listeners for patient");
    socket.on('appointment:response', handleAppointmentResponse);
    
    // ... rest of your listeners

    return () => {
      console.log('🧹 Cleaning up patient socket listeners');
      socket.off('appointment:response', handleAppointmentResponse);
      // ... rest of cleanup
    };
  }
}, [currentUserId, userData]);


// In Docprofile.jsx - add this socket connection setup
useEffect(() => {
  if (socket) {
    console.log('👨‍⚕️ DOCTOR: Setting up socket connection');
    console.log('👨‍⚕️ DOCTOR: Socket object:', socket);
    console.log('👨‍⚕️ DOCTOR: Socket connected:', socket?.connected);
    
    // Get doctor ID from your state/props (you'll need to replace this)
    const doctorId = "68c859b3533846589fdd5347"; // Replace with actual doctor ID
    
    // ✅ CRITICAL: Doctor must emit user_online
    socket.emit('user_online', {
      userId: doctorId,
      firstName: 'Doctor', // Replace with actual name
      lastName: 'Name',
      userType: 'doctor'
    });
    
    console.log('✅ DOCTOR: user_online emitted for', doctorId);
  }
}, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Add this useEffect for patient socket connection - CRITICAL
useEffect(() => {
  if (currentUserId && socket) {
    console.log('👤 PATIENT: Connecting to socket with ID:', currentUserId);
    console.log('👤 PATIENT: Socket object:', socket);
    console.log('👤 PATIENT: Socket connected:', socket?.connected);
    
    // ✅ CRITICAL: Patient must emit user_online
    socket.emit('user_online', {
      userId: currentUserId,
      firstName: userData?.user?.firstName || userData?.firstName || 'User',
      lastName: userData?.user?.lastName || userData?.lastName || '',
      userType: 'patient'
    });
    
    console.log('✅ PATIENT: user_online emitted for', currentUserId);
    
    // Setup video call listener
    const handleIncomingVideoCall = (data) => {
      console.log('📹 ✅ PATIENT RECEIVED: Video call from doctor!', data);
      alert('📹 INCOMING VIDEO CALL FROM DOCTOR!');
      setIncomingVideoCall(data);
      
      // Add to notifications
      const notification = {
        id: `notif_${Date.now()}_${Math.random()}`,
        type: 'video_call_incoming',
        title: 'Incoming Video Call',
        message: `Dr. ${data.doctorInfo?.firstName || 'Doctor'} is calling you for your appointment`,
        doctorInfo: data.doctorInfo,
        appointmentId: data.appointmentId,
        timestamp: Date.now(),
        isRead: false,
        data: data
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    console.log('🎧 PATIENT: Attaching video:incoming_call listener');
    socket.on('video:incoming_call', handleIncomingVideoCall);
    
    return () => {
      console.log('🧹 PATIENT: Cleaning up socket listeners');
      socket.off('video:incoming_call', handleIncomingVideoCall);
    };
  }
}, [currentUserId, userData]);


  // Fetch doctors and appointments on component mount
  useEffect(() => {
    if (currentUserId) {
      fetchDoctors();
      fetchUserAppointments();
    }
  }, [currentUserId]);

  // Fetch doctors function with new service
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      console.log("Fetching doctors using getAllDoctors...");

      const response = await getAllDoctors();
      console.log("Doctors response:", response);

      let doctorsData = [];
      if (response?.success && response.doctors) {
        doctorsData = response.doctors;
      } else if (response?.data) {
        doctorsData = response.data;
      } else if (Array.isArray(response)) {
        doctorsData = response;
      } else {
        doctorsData = [];
      }

      console.log("Setting doctors data:", doctorsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user appointments with new service
  const fetchUserAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      console.log("Fetching appointments for patient:", currentUserId);

      const response = await getPatientAppointments(currentUserId);
      console.log("Patient appointments response:", response);

      let appointmentsData = [];
      if (response?.success && response.appointments) {
        appointmentsData = response.appointments;
      } else if (response?.data) {
        appointmentsData = response.data;
      } else if (Array.isArray(response)) {
        appointmentsData = response;
      }

      console.log(`Found ${appointmentsData.length} appointments for user ${currentUserId}`);
      setUserAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setUserAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Handle book appointment
  const handleBookAppointment = (doctor) => {
    if (!currentUserId) {
      alert("Please log in to book an appointment");
      navigate('/login');
      return;
    }
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  // Handle cancel appointment with new service
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      console.log("Cancelling appointment:", appointmentId);

      const result = await cancelAppointment(appointmentId, "Cancelled by patient");
      console.log("Cancellation result:", result);

      if (result.success) {
        // Remove from local state
        setUserAppointments(prev =>
          prev.filter(apt =>
            apt._id !== appointmentId &&
            apt.appointmentId !== appointmentId
          )
        );

        alert("Appointment cancelled successfully");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
      // Reload appointments on error
      fetchUserAppointments();
    }
  };

  // ✅ Handle video call response - UPDATED
 // ✅ UPDATED handleVideoCallResponse - Add this to your DoctorConsult.jsx
const handleVideoCallResponse = async (accepted) => {
  console.log(`Patient ${accepted ? 'accepting' : 'rejecting'} video call`);
  
  if (accepted && incomingVideoCall?.offer) {
    try {
      console.log('🚀 Patient starting video call acceptance process');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Store references globally
      window["currentPeerConnection"] = peerConnection;
      window["currentLocalStream"] = stream;

      // ✅ ICE candidate queue for early candidates
      let iceCandidatesQueue = [];
      let remoteDescriptionSet = false;

      // ✅ Handle remote stream from doctor
      peerConnection.ontrack = (event) => {
        console.log('🎥 Patient received remote track from doctor:', event);
        if (event.streams && event.streams[0]) {
          console.log('📹 Patient got doctor video stream');
          // VideoConsultation component will handle this
        }
      };

      // ✅ Handle outgoing ICE candidates to doctor
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Patient sending ICE candidate to doctor');
          socket.emit('video:ice_candidate', {
            appointmentId: incomingVideoCall.appointmentId,
            candidate: event.candidate,
            sender: 'patient'
          });
        } else {
          console.log('🧊 Patient ICE gathering completed');
        }
      };

      // ✅ Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Patient connection state:', peerConnection.connectionState);
        
        switch (peerConnection.connectionState) {
          case 'connected':
            console.log('✅ Patient successfully connected to doctor');
            break;
          case 'disconnected':
            console.log('⚠️ Patient disconnected from doctor');
            break;
          case 'failed':
            console.log('❌ Patient connection to doctor failed');
            break;
          case 'closed':
            console.log('🔒 Patient connection closed');
            break;
        }
      };

      // ✅ ICE connection state monitoring
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 Patient ICE connection state:', peerConnection.iceConnectionState);
      };

      // ✅ SET UP SOCKET EVENT LISTENERS - THIS WAS MISSING!
      const handleIncomingIceCandidate = async (data) => {
        console.log('🧊 Patient received ICE candidate from doctor');
        
        if (data.candidate && data.sender === 'doctor') {
          try {
            const candidate = new RTCIceCandidate(data.candidate);
            
            if (remoteDescriptionSet) {
              await peerConnection.addIceCandidate(candidate);
              console.log('🧊 Patient added doctor ICE candidate');
            } else {
              console.log('🧊 Patient queuing doctor ICE candidate');
              iceCandidatesQueue.push(candidate);
            }
          } catch (error) {
            console.error('❌ Patient error adding ICE candidate:', error);
          }
        }
      };

      const handleCallEnded = () => {
        console.log('📵 Doctor ended the call');
        cleanup();
        alert('Call ended by doctor');
      };

      const handleVideoError = (data) => {
        console.error('❌ Patient video call error:', data);
        alert('Video call error: ' + (data.message || 'Unknown error'));
        cleanup();
      };

      // ✅ Cleanup function
      const cleanup = () => {
        console.log('🧹 Patient cleaning up call');
        
        // Remove socket listeners
        socket.off('video:ice_candidate', handleIncomingIceCandidate);
        socket.off('video:call_ended', handleCallEnded);
        socket.off('video:error', handleVideoError);
        
        // Close peer connection
        if (peerConnection && peerConnection.connectionState !== 'closed') {
          peerConnection.close();
        }
        
        // Stop local stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Clear global references
        if (window["currentPeerConnection"]) {
          delete window["currentPeerConnection"];
        }
        if (window["currentLocalStream"]) {
          delete window["currentLocalStream"];
        }
      };

      // ✅ REGISTER SOCKET EVENT LISTENERS
      socket.on('video:ice_candidate', handleIncomingIceCandidate);
      socket.on('video:call_ended', handleCallEnded);
      socket.on('video:error', handleVideoError);

      // Store cleanup function globally
      window["currentCallCleanup"] = cleanup;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log(`➕ Patient adding ${track.kind} track to peer connection`);
        peerConnection.addTrack(track, stream);
      });

      // Set remote description from doctor's offer
      console.log('📥 Patient setting remote description from doctor offer');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingVideoCall.offer));
      remoteDescriptionSet = true;

      // Process any queued ICE candidates
      console.log(`🧊 Patient processing ${iceCandidatesQueue.length} queued ICE candidates`);
      while (iceCandidatesQueue.length > 0) {
        const candidate = iceCandidatesQueue.shift();
        try {
          await peerConnection.addIceCandidate(candidate);
          console.log('🧊 Patient processed queued ICE candidate');
        } catch (error) {
          console.error('❌ Patient error processing queued ICE candidate:', error);
        }
      }

      // Create answer for doctor
      console.log('📤 Patient creating answer for doctor');
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // ✅ FIXED: Send answer with correct event name
      console.log('📤 Patient sending answer to doctor');
      socket.emit('video:call_response', {  // ✅ Changed from 'video:respond_call'
        appointmentId: incomingVideoCall.appointmentId,
        accepted: true,
        answer: answer,
        patientId: getCurrentUserId()
      });

      // ✅ FIXED: Navigate with user type parameter
      console.log('🚀 Patient navigating to video consultation page');
      navigate(`/video-consultation/${incomingVideoCall.appointmentId}?userType=patient`);

    } catch (error) {
      console.error('❌ Patient error accepting call:', error);
      alert('Failed to accept video call: ' + error.message);
      
      // Send rejection on error
      socket.emit('video:call_response', {
        appointmentId: incomingVideoCall.appointmentId,
        accepted: false,
        error: error.message
      });
    }
  } else {
    // Call rejected
    console.log('❌ Patient rejecting video call');
    socket.emit('video:call_response', {  // ✅ Changed from 'video:respond_call'
      appointmentId: incomingVideoCall.appointmentId,
      accepted: false
    });
  }
  
  setIncomingVideoCall(null);
};

// ✅ Helper function to get current user ID
const getCurrentUserId = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.user?._id) return userData.user._id;
    if (userData._id) return userData._id;
    
    const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
    if (doctorData._id) return doctorData._id;
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
};




  // Notification helper functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_confirmed':
        return "ri-check-circle-line text-green-500";
      case 'appointment_rejected':
        return "ri-close-circle-line text-red-500";
      case 'appointment_cancelled':
        return "ri-time-line text-orange-500";
      case 'video_call_incoming':
        return "ri-video-line text-blue-500";
      case 'appointment_booking_confirmed':
        return "ri-send-plane-line text-blue-500";
      case 'prescription_received':
        return "ri-file-text-line text-purple-500";
      case 'appointment_reminder':
        return "ri-alarm-line text-yellow-500";
      default:
        return "ri-notification-line text-gray-500";
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleLogout = () => {
    if (socket && socket.disconnect) {
      socket.disconnect();
    }
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      case 'completed':
        return "bg-blue-100 text-blue-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-screen w-screen flex font-manrope bg-[#F0F4F6]">
      {/* Sidebar */}
      <motion.div
        // ✅ REMOVED: initial={{ x: -200, opacity: 0 }}
        // ✅ REMOVED: animate={{ x: 0, opacity: 1 }}
        // ✅ REMOVED: transition={{ duration: 0.5 }}
        className={`side-nav-bar h-full bg-[#70AAB4] flex flex-col justify-between p-6 transition-all duration-300 ${open ? "w-72" : "w-20"}`}
      >
        <div>
          <h1 className={`text-3xl text-white font-bold transition-all duration-300 ${!open && "opacity-0 hidden"}`}>
            HealNest
          </h1>
        </div>

        <div className="h-5/6 flex flex-col gap-6 mt-6">
          {[
            { icon: "ri-dashboard-2-fill", label: "Dashboard", link: "/profile" },
            { icon: "ri-user-line", label: "Calmi (AI Chatbot)", link: "/aicalmi" },
            { icon: "ri-bar-chart-fill", label: "Mood Tracker", link: "/moodtracker" },
            { icon: "ri-chat-smile-2-fill", label: "Journaling", link: "/journaling" },
            { icon: "ri-empathize-line", label: "Self-Care", link: "/selfcare" },
            { icon: "ri-user-community-line", label: "Community", link: "/community" },
            { icon: "ri-booklet-line", label: "Profile", link: "/profile" },
            { icon: "ri-alarm-warning-fill", label: "Crisis Mode", link: "/crisismode" },
          ].map((item, index) => (
            <Link key={index} to={item.link} className="text-white flex items-center gap-3 hover:scale-105 transition-transform duration-200">
              <i className={`${item.icon} text-2xl`}></i>
              <span className={`transition-all duration-300 ${!open && "opacity-0 hidden"}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 h-full bg-zinc-50 flex flex-col transition-all duration-300">
        {/* Navbar */}
        <motion.div
      // ✅ REMOVED: initial={{ y: -50, opacity: 0 }}
      // ✅ REMOVED: animate={{ y: 0, opacity: 1 }}
                  // ✅ REMOVED: transition={{ duration: 0.6 }}
                  className="navbar h-16 w-full flex items-center px-6 rounded-md shadow-md bg-white/80 backdrop-blur-md"
                >
                  <div className="left w-1/2 h-full flex items-center">
                    <button onClick={() => setOpen(!open)} className="text-gray-400 focus:outline-none">
                      <i className="ri-align-justify text-2xl"></i>
                    </button>
                  </div>
                  <div className="right w-1/2 h-full flex justify-end items-center font-josefin gap-6 px-4 text-blue-500">
                    <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]">Help</span>
                    <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]">Settings</span>
                    <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]" onClick={handleLogout}>Logout</span>
                  </div>
                </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#F0F4F6] p-6 overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Consultation</h1>
            <p className="text-gray-600">Connect with qualified mental health professionals</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === "doctors"
                  ? "bg-[#70AAB4] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Available Doctors ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === "appointments"
                  ? "bg-[#70AAB4] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              My Appointments ({userAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors relative ${activeTab === "notifications"
                  ? "bg-[#70AAB4] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Notifications ({notifications.length})
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "doctors" && (
              <div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                        <div className="flex items-center mb-4">
                          <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-5 bg-gray-300 rounded w-32"></div>
                            <div className="h-4 bg-gray-300 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-300 rounded"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-10 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ri-user-heart-line text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Doctors Available</h3>
                    <p className="text-gray-500 mb-6">Please try again later or contact support</p>
                    <button
                      onClick={fetchDoctors}
                      className="bg-[#70AAB4] hover:bg-[#5a8b94] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                      <motion.div
                        key={doctor._id || doctor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        {/* Doctor Header */}
                        <div className="flex items-center mb-4">
                          <div className="h-16 w-16 bg-gradient-to-r from-[#70AAB4] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {(doctor.firstName || doctor.personalInfo?.firstName || 'D')[0]}
                            {(doctor.lastName || doctor.personalInfo?.lastName || '')[0]}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Dr. {doctor.firstName || doctor.personalInfo?.firstName || 'Doctor'}{' '}
                              {doctor.lastName || doctor.personalInfo?.lastName || ''}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doctor.specialization || doctor.specializations?.primarySpecialization || 'Healthcare Provider'}
                            </p>
                          </div>
                        </div>

                        {/* Doctor Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <i className="ri-award-line mr-2"></i>
                            License: {doctor.license || doctor.professionalInfo?.medicalLicenseNumber || 'N/A'}
                          </div>

                          {doctor.education && typeof doctor.education === 'string' ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <i className="ri-book-line mr-2"></i>
                              {doctor.education}
                            </div>
                          ) : doctor.education?.[0] && typeof doctor.education[0] === 'object' ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <i className="ri-book-line mr-2"></i>
                              {doctor.education[0].degree} - {doctor.education[0].institution}
                            </div>
                          ) : null}

                          <div className="flex items-center text-sm text-gray-600">
                            <i className="ri-map-pin-line mr-2"></i>
                            {doctor.nationality || doctor.personalInfo?.nationality || 'N/A'}
                          </div>

                          {doctor.experience && (
                            <div className="flex items-center text-sm text-gray-600">
                              <i className="ri-time-line mr-2"></i>
                              {doctor.experience} experience
                            </div>
                          )}

                          <div className="flex items-center text-sm text-gray-600">
                            <i className="ri-mail-line mr-2"></i>
                            {doctor.email || doctor.contactInfo?.email || 'N/A'}
                          </div>
                        </div>

                        {/* Specializations/Expertise */}
                        {(doctor.expertise?.length > 0 || doctor.specializations?.mentalHealthFocus?.length > 0) && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-500 mb-2">Specializes in:</p>
                            <div className="flex flex-wrap gap-1">
                              {(doctor.expertise || doctor.specializations?.mentalHealthFocus || [])
                                .slice(0, 3)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {((doctor.expertise?.length > 3) || (doctor.specializations?.mentalHealthFocus?.length > 3)) && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{((doctor.expertise?.length || 0) + (doctor.specializations?.mentalHealthFocus?.length || 0)) - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Book Appointment Button */}
                        <button
                          onClick={() => handleBookAppointment(doctor)}
                          className="w-full bg-[#70AAB4] hover:bg-[#5a8b94] text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                          Book Appointment
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-4">
                            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-5 bg-gray-300 rounded w-40"></div>
                              <div className="h-4 bg-gray-300 rounded w-32"></div>
                              <div className="h-4 bg-gray-300 rounded w-48"></div>
                            </div>
                          </div>
                          <div className="h-8 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ri-calendar-line text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Yet</h3>
                    <p className="text-gray-500 mb-6">Book your first appointment with one of our doctors</p>
                    <button
                      onClick={() => setActiveTab("doctors")}
                      className="bg-[#70AAB4] hover:bg-[#5a8b94] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Browse Doctors
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAppointments.map((appointment) => (
                      <motion.div
                        key={appointment._id || appointment.appointmentId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-4">
                            <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {(appointment.doctorName?.[0] || appointment.doctorInfo?.firstName?.[0] || 'D')}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {appointment.doctorName || (appointment.doctorInfo
                                  ? `Dr. ${appointment.doctorInfo.firstName} ${appointment.doctorInfo.lastName}`
                                  : 'Doctor')}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {appointment.doctorInfo?.specialization || 'Healthcare Provider'}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                <strong>Concern:</strong> {appointment.concern || appointment.appointmentDetails?.concern || 'General consultation'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              <i className="ri-calendar-line mr-1"></i>
                              {appointment.date || new Date(appointment.scheduledTime).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500">
                              <i className="ri-time-line mr-1"></i>
                              {appointment.time || new Date(appointment.scheduledTime).toLocaleTimeString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              ID: {appointment.appointmentId || appointment._id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>

                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.appointmentId || appointment._id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">All Notifications</h2>
                    <div className="flex space-x-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border transition-all ${!notification.isRead
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 bg-white'
                            }`}
                        >
                          <div className="flex items-start space-x-4">
                            <i className={`${getNotificationIcon(notification.type)} text-2xl mt-1`}></i>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                                  <p className="text-gray-600 mt-1">{notification.message}</p>

                                  {notification.doctorInfo && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Doctor: Dr. {notification.doctorInfo.firstName} {notification.doctorInfo.lastName}
                                    </p>
                                  )}

                                  {notification.appointmentId && (
                                    <p className="text-sm text-gray-500">
                                      Appointment ID: {notification.appointmentId}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">
                                    {formatNotificationTime(notification.timestamp)}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                              </div>

                              <div className="flex space-x-2 mt-3">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                                  >
                                    Mark as read
                                  </button>
                                )}
                                <button
                                  onClick={() => clearNotification(notification.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <i className="ri-notification-off-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notifications</h3>
                      <p className="text-gray-500">You'll see appointment updates and doctor communications here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <AppointmentBookingModal
          doctor={selectedDoctor}
          patient={userData}
          patientId={currentUserId}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchUserAppointments();
          }}
        />
      )}

      {/* Incoming Video Call Modal */}
      {incomingVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-video-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Incoming Video Call</h3>
              <p className="text-gray-600 mb-6">
                Dr. {incomingVideoCall.doctorInfo?.firstName} is calling you for your appointment
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleVideoCallResponse(false)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleVideoCallResponse(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Updated AppointmentBookingModal Component with socket integration
const AppointmentBookingModal = ({ doctor, patient, patientId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    concern: '',
    symptoms: '',
    urgency: 'medium',
    preferredDate: '',
    preferredTime: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Use the passed patientId first, then fallback to patient data
    const actualPatientId = patientId || patient?.user?._id || patient?._id;

    console.log("Patient ID sources:");
    console.log("- Passed patientId:", patientId);
    console.log("- patient.user._id:", patient?.user?._id);
    console.log("- patient._id:", patient?._id);
    console.log("- Final actualPatientId:", actualPatientId);

    if (!actualPatientId) {
      alert("Please log in to book an appointment");
      return;
    }

    setLoading(true);

    try {
      console.log("Booking appointment for patient:", actualPatientId);

      // ✅ Use socket for booking instead of REST API
      if (socket) {
        socket.emit('appointment:book', {
          doctorId: doctor._id || doctor.id,
          patientId: actualPatientId,
          scheduledTime: `${formData.preferredDate}T${formData.preferredTime}`,
          appointmentDetails: formData
        });

        // Listen for booking confirmation
        const handleBookingResponse = (data) => {
          if (data.success) {
            console.log("Appointment booked successfully:", data);
            alert("Appointment request sent successfully!");
            onSuccess();
          } else {
            alert(data.message || "Failed to book appointment");
          }
          socket.off('appointment:booking_confirmed', handleBookingResponse);
          socket.off('appointment:error', handleBookingError);
        };

        const handleBookingError = (error) => {
          console.error("Booking error:", error);
          alert(error.message || "Failed to book appointment. Please try again.");
          socket.off('appointment:booking_confirmed', handleBookingResponse);
          socket.off('appointment:error', handleBookingError);
        };

        socket.on('appointment:booking_confirmed', handleBookingResponse);
        socket.on('appointment:error', handleBookingError);

        // Timeout after 10 seconds
        setTimeout(() => {
          socket.off('appointment:booking_confirmed', handleBookingResponse);
          socket.off('appointment:error', handleBookingError);
        }, 10000);
      } else {
        // Fallback to REST API if socket not available
        const appointmentData = {
          doctorId: doctor._id || doctor.id,
          patientId: actualPatientId,
          scheduledTime: `${formData.preferredDate}T${formData.preferredTime}`,
          appointmentDetails: formData
        };

        console.log("Sending appointment data:", appointmentData);

        const result = await createAppointment(appointmentData);
        console.log("Appointment booked successfully:", result);

        alert("Appointment request sent successfully!");
        onSuccess();
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">
            Dr. {doctor.firstName || doctor.personalInfo?.firstName} {doctor.lastName || doctor.personalInfo?.lastName}
          </h3>
          <p className="text-sm text-gray-600">{doctor.specialization || doctor.specializations?.primarySpecialization}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main Concern *</label>
            <textarea
              required
              value={formData.concern}
              onChange={(e) => setFormData({ ...formData, concern: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#70AAB4] focus:border-transparent resize-none"
              rows="3"
              placeholder="Describe your main concern..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
            <input
              type="text"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#70AAB4] focus:border-transparent"
              placeholder="List your symptoms..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#70AAB4] focus:border-transparent"
            >
              <option value="low">Low - Can wait a few days</option>
              <option value="medium">Medium - Within 1-2 days</option>
              <option value="high">High - Need urgent consultation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
              <input
                type="date"
                required
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={today}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#70AAB4] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time *</label>
              <select
                required
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#70AAB4] focus:border-transparent"
              >
                <option value="">Select time</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#70AAB4] hover:bg-[#5a8b94] text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DoctorConsult;
