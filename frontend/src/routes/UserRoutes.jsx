import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "../users/Login";
import Register from "../users/Register";
import Profile from "../users/Profile_user";
import Aicalmi from "../users/Aicalmi";
import Community from "../users/Community";
import Moodtracker from "../users/Moodtracker";
import ProtectedRoute from "./protectedRoutes";
import DoctorProtectedRoute from "./DoctorProtectedRoutes"; // Import doctor protected route
import ReportCalmi from "../users/Reportcalmi"
import Reportmoods from "../users/Reportmoods";
import Docregis from "../users/Docregis";
import Doclogin from "../users/Doclogin";
import Docprofile from "../users/docprofile";
import VideoConsultation from "../users/VideoConsultation";
import Journaling from "../users/Jourling,";
import DoctorConsult from "../users/Doctorconsult";
import Home from  "../users/Home"



function UserRouters() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element ={<Home/>} />

      {/* Public doctor auth routes */}
      <Route path="/docregis" element={<Docregis />} />
      <Route path="/doclogin" element={<Doclogin />} />

      {/* Protected routes for doctors */}
      <Route
        path="/docprofile"
        element={
          <DoctorProtectedRoute>
            <Docprofile />
          </DoctorProtectedRoute>
        }
      />

      {/* Video consultation routes - accessible to both doctor and patient */}
      <Route
        path="/video-consultation/:appointmentId"
        element={<VideoConsultation />}
      />

      {/* Optional: Alternative route for doctors */}
      <Route
        path="/videoconsultation/:appointmentId"
        element={<VideoConsultation />}
      />


      {/* <Route
        path="/videoconsultation/:appointmentId"
        element={
          <DoctorProtectedRoute>
            <VideoConsultation />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/doctor/video-consultation/:appointmentId"
        element={
          <DoctorProtectedRoute>
            <VideoConsultation />
          </DoctorProtectedRoute>
        }
      /> */}

      {/* Protected routes for users */}
      <Route
        path="/reportcalmi/:reportId"
        element={
          <ProtectedRoute>
            <ReportCalmi />
          </ProtectedRoute>
        }
      />

      <Route
        path="/moodreport/:reportId"
        element={
          <ProtectedRoute>
            <Reportmoods />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctorconsult"
        element={
          <ProtectedRoute>
            <DoctorConsult />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aicalmi"
        element={
          <ProtectedRoute>
            <Aicalmi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moodtracker"
        element={
          <ProtectedRoute>
            <Moodtracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journaling"
        element={
          <ProtectedRoute>
            <Journaling />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default UserRouters;
