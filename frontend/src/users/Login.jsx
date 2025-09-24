import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useUser } from "../context/userContext";

const LoginPage = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userData = await loginUser({ emailOrUsername, password });
      console.log("📥 Login response:", userData);

      if (userData.token && userData.message === 'Login successful') {
        console.log("💾 Force storing token...");

        localStorage.setItem('token', userData.token);
        localStorage.setItem('userData', JSON.stringify(userData.user));

        const stored = localStorage.getItem('token');
        console.log("🔍 Token stored verification:", stored ? 'SUCCESS' : 'FAILED');

        login(userData);

        console.log("✅ User logged in successfully");
        navigate("/profile");

      } else {
        console.error("❌ Login failed - missing token or invalid message:", userData);
        setError("Login failed - invalid response from server");
      }

    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err.message);
      setError("Invalid email/username or password");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left side with the meditation image background */}
      <div 
        className="flex-1 relative flex items-center justify-start bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1628909586533-77fc0df08f61?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#70AAB4]/60 via-[#70AAB4]/40 to-transparent via-50% to-75%"></div>

        {/* Content overlay */}
        <div className="relative z-10 text-left text-white p-10 pl-15 max-w-lg">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-5 font-story drop-shadow-md">
              HealNest
            </h1>
            <h2 className="text-3xl font-semibold mb-6 font-josefin drop-shadow-sm">
              Find Your Inner Peace
            </h2>
          </div>

          <div className="text-lg leading-relaxed space-y-5">
            <p className="font-josefin drop-shadow-sm">
              <strong>Begin your journey</strong> to mental wellness with mindful practices
            </p>
            <p className="font-josefin drop-shadow-sm">
              <strong>Discover balance</strong> through meditation and self-care
            </p>
            <p className="font-josefin drop-shadow-sm">
              <strong>Connect with yourself</strong> in a safe, supportive space
            </p>
            <p className="font-josefin drop-shadow-sm">
              <strong>Grow and heal</strong> at your own pace
            </p>
          </div>
        </div>
      </div>

      {/* Right side (Login Form) */}
      <div className="flex-1 max-w-lg px-15 py-20 flex flex-col justify-center p-20 bg-white">
        <h1 className="text-3xl font-bold mb-4 font-josefin text-gray-700">
          Welcome Back
        </h1>
        <p className="mb-10 text-gray-500 font-josefin">
          Continue your journey to mental wellness and inner peace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700 font-josefin">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Enter your email or username"
              className="w-full px-5 py-3.5 rounded-full bg-gray-100 border-2 border-transparent text-base font-josefin outline-none transition-all duration-300 ease-in-out focus:border-[#70AAB4]"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 font-josefin">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-5 py-3.5 rounded-full bg-gray-100 border-2 border-transparent text-base font-josefin outline-none transition-all duration-300 ease-in-out focus:border-[#70AAB4]"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-josefin p-2.5 bg-red-50 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-4 text-base font-semibold text-white bg-[#70AAB4] rounded-full cursor-pointer font-josefin transition-all duration-300 ease-in-out shadow-lg hover:bg-[#5a9ca6] hover:-translate-y-0.5 hover:shadow-xl transform"
          >
            Begin Your Journey
          </button>
        </form>

        <p className="mt-5 text-center font-josefin text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#70AAB4] font-semibold no-underline transition-colors duration-300 hover:text-[#5a9ca6]"
          >
            Sign up
          </Link>
        </p>

        <div className="text-center mt-4">
          <p className="text-gray-400 font-josefin text-sm">
            Get back to home?{" "}
            <Link
              to="/home"
              className="text-[#70AAB4] underline font-medium transition-colors duration-300 hover:text-[#5a9ca6]"
            >
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
