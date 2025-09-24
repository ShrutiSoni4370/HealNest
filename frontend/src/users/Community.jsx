import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../context/userContext";
import { getAllUsers, getonlineusers } from "../services/authService";
import socket from "../services/socket-client";
import "remixicon/fonts/remixicon.css";

const Community = () => {
  const [open, setOpen] = useState(true);
  const { userData, token, logout } = useUser();
  const [leaveButtonText, setLeaveButtonText] = useState("Leave Chat");

  // Initialize state from localStorage for persistence
  const [activeRoom, setActiveRoom] = useState(() => {
    const saved = localStorage.getItem('activeRoom');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });

  const [status, setStatus] = useState(() => {
    const saved = localStorage.getItem('userStatus');
    return saved ? JSON.parse(saved) : {};
  });

  const [input, setInput] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('activeRoom', JSON.stringify(activeRoom));
  }, [activeRoom]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('userStatus', JSON.stringify(status));
  }, [status]);

  // Store user details for name lookup when allUsers changes
  useEffect(() => {
    if (allUsers.length > 0) {
      const userDetailsMap = {};
      allUsers.forEach(user => {
        userDetailsMap[user._id] = {
          firstName: user.firstName,
          lastName: user.lastName,
          _id: user._id
        };
      });
      localStorage.setItem('userDetails', JSON.stringify(userDetailsMap));
    }
  }, [allUsers]);

  // Enhanced getUserDisplayName function
  const getUserDisplayName = (userId) => {
    if (!userId) return "Unknown User";
    if (userId === userData?.user?._id) return "You";

    let user = allUsers.find(u => u._id === userId);

    if (!user) {
      user = incomingRequests.find(u => u._id === userId);
    }

    if (!user) {
      const storedUserDetails = localStorage.getItem('userDetails');
      if (storedUserDetails) {
        try {
          const userDetailsMap = JSON.parse(storedUserDetails);
          user = userDetailsMap[userId];
        } catch (e) {
          console.error("Error parsing stored user details:", e);
        }
      }
    }

    return user ? `${user.firstName} ${user.lastName}` : `User ${userId.substring(0, 8)}`;
  };

  // Update button text when room changes
  useEffect(() => {
    if (activeRoom && activeRoom.otherUser) {
      const otherUserName = getUserDisplayName(activeRoom.otherUser);
      setLeaveButtonText(`Leave Chat with ${otherUserName}`);
    } else {
      setLeaveButtonText("Leave Chat");
    }
  }, [activeRoom, allUsers]);

  // Fetch users when userData is available
  useEffect(() => {
    if (userData && userData.user && userData.user._id) {
      fetchUsers();

      socket.emit("user_online", {
        userId: userData.user._id,
        firstName: userData.user.firstName,
        lastName: userData.user.lastName
      });

      if (activeRoom) {
        socket.emit("rejoin_room", {
          room: activeRoom.room,
          userId: userData.user._id
        });
      }
    }

    const interval = setInterval(() => {
      if (userData && userData.user && userData.user._id) {
        fetchOnlineUsers();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userData]);

  const fetchUsers = async () => {
    try {
      if (!userData || !userData.user || !userData.user._id) return;

      const token = localStorage.getItem("token");
      const allUsersResponse = await getAllUsers(token);

      const filteredUsers = allUsersResponse.data.filter(user =>
        user._id !== userData.user._id
      );
      setAllUsers(filteredUsers);

      await fetchOnlineUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      if (!userData || !userData.user || !userData.user._id) return;

      const token = localStorage.getItem("token");
      const onlineResponse = await getonlineusers(token);

      const filteredOnlineUsers = onlineResponse.data.filter(user =>
        user._id !== userData.user._id
      );
      const onlineIds = new Set(filteredOnlineUsers.map(user => user._id));
      setOnlineUserIds(onlineIds);
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  // Socket event listeners
  useEffect(() => {
    console.log("🔍 Setting up socket listeners");

    socket.on("receive_request", (user) => {
      console.log("📨 Received friend request from:", user);
      setIncomingRequests((prev) => {
        const exists = prev.some(u => u._id === user._id);
        return exists ? prev : [...prev, user];
      });
    });

    socket.on("request_rejected", ({ rejectedBy }) => {
      console.log("❌ Request rejected by:", rejectedBy);
      setStatus((prev) => ({ ...prev, [rejectedBy]: "Add" }));
    });

    // ✅ NEW: Handle request cancelled
    socket.on("request_cancelled", ({ fromUserId, message }) => {
      console.log("🚫 Request cancelled by:", fromUserId);
      setIncomingRequests((prev) => prev.filter((u) => u._id !== fromUserId));
      alert(message);
    });

    socket.on("room_started", ({ room, users, otherUser }) => {
      console.log("🏠 Room started:", room, "other user:", otherUser);

      const otherUserName = getUserDisplayName(otherUser);

      setActiveRoom({
        room,
        otherUser,
        otherUserName
      });
      setMessages([]);
      setStatus((prev) => ({ ...prev, [otherUser]: "Chatting" }));
    });

    socket.on("receive_message", (message) => {
      console.log("💬 Received message:", message);
      setMessages((prev) => [...prev, message]);
    });

    // ✅ FIXED: Handle user left room with both status reset
    socket.on("user_left_room", ({ room, userId, message, resetBothToAdd }) => {
      console.log("🚪 User left room:", userId);
      setActiveRoom(null);
      setMessages([]);
      setLeaveButtonText("Leave Chat");

      // ✅ FIXED: Reset BOTH users' status to "Add"
      if (resetBothToAdd) {
        setStatus((prev) => {
          const newStatus = { ...prev };
          // Reset status for all users in the conversation
          Object.keys(newStatus).forEach(key => {
            if (newStatus[key] === "Chatting") {
              newStatus[key] = "Add";
            }
          });
          return newStatus;
        });
      }

      alert(message);

      localStorage.removeItem('activeRoom');
      localStorage.removeItem('chatMessages');
    });

    socket.on("room_ended", ({ room }) => {
      console.log("🏠 Room ended:", room);
      setActiveRoom(null);
      setMessages([]);
      setLeaveButtonText("Leave Chat");
      localStorage.removeItem('activeRoom');
      localStorage.removeItem('chatMessages');
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      if (userData?.user?._id) {
        socket.emit("user_online", {
          userId: userData.user._id,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName
        });

        const savedRoom = localStorage.getItem('activeRoom');
        if (savedRoom) {
          try {
            const activeRoomData = JSON.parse(savedRoom);
            socket.emit("rejoin_room", {
              room: activeRoomData.room,
              userId: userData.user._id
            });
          } catch (e) {
            console.error("Error parsing saved room:", e);
          }
        }
      }
    });

    socket.on("user_rejoined", ({ room, userId }) => {
      console.log("👋 User rejoined room:", userId);
    });

    return () => {
      socket.off("receive_request");
      socket.off("request_rejected");
      socket.off("request_cancelled");
      socket.off("room_started");
      socket.off("receive_message");
      socket.off("user_left_room");
      socket.off("room_ended");
      socket.off("connect");
      socket.off("user_rejoined");
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return;

    const msg = {
      id: Date.now(),
      sender: userData.user._id,
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("send_message", {
      room: activeRoom.room,
      message: msg
    });
    setInput("");
  };

  const sendRequest = (user) => {
    const isOnline = onlineUserIds.has(user._id);
    const currentStatus = status[user._id];

    if (!isOnline || activeRoom || currentStatus === "Requested") return;

    setStatus((prev) => ({ ...prev, [user._id]: "Requested" }));

    socket.emit("send_request", {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName
    });
  };

  // ✅ NEW: Cancel request function
  const cancelRequest = (user) => {
    setStatus((prev) => ({ ...prev, [user._id]: "Add" }));
    socket.emit("cancel_request", { targetUserId: user._id });
  };

  const acceptRequest = (user) => {
    setIncomingRequests((prev) => prev.filter((u) => u._id !== user._id));
    socket.emit("accept_request", user);
  };

  const rejectRequest = (user) => {
    setIncomingRequests((prev) => prev.filter((u) => u._id !== user._id));
    socket.emit("reject_request", user._id);
  };

  // ✅ FIXED: leaveRoom function with both status reset
  const leaveRoom = () => {
    if (!activeRoom) return;

    socket.emit("leave_room", { room: activeRoom.room });

    setLeaveButtonText("Leave Chat");

    // Reset both users' status to "Add"
    setStatus((prev) => {
      const newStatus = { ...prev };
      Object.keys(newStatus).forEach(key => {
        if (newStatus[key] === "Chatting") {
          newStatus[key] = "Add";
        }
      });
      return newStatus;
    });

    setActiveRoom(null);
    setMessages([]);

    localStorage.removeItem('activeRoom');
    localStorage.removeItem('chatMessages');
  };

  const getButtonStatus = (user) => {
    const isOnline = onlineUserIds.has(user._id);
    const currentStatus = status[user._id];

    if (!isOnline) return "Offline";
    if (activeRoom) return "Busy";
    if (currentStatus) return currentStatus;
    return "Add";
  };

  const getButtonClass = (user) => {
    const buttonStatus = getButtonStatus(user);
    switch (buttonStatus) {
      case "Add": return "bg-green-500 hover:bg-green-600";
      case "Requested": return "bg-yellow-500 hover:bg-yellow-600";
      case "Chatting": return "bg-blue-600";
      case "Busy": return "bg-gray-500";
      case "Offline": return "bg-red-500";
      default: return "bg-green-500";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('activeRoom');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userDetails');
    logout();
  };

  return (
    <div className="h-screen w-screen flex font-manrope bg-[#F0F4F6]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`side-nav-bar h-full bg-[#70AAB4] flex flex-col justify-between p-6 transition-all duration-300 ${
          open ? "w-72" : "w-20"
        }`}
      >
        <h1 className={`text-3xl text-white font-bold transition-all duration-300 ${!open && "opacity-0 hidden"}`}>
          HealNest
        </h1>

        <div className="h-5/6 flex flex-col gap-6 mt-6">
          {[
            { icon: "ri-dashboard-2-fill", label: "Dashboard", link: "/profile" },
            { icon: "ri-user-line", label: "Calmi (AI Chatbot)", link: "/aicalmi" },
            { icon: "ri-bar-chart-fill", label: "Mood Tracker", link: "/moodtracker" },
            { icon: "ri-chat-smile-2-fill", label: "Journaling", link: "/journaling" },
            { icon: "ri-empathize-line", label: "Self-Care", link: "/selfcare" },
            { icon: "ri-user-community-line", label: "Profile", link: "/profile" },
            { icon: "ri-booklet-line", label: "Doctor Consultation", link: "/doctor-consultation" },
            { icon: "ri-alarm-warning-fill", label: "Crisis Mode", link: "/crisismode" },
          ].map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="text-white flex items-center gap-3 hover:scale-105 transition-transform duration-200"
            >
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
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="navbar h-16 w-full flex items-center px-6 rounded-md shadow-md bg-white/80 backdrop-blur-md"
        >
          <div className="left w-1/2 h-full flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-400 focus:outline-none"
            >
              <i className="ri-align-justify text-2xl"></i>
            </button>
          </div>
          <div className="right w-1/2 h-full flex justify-end items-center gap-6 px-4 text-blue-500">
            <span className="cursor-pointer hover:text-[#70AAB4]">Help</span>
            <span className="cursor-pointer hover:text-[#70AAB4]">Settings</span>
            <span
              className="cursor-pointer hover:text-[#70AAB4]"
              onClick={handleLogout}
            >
              Logout
            </span>
          </div>
        </motion.div>

        <div className="flex-1 flex bg-[#F0F4F6]">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col p-6">
            {activeRoom ? (
              <>
                <div className="mb-4 p-2 bg-white rounded shadow flex justify-between items-center">
                  <span>
                    Chatting with: <span className="font-semibold">{activeRoom.otherUserName || getUserDisplayName(activeRoom.otherUser)}</span>
                    <span className="ml-2 text-sm text-green-600">● Active</span>
                  </span>
                  <button
                    onClick={leaveRoom}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    {leaveButtonText}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-3 max-h-[calc(100vh-200px)]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === userData.user._id ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-2 rounded-lg shadow max-w-xs ${msg.sender === userData.user._id ? "bg-[#70AAB4]/70 text-white" : "bg-gray-200 text-black"}`}>
                        <div className="text-xs opacity-70 mb-1">
                          {getUserDisplayName(msg.sender)}
                        </div>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 shadow focus:outline-[#51899E]"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button onClick={sendMessage} className="px-4 py-2 bg-[#51899E] text-white rounded-full hover:bg-[#70AAB4] transition-colors">
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
                No active chat. Send a request to an online user to start chatting 💬
              </div>
            )}
          </div>

          {/* Right Panel - Two Scrollable Sections */}
          <div className="w-72 bg-[#70AAB4]/90 flex flex-col h-full">
            {/* Users Section - Scrollable */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
              <h2 className="text-white text-xl font-bold mb-4 shrink-0">
                Community Users ({allUsers.length})
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-[#51899E] scrollbar-track-transparent">
                {allUsers.map((user) => {
                  const isOnline = onlineUserIds.has(user._id);
                  const buttonStatus = getButtonStatus(user);

                  return (
                    <div key={user._id} className="flex items-center justify-between p-3 rounded-lg bg-[#51899E]/50 hover:bg-[#51899E]/70 transition-colors shrink-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-medium truncate">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className={`text-xs ${isOnline ? 'text-green-300' : 'text-red-300'}`}>
                          {isOnline ? '● Online' : '○ Offline'}
                        </span>
                      </div>

                      {/* ✅ FIXED: Show Cancel button for Requested status */}
                      {buttonStatus === "Requested" ? (
                        <button
                          className="px-3 py-1 rounded text-sm text-white transition-colors shrink-0 bg-orange-500 hover:bg-orange-600"
                          onClick={() => cancelRequest(user)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          className={`px-3 py-1 rounded text-sm text-white transition-colors shrink-0 ${getButtonClass(user)}`}
                          disabled={buttonStatus === "Offline" || buttonStatus === "Busy" || buttonStatus === "Chatting"}
                          onClick={() => sendRequest(user)}
                        >
                          {buttonStatus}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/30 mx-4 shrink-0"></div>

            {/* Incoming Requests Section - Scrollable */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
              <h2 className="text-white text-xl font-bold mb-4 shrink-0">
                Incoming Requests ({incomingRequests.length})
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-[#51899E] scrollbar-track-transparent">
                {incomingRequests.length === 0 ? (
                  <p className="text-white/70 text-sm">No pending requests</p>
                ) : (
                  incomingRequests.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 rounded-lg bg-[#51899E]/80 shrink-0">
                      <span className="text-white font-medium min-w-0 truncate">
                        {user.firstName} {user.lastName}
                      </span>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => acceptRequest(user)} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-xs text-white rounded transition-colors">
                          Accept
                        </button>
                        <button onClick={() => rejectRequest(user)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-xs text-white rounded transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
