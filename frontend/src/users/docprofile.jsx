import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  Search,
  Filter,
  MoreVertical,
  MessageCircle,
  Star,
  Award,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  X
} from 'lucide-react';

import VideoConsultation from './VideoConsultation';
// Import new services and context
import { useDoctor } from '../context/doctorcontex';
import {
  getDoctorAppointments,
  respondToAppointment
} from '../services/authService';
import socket from '../services/socket-client';
import webrtcService from '../services/webrtc'; // Import WebRTC service


const Docprofile = () => {
  const navigate = useNavigate();

  const {
    doctorData,
    loading: doctorLoading,
    logout,
    isAuthenticated
  } = useDoctor();

  // Appointment and UI states
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Video call states
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);

  // Debug doctor data structure
  useEffect(() => {
    console.log('🔍 Doctor data structure:', doctorData);
    if (doctorData) {
      console.log('📊 Available keys:', Object.keys(doctorData));
      console.log('🆔 Doctor ID:', doctorData._id || doctorData.id);
    }
  }, [doctorData]);

  // Add this useEffect for doctor socket connection
  // In Docprofile.jsx - enhance your existing socket setup (around line 45)
  useEffect(() => {
    const getDoctorId = () => {
      if (doctorData?._id) return doctorData._id;
      if (doctorData?.id) return doctorData.id;
      return null;
    };

    const doctorId = getDoctorId();

    if (doctorId && socket) {
      console.log('👨‍⚕️ DOCTOR: Setting up socket listeners for doctor:', doctorId);
      console.log('👨‍⚕️ DOCTOR: Doctor data available:', !!doctorData);
      console.log('👨‍⚕️ DOCTOR: Socket object:', socket);
      console.log('👨‍⚕️ DOCTOR: Socket connected:', socket?.connected);

      // ✅ Your existing emit (this is correct!)
      socket.emit('user_online', {
        userId: doctorId,
        firstName: doctorData.personalInfo?.firstName || 'Doctor',
        lastName: doctorData.personalInfo?.lastName || '',
        userType: 'doctor'
      });

      console.log('✅ DOCTOR: user_online emitted for doctor ID:', doctorId);

      // ... rest of your existing socket setup
    } else {
      console.log('❌ DOCTOR: Cannot setup socket - doctorId:', doctorId, 'socket:', !!socket);
    }
  }, [doctorData]);


  // ✅ Socket.io integration for doctor - FIXED
  useEffect(() => {
    const getDoctorId = () => {
      if (doctorData?._id) return doctorData._id;
      if (doctorData?.id) return doctorData.id;
      return null;
    };

    const doctorId = getDoctorId();

    if (doctorId && socket) {
      console.log('👨‍⚕️ Setting up socket listeners for doctor:', doctorId);

      // ✅ Emit user_online event (backend will handle room joining)
      socket.emit('user_online', {
        userId: doctorId,
        firstName: doctorData.personalInfo?.firstName || doctorData.firstName || 'Doctor',
        lastName: doctorData.personalInfo?.lastName || doctorData.lastName || '',
        userType: 'doctor'
      });

      // ✅ Setup appointment-related socket listeners
      const handleNewAppointmentRequest = (data) => {
        console.log('🔔 New appointment request:', data);

        // Add to notifications
        const notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'new_appointment',
          title: 'New Appointment Request',
          message: `${data.patientInfo?.firstName || 'Patient'} ${data.patientInfo?.lastName || ''} has requested an appointment`,
          appointmentData: data.appointment,
          patientInfo: data.patientInfo,
          timestamp: Date.now(),
          isRead: false
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

        // Add to appointments list
        const newAppointment = {
          id: data.appointment.appointmentId,
          appointmentId: data.appointment.appointmentId,
          patientId: data.patientInfo?.id || data.patientInfo?._id,
          patientName: `${data.patientInfo?.firstName || 'Unknown'} ${data.patientInfo?.lastName || 'Patient'}`.trim(),
          patientEmail: data.patientInfo?.email,
          concern: data.appointment.appointmentDetails?.concern || 'General consultation',
          symptoms: data.appointment.appointmentDetails?.symptoms,
          urgency: data.appointment.appointmentDetails?.urgency || 'medium',
          scheduledTime: data.appointment.scheduledTime,
          time: new Date(data.appointment.scheduledTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          date: new Date(data.appointment.scheduledTime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          status: 'pending',
          duration: '45 mins',
          type: 'Initial Consultation'
        };

        setAppointments(prev => [newAppointment, ...prev]);
        console.log('✅ New appointment added:', newAppointment);

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Appointment Request', {
            body: `${data.patientInfo?.firstName || 'Patient'} has requested an appointment`,
            icon: '/favicon.ico',
            tag: 'appointment-request'
          });
        }
      };

      const handleVideoCallAccepted = (data) => {
        console.log('📹 Video call accepted:', data);
        setActiveVideoCall(data);
        setShowVideoCallModal(true);
      };

      const handleVideoCallRejected = (data) => {
        console.log('📹 Video call rejected:', data);
        alert('Patient declined the video call');
      };

      const handleVideoCallEnded = (data) => {
        console.log('📹 Video call ended:', data);
        setActiveVideoCall(null);
        setShowVideoCallModal(false);
        alert(`Video call ended. Duration: ${data.duration || 'N/A'} minutes`);
      };

      const handleAppointmentCancelled = (data) => {
        console.log('❌ Appointment cancelled:', data);

        const notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: `Patient has cancelled appointment ${data.appointmentId}`,
          timestamp: Date.now(),
          isRead: false
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

        // Remove from appointments
        setAppointments(prev =>
          prev.filter(apt => apt.appointmentId !== data.appointmentId)
        );
      };

      const handleAppointmentError = (error) => {
        console.error('❌ Appointment error:', error);
        alert(`Appointment error: ${error.message}`);
      };

      // ✅ Attach socket listeners
      socket.on('appointment:new_request', handleNewAppointmentRequest);
      socket.on('video:call_accepted', handleVideoCallAccepted);
      socket.on('video:call_rejected', handleVideoCallRejected);
      socket.on('video:call_ended', handleVideoCallEnded);
      socket.on('appointment:cancelled', handleAppointmentCancelled);
      socket.on('appointment:error', handleAppointmentError);

      // ✅ Cleanup on unmount
      return () => {
        socket.off('appointment:new_request', handleNewAppointmentRequest);
        socket.off('video:call_accepted', handleVideoCallAccepted);
        socket.off('video:call_rejected', handleVideoCallRejected);
        socket.off('video:call_ended', handleVideoCallEnded);
        socket.off('appointment:cancelled', handleAppointmentCancelled);
        socket.off('appointment:error', handleAppointmentError);
      };
    }
  }, [doctorData]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ✅ Fetch appointments using socket events
  useEffect(() => {
    const fetchAppointments = () => {
      const doctorId = doctorData?._id || doctorData?.id;

      if (doctorId && socket) {
        console.log('🔍 Fetching appointments via socket for doctor:', doctorId);
        setAppointmentsLoading(true);

        // Listen for appointments response
        const handleAppointmentsList = (data) => {
          console.log('📅 Doctor appointments received:', data);

          if (data.appointments) {
            const formattedAppointments = data.appointments.map(apt => {
              const scheduledTime = apt.scheduledTime || apt.date;
              const timeObj = scheduledTime ? new Date(scheduledTime) : new Date();

              return {
                id: apt._id || apt.appointmentId || `apt_${Date.now()}_${Math.random()}`,
                appointmentId: apt.appointmentId || apt._id,
                patientId: apt.patient?._id || apt.patientId,
                patientName: apt.patient?.firstName && apt.patient?.lastName
                  ? `${apt.patient.firstName} ${apt.patient.lastName}`
                  : apt.patientName || 'Unknown Patient',
                patientEmail: apt.patient?.email || apt.patientEmail,
                concern: apt.appointmentDetails?.concern || apt.concern || 'General consultation',
                symptoms: apt.appointmentDetails?.symptoms || apt.symptoms,
                urgency: apt.appointmentDetails?.urgency || apt.urgency || 'medium',
                scheduledTime: scheduledTime,
                time: timeObj.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }),
                date: timeObj.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                status: apt.status || 'pending',
                duration: apt.duration || '45 mins',
                type: apt.type || 'Consultation'
              };
            });

            console.log('✅ Formatted appointments:', formattedAppointments);
            setAppointments(formattedAppointments);
          }
          setAppointmentsLoading(false);
        };

        const handleAppointmentsError = (error) => {
          console.error('❌ Error fetching appointments:', error);
          setAppointmentsLoading(false);
        };

        // Listen for appointments list
        socket.on('appointments:doctor_list', handleAppointmentsList);
        socket.on('appointments:error', handleAppointmentsError);

        // ✅ Request appointments from backend
        socket.emit('appointments:get_doctor', {
          doctorId: doctorId,
          filters: {} // Add any filters if needed
        });

        // Cleanup listeners after timeout
        setTimeout(() => {
          socket.off('appointments:doctor_list', handleAppointmentsList);
          socket.off('appointments:error', handleAppointmentsError);
        }, 10000);
      }
    };

    if (doctorData) {
      fetchAppointments();
    }
  }, [doctorData]);

  // ✅ Handle appointment response (accept/reject) using socket
  const handleAppointmentResponse = async (appointment, accepted, message = '') => {
    try {
      console.log(`${accepted ? '✅' : '❌'} ${accepted ? 'Accepting' : 'Rejecting'} appointment:`, appointment.appointmentId);

      if (socket) {
        // Emit appointment response via socket
        socket.emit('appointment:respond', {
          appointmentId: appointment.appointmentId,
          accepted: accepted,
          message: message,
          doctorInfo: {
            firstName: doctorData.personalInfo?.firstName || doctorData.firstName,
            lastName: doctorData.personalInfo?.lastName || doctorData.lastName,
            specialization: doctorData.specializations?.primarySpecialization
          }
        });

        // Update local appointment status immediately for better UX
        setAppointments(prev =>
          prev.map(apt =>
            apt.appointmentId === appointment.appointmentId
              ? { ...apt, status: accepted ? 'confirmed' : 'rejected' }
              : apt
          )
        );

        // Add notification
        const notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: accepted ? 'appointment_accepted' : 'appointment_rejected',
          title: `Appointment ${accepted ? 'Accepted' : 'Rejected'}`,
          message: `You have ${accepted ? 'accepted' : 'rejected'} appointment with ${appointment.patientName}`,
          timestamp: Date.now(),
          isRead: false
        };

        setNotifications(prev => [notification, ...prev]);
      }
    } catch (error) {
      console.error('Error responding to appointment:', error);
      alert('Failed to respond to appointment');
    }
  };

  // ✅ Start video call using socket


 // In your doctor's startVideoCall function, add ontrack handler:
