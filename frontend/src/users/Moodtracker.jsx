import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  getquestions,
  analyzemood,
  getmoodhistory,
  getmoodreport,
  getmoodanalytics,
  deletereport,
} from "../services/authService"; // Adjust import path as needed
import { useUser } from "../context/userContext";





const MoodTrackerFull = () => {
  // Initialize state with localStorage data to prevent flickering
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('moodTracker_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('moodTracker_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [analytics, setAnalytics] = useState(() => {
    const saved = localStorage.getItem('moodTracker_analytics');
    return saved ? JSON.parse(saved) : {};
  });

  const [responses, setResponses] = useState([]);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [detailedReport, setDetailedReport] = useState(null); // For viewing single full report
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const { userData, logout } = useUser();


  // Fetch questions, mood history, and analytics on mount
  useEffect(() => {
    // Only show loading if we have no cached data
    const hasCache = questions.length > 0 || history.length > 0 || Object.keys(analytics).length > 0;

    if (!hasCache) {
      setLoading(true);
    }

   

    Promise.all([
      getquestions(),
      getmoodhistory({ limit: 10 }),
      getmoodanalytics({ days: 30 }),
    ])
      .then(([questionsData, historyData, analyticsData]) => {
        const newQuestions = questionsData.data?.questions || [];
        const newHistory = historyData.data?.reports || [];
        const newAnalytics = analyticsData.data || {};

        setQuestions(newQuestions);
        setHistory(newHistory);
        setAnalytics(newAnalytics);

        // Cache the fresh data
        localStorage.setItem('moodTracker_questions', JSON.stringify(newQuestions));
        localStorage.setItem('moodTracker_history', JSON.stringify(newHistory));
        localStorage.setItem('moodTracker_analytics', JSON.stringify(newAnalytics));

        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load initial data.");
        setLoading(false);
      });
  }, []);

   const handleLogout = () => {
      logout();
      navigate("/login");
    };

  // Handle answering question and progress
  const handleAnswer = (answer) => {
    setResponses([...responses, { question: questions[step], answer }]);
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  // Submit all answers for AI analysis
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const answerValues = responses.map((r) => r.answer);
      const data = await analyzemood(answerValues);
      setReport(data);
      setDetailedReport(null); // Clear detailed if showing previous
      setLoading(false);

      // Refresh history to include the new report
      const historyData = await getmoodhistory({ limit: 10 });
      const newHistory = historyData.data?.reports || [];
      setHistory(newHistory);
      localStorage.setItem('moodTracker_history', JSON.stringify(newHistory));
    } catch {
      setError("Could not analyze mood.");
      setLoading(false);
    }
  };

  // View detailed report from history
  const handleViewReport = async (reportId) => {
    navigate(`/moodreport/${reportId}`);
    setReport(null);
  };

  // Delete report from history
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deletereport(reportId);
      const updatedHistory = history.filter((item) => item._id !== reportId);
      setHistory(updatedHistory);

      // Update cache
      localStorage.setItem('moodTracker_history', JSON.stringify(updatedHistory));

      // Clear detailed view if it was showing deleted report
      if (detailedReport && detailedReport._id === reportId) {
        setDetailedReport(null);
      }
    } catch {
      setError("Failed to delete report.");
    }
  };

  // Reset questionnaire
  const handleResetQuestionnaire = () => {
    setResponses([]);
    setStep(0);
    setReport(null);
    setError("");
  };

  return (
    <div className="flex h-screen font-manrope ">
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
            { icon: "ri-profile-fill", label: "Profile", link: "/profile" },
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        {/* <div className="h-16 w-full flex items-center justify-between px-6 bg-white shadow-md rounded-b-xl">
          <div className="flex items-center gap-4 w-1/5 h-[100%] justify-between">
            <button onClick={() => setOpen(!open)} className="text-gray-600 focus:outline-none mb-6 pt-6">
              <i className="ri-align-justify text-2xl"></i>
            </button>
            <h1 className="text-xl font-semibold">Mood Tracker</h1>
          </div>

          <div className="flex gap-6">
            {["Help", "Settings", "Logout"].map((item, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.1, color: "#70AAB4" }}
                className="relative cursor-pointer"
              >
                {item}
                <motion.span
                  className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#70AAB4]"
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>
        </div> */}
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
          <div className="right w-1/2 h-full flex justify-end items-center gap-6 px-4 text-blue-500">
            <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]">Help</span>
            <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]">Settings</span>
            <span className="cursor-pointer hover:text-[#04bfe0] text-[14px]" onClick={handleLogout}>Logout</span>
          </div>
        </motion.div>
        {/* Loading / Error UI - Only show if no cached data */}
        {(loading && questions.length === 0 && history.length === 0) && (
          <div className="p-6 text-center text-gray-600">
            <div className="animate-pulse">Loading mood tracker...</div>
          </div>
        )}

        {(!loading && error) && (
          <div className="p-6 text-center text-red-600 bg-red-50 mx-6 mt-6 rounded-lg">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Layout */}
        {(questions.length > 0 || history.length > 0) && (
          <div className="flex-1 flex gap-6 bg-gray-50 p-6 overflow-hidden">
            {/* Left Panel: Questionnaire or Generate button */}
            {!report && questions.length > 0 && (
              <div className="flex-[1] bg-white rounded-2xl shadow-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    AI Mood Questionnaire
                  </h2>
                  {responses.length > 0 && (
                    <button
                      onClick={handleResetQuestionnaire}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {responses.length < questions.length ? (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Question {step + 1} of {questions.length}</span>
                        <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#70AAB4] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-lg font-medium mb-6 text-gray-700">
                      {questions[step].question}
                    </p>

                    <div className="flex gap-3 flex-wrap">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleAnswer(value)}
                          className="flex-1 min-w-[60px] py-3 rounded-xl bg-[#70AAB4] text-white hover:bg-[#51899E] transition-all duration-200 font-medium"
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Rate from 1 (Strongly Disagree) to 5 (Strongly Agree)
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="ri-checkbox-circle-line text-4xl text-green-500 mb-2"></i>
                      <p className="text-lg text-gray-700">All questions completed!</p>
                    </div>
                    <button
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className="px-8 py-3 bg-[#51899E] text-white font-semibold rounded-xl hover:bg-[#70AAB4]/90 transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <i className="ri-loader-4-line animate-spin"></i>
                          Generating...
                        </span>
                      ) : (
                        "Generate Mood Report"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Middle Panel: Show generated or detailed report */}
            {(report || detailedReport) && (
              <div className="flex-[1] bg-white rounded-2xl shadow-lg p-6 flex flex-col overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Mood {detailedReport ? "Detailed Report" : "Analysis"}
                  </h2>
                  <button
                    onClick={() => {
                      setReport(null);
                      setDetailedReport(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <div className="overflow-auto">
                  <ul className="text-gray-700 space-y-3">
                    {Object.entries(detailedReport || report).map(([key, value]) => (
                      <li key={key} className="border-b border-gray-100 pb-2">
                        <strong className="capitalize text-gray-800 block mb-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </strong>
                        <span className="text-gray-600 text-sm">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!detailedReport && (
                  <button
                    onClick={handleResetQuestionnaire}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Take Another Assessment
                  </button>
                )}
              </div>
            )}

            {/* Right Panel: History of past reports */}
            <div className="flex-[1] bg-white rounded-2xl shadow-lg p-6 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Past Reports</h2>
                <span className="text-sm text-gray-500">{history.length} total</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <i className="ri-file-list-3-line text-4xl mb-2 block"></i>
                  <p>No past reports available.</p>
                  <p className="text-xs mt-1">Complete a mood assessment to see your history.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {history.map((item) => (
                    <div key={item._id} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-800 text-sm">
                          {new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewReport(item._id)}
                            className="bg-[#70AAB4] text-white px-3 py-1 rounded text-xs hover:bg-[#51899E] transition"
                          >
                            <i className="ri-eye-line mr-1"></i>
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteReport(item._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.summary || item.aiAnalysis?.summary || item.aiAnalysis?.moodTrend || "Mood analysis completed"}
                      </p>
                      {item.aiAnalysis?.level && (
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.aiAnalysis.level === 'high' ? 'bg-red-100 text-red-700' :
                            item.aiAnalysis.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {item.aiAnalysis.level} risk
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTrackerFull;
