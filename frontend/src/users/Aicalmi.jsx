import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/userContext";
import { aicalmi, generateReport, fetchReports, getCurrentUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";


const navItems = [
  { icon: "ri-dashboard-2-fill", label: "Dashboard", route: "/dashboard" },
  { icon: "ri-user-line", label: "Profile", route: "/profile" },
  { icon: "ri-bar-chart-fill", label: "Mood Tracker", route: "/mood-tracker" },
  { icon: "ri-chat-smile-2-fill", label: "Journaling", route: "/journaling" },
  { icon: "ri-empathize-line", label: "Self-Care", route: "/self-care" },
  { icon: "ri-user-community-line", label: "Community", route: "/community" },
  { icon: "ri-booklet-line", label: "Doctor Consultation", route: "/doctor-consultation" },
  { icon: "ri-alarm-warning-fill", label: "Crisis Mode", route: "/crisis-mode" },
];

const Aicalmi = ({ onBackToProfile }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reports, setReports] = useState([]);
  const [showChatActions, setShowChatActions] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { userData, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!userData) {
    navigate('/login');
    return null;
  }

  // Load chat from localStorage on component mount
  useEffect(() => {
    loadChatFromStorage();
    loadReports();
  }, [userData]);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatToStorage();
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = document.querySelector('textarea[name="chatInput"]');
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const loadChatFromStorage = () => {
    try {
      const userId = userData?.user?.id || getCurrentUser()?.id;
      if (!userId) {
        console.log("No user ID found, using default message");
        setMessages([
          {
            id: 1,
            sender: "ai",
            text: "Hello! I'm Calmi. Please share whatever is on your mind.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const savedChat = localStorage.getItem(`chat_${userId}`);

      if (savedChat) {
        const parsedChat = JSON.parse(savedChat);
        const messagesWithDates = parsedChat.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log("Loaded chat with", messagesWithDates.length, "messages");
        setMessages(messagesWithDates);
      } else {
        console.log("No saved chat found, using default message");
        setMessages([
          {
            id: 1,
            sender: "ai",
            text: "Hello! I'm Calmi. Please share whatever is on your mind.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading chat from storage:', error);
      setMessages([
        {
          id: 1,
          sender: "ai",
          text: "Hello! I'm Calmi. Please share whatever is on your mind.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const saveChatToStorage = () => {
    try {
      const userId = userData?.user?.id || getCurrentUser()?.id;
      if (userId) {
        localStorage.setItem(`chat_${userId}`, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Error saving chat to storage:', error);
    }
  };

  const clearChatFromStorage = () => {
    try {
      const userId = userData?.user?.id || getCurrentUser()?.id;
      if (userId) {
        localStorage.removeItem(`chat_${userId}`);
      }
    } catch (error) {
      console.error('Error clearing chat from storage:', error);
    }
  };

  // ✅ UPDATED: Removed manual token handling
  const loadReports = async () => {
    try {
      const userId = userData?.user?.id || getCurrentUser()?.id;
      if (!userId) {
        console.log("No user ID found for loading reports");
        return;
      }

      console.log("Loading reports for user:", userId);
      const result = await fetchReports({ userId });

      if (result.success) {
        console.log("Reports loaded successfully:", result.data.reports?.length || 0);
        setReports(result.data.reports || []);
      } else {
        console.error("Failed to load reports:", result.error);
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      setReports([]);
    }
  };

  const handleNavigation = (route) => {
    if (route) {
      navigate(route);
    }
  };

  // ✅ UPDATED: Removed manual token handling
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const tempId = Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: "patient",
        text: userMessage,
        timestamp: new Date()
      },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await aicalmi(userMessage); // ✅ No manual token

      setMessages((prev) => [
        ...prev,
        {
          id: tempId + 2,
          sender: "ai",
          text: aiResponse || "I'm here to listen. Could you tell me more about how you're feeling?",
          timestamp: new Date(),
        },
      ]);

    } catch (error) {
      console.error("AI API Error:", error);

      // Handle auth errors gracefully (interceptors will handle redirect)
      let errorMessage = "I'm experiencing some technical difficulties right now. Please try again in a moment. I'm still here to support you.";

      if (error.response?.status === 401) {
        errorMessage = "Your session seems to have expired. Please refresh the page and try again.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: tempId + 2,
          sender: "ai",
          text: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Removed manual token handling  
  const generateChatReport = async () => {
    // More robust conversation validation
    const conversationMessages = messages.filter(msg =>
      msg.sender === "patient" ||
      (msg.sender === "ai" &&
        !msg.text.includes("Hello! I'm Calmi") &&
        !msg.text.includes("ready for a new conversation") &&
        msg.text.length > 10)
    );

    // Better validation with user feedback
    if (conversationMessages.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: "🤔 I don't see enough conversation to generate a meaningful report. Please share more about how you're feeling first.",
          timestamp: new Date(),
        }
      ]);
      return;
    }

    // Minimum interaction requirement for mental health analysis
    const patientMessages = messages.filter(msg => msg.sender === "patient");
    if (patientMessages.length < 3) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: "📝 To generate a comprehensive mental health report, I need a bit more conversation. Please share at least a few more thoughts or feelings.",
          timestamp: new Date(),
        }
      ]);
      return;
    }

    setIsGeneratingReport(true);
    setShowChatActions(false);

    // Add loading message for better UX
    const loadingMessageId = Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: loadingMessageId,
        sender: "ai",
        text: "🔄 Analyzing our conversation and generating your mental health report... This may take a moment.",
        timestamp: new Date(),
        isLoading: true
      }
    ]);

    try {
      const currentUser = userData?.user || getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        // Remove loading message and show error
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            text: "🔐 Unable to identify user. Please refresh the page and try again.",
            timestamp: new Date(),
          }
        ]);
        setIsGeneratingReport(false);
        return;
      }

      // Generate unique session ID
      const sessionId = `session_${userId}_${Date.now()}`;

      // Format data to match backend expectations
      const reportData = {
        userId: userId,
        sessionId: sessionId,
        chatHistory: messages
          .filter(msg => msg.sender === "patient" || msg.sender === "ai")
          .map(msg => ({
            id: msg.id,
            role: msg.sender === "patient" ? "user" : "assistant",
            content: msg.text,
            text: msg.text,
            timestamp: msg.timestamp,
            sender: msg.sender
          })),
        metadata: {
          totalMessages: messages.length,
          patientMessages: patientMessages.length,
          conversationDuration: messages.length > 0 ?
            new Date() - new Date(messages[0].timestamp) : 0,
          startTime: messages[0]?.timestamp,
          endTime: new Date().toISOString(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        }
      };

      console.log("Generating report with data:", {
        userId: reportData.userId,
        sessionId: reportData.sessionId,
        messageCount: reportData.chatHistory.length
      });

      const reportResponse = await generateReport(reportData); // ✅ No manual token

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      // Handle successful response
      if (reportResponse.success) {
        // Clear chat from storage
        clearChatFromStorage();

        // Show success message with report details
        const alertLevel = reportResponse.data?.analysis_summary?.alert_level ||
          reportResponse.data?.analysis?.alert_level || 'Low';
        const reportId = reportResponse.data?.report_id;

        let successMessage = "✅ Your mental health report has been generated successfully!";

        // Add specific messaging based on alert level
        if (alertLevel === 'Critical') {
          successMessage += "\n\n🚨 IMPORTANT: Your report indicates some concerning patterns. Please consider reaching out to a mental health professional or crisis helpline immediately.";
        } else if (alertLevel === 'High') {
          successMessage += "\n\n⚠️ Your report suggests you might benefit from speaking with a mental health professional.";
        } else if (alertLevel === 'Medium') {
          successMessage += "\n\n💙 Your report shows some areas that might benefit from attention. Consider self-care practices or professional support.";
        } else {
          successMessage += "\n\n😌 Your report shows generally positive patterns. Keep taking care of yourself!";
        }

        successMessage += `\n\nReport ID: ${reportId}\nI'm ready for a new conversation. What would you like to talk about?`;

        setMessages([
          {
            id: Date.now(),
            sender: "ai",
            text: successMessage,
            timestamp: new Date(),
            reportData: {
              reportId: reportId,
              alertLevel: alertLevel,
              sessionId: reportData.sessionId
            }
          },
        ]);

        // Handle crisis response if present
        if (reportResponse.data?.crisis_response?.immediate_action_required) {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: Date.now() + 1,
                sender: "ai",
                text: `🆘 CRISIS RESOURCES:\n• Call or text 988 (Suicide & Crisis Lifeline)\n• Text 'HELLO' to 741741 (Crisis Text Line)\n• Call 911 for immediate emergency help\n\nYou don't have to go through this alone. Help is available 24/7.`,
                timestamp: new Date(),
                isCrisis: true
              }
            ]);
          }, 1000);
        }

        // Reload reports in background
        try {
          await loadReports();
        } catch (reloadError) {
          console.warn("Failed to reload reports:", reloadError);
        }

      } else {
        // Handle failed response
        throw new Error(reportResponse.error || "Unknown error occurred");
      }

    } catch (error) {
      console.error("Failed to generate report:", error);

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      // Determine error type and show appropriate message
      let errorMessage = "❌ Sorry, there was an error generating your report. ";

      if (error.response?.status === 401) {
        errorMessage += "Please refresh the page and try again.";
      } else if (error.message?.includes("timeout") || error.code === 'ECONNABORTED') {
        errorMessage += "The request is taking longer than expected. Please try again.";
      } else if (error.response?.status === 400) {
        errorMessage += "There seems to be an issue with the conversation data. Please start a new conversation.";
      } else if (error.response?.status === 503) {
        errorMessage += "The analysis service is temporarily unavailable. Please try again in a few minutes.";
      } else {
        errorMessage += "Please try again later. Your conversation is still saved.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: errorMessage,
          timestamp: new Date(),
          isError: true
        }
      ]);

    } finally {
      setIsGeneratingReport(false);
    }
  };

  const startNewChat = () => {
    clearChatFromStorage();
    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        text: "Hello! I'm Calmi. Please share whatever is on your mind.",
        timestamp: new Date(),
      },
    ]);
    setShowChatActions(false);
  };

  // ✅ UPDATED: Removed manual token handling

  const viewReport = async (reportId) => {
    try {
      console.log('🔍 viewReport called with reportId:', reportId);
      console.log('🔍 Navigating to:', `/reportcalmi/${reportId}`);

      // ✅ Navigate to the report page
      navigate(`/reportcalmi/${reportId}`);
    } catch (error) {
      console.error("❌ Failed to view report:", error);
      alert("Error loading report. Please try again.");
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check if create report should be enabled
  const canCreateReport = () => {
    const conversationMessages = messages.filter(msg =>
      msg.sender === "patient" ||
      (msg.sender === "ai" && !msg.text.includes("Hello! I'm Calmi") && !msg.text.includes("ready for a new conversation"))
    );
    return conversationMessages.length > 0 && !isGeneratingReport;
  };

  return (
    <div className="h-screen w-screen bg-[#70AAB4]/10 flex font-manrope overflow-hidden">
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
            { icon: "ri-user-line", label: "Profile", link: "/profile" },
            { icon: "ri-bar-chart-fill", label: "Mood Tracker", link: "/moodtracker" },
            { icon: "ri-chat-smile-2-fill", label: "Journaling", link: "/journaling" },
            { icon: "ri-empathize-line", label: "Self-Care", link: "/selfcare" },
            { icon: "ri-user-community-line", label: "Community", link: "/community" },
            { icon: "ri-booklet-line", label: "Doctor Consultation", link: "/doctorconsult" },
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
      {/* Right Section */}
      <div className="flex flex-1 flex-col h-full min-w-0">
        {/* Top Navbar */}
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

        {/* Chat + Reports Section */}
        <div className="flex flex-1 min-h-0">
          {/* Chat Section */}
          <div className="flex flex-col flex-[2] h-full min-w-0 relative">
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#70AAB4]/20 bg-white/50 flex-shrink-0">
              <img
                src="https://ui-avatars.com/api/?name=Calmi&background=70AAB4&color=fff"
                alt="Calmi Avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-bold text-xl text-[#51899E]">Calmi AI</div>
                <div className="text-xs text-gray-400">Mental Health Assistant • Online</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onBackToProfile}
                  className="text-[#51899E] hover:text-[#70AAB4] font-medium px-3 py-2 rounded-lg hover:bg-[#70AAB4]/10 transition-all duration-200 flex items-center gap-2"
                >
                  <i className="ri-arrow-left-line"></i>
                  <span className="hidden sm:inline">Profile</span>
                </button>

                {/* Chat Actions Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowChatActions(!showChatActions)}
                    className="bg-[#51899E] hover:bg-[#70AAB4] text-white p-2 rounded-full transition-all duration-200 hover:scale-105 shadow-md"
                    title="Chat Actions"
                  >
                    <i className="ri-more-2-fill text-lg"></i>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showChatActions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-50"
                      >
                        <button
                          onClick={generateChatReport}
                          disabled={!canCreateReport()}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-200 ${!canCreateReport()
                            ? "text-gray-400 cursor-not-allowed bg-gray-50"
                            : "text-[#51899E] hover:bg-[#70AAB4]/10"
                            }`}
                        >
                          {isGeneratingReport ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#51899E] border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating Report...</span>
                            </>
                          ) : (
                            <>
                              <i className="ri-file-text-line text-lg"></i>
                              <div>
                                <div className="font-medium">Create Report</div>
                                <div className="text-xs text-gray-500">Export this conversation</div>
                              </div>
                            </>
                          )}
                        </button>

                        <hr className="my-1" />

                        <button
                          onClick={startNewChat}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <i className="ri-add-line text-lg"></i>
                          <div>
                            <div className="font-medium">New Conversation</div>
                            <div className="text-xs text-gray-500">Start fresh chat</div>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#70AAB4 transparent'
              }}
            >
              <div className="flex flex-col gap-4 pb-4">
                {messages.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-2"
                  >
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Conversation saved automatically
                    </div>
                  </motion.div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm whitespace-pre-line break-words ${msg.sender === "patient"
                        ? "bg-[#70AAB4] text-white"
                        : "bg-white text-[#51899E] border border-[#D4F1F4]/30"
                        }`}
                    >
                      <div className="text-sm leading-relaxed">{msg.text}</div>
                      <div className={`text-xs mt-2 ${msg.sender === "patient" ? "text-white/70" : "text-[#70AAB4]"
                        }`}>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white text-[#51899E] border border-[#D4F1F4]/30 px-4 py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#70AAB4] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#70AAB4] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-[#70AAB4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">Calmi is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Input Section */}
            <div className="px-6 py-4 bg-white border-t border-[#70AAB4]/20 flex-shrink-0">
              <div className="flex gap-3 items-end max-w-full">
                <div className="flex-1 relative">
                  <textarea
                    name="chatInput"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share what's on your mind..."
                    className="w-full rounded-2xl px-4 py-3 border border-[#70AAB4]/40 focus:outline-none focus:ring-2 focus:ring-[#51899E]/50 bg-white shadow-sm resize-none min-h-[48px] max-h-24 transition-all duration-200"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`rounded-full p-3 shadow-md font-semibold transition-all duration-200 flex items-center justify-center flex-shrink-0 ${!input.trim() || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#51899E] text-white hover:bg-[#70AAB4] hover:scale-105 active:scale-95"
                    }`}
                >
                  <i className="ri-send-plane-2-fill text-lg"></i>
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send • Shift + Enter for new line
              </div>
            </div>

            {/* Overlay to close dropdown */}
            {showChatActions && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChatActions(false)}
              />
            )}
          </div>

          {/* Reports Section */}
          <div className="w-[400px] bg-white flex flex-col shadow-lg border-l  border-[#51899E]/20 flex-shrink-0">
            <div className="p-6 border-b border-[#51899E]/20 flex-shrink-0">
              <div className="flex flex-col items-center">
                <img
                  src={`https://ui-avatars.com/api/?name=${userData?.user?.firstName || 'User'}+${userData?.user?.lastName || ''}&size=80&background=51899E&color=fff`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-4 border-[#A3D7DC] mb-3 shadow-md"
                />
                <div className="font-bold text-lg text-[#51899E] text-center">
                  {userData?.user?.firstName || 'User'} {userData?.user?.lastName || ''}
                </div>
                <div className="text-sm text-[#70AAB4]">Patient</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto   p-6">

              <style jsx>{` div::-webkit-scrollbar {
                 display: none; /* Chrome, Safari, Opera */}`}</style>
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-[#51899E] text-lg mb-2">Chat Reports</h3>

                {reports.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <i className="ri-file-list-3-line text-4xl mb-4 text-[#70AAB4]"></i>
                    <p className="text-sm">No reports generated yet.</p>
                    <p className="text-xs mt-2 text-gray-400">Start a conversation and create your first report!</p>
                  </div>
                ) : (
                  reports.map((report, i) => (
                    <motion.div
                      key={report._id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="bg-gradient-to-br from-[#70AAB4]/60 to-[#D4F1F4]/30 backdrop-blur-lg border border-white/30 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[#51899E] text-sm">Report {i + 1}</h4>
                        <span className="text-xs text-[#70AAB4]">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed mb-3">
                        Chat session from {new Date(report.createdAt).toLocaleString()}
                      </p>
                      <button
                        onClick={() => viewReport(report._id)}
                        className="w-full bg-[#51899E] text-white py-2 px-3 rounded-lg hover:bg-[#70AAB4] transition-colors duration-200 text-sm font-medium"
                      >
                        View Report
                      </button>
                    </motion.div>
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

export default Aicalmi;
