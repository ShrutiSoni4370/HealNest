import { createAppointment, cancelAppointment, getappointment, updateAppointmentStatus, getpatientappointments, respondToAppointment, getdoctorsappointments } from '../service/doctorservice.js';
import { getuserbyid } from '../service/userservice.js'; // You'll need to implement these
import { getDoctorById } from '../service/doctorservice.js'
import mongoose from 'mongoose';
// socket-handler.js 
const onlineUsers = new Map(); // socketId -> userId
const userDetails = new Map(); // userId -> user details
const userSockets = new Map(); // userId -> Set of socketIds (for multiple devices/tabs)

const activeAppointments = new Map(); // appointmentId -> appointment data
const doctorAppointments = new Map(); // doctorId -> Set of appointmentIds
const patientAppointments = new Map(); // patientId -> Set of appointmentIds


export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // When user comes online
    socket.on("user_online", (userInfo) => {
      const userId = userInfo.userId || userInfo;

      onlineUsers.set(socket.id, userId);

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      socket.join(userId);

      if (userInfo.userType === 'patient') {
        socket.join(`patient:${userId}`);
        console.log(`👤 Patient ${userId} joined patient room: patient:${userId}`);
      } else if (userInfo.userType === 'doctor') {
        socket.join(`doctor:${userId}`);
        console.log(`👨‍⚕️ Doctor ${userId} joined doctor room: doctor:${userId}`);
      }

      if (typeof userInfo === 'object' && userInfo.firstName) {
        userDetails.set(userId, {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          _id: userId
        });
      }

      console.log(`👤 User ${userId} is online with ${userSockets.get(userId).size} connection(s)`);
      io.emit("online_users", Array.from(userSockets.keys()));
    });

    // ✅ FIXED: Send friend request (prevent sending to self)
    socket.on("send_request", (targetUserDetails) => {
      const fromUserId = onlineUsers.get(socket.id);
      const toUserId = targetUserDetails._id;

      // ✅ PREVENT SENDING REQUEST TO SELF
      if (fromUserId === toUserId) {
        console.log(`❌ User ${fromUserId} tried to send request to themselves`);
        return;
      }

      console.log(`📩 Request from ${fromUserId} to ${toUserId}`);

      const senderDetails = userDetails.get(fromUserId) || {
        _id: fromUserId,
        firstName: "Unknown",
        lastName: "User"
      };

      if (userSockets.has(toUserId)) {
        const recipientSockets = userSockets.get(toUserId);
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit("receive_request", senderDetails);
        });
      }
    });

    // ✅ NEW: Cancel friend request
    socket.on("cancel_request", ({ targetUserId }) => {
      const fromUserId = onlineUsers.get(socket.id);

      console.log(`🚫 User ${fromUserId} cancelled request to ${targetUserId}`);

      // Remove request from recipient's incoming requests
      if (userSockets.has(targetUserId)) {
        const recipientSockets = userSockets.get(targetUserId);
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit("request_cancelled", {
            fromUserId,
            message: "Request was cancelled by sender"
          });
        });
      }
    });

    // Accept friend request and create room
    socket.on("accept_request", (user) => {
      const fromUserId = user._id;
      const toUserId = onlineUsers.get(socket.id);

      const room = [fromUserId, toUserId].sort().join("_");
      console.log(`✅ Creating room ${room} for users ${fromUserId} and ${toUserId}`);

      // Join all sockets of both users to room
      if (userSockets.has(fromUserId)) {
        userSockets.get(fromUserId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.join(room);
        });
      }

      if (userSockets.has(toUserId)) {
        userSockets.get(toUserId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.join(room);
        });
      }

      // Send room_started to accepter
      if (userSockets.has(toUserId)) {
        userSockets.get(toUserId).forEach(socketId => {
          io.to(socketId).emit("room_started", {
            room,
            users: [fromUserId, toUserId],
            otherUser: fromUserId
          });
        });
      }

      // Send room_started to requester
      if (userSockets.has(fromUserId)) {
        userSockets.get(fromUserId).forEach(socketId => {
          io.to(socketId).emit("room_started", {
            room,
            users: [fromUserId, toUserId],
            otherUser: toUserId
          });
        });
      }
    });

    // Reject friend request
    socket.on("reject_request", (userId) => {
      const rejecterId = onlineUsers.get(socket.id);
      console.log(`❌ ${rejecterId} rejected request from ${userId}`);

      if (userSockets.has(userId)) {
        userSockets.get(userId).forEach(socketId => {
          io.to(socketId).emit("request_rejected", { rejectedBy: rejecterId });
        });
      }
    });

    // Send message in room
    socket.on("send_message", ({ room, message }) => {
      const senderId = onlineUsers.get(socket.id);
      console.log(`💬 Message from ${senderId} in room ${room}: ${message.text}`);

      socket.to(room).emit("receive_message", {
        ...message,
        sender: senderId
      });
    });

    // ✅ FIXED: Leave room - both users disconnect and status reset
    socket.on("leave_room", ({ room }) => {
      const userId = onlineUsers.get(socket.id);
      console.log(`🚪 User ${userId} leaving room ${room}`);

      // Get room members before leaving
      const roomClients = io.sockets.adapter.rooms.get(room);
      const roomMemberIds = [];

      if (roomClients) {
        roomClients.forEach(socketId => {
          const memberUserId = onlineUsers.get(socketId);
          if (memberUserId && !roomMemberIds.includes(memberUserId)) {
            roomMemberIds.push(memberUserId);
          }
        });
      }

      // Remove all user's sockets from room
      if (userSockets.has(userId)) {
        userSockets.get(userId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.leave(room);
        });
      }

      // Notify all room members that someone left and reset both statuses
      roomMemberIds.forEach(memberId => {
        if (userSockets.has(memberId)) {
          userSockets.get(memberId).forEach(socketId => {
            io.to(socketId).emit("user_left_room", {
              room,
              userId,
              message: memberId === userId ? "You left the chat" : "Other user has left the chat",
              resetBothToAdd: true // ✅ Reset both users to "Add"
            });
          });
        }
      });
    });

    // Rejoin room on reconnection
    socket.on("rejoin_room", ({ room, userId }) => {
      console.log(`👤 User ${userId} rejoining room ${room}`);
      socket.join(room);

      const roomClients = io.sockets.adapter.rooms.get(room);
      if (roomClients && roomClients.size > 1) {
        socket.to(room).emit("user_rejoined", { room, userId });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userId = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);

      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);

        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          userDetails.delete(userId);
          console.log(`👤 User ${userId} fully disconnected`);
        } else {
          console.log(`👤 User ${userId} has ${userSockets.get(userId).size} connection(s) remaining`);
        }
      }

      console.log("❌ Socket disconnected:", socket.id, "userId:", userId);
      io.emit("online_users", Array.from(userSockets.keys()));
    });



    // ✅ Handle appointment booking with user data

    socket.on('appointment:book', async (data) => {
      try {
        console.log('📝 Booking appointment with data:', data);

        const { doctorId, patientId, scheduledTime, appointmentDetails } = data;

        // Validate required data
        if (!doctorId || !patientId || !scheduledTime) {
          socket.emit('appointment:error', {
            message: 'Missing required appointment data',
            details: { doctorId: !!doctorId, patientId: !!patientId, scheduledTime: !!scheduledTime }
          });
          return;
        }

        // ✅ Create appointment in MongoDB
        const result = await createAppointment({
          patientId,
          doctorId,
          scheduledTime,
          appointmentDetails
        });

        if (result.success) {
          // Add to in-memory tracking for real-time features
          activeAppointments.set(result.appointment.appointmentId, {
            ...result.appointment,
            expiresAt: new Date(result.appointment.expiresAt).getTime()
          });

          // Track by doctor and patient
          if (!doctorAppointments.has(doctorId)) {
            doctorAppointments.set(doctorId, new Set());
          }
          doctorAppointments.get(doctorId).add(result.appointment.appointmentId);

          if (!patientAppointments.has(patientId)) {
            patientAppointments.set(patientId, new Set());
          }
          patientAppointments.get(patientId).add(result.appointment.appointmentId);

          // Emit to patient
          socket.emit('appointment:booking_confirmed', {
            success: true,
            appointment: result.appointment
          });

          // ✅ Emit to doctor with complete patient data
          io.to(`doctor:${doctorId}`).emit('appointment:new_request', {
            appointment: result.appointment,
            patientInfo: result.appointment.patient
          });

          console.log('✅ Appointment created successfully:', result.appointment.appointmentId);
        } else {
          socket.emit('appointment:error', { message: result.error });
        }

      } catch (error) {
        console.error('❌ Appointment booking error:', error);
        socket.emit('appointment:error', { message: 'Failed to book appointment' });
      }
    });

    // ✅ APPOINTMENT RESPONSE (Accept/Reject) - MongoDB-based
    socket.on('appointment:respond', async (data) => {
      try {
        const { appointmentId, accepted, message, doctorInfo } = data;

        console.log(`${accepted ? '✅' : '❌'} Doctor responding to appointment:`, appointmentId);

        // ✅ Use MongoDB service to respond to appointment
        const result = await respondToAppointment(appointmentId, accepted, message);

        if (result.success) {
          // Update in-memory tracking
          if (activeAppointments.has(appointmentId)) {
            activeAppointments.get(appointmentId).status = result.appointment.status;
          }

          // Emit to patient
          io.to(`patient:${result.appointment.patient._id}`).emit('appointment:response', {
            appointment: result.appointment,
            doctorInfo: result.appointment.doctor,
            message: message || `Appointment ${result.appointment.status}`
          });

          console.log(`✅ Appointment ${appointmentId} ${result.appointment.status}`);
        } else {
          socket.emit('appointment:error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Appointment response error:', error);
        socket.emit('appointment:error', { message: 'Failed to respond to appointment' });
      }
    });

    // ✅ GET DOCTOR APPOINTMENTS - MongoDB-based
    socket.on('appointments:get_doctor', async (data) => {
      try {
        const { doctorId, filters = {} } = data;

        console.log('🔍 Fetching appointments for doctor:', doctorId);

        const result = await getdoctorsappointments(doctorId, filters);

        if (result.success) {
          socket.emit('appointments:doctor_list', {
            appointments: result.appointments,
            total: result.total
          });
        } else {
          socket.emit('appointments:error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error fetching doctor appointments:', error);
        socket.emit('appointments:error', { message: 'Failed to fetch appointments' });
      }
    });



    // ✅ GET PATIENT APPOINTMENTS - MongoDB-based
    socket.on('appointments:get_patient', async (data) => {
      try {
        const { patientId, filters = {} } = data;

        console.log('🔍 Fetching appointments for patient:', patientId);

        const result = await getpatientappointments(patientId, filters);

        if (result.success) {
          socket.emit('appointments:patient_list', {
            appointments: result.appointments,
            total: result.total
          });
        } else {
          socket.emit('appointments:error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error fetching patient appointments:', error);
        socket.emit('appointments:error', { message: 'Failed to fetch appointments' });
      }
    });

    // ✅ CANCEL APPOINTMENT - MongoDB-based
    socket.on("appointment:cancel", async (data) => {
      try {
        const userId = onlineUsers.get(socket.id);
        const { appointmentId, reason = '' } = data;

        console.log(`🚫 User ${userId} cancelling appointment:`, appointmentId);

        // ✅ Use MongoDB service to cancel appointment
        const cancelledBy = userDetails.get(userId)?.userType === 'doctor' ? 'doctor' : 'patient';
        const result = await cancelAppointment(appointmentId, cancelledBy, reason);

        if (result.success) {
          // Update in-memory tracking
          if (activeAppointments.has(appointmentId)) {
            activeAppointments.get(appointmentId).status = 'cancelled';
          }

          const appointment = result.appointment;
          const otherUserId = userId === appointment.patient._id.toString()
            ? appointment.doctor._id.toString()
            : appointment.patient._id.toString();
          const otherUserType = userId === appointment.patient._id.toString() ? 'doctor' : 'patient';

          console.log(`✅ Appointment ${appointmentId} cancelled by ${cancelledBy}`);

          // Notify the other party
          io.to(`${otherUserType}:${otherUserId}`).emit("appointment:cancelled", {
            appointmentId,
            appointment: result.appointment,
            cancelledBy: userDetails.get(userId),
            reason
          });

          socket.emit("appointment:cancel_confirmed", {
            appointment: result.appointment
          });
        } else {
          socket.emit("appointment:error", { message: result.error });
        }

      } catch (error) {
        console.error('❌ Appointment cancellation error:', error);
        socket.emit("appointment:error", { message: "Failed to cancel appointment" });
      }
    });

    // ✅ VIDEO CALL INITIATION



    // In backend config/socket.js - add this in the socket connection handler
    socket.on('test_connection', (data) => {
      console.log('📧 Received connection test from patient:', data);
      socket.emit('test_response', {
        message: 'Backend connected successfully!',
        patientId: data.patientId,
        timestamp: new Date().toISOString()
      });
    });


    // Add this socket handler in your backend/server.js or wherever your socket handlers are
    socket.on('video:join_room', async (data) => {
      try {
        const { appointmentId, userId, userType } = data;
        console.log(`🎥 ${userType} ${userId} joining video room for appointment ${appointmentId}`);

        // Join the specific video room
        const videoRoomId = `video:${appointmentId}`;
        socket.join(videoRoomId);

        // Get all users in this video room
        const roomSockets = await io.in(videoRoomId).fetchSockets();
        console.log(`👥 Video room ${videoRoomId} now has ${roomSockets.length} users`);

        if (roomSockets.length === 2) {
          // Both users are present, initiate WebRTC connection
          console.log('🎯 Both users in video room, initiating WebRTC connection...');

          // Tell both users they're ready to connect
          io.to(videoRoomId).emit('video:ready_to_connect', {
            appointmentId: appointmentId,
            totalUsers: roomSockets.length,
            message: 'Both users ready, establishing connection...'
          });

          // Find the doctor and tell them to initiate the WebRTC offer
          for (let roomSocket of roomSockets) {
            const socketUserId = onlineUsers.get(roomSocket.id);
            console.log(`🔍 Checking socket ${roomSocket.id} with user ${socketUserId}`);

            // You can identify doctor by checking if userId matches doctor pattern
            // Or pass userType information and check that
            if (data.userType === 'doctor' || socketUserId === '68c859b3533846589fdd5347') {
              console.log('👨‍⚕️ Found doctor socket, telling them to initiate connection');
              roomSocket.emit('video:initiate_connection', {
                appointmentId: appointmentId,
                patientId: userId // The patient who just joined
              });
              break;
            }
          }
        } else {
          // First user, waiting for second
          console.log(`⏳ Only ${roomSockets.length} user(s) in room, waiting for other user`);
          socket.emit('video:waiting_for_other_user', {
            appointmentId: appointmentId,
            currentUsers: roomSockets.length,
            message: `Waiting for ${userType === 'doctor' ? 'patient' : 'doctor'} to join...`
          });
        }

      } catch (error) {
        console.error('❌ Error in video:join_room:', error);
        socket.emit('video:error', {
          message: 'Failed to join video room',
          error: error.message
        });
      }
    });


    // ✅ VIDEO CALL RESPONSE


    // ✅ END VIDEO CALL
    socket.on("video:end_call", async (data) => {
      try {
        const userId = onlineUsers.get(socket.id);
        const { appointmentId } = data;

        console.log(`📹 User ${userId} ending video call for appointment ${appointmentId}`);

        // ✅ Get appointment from MongoDB
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit("video:error", { message: "Appointment not found" });
          return;
        }

        const appointment = appointmentResult.appointment;

        // ✅ Update appointment status to completed in MongoDB
        const updateResult = await updateAppointmentStatus(appointmentId, 'completed', {
          'videoCall.endTime': new Date(),
          'videoCall.actualDuration': appointment.videoCall?.startTime
            ? Math.round((new Date() - new Date(appointment.videoCall.startTime)) / 60000) // duration in minutes
            : null,
          'consultation.completedAt': new Date()
        });

        if (updateResult.success) {
          // Update in-memory tracking
          if (activeAppointments.has(appointmentId)) {
            activeAppointments.get(appointmentId).status = 'completed';
          }

          const otherUserId = userId === appointment.patient._id.toString()
            ? appointment.doctor._id.toString()
            : appointment.patient._id.toString();
          const otherUserType = userId === appointment.patient._id.toString() ? 'doctor' : 'patient';

          // Notify other party
          io.to(`${otherUserType}:${otherUserId}`).emit("video:call_ended", {
            appointmentId: appointmentId,
            duration: updateResult.appointment.videoCall?.actualDuration
          });

          socket.emit("video:call_end_confirmed", {
            appointmentId: appointmentId,
            appointment: updateResult.appointment
          });
        }

      } catch (error) {
        console.error('❌ Video call end error:', error);
        socket.emit("video:error", { message: "Failed to end video call" });
      }
    });

    // ✅ ADD THESE MISSING WEBRTC SIGNALING HANDLERS
    socket.on('video:offer', async (data) => {
      try {
        const { appointmentId, userId, userType, offer } = data;
        console.log(`📤 WebRTC offer from ${userType} ${userId} for appointment ${appointmentId}`);

        // Get appointment details
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit('video:error', { message: 'Appointment not found' });
          return;
        }

        const appointment = appointmentResult.appointment;

        // Determine the target user (opposite of sender)
        const targetUserId = userType === 'doctor'
          ? appointment.patient._id.toString()
          : appointment.doctor._id.toString();
        const targetUserType = userType === 'doctor' ? 'patient' : 'doctor';

        console.log(`📤 Forwarding offer to ${targetUserType} ${targetUserId}`);

        // Forward offer to target user via multiple methods
        const offerData = {
          appointmentId,
          userId,
          userType,
          offer
        };

        // Method 1: User type room
        io.to(`${targetUserType}:${targetUserId}`).emit('video:offer', offerData);

        // Method 2: Video room
        io.to(`video:${appointmentId}`).emit('video:offer', offerData);

        // Method 3: Direct socket targeting
        if (userSockets.has(targetUserId)) {
          const targetSockets = userSockets.get(targetUserId);
          targetSockets.forEach(socketId => {
            io.to(socketId).emit('video:offer', offerData);
          });
        }

      } catch (error) {
        console.error('❌ Error handling video offer:', error);
        socket.emit('video:error', { message: 'Failed to process offer' });
      }
    });

    // In your backend video:answer handler:
    socket.on('video:answer', async (data) => {
      try {
        const { appointmentId, userId, answer } = data;

        // ✅ ADD DUPLICATE PREVENTION
        const answerKey = `answer_${appointmentId}_${userId}`;
        if (socket.processedAnswers && socket.processedAnswers.has(answerKey)) {
          console.log('⚠️ Duplicate answer ignored for', appointmentId);
          return;
        }

        // Track processed answers
        if (!socket.processedAnswers) {
          socket.processedAnswers = new Set();
        }
        socket.processedAnswers.add(answerKey);

        // Clear after 30 seconds
        setTimeout(() => {
          socket.processedAnswers?.delete(answerKey);
        }, 30000);

        console.log(`📤 WebRTC answer from user ${userId} for appointment ${appointmentId}`);

        // ... rest of your existing code
      } catch (error) {
        console.error('❌ Error handling video answer:', error);
      }
    });


    // ✅ ENHANCED ICE CANDIDATE HANDLER (you already have this, but enhance it)
    // ✅ FIXED: Video call initiation handler
    socket.on("video:initiate_call", async (data) => {
      try {
        const doctorId = onlineUsers.get(socket.id);
        const { appointmentId, patientId, offer } = data;

        console.log(`📹 Doctor ${doctorId} initiating video call for appointment ${appointmentId}`);

        // Get appointment details
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit("video:error", { message: "Appointment not found" });
          return;
        }

        const appointment = appointmentResult.appointment;
        const patientUserId = appointment.patient._id.toString();

        const videoCallData = {
          appointmentId: appointmentId,
          doctorInfo: {
            firstName: appointment.doctor.personalInfo?.firstName,
            lastName: appointment.doctor.personalInfo?.lastName,
            specialization: appointment.doctor.specializations?.primarySpecialization
          },
          offer: offer // ✅ Include the WebRTC offer
        };

        console.log(`📡 Sending video call to patient ${patientUserId}`);

        // Send to patient via multiple targeting methods
        io.to(`patient:${patientUserId}`).emit("video:incoming_call", videoCallData);

        if (userSockets.has(patientUserId)) {
          const patientSockets = userSockets.get(patientUserId);
          patientSockets.forEach(socketId => {
            io.to(socketId).emit("video:incoming_call", videoCallData);
          });
        }

        console.log(`✅ Video call invitation sent to patient`);

      } catch (error) {
        console.error('❌ Video call initiation error:', error);
        socket.emit("video:error", { message: "Failed to initiate video call" });
      }
    });

    // ✅ FIXED: Video call response handler (matches frontend event name)
    socket.on("video:call_response", async (response) => {
      try {
        const patientId = onlineUsers.get(socket.id);
        const { appointmentId, accepted, answer } = response;

        console.log(`📹 Patient ${patientId} ${accepted ? 'accepted' : 'rejected'} video call`);

        // Get appointment from database
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit("video:error", { message: "Appointment not found" });
          return;
        }

        const appointment = appointmentResult.appointment;
        const doctorUserId = appointment.doctor._id.toString();

        if (accepted && answer) {
          console.log(`✅ Sending answer to doctor ${doctorUserId}`);

          // Send answer to doctor via multiple methods
          io.to(`doctor:${doctorUserId}`).emit("video:call_response", {
            appointmentId: appointmentId,
            accepted: true,
            answer: answer // ✅ WebRTC answer for doctor
          });

          if (userSockets.has(doctorUserId)) {
            const doctorSockets = userSockets.get(doctorUserId);
            doctorSockets.forEach(socketId => {
              io.to(socketId).emit("video:call_response", {
                appointmentId: appointmentId,
                accepted: true,
                answer: answer
              });
            });
          }

          // Update appointment status
          const updateResult = await updateAppointmentStatus(appointmentId, 'in_progress', {
            'videoCall.startTime': new Date(),
            'videoCall.status': 'active'
          });

        } else {
          // Call rejected
          console.log(`❌ Call rejected, notifying doctor`);

          io.to(`doctor:${doctorUserId}`).emit("video:call_response", {
            appointmentId: appointmentId,
            accepted: false
          });

          if (userSockets.has(doctorUserId)) {
            const doctorSockets = userSockets.get(doctorUserId);
            doctorSockets.forEach(socketId => {
              io.to(socketId).emit("video:call_response", {
                appointmentId: appointmentId,
                accepted: false
              });
            });
          }
        }

      } catch (error) {
        console.error('❌ Video call response error:', error);
        socket.emit("video:error", { message: "Failed to respond to video call" });
      }
    });

    // ✅ FIXED: ICE candidate handler with proper routing
    socket.on('video:ice_candidate', async (data) => {
      try {
        const senderId = onlineUsers.get(socket.id);
        const { appointmentId, candidate, sender } = data;

        console.log(`🧊 ICE candidate from ${sender || 'unknown'} for appointment ${appointmentId}`);

        // Get appointment to identify participants
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          console.log('❌ Appointment not found for ICE candidate');
          return;
        }

        const appointment = appointmentResult.appointment;
        const doctorUserId = appointment.doctor._id.toString();
        const patientUserId = appointment.patient._id.toString();

        // Determine target user (opposite of sender)
        let targetUserId, targetUserType;

        if (senderId === doctorUserId) {
          targetUserId = patientUserId;
          targetUserType = 'patient';
        } else if (senderId === patientUserId) {
          targetUserId = doctorUserId;
          targetUserType = 'doctor';
        } else {
          console.log('❌ Invalid sender for ICE candidate');
          return;
        }

        console.log(`🧊 Forwarding ICE candidate to ${targetUserType} ${targetUserId}`);

        const candidateData = {
          appointmentId,
          candidate,
          sender: senderId === doctorUserId ? 'doctor' : 'patient'
        };

        // Send to target user via multiple methods
        io.to(`${targetUserType}:${targetUserId}`).emit('video:ice_candidate', candidateData);

        if (userSockets.has(targetUserId)) {
          const targetSockets = userSockets.get(targetUserId);
          targetSockets.forEach(socketId => {
            io.to(socketId).emit('video:ice_candidate', candidateData);
          });
        }

      } catch (error) {
        console.error('❌ Error handling ICE candidate:', error);
      }
    });

    // ✅ Enhanced video call end handler
    socket.on("video:end_call", async (data) => {
      try {
        const userId = onlineUsers.get(socket.id);
        const { appointmentId } = data;

        console.log(`📹 User ${userId} ending video call for appointment ${appointmentId}`);

        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit("video:error", { message: "Appointment not found" });
          return;
        }

        const appointment = appointmentResult.appointment;
        const doctorUserId = appointment.doctor._id.toString();
        const patientUserId = appointment.patient._id.toString();

        // Determine the other user
        const otherUserId = userId === patientUserId ? doctorUserId : patientUserId;
        const otherUserType = userId === patientUserId ? 'doctor' : 'patient';

        // Update appointment status
        const updateResult = await updateAppointmentStatus(appointmentId, 'completed', {
          'videoCall.endTime': new Date(),
          'videoCall.status': 'ended'
        });

        // Notify the other party
        io.to(`${otherUserType}:${otherUserId}`).emit("video:call_ended", {
          appointmentId: appointmentId,
          endedBy: userId
        });

        if (userSockets.has(otherUserId)) {
          const otherSockets = userSockets.get(otherUserId);
          otherSockets.forEach(socketId => {
            io.to(socketId).emit("video:call_ended", {
              appointmentId: appointmentId,
              endedBy: userId
            });
          });
        }

        // Confirm to sender
        socket.emit("video:call_end_confirmed", {
          appointmentId: appointmentId
        });

      } catch (error) {
        console.error('❌ Video call end error:', error);
        socket.emit("video:error", { message: "Failed to end video call" });
      }
    });



    // ✅ SHARE PRESCRIPTION
    socket.on("prescription:share", async (data) => {
      try {
        const doctorId = onlineUsers.get(socket.id);
        const { appointmentId, prescription, diagnosis, medicalNotes } = data;

        console.log(`📄 Doctor ${doctorId} sharing prescription for appointment ${appointmentId}`);

        // ✅ Get appointment from MongoDB
        const appointmentResult = await getappointment(appointmentId);
        if (!appointmentResult.success) {
          socket.emit("prescription:error", { message: "Appointment not found" });
          return;
        }

        const appointment = appointmentResult.appointment;

        if (appointment.doctor._id.toString() !== doctorId) {
          socket.emit("prescription:error", { message: "Unauthorized to share prescription" });
          return;
        }

        // ✅ Update appointment with prescription in MongoDB
        const updateResult = await updateAppointmentStatus(appointmentId, appointment.status, {
          'consultation.prescription': prescription,
          'consultation.diagnosis': diagnosis,
          'consultation.medicalNotes': medicalNotes,
          'consultation.prescriptionSharedAt': new Date()
        });

        if (updateResult.success) {
          const prescriptionData = {
            prescriptionId: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            appointmentId: appointmentId,
            prescription: prescription,
            diagnosis: diagnosis,
            medicalNotes: medicalNotes,
            createdAt: new Date(),
            doctorInfo: {
              firstName: appointment.doctor.personalInfo?.firstName,
              lastName: appointment.doctor.personalInfo?.lastName,
              specialization: appointment.doctor.specializations?.primarySpecialization
            }
          };

          // Notify patient
          io.to(`patient:${appointment.patient._id}`).emit("prescription:received", prescriptionData);

          socket.emit("prescription:share_confirmed", prescriptionData);
        }

      } catch (error) {
        console.error('❌ Prescription sharing error:', error);
        socket.emit("prescription:error", { message: "Failed to share prescription" });
      }
    });

    // ✅ CHAT SYSTEM (Existing functionality)

    // Send friend request (prevent sending to self)
    socket.on("send_request", (targetUserDetails) => {
      const fromUserId = onlineUsers.get(socket.id);
      const toUserId = targetUserDetails._id;

      if (fromUserId === toUserId) {
        console.log(`❌ User ${fromUserId} tried to send request to themselves`);
        return;
      }

      console.log(`📩 Request from ${fromUserId} to ${toUserId}`);

      const senderDetails = userDetails.get(fromUserId) || {
        _id: fromUserId,
        firstName: "Unknown",
        lastName: "User"
      };

      if (userSockets.has(toUserId)) {
        const recipientSockets = userSockets.get(toUserId);
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit("receive_request", senderDetails);
        });
      }
    });

    // Cancel friend request
    socket.on("cancel_request", ({ targetUserId }) => {
      const fromUserId = onlineUsers.get(socket.id);

      console.log(`🚫 User ${fromUserId} cancelled request to ${targetUserId}`);

      if (userSockets.has(targetUserId)) {
        const recipientSockets = userSockets.get(targetUserId);
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit("request_cancelled", {
            fromUserId,
            message: "Request was cancelled by sender"
          });
        });
      }
    });

    // Accept friend request and create room
    socket.on("accept_request", (user) => {
      const fromUserId = user._id;
      const toUserId = onlineUsers.get(socket.id);

      const room = [fromUserId, toUserId].sort().join("_");
      console.log(`✅ Creating chat room ${room} for users ${fromUserId} and ${toUserId}`);

      // Join all sockets of both users to room
      if (userSockets.has(fromUserId)) {
        userSockets.get(fromUserId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.join(room);
        });
      }

      if (userSockets.has(toUserId)) {
        userSockets.get(toUserId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.join(room);
        });
      }

      // Send room_started to both users
      const roomData = {
        room,
        users: [fromUserId, toUserId],
        otherUser: toUserId
      };

      if (userSockets.has(toUserId)) {
        userSockets.get(toUserId).forEach(socketId => {
          io.to(socketId).emit("room_started", { ...roomData, otherUser: fromUserId });
        });
      }

      if (userSockets.has(fromUserId)) {
        userSockets.get(fromUserId).forEach(socketId => {
          io.to(socketId).emit("room_started", { ...roomData, otherUser: toUserId });
        });
      }
    });

    // Reject friend request
    socket.on("reject_request", (userId) => {
      const rejecterId = onlineUsers.get(socket.id);
      console.log(`❌ ${rejecterId} rejected request from ${userId}`);

      if (userSockets.has(userId)) {
        userSockets.get(userId).forEach(socketId => {
          io.to(socketId).emit("request_rejected", { rejectedBy: rejecterId });
        });
      }
    });

    // Send message in room
    socket.on("send_message", ({ room, message }) => {
      const senderId = onlineUsers.get(socket.id);
      console.log(`💬 Message from ${senderId} in room ${room}: ${message.text}`);

      socket.to(room).emit("receive_message", {
        ...message,
        sender: senderId
      });
    });

    // Leave room
    socket.on("leave_room", ({ room }) => {
      const userId = onlineUsers.get(socket.id);
      console.log(`🚪 User ${userId} leaving room ${room}`);

      // Get room members before leaving
      const roomClients = io.sockets.adapter.rooms.get(room);
      const roomMemberIds = [];

      if (roomClients) {
        roomClients.forEach(socketId => {
          const memberUserId = onlineUsers.get(socketId);
          if (memberUserId && !roomMemberIds.includes(memberUserId)) {
            roomMemberIds.push(memberUserId);
          }
        });
      }

      // Remove all user's sockets from room
      if (userSockets.has(userId)) {
        userSockets.get(userId).forEach(socketId => {
          io.sockets.sockets.get(socketId)?.leave(room);
        });
      }

      // Notify all room members
      roomMemberIds.forEach(memberId => {
        if (userSockets.has(memberId)) {
          userSockets.get(memberId).forEach(socketId => {
            io.to(socketId).emit("user_left_room", {
              room,
              userId,
              message: memberId === userId ? "You left the chat" : "Other user has left the chat",
              resetBothToAdd: true
            });
          });
        }
      });
    });

    // Rejoin room on reconnection
    socket.on("rejoin_room", ({ room, userId }) => {
      console.log(`👤 User ${userId} rejoining room ${room}`);
      socket.join(room);

      const roomClients = io.sockets.adapter.rooms.get(room);
      if (roomClients && roomClients.size > 1) {
        socket.to(room).emit("user_rejoined", { room, userId });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userId = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);

      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);

        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          userDetails.delete(userId);
          console.log(`👤 User ${userId} fully disconnected`);
        } else {
          console.log(`👤 User ${userId} has ${userSockets.get(userId).size} connection(s) remaining`);
        }
      }

      console.log("❌ Socket disconnected:", socket.id, "userId:", userId);
      io.emit("online_users", Array.from(userSockets.keys()));
    });
  });

  // ✅ AUTO-CLEANUP: MongoDB TTL will handle expired appointments automatically
  // Optional: Periodic cleanup for in-memory tracking
  setInterval(async () => {
    try {
      console.log('🧹 Cleaning up in-memory appointment tracking...');

      const now = Date.now();
      let cleanedCount = 0;

      for (const [appointmentId, appointment] of activeAppointments.entries()) {
        // Remove completed, cancelled, or expired appointments from memory
        if (['completed', 'cancelled', 'expired'].includes(appointment.status) ||
          (appointment.status === 'pending' && now > appointment.expiresAt)) {
          activeAppointments.delete(appointmentId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} appointments from memory`);
      }
    } catch (error) {
      console.error('❌ Error during appointment cleanup:', error);
    }
  }, 60 * 60 * 1000); // Run every hour

  console.log('🚀 Socket.io server initialized with MongoDB-based appointment system');
}
