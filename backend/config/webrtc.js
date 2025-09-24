// webrtcService.js - NEW FILE
class WebRTCService {
  constructor(socket) {
    this.socket = socket;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    
    // WebRTC Configuration with STUN servers
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.setupSocketListeners();
  }

  // 🎥 Initialize WebRTC peer connection
  initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.config);

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream');
      this.remoteStream = event.streams;
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo) {
        remoteVideo.srcObject = this.remoteStream;
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        this.socket.emit('video:ice_candidate', {
          appointmentId: this.currentAppointmentId,
          candidate: event.candidate
        });
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('📡 Connection state:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC connection established!');
      } else if (this.peerConnection.connectionState === 'failed') {
        console.log('❌ WebRTC connection failed');
        this.handleConnectionFailure();
      }
    };
  }

  // 🎦 Get user media (camera + microphone)
  async getUserMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      // Display local video
      const localVideo = document.getElementById('localVideo');
      if (localVideo) {
        localVideo.srcObject = this.localStream;
      }

      return this.localStream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      throw error;
    }
  }

  // 👨‍⚕️ Doctor starts video call
  async startCall(appointmentId) {
    this.currentAppointmentId = appointmentId;
    
    try {
      // Get user media first
      await this.getUserMedia();
      
      // Initialize peer connection
      this.initializePeerConnection();
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create WebRTC offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('📞 Creating WebRTC offer');

      // Send offer via Socket.io signaling
      this.socket.emit('video:initiate_call', {
        appointmentId,
        offer: offer // SDP Offer
      });

    } catch (error) {
      console.error('❌ Error starting call:', error);
    }
  }

  // 👤 Patient answers video call
  async answerCall(appointmentId, offer) {
    this.currentAppointmentId = appointmentId;
    
    try {
      // Get user media
      await this.getUserMedia();
      
      // Initialize peer connection
      this.initializePeerConnection();
      
      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Set remote description (the offer)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('📞 Creating WebRTC answer');

      // Send answer via Socket.io signaling
      this.socket.emit('video:respond_call', {
        appointmentId,
        accepted: true,
        answer: answer // SDP Answer
      });

    } catch (error) {
      console.error('❌ Error answering call:', error);
    }
  }

  // 🔗 Handle Socket.io signaling events
  setupSocketListeners() {
    // Incoming video call (Patient receives this)
    this.socket.on('video:incoming_call', async (data) => {
      console.log('📞 Incoming video call from doctor');
      
      // Show UI to accept/reject call
      const accepted = window.confirm(`Incoming video call from Dr. ${data.doctorInfo?.firstName}. Accept?`);
      
      if (accepted) {
        await this.answerCall(data.appointmentId, data.offer);
      } else {
        this.socket.emit('video:respond_call', {
          appointmentId: data.appointmentId,
          accepted: false
        });
      }
    });

    // Call accepted (Doctor receives this)
    this.socket.on('video:call_accepted', async (data) => {
      console.log('✅ Patient accepted the call');
      
      try {
        // Set remote description (the answer)
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('🔗 WebRTC connection established');
      } catch (error) {
        console.error('❌ Error setting remote description:', error);
      }
    });

    // ICE candidate received
    this.socket.on('video:ice_candidate', async (data) => {
      try {
        if (this.peerConnection && data.candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('🧊 Added ICE candidate');
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    });

    // Call ended
    this.socket.on('video:call_ended', () => {
      console.log('📵 Call ended by other party');
      this.endCall();
    });
  }

  // 📵 End the video call
  endCall() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear video elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    console.log('📵 Call ended');

    // Notify server
    if (this.currentAppointmentId) {
      this.socket.emit('video:end_call', {
        appointmentId: this.currentAppointmentId
      });
    }
  }

  handleConnectionFailure() {
    alert('Video call connection failed. Please try again.');
    this.endCall();
  }
}

export default WebRTCService;
