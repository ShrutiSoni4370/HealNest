import React, { useState } from "react";
import "remixicon/fonts/remixicon.css";
import { motion } from "framer-motion"; // ✅ KEEP Framer Motion for hover effects
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/userContext";

const Profile_user = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { userData, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!userData) {
    navigate('/login');
    return null;
  }

  const user = userData;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Not set';
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-200 flex font-manrope">
      {/* Sidebar - ✅ REMOVED initial animation but KEPT transition */}
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
      <div className="flex-1 h-full bg-zinc-50 flex flex-col transition-all duration-300">
        {/* Navbar - ✅ REMOVED initial animation */}
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

        {/* Content Section */}
        <div className="flex-1 flex">
          {/* left Section */}
          <div className="w-[50%] bg-zinc-50 p-4 flex-1 flex  flex-col">

            <div className="h-[100%] w-[100] rounded bg-white shadow-lg ">
              {/* Left Greeting Section - ✅ REMOVED initial animation */}
              <motion.div
                className="text-left w-1/2  h-full p-10 pl-16 text-black"
              >

                <div className=" w-96 h-36 px-7 border-2 border-zinc-200 pt-4">
                  <h1 className="text-3xl  w-56 text-slate-600 font-josefin">
                    Hi, {userData?.user?.firstName} {userData?.user?.lastName}
                  </h1>
                  <h2 className="text-gray-500 w-48  font-quicksand pb-7">Welcome to your profile</h2>
                </div>
                 
                <motion.div
                  className="mt-6 w-96 gap-8 px-7 pt-4 border-2 border-zinc-200  flex flex-col  text-lg"
                >
                    <h1 className="font-semibold text-slate-600 text-2xl font-josefin">User Information</h1>
                  <div className="w-[100%]  flex gap-4" >
                  
                    <p className="font-semibold text-slate-500 font-josefin">Full Name</p>
                    <p className="text-gray-500 text-[15px] font-quicksand">
                      {userData?.user?.firstName} {userData?.user?.lastName}
                    </p>
                  </div>
                  <div className="w-[100%]  flex gap-4" >
                    <p className="font-semibold text-slate-500 font-josefin ">Date of Birth</p>
                    <p className="text-gray-500 text-[15px] font-quicksand">
                      {formatDate(userData?.user?.dob)}
                    </p>
                  </div>
                  <div className="w-[100%]  flex gap-4">
                    <p className="font-semibold text-slate-500 font-josefin">Contact</p>
                    <p className="text-gray-500 text-[15px] font-quicksand">
                      {userData?.user?.countryCode} {userData?.user?.phoneNumber}
                    </p>
                  </div>
                  <div className="w-[100%]  flex gap-4">
                    <p className="font-semibold text-slate-500 font-josefin">Email ID</p>
                    <p className="text-gray-500 text-[15px] font-quicksand">
                      {userData?.user?.email}
                    </p>
                  </div>
                </motion.div>

              </motion.div>

              {/* Right Profile Details - ✅ REMOVED initial animation */}

            </div>

          </div>

          {/* right Section (Reports) */}
          <div className="w-[50%]  p-4  flex flex-col bg-zinc-50 ">

            <div className="flex-1 w-[98%] p-6 rounded h-[98%]  bg-white  shadow-lg">
              <h2 className="text-xl font-bold font-quicksand text-gray-500 mb-4">Reports</h2>
              <div className=" flex  flex-col gap-6 ">
                {[
                  {
                    title: "AI-Generated Report",
                    text: "Your mood trend this week.",
                    color: "from-[#70AAB4]/60 to-[#D4F1F4]/30",
                  },
                  {
                    title: "Mood Analysis Report",
                    text: "Overview of last month's logs.",
                    color: "from-[#A1C4FD]/60 to-[#C2E9FB]/30",
                  },
                  {
                    title: "DOCTOR Report",
                    text: "Consultation summary & advice.",
                    color: "from-[#FFDEE9]/60 to-[#B5FFFC]/30",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    // ✅ REMOVED: initial={{ opacity: 0, y: 40 }}
                    // ✅ REMOVED: animate={{ opacity: 1, y: 0 }}
                    // ✅ REMOVED: transition={{ duration: 0.6, delay: i * 0.2 }}
                    whileHover={{ scale: 1.05 }} // ✅ KEPT: hover animation
                    className={`bg-gradient-to-br ${card.color} backdrop-blur-lg border border-white/30 p-6 rounded-xl shadow-lg transition-all duration-300 cursor-pointer`}
                  >
                    <h3 className="font-semibold text-white">{card.title}</h3>
                    <p className="text-gray-700 mt-2">{card.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile_user;