const startVideoCall = async (appointment) => {
  try {
    if (appointment.status === 'confirmed') {
      console.log('📹 Doctor starting video call for appointment:', appointment.appointmentId);

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

      // ✅ Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('🎥 Doctor received remote track:', event);
        if (event.streams && event.streams[0]) {
          console.log('📹 Doctor got remote stream from patient');
          // The VideoConsultation component will handle this
        }
      };

      // ✅ Handle outgoing ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Doctor sending ICE candidate to patient');
          socket.emit('video:ice_candidate', {
            appointmentId: appointment.appointmentId,
            candidate: event.candidate,
            sender: 'doctor'
          });
        } else {
          console.log('🧊 Doctor ICE gathering completed');
        }
      };

      // ✅ Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Doctor connection state:', peerConnection.connectionState);
        
        switch (peerConnection.connectionState) {
          case 'connected':
            console.log('✅ Doctor successfully connected to patient');
            break;
          case 'disconnected':
            console.log('⚠️ Doctor disconnected from patient');
            break;
          case 'failed':
            console.log('❌ Doctor connection to patient failed');
            break;
          case 'closed':
            console.log('🔒 Doctor connection closed');
            break;
        }
      };

      // ✅ ICE connection state monitoring
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 Doctor ICE connection state:', peerConnection.iceConnectionState);
      };

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log(`➕ Doctor adding ${track.kind} track to peer connection`);
        peerConnection.addTrack(track, stream);
      });

      // ✅ SET UP SOCKET EVENT LISTENERS - THIS WAS MISSING!
      const handleCallResponse = async (data) => {
        console.log('📞 Doctor received call response from patient:', data);
        
        if (data.accepted && data.answer) {
          try {
            console.log('✅ Patient accepted call, doctor setting answer');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            remoteDescriptionSet = true;
            
            // Process any queued ICE candidates
            console.log(`🧊 Processing ${iceCandidatesQueue.length} queued ICE candidates`);
            while (iceCandidatesQueue.length > 0) {
              const candidate = iceCandidatesQueue.shift();
              try {
                await peerConnection.addIceCandidate(candidate);
                console.log('🧊 Doctor processed queued ICE candidate');
              } catch (error) {
                console.error('❌ Error processing queued ICE candidate:', error);
              }
            }
            
          } catch (error) {
            console.error('❌ Doctor error handling call response:', error);
            alert('Error connecting to patient: ' + error.message);
          }
        } else {
          console.log('❌ Patient rejected the call');
          alert('Patient declined the video call');
          cleanup();
        }
      };

      const handleIncomingIceCandidate = async (data) => {
        console.log('🧊 Doctor received ICE candidate from patient');
        
        if (data.candidate && data.sender === 'patient') {
          try {
            const candidate = new RTCIceCandidate(data.candidate);
            
            if (remoteDescriptionSet) {
              await peerConnection.addIceCandidate(candidate);
              console.log('🧊 Doctor added patient ICE candidate');
            } else {
              console.log('🧊 Doctor queuing patient ICE candidate (remote description not set yet)');
              iceCandidatesQueue.push(candidate);
            }
          } catch (error) {
            console.error('❌ Doctor error adding ICE candidate:', error);
          }
        }
      };

      const handleCallEnded = () => {
        console.log('📵 Patient ended the call');
        cleanup();
        alert('Call ended by patient');
      };

      const handleVideoError = (data) => {
        console.error('❌ Video call error:', data);
        alert('Video call error: ' + (data.message || 'Unknown error'));
        cleanup();
      };

      // ✅ REGISTER SOCKET EVENT LISTENERS
      socket.on('video:call_response', handleCallResponse);
      socket.on('video:ice_candidate', handleIncomingIceCandidate);
      socket.on('video:call_ended', handleCallEnded);
      socket.on('video:error', handleVideoError);

      // ✅ Cleanup function
      const cleanup = () => {
        console.log('🧹 Doctor cleaning up call');
        
        // Remove socket listeners
        socket.off('video:call_response', handleCallResponse);
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

      // Store cleanup function globally
      window["currentCallCleanup"] = cleanup;

      // Create and send offer
      console.log('📤 Doctor creating offer for patient');
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);

      // Send offer to patient
      console.log('📤 Doctor sending call offer to patient');
      socket.emit('video:initiate_call', {
        appointmentId: appointment.appointmentId,
        patientId: appointment.patientId,
        offer: offer,
        doctorId: getCurrentUserId() // Helper function to get doctor ID
      });

      // ✅ FIXED: Navigate with user type parameter
      console.log('🚀 Doctor navigating to video consultation page');
      navigate(`/video-consultation/${appointment.appointmentId}?userType=doctor`);

    } else {
      alert('Appointment must be confirmed before starting video call');
    }
  } catch (error) {
    console.error('❌ Error starting video call:', error);
    alert('Failed to initiate video call: ' + error.message);
    
    // Cleanup on error
    if (window["currentCallCleanup"]) {
      window["currentCallCleanup"]();
    }
  }
};

