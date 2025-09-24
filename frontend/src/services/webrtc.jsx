// services/webrtc.js - FINAL CORRECTED VERSION (DISABLE SOCKET LISTENERS)
import socket from './socket-client';

class WebRTCService {
  constructor() {
    this.socket = socket;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentAppointmentId = null;
    this.isDoctor = false;
    this.isInitiator = false;
    this.queuedIceCandidates = [];

    // Callbacks for UI updates
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onCallEnded = null;
    this.onCallConnected = null;
    this.onError = null;
    this.onIncomingCall = null;

    // WebRTC Configuration
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    // ✅ DISABLE automatic socket listeners since you're handling WebRTC manually
    // this.setupSocketListeners();
    console.log('✅ WebRTC service initialized (socket listeners DISABLED)');
  }

  // ✅ DISABLED: Socket listeners to prevent conflicts with manual WebRTC handling
  setupSocketListeners() {
    console.log('⚠️ WebRTC socket listeners are DISABLED - using manual WebRTC in components');
    
    // ❌ ALL SOCKET LISTENERS DISABLED TO PREVENT CONFLICTS:
    // this.socket.on('video:offer', this.handleOffer.bind(this));
    // this.socket.on('video:answer', this.handleAnswer.bind(this));
    // this.socket.on('video:ice_candidate', this.handleIceCandidate.bind(this));
    // this.socket.on('video:call_ended', this.handleCallEnded.bind(this));
    // this.socket.on('video:error', this.handleVideoError.bind(this));
    // this.socket.on('video:incoming_call', this.handleIncomingCall.bind(this));
    // this.socket.on('video:call_accepted', this.handleCallAccepted.bind(this));
    // this.socket.on('video:call_rejected', this.handleCallRejected.bind(this));
  }

  // Set user type (doctor or patient)
  setUserType(isDoctor) {
    this.isDoctor = isDoctor;
    console.log(`✅ User type set: ${isDoctor ? 'doctor' : 'patient'}`);
  }

  // Set callback functions (for VideoConsultation UI updates only)
  setCallbacks(callbacks) {
    this.onLocalStream = callbacks.onLocalStream;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onCallEnded = callbacks.onCallEnded;
    this.onCallConnected = callbacks.onCallConnected;
    this.onError = callbacks.onError;
    this.onIncomingCall = callbacks.onIncomingCall;
    console.log('✅ WebRTC callbacks set for UI updates');
  }

  // ✅ Keep utility methods for VideoConsultation component
  
  // Toggle mute/unmute audio
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🔊 Audio', audioTrack.enabled ? 'enabled' : 'disabled');
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video on/off
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Video', videoTrack.enabled ? 'enabled' : 'disabled');
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Check if call is active
  isCallActive() {
    return this.peerConnection && 
           this.peerConnection.connectionState === 'connected' &&
           this.currentAppointmentId;
  }

  // Get call statistics
  async getCallStats() {
    if (this.peerConnection) {
      try {
        const stats = await this.peerConnection.getStats();
        return stats;
      } catch (error) {
        console.error('Error getting call stats:', error);
        return null;
      }
    }
    return null;
  }

  // ✅ Minimal cleanup - only clear references
  cleanup() {
    console.log('🧹 Cleaning up WebRTC service (minimal cleanup)');
    
    // Clear references
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentAppointmentId = null;
    this.queuedIceCandidates = [];
    
    // Don't remove socket listeners since they're not set up
    console.log('✅ WebRTC service cleaned up');
  }

  // ✅ REMOVED: All WebRTC negotiation methods since you're handling them manually
  // - createPeerConnection()
  // - handleOffer()
  // - handleAnswer()
  // - handleIceCandidate()
  // - initiateCall()
  // - startCall()
  // - answerCall()
  // - etc.
}

// Export singleton instance
const webrtcService = new WebRTCService();
export default webrtcService;
