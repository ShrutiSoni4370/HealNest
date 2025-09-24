import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import 'react-phone-input-2/lib/style.css';
import PhoneInput from "react-phone-input-2";
import {
  registerUser,
  generateEmailOtp,
  generatePhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "../services/authService";
import { useUser } from "../context/userContext"; // Add this import

const Register = () => {
  const navigate = useNavigate();
  const { login } = useUser(); // Add this hook
  
  const [data, setData] = useState({
    email: "",
    countryCode: "",
    phoneNumber: "",
    emailOtp: "",
    phoneOtp: "",
    firstName: "",
    lastName: "",
    username: "",
    gender: "",
    dob: "",
    emergencyContact: { name: "", phone: "", relation: "" },
    password: "",
    confirmPassword: "",
  });

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("emergency")) {
      const key = name.replace("emergency", "").toLowerCase();
      setData({
        ...data,
        emergencyContact: { ...data.emergencyContact, [key]: value },
      });
    } else {
      setData({ ...data, [name]: value });
    }
  };

  const handlePhoneChange = (value, country) => {
    const dialCode = country.dialCode;
    const number = value.slice(dialCode.length);
    setData({
      ...data,
      countryCode: `+${dialCode}`,
      phoneNumber: number,
    });
    console.log(number)
  };

  const registerUserController = async () => {
    if (!emailVerified || !phoneVerified)
      return alert("Please verify both email and phone first");
    if (data.password !== data.confirmPassword)
      return alert("Passwords do not match");

    try {
      const userData = await registerUser(data);
      console.log("📥 Registration response:", userData);

      // Handle registration success similar to login
      if (userData.token && userData.message === 'Registration successful') {
        console.log("💾 Force storing token after registration...");
        
        // Store token and user data
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userData', JSON.stringify(userData.user));
        
        // Verify storage
        const stored = localStorage.getItem('token');
        console.log("🔍 Token stored verification:", stored ? 'SUCCESS' : 'FAILED');
        
        // Update context
        login(userData);
        
        alert("✅ Registered Successfully!");
        console.log("✅ User registered and logged in successfully");
        navigate("/profile");
        
      } else {
        // Fallback for different response structure
        alert("✅ Registered Successfully!");
        console.log("✅ User registered successfully");
        navigate("/profile");
      }
      
    } catch (err) {
      console.error("❌ Registration error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Registration Failed");
    }
  };

  const sendEmailOtpHandler = async () => {
    if (!data.email) return alert("Enter email");
    try {
      await generateEmailOtp(data.email);
      alert("Email OTP sent!");
      setEmailOtpSent(true);
    } catch {
      alert("❌ Failed to send Email OTP");
    }
  };

  const sendPhoneOtpHandler = async () => {
    if (!data.countryCode || !data.phoneNumber)
      return alert("Enter phone number");
    try {
      await generatePhoneOtp(data.countryCode + data.phoneNumber);
      alert("Phone OTP sent!");
      setPhoneOtpSent(true);
    } catch {
      alert("❌ Failed to send Phone OTP");
    }
  };

  const verifyEmailOtpHandler = async () => {
    try {
      await verifyEmailOtp(data.email, data.emailOtp);
      alert("✅ Email verified!");
      setEmailVerified(true);
    } catch {
      alert("❌ Invalid Email OTP");
    }
  };

  const verifyPhoneOtpHandler = async () => {
    try {
      await verifyPhoneOtp(data.countryCode + data.phoneNumber, data.phoneOtp);
      alert("✅ Phone verified!");
      setPhoneVerified(true);
    } catch {
      alert("❌ Invalid Phone OTP");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await registerUserController();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br p-4">
      <form
        onSubmit={onSubmit}
        className="bg-[rgba(18, 97, 150, 1)] bg-[#abd4db] rounded-2xl shadow-lg p-6 w-full max-w-4xl grid grid-cols-2 gap-6"
      >
        {/* Column 1 */}
        <div className="space-y-4">
          <div>
            <h1 className="text-5xl font-bold text-white font-josefin">Register</h1>
            {/* Already have account link */}
            <p className="text-white font-josefin mt-2">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-teal-500 hover:text-teal-100 underline font-medium"
              >
                Login here
              </Link>
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-white font-medium font-epunda">
              Email {emailVerified && <span className="text-green-500">✓</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={onChange}
                disabled={emailVerified}
                className="flex-1 px-3 py-1.5 border font-josefin rounded-full bg-gray-100 focus:outline-none"
                placeholder="you@example.com"
                required
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={sendEmailOtpHandler}
                  disabled={emailOtpSent}
                  className={`px-4 py-1.5 text-white font-josefin rounded-full ${emailOtpSent ? "bg-gray-400" : "bg-teal-500 hover:bg-teal-600"}`}
                >
                  {emailOtpSent ? "Sent" : "OTP"}
                </button>
              )}
            </div>
            {emailOtpSent && !emailVerified && (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="emailOtp"
                  value={data.emailOtp}
                  onChange={onChange}
                  maxLength={6}
                  className="flex-1 px-3 font-josefin py-1.5 border rounded-full focus:outline-none"
                  placeholder="Enter OTP"
                />
                <button
                  type="button"
                  onClick={verifyEmailOtpHandler}
                  className="px-4 py-1.5 bg-blue-500 font-josefin text-white rounded-full hover:bg-blue-600"
                >
                  Verify
                </button>
              </div>
            )}
          </div>

          {/* First Name */}
          <input
            type="text"
            name="firstName"
            value={data.firstName}
            onChange={onChange}
            className="w-full font-josefin px-3 py-1.5 border rounded-full focus:outline-none"
            placeholder="First Name"
            required
          />

          {/* Last Name */}
          <input
            type="text"
            name="lastName"
            value={data.lastName}
            onChange={onChange}
            className="w-full font-josefin px-3 py-1.5 border rounded-full focus:outline-none"
            placeholder="Last Name"
            required
          />

          {/* Emergency Name */}
          <input
            type="text"
            name="emergencyName"
            value={data.emergencyContact.name}
            onChange={onChange}
            className="w-full px-3 font-josefin py-1.5 border rounded-full focus:outline-none"
            placeholder="Emergency Contact Name"
            required
          />

          {/* Emergency Relation */}
          <input
            type="text"
            name="emergencyRelation"
            value={data.emergencyContact.relation}
            onChange={onChange}
            className="w-full px-3 py-1.5 font-josefin border rounded-full focus:outline-none"
            placeholder="Relation"
            required
          />
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <div />

          {/* Phone Input */}
          <div className="space-y-1">
            <label className="text-white font-epunda font-medium">
              Phone {phoneVerified && <span className="text-green-500">✓</span>}
            </label>
            <PhoneInput
              country={"in"}
              value={data.countryCode + data.phoneNumber}
              onChange={handlePhoneChange}
              disabled={phoneVerified}
              inputClass="!w-full !pl-12 !pr-3 !py-1.5 !border !rounded-full"
              containerClass="!w-full"
              buttonClass="!bg-white !border-none"
              inputStyle={{ width: "100%" }}
            />
            {!phoneVerified && !phoneOtpSent && (
              <button
                type="button"
                onClick={sendPhoneOtpHandler}
                className="mt-2 px-4 py-1.5 bg-teal-500 font-josefin text-white rounded-full hover:bg-teal-600"
              >
                Send OTP
              </button>
            )}
            {phoneOtpSent && !phoneVerified && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  name="phoneOtp"
                  value={data.phoneOtp}
                  onChange={onChange}
                  maxLength={6}
                  className="flex-1 px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
                  placeholder="Enter OTP"
                />
                <button
                  type="button"
                  onClick={verifyPhoneOtpHandler}
                  className="px-4 py-1.5 bg-blue-500 text-white font-josefin rounded-full hover:bg-blue-600"
                >
                  Verify
                </button>
              </div>
            )}
          </div>

          {/* Username */}
          <input
            type="text"
            name="username"
            value={data.username}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
            placeholder="Username"
            required
          />

          {/* Gender */}
          <select
            name="gender"
            value={data.gender}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
            required
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          {/* Emergency Phone */}
          <input
            type="tel"
            name="emergencyPhone"
            value={data.emergencyContact.phone}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
            placeholder="Emergency Contact Phone"
            required
          />

          {/* DOB */}
          <input
            type="date"
            name="dob"
            value={data.dob}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            value={data.password}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
            placeholder="Password"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            value={data.confirmPassword}
            onChange={onChange}
            className="w-full px-3 py-1.5 border font-josefin rounded-full focus:outline-none"
            placeholder="Confirm Password"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="col-span-2 py-3 font-josefin text-white bg-teal-500 rounded-full font-semibold hover:bg-teal-600"
        >
          Create Account
        </button>

        {/* Alternative: Login Link at bottom */}
        <div className="col-span-2 text-center">
          <p className="text-white font-josefin capitalize">
             get back to home?{" "}
            <Link 
              to="/home" 
              className="text-teal-500 hover:text-teal-100 underline font-medium"
            >
              Home
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
