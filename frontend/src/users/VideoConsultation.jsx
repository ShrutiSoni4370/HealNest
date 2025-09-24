// VideoConsultation.jsx - FIXED VERSION WITH PROPER USER DETECTION
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import webrtcService from '../services/webrtc';
import socket from '../services/socket-client';

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Add this

  // States
  const [callActive, setCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callError, setCallError] = useState(null);
  const [callStatus, setCallStatus] = useState('Initializing...');
  const [currentUserType, setCurrentUserType] = useState('');
  const [remoteUserType, setRemoteUserType] = useState('');
  const [userDetails, setUserDetails] = useState(null); // ✅ Add user details state

  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // ✅ FIXED: Proper user type detection
  const getCurrentUserType = () => {
    try {
      console.log('🔍 DETECTING USER TYPE - Current URL:', window.location.href);
      
      // ✅ Method 1: Check URL parameters first (HIGHEST PRIORITY)
      const urlParams = new URLSearchParams(location.search);
      const userTypeFromUrl = urlParams.get('userType');
      if (userTypeFromUrl) {
        console.log('✅ USER TYPE FROM URL:', userTypeFromUrl);
        return userTypeFromUrl;
      }

      // ✅ Method 2: Check session storage for this specific appointment
      const sessionKey = `userType_${appointmentId}`;
      const sessionUserType = sessionStorage.getItem(sessionKey);
      if (sessionUserType) {
        console.log('✅ USER TYPE FROM SESSION:', sessionUserType);
        return sessionUserType;
      }

      // ✅ Method 3: Determine by which dashboard/component initiated this
      const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      console.log('📊 STORAGE ANALYSIS:', {
        doctorDataExists: !!doctorData._id,
        userDataExists: !!(userData._id || userData.user?._id),
        currentPath: window.location.pathname,
        referrer: document.referrer
      });

      // Check which data is being actively used
      if (window.location.pathname.includes('/doctor/') || 
          window.location.hash.includes('doctor') ||
          document.referrer.includes('doctor-dashboard')) {
        console.log('✅ DETECTED AS DOCTOR (from path/referrer)');
        return 'doctor';
      }

      if (window.location.pathname.includes('/patient/') || 
          document.referrer.includes('patient-dashboard')) {
        console.log('✅ DETECTED AS PATIENT (from path/referrer)');
        return 'patient';
      }

      // Fallback: If only doctorData exists, it's doctor
      if (doctorData._id && !userData._id) {
        console.log('✅ DETECTED AS DOCTOR (only doctor data exists)');
        return 'doctor';
      }

      // Fallback: If userData exists, it's patient
      if (userData._id || userData.user?._id) {
        console.log('✅ DETECTED AS PATIENT (user data exists)');
        return 'patient';
      }

      console.log('⚠️ DEFAULTING TO PATIENT');
      return 'patient';

    } catch (error) {
      console.error('❌ Error detecting user type:', error);
      return 'patient';
    }
  };

  // ✅ Get user details for display
  const getCurrentUserDetails = () => {
    try {
      const userType = currentUserType || getCurrentUserType();
      
      if (userType === 'doctor') {
        const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
        return {
          id: doctorData._id,
          name: `Dr. ${doctorData.personalInfo?.firstName || 'Unknown'} ${doctorData.personalInfo?.lastName || ''}`.trim(),
          specialization: doctorData.specializations?.primarySpecialization || 'General',
          type: 'doctor'
        };
      } else {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const user = userData.user || userData;
        return {
          id: user._id || userData._id,
          name: `${user.firstName || 'Patient'} ${user.lastName || ''}`.trim(),
          age: user.age,
          type: 'patient'
        };
      }
    } catch (error) {
      console.error('Error getting user details:', error);
      return {
        id: 'unknown',
        name: 'Unknown User',
        type: currentUserType || 'patient'
      };
    }
  };

  // ✅ Setup existing streams function (same as before but with logging)
  const setupExistingStreams = async () => {
    try {
      console.log(`🚀 Setting up streams for ${currentUserType}...`);
      
      // Handle local stream
      if (window['currentLocalStream']) {
        localStreamRef.current = window['currentLocalStream'];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window['currentLocalStream'];
          console.log(`✅ ${currentUserType} local video connected from existing`);
        }
      } else {
        // Create new local stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        window['currentLocalStream'] = stream;
        webrtcService.localStream = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log(`✅ ${currentUserType} new local video stream created`);
        }
      }

      // Handle remote stream
      if (window['currentPeerConnection']) {
        console.log(`🔍 ${currentUserType} setting up remote stream handlers`);
        
        if (!window['ontrackHandlerSet']) {
          window['currentPeerConnection'].ontrack = (event) => {
            console.log(`🎥 ${currentUserType} received remote track:`, event);
            
            let remoteStream;
            if (event.streams && event.streams[0]) {
              remoteStream = event.streams[0];
            } else if (event.track) {
              remoteStream = new MediaStream([event.track]);
            }
            
            if (remoteStream && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              setCallActive(true);
              setCallStatus('Connected - Both videos active');
              setIsConnecting(false);
              console.log(`✅ ${currentUserType} remote video connected`);
            }
          };
          
          window['ontrackHandlerSet'] = true;
        }

        // Check existing receivers
        try {
          const receivers = window['currentPeerConnection'].getReceivers();
          console.log(`📡 ${currentUserType} found receivers:`, receivers.length);
          
          if (receivers.length > 0) {
            const remoteStream = new MediaStream();
            let hasVideoTrack = false;
            
            receivers.forEach(receiver => {
              if (receiver.track && receiver.track.readyState === 'live') {
                remoteStream.addTrack(receiver.track);
                if (receiver.track.kind === 'video') {
                  hasVideoTrack = true;
                }
              }
            });
            
            if (hasVideoTrack && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              setCallActive(true);
              setCallStatus('Connected - Both videos active');
              setIsConnecting(false);
              console.log(`✅ ${currentUserType} remote video set from existing receivers`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ ${currentUserType} could not check existing receivers:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ ${currentUserType} error in setupExistingStreams:`, error);
    }
  };

  // ✅ Main useEffect with proper user type setting
  useEffect(() => {
    console.log('📹 VideoConsultation loaded for appointment:', appointmentId);

    if (!appointmentId) {
      console.error('❌ No appointmentId found in URL');
      setCallError('No appointment ID found');
      return;
    }

    // ✅ Get user type and details
    const userType = getCurrentUserType();
    const userInfo = getCurrentUserDetails();
    const remoteType = userType === 'doctor' ? 'patient' : 'doctor';
    
    setCurrentUserType(userType);
    setRemoteUserType(remoteType);
    setUserDetails(userInfo);

    console.log(`🔧 USER DETECTED:`, {
      userType: userType,
      remoteType: remoteType,
      userDetails: userInfo,
      appointmentId: appointmentId,
      url: window.location.href
    });

    const initializeVideoConsultation = async () => {
      try {
        console.log(`🚀 ${userType} initializing video consultation`);
        setCallStatus(`Ready as ${userType}`);
        setIsConnecting(false);
        await setupExistingStreams();
      } catch (error) {
        console.error(`❌ ${userType} error initializing:`, error);
        setCallError('Failed to initialize: ' + error.message);
      }
    };

    const initTimeout = setTimeout(initializeVideoConsultation, 1000);

    return () => {
      clearTimeout(initTimeout);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [appointmentId, location.search]); // ✅ Add location.search dependency

  // ✅ Helper functions (updated)
  const getCurrentUserId = () => {
    try {
      if (currentUserType === 'doctor') {
        const doctorData = JSON.parse(localStorage.getItem('doctorData') || '{}');
        return doctorData._id;
      } else {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return userData.user?._id || userData._id;
      }
    } catch {
      return 'unknown_user';
    }
  };

  // Control functions (same as before)
  const endVideoCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socket) {
      socket.emit('video:end_call', { appointmentId });
    }
    navigate(-1);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[1000]">
      {/* ✅ Enhanced Header with user details */}
      <div className="flex justify-between items-center p-4 bg-black/80 text-white z-[1001] relative">
        <div>
          <h3 className="text-xl font-semibold m-0 mb-1">
            {currentUserType === 'doctor' ? 'Patient Consultation' : 'Doctor Consultation'}
          </h3>
          {userDetails && (
            <p className="text-sm opacity-75 m-0">
              Session ID: {appointmentId?.slice(-8) || 'Unknown'}
            </p>
          )}
        </div>
        
        {/* ✅ User info in center */}
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {userDetails?.name || 'Unknown User'}
          </div>
          <div className="text-sm opacity-75">
            {currentUserType === 'doctor' ? '🩺 Doctor' : '👤 Patient'} • 
            {userDetails?.specialization && ` ${userDetails.specialization}`}
            {userDetails?.age && ` Age ${userDetails.age}`}
          </div>
        </div>

        <button
          onClick={endVideoCall}
          className="bg-transparent border-none text-white text-2xl cursor-pointer hover:text-red-400 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Video Section */}
      <div className="relative h-[calc(100vh-140px)]">
        {/* Main remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-gray-800 block z-10"
        />

        {/* Placeholder when no remote video */}
        {!callActive && (
          <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center text-white flex-col z-20">
            <div className="text-6xl mb-4">
              {remoteUserType === 'doctor' ? '🩺' : '👤'}
            </div>
            <p className="text-xl m-0 text-center">{callStatus}</p>
            <div className="mt-4 text-center">
              <p className="text-lg">
                <span className="text-green-400 font-bold">{userDetails?.name || currentUserType}</span> 
                {" "}({currentUserType})
              </p>
              <p className="text-sm opacity-70">
                Waiting for {remoteUserType}...
              </p>
            </div>
          </div>
        )}

        {/* ✅ SMALL WINDOW: Local video with correct user type display */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-600 rounded-lg overflow-hidden border-2 border-white z-[1002]">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover bg-gray-700"
          />
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded">
            You ({currentUserType})
          </div>
          {/* ✅ User name overlay */}
          <div className="absolute top-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded">
            {userDetails?.name?.split(' ')[0] || currentUserType}
          </div>
        </div>

        {/* Error Display */}
        {callError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md max-w-[80%] text-center z-[1003]">
            {callError}
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="p-4 bg-black/80 flex justify-center z-[1001] relative">
        <div className="flex items-center gap-4 bg-gray-500/90 rounded-full px-6 py-3">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full border-none text-white cursor-pointer text-xl transition-colors ${
              isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? '🔇' : '🎤'}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full border-none text-white cursor-pointer text-xl transition-colors ${
              isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoMuted ? '📵' : '📹'}
          </button>

          <button
            onClick={endVideoCall}
            className="px-4 py-3 rounded-full border-none bg-red-600 text-white cursor-pointer hover:bg-red-700 transition-colors"
          >
            📞 End Call
          </button>
        </div>
      </div>

      {/* ✅ Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-20 left-4 bg-black/80 text-white p-2 rounded text-xs z-[1004] max-w-xs">
          <div><strong>Debug Info:</strong></div>
          <div>User: {currentUserType}</div>
          <div>Name: {userDetails?.name}</div>
          <div>ID: {userDetails?.id?.slice(-8)}</div>
          <div>URL: {location.search}</div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;