// ✅ Helper function to get current user ID
const getCurrentUserId = () => {
  try {
    const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
    if (doctorData._id) return doctorData._id;
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.user?._id || userData._id || 'unknown';
  } catch {
    return 'unknown';
  }
};



  // ADD TO PATIENT COMPONENT:
  useEffect(() => {
    webrtcService.setUserType(false); // false = patient
    webrtcService.setCallbacks({
      onIncomingCall: (data) => {
        console.log('📹 Incoming call via WebRTC service:', data);
        setIncomingVideoCall(data);
      }
    });
  }, []);


  // Notification helper functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const clearNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (notification && !notification.isRead) {
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_appointment': return '🔔';
      case 'appointment_accepted': return '✅';
      case 'appointment_rejected': return '❌';
      case 'appointment_cancelled': return '🚫';
      case 'video_call': return '📹';
      default: return '📄';
    }
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.concern?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        // ✅ Disconnect socket on logout
        if (socket && socket.disconnect) {
          socket.disconnect();
        }
        await logout();
        navigate('/doctor/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Show loading if context is loading
  if (doctorLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or no doctor data
  if (!isAuthenticated || !doctorData) {
    navigate('/doctor/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {(doctorData.personalInfo?.firstName || doctorData.firstName || 'D')[0]}
                  {(doctorData.personalInfo?.lastName || doctorData.lastName || '')[0]}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Welcome back, Dr. {doctorData.personalInfo?.firstName || doctorData.firstName || ''} {doctorData.personalInfo?.lastName || doctorData.lastName || ''}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      {doctorData.specializations?.primarySpecialization || 'Healthcare Provider'}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountStatusColor(doctorData.platformSettings?.accountStatus || doctorData.accountStatus)}`}>
                      {doctorData.platformSettings?.accountStatus || doctorData.accountStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notification Bell with Dynamic Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Panel */}
                <AnimatePresence>
                  {showNotificationPanel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Notifications ({unreadNotifications})
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span>{getNotificationIcon(notification.type)}</span>
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => markNotificationAsRead(notification.id)}
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => clearNotification(notification.id)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No notifications</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => navigate('/doctor/settings')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-6 w-6" />
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => navigate('/doctor/profile-setup')}
              >
                Complete Profile ({doctorData.platformSettings?.profileCompletionPercentage || doctorData.profileCompletionPercentage || 0}%)
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {appointments.filter(apt => apt.status === 'pending').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {appointments.filter(apt => apt.status === 'confirmed').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-3xl font-bold text-purple-600">{unreadNotifications}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Appointments Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Appointment Requests & Schedule
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {appointment.patientName[0] || 'P'}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{appointment.patientName}</h3>
                            <p className="text-sm text-gray-600">{appointment.concern}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.time} ({appointment.duration})
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                              {appointment.urgency === 'high' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAppointmentResponse(appointment, true)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleAppointmentResponse(appointment, false)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => startVideoCall(appointment)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Start Video Call"
                            >
                              <Video className="h-5 w-5" />
                            </button>
                          )}
                          <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
                    <p className="text-gray-600">
                      {searchTerm ? 'No appointments match your search.' : "You don't have any appointments scheduled."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor Profile Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {doctorData.contactInfo?.email || doctorData.email || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {doctorData.contactInfo?.phone?.primary || doctorData.phone || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">License:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {doctorData.professionalInfo?.medicalLicenseNumber || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Specialization:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {doctorData.specializations?.primarySpecialization || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Calendar className="h-5 w-5" />
                  <span>View Schedule</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <FileText className="h-5 w-5" />
                  <span>Write Prescription</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Users className="h-5 w-5" />
                  <span>Patient Records</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Profile created successfully</p>
                    <p className="text-xs text-gray-500">{formatDate(doctorData.createdAt)}</p>
                  </div>
                </div>
                {(doctorData.platformSettings?.lastLogin || doctorData.lastLogin) && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">Last login</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(doctorData.platformSettings?.lastLogin || doctorData.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">
                      {doctorData.platformSettings?.emailVerified || doctorData.emailVerified
                        ? 'Email verified'
                        : 'Email verification pending'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doctorData.platformSettings?.emailVerified || doctorData.emailVerified
                        ? 'Email verification completed'
                        : 'Please check your email'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCallModal && activeVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Call Accepted</h3>
              <p className="text-gray-600 mb-6">
                Patient has accepted your video call request. Starting video consultation...
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowVideoCallModal(false);
                    setActiveVideoCall(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    navigate(`/doctor/video-consultation/${activeVideoCall.appointmentId}`);
                    setShowVideoCallModal(false);
                    setActiveVideoCall(null);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                >
                  Start Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docprofile;

