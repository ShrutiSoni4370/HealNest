import React, { useState } from "react";
import { motion } from "framer-motion";

const navItems = [
  { icon: "ri-dashboard-2-fill", label: "Dashboard" },
  { icon: "ri-user-line", label: "Profile" },
  { icon: "ri-bar-chart-fill", label: "Mood Tracker" },
  { icon: "ri-chat-smile-2-fill", label: "Journaling" },
  { icon: "ri-empathize-line", label: "Self-Care" },
  { icon: "ri-user-community-line", label: "Community" },
  { icon: "ri-booklet-line", label: "Doctor Consultation" },
  { icon: "ri-alarm-warning-fill", label: "Crisis Mode" },
];

// Example data for reports
const reportsData = {
  calmi: [
    { title: "Calmi Report 1", date: "06 Sept 2025", text: "Patient shared thoughts about stress." },
    { title: "Calmi Report 2", date: "10 Sept 2025", text: "Patient shared improvement in mood." },
  ],
  doctor: [
    { title: "Doctor Feedback 1", date: "05 Sept 2025", text: "Recommended daily journaling." },
    { title: "Doctor Feedback 2", date: "12 Sept 2025", text: "Follow-up suggested next week." },
  ],
  moodtracker: [
    { title: "Mood Tracker 1", date: "08 Sept 2025", text: "Patient feeling happy and calm." },
    { title: "Mood Tracker 2", date: "14 Sept 2025", text: "Patient reported slight anxiety." },
  ],
};

const Journaling = () => {
  const [open, setOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("calmi");

  const renderReports = () => {
    return reportsData[activeCategory].map((report, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: i * 0.1 }}
        className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[#51899E]">{report.title}</h3>
          <span className="text-sm text-gray-400">{report.date}</span>
        </div>
        <p className="text-gray-700 mt-2">{report.text}</p>
      </motion.div>
    ));
  };

  return (
    <div className="flex h-screen font-manrope">
      {/* Sidebar */}
      <motion.div
        animate={{ width: open ? "18rem" : "4rem" }}
        className="h-full bg-[#70AAB4] text-white p-4 flex flex-col"
      >
        <button
          onClick={() => setOpen(!open)}
          className="text-white focus:outline-none mb-6"
        >
          <i className="ri-align-justify text-2xl"></i>
        </button>
        <nav className="flex flex-col gap-6">
          {navItems.map((item, index) => (
            <a key={index} href="#" className="flex items-center gap-2">
              <i className={`${item.icon} text-xl`}></i>
              {open && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Navbar */}
        <div className="h-16 w-full flex items-center justify-between px-6 bg-white shadow-md rounded-b-xl">
          <h1 className="text-xl font-semibold">Journaling Reports</h1>
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
        </div>

        {/* Report Categories */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveCategory("calmi")}
              className={`px-4 py-2 rounded-xl font-semibold ${
                activeCategory === "calmi"
                  ? "bg-[#51899E] text-white"
                  : "bg-white text-[#51899E] border border-[#70AAB4]"
              }`}
            >
              AI Chatbot Calmi
            </button>
            <button
              onClick={() => setActiveCategory("doctor")}
              className={`px-4 py-2 rounded-xl font-semibold ${
                activeCategory === "doctor"
                  ? "bg-[#51899E] text-white"
                  : "bg-white text-[#51899E] border border-[#70AAB4]"
              }`}
            >
              Doctor Consultation
            </button>
            <button
              onClick={() => setActiveCategory("moodtracker")}
              className={`px-4 py-2 rounded-xl font-semibold ${
                activeCategory === "moodtracker"
                  ? "bg-[#51899E] text-white"
                  : "bg-white text-[#51899E] border border-[#70AAB4]"
              }`}
            >
              Mood Tracker
            </button>
          </div>

          {/* Reports List */}
          <div>{renderReports()}</div>
        </div>
      </div>
    </div>
  );
};

export default Journaling;
