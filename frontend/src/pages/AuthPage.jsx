import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance.js";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromCheckout = location.state?.fromCheckout || false;
  const [isLogin, setIsLogin] = useState(true);
  const { login, isLoggingIn, checkAuth, authUser } = useAuthStore();
  const { signup, isSigningUp } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authUser) {
      navigate(fromCheckout ? "/checkout" : "/profile", {
        state: { fromAuth: location.pathname === "/auth" },
      });
    }
  }, [authUser]);

  // Forgot password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Only for signup: check if passwords match
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast("Passwords don't match!");
      navigate("/auth");
      return;
    }

    try {
      await login(formData); // It will throw on failure, or set auth state
      navigate(fromCheckout ? "/checkout" : "/", {
        state: {
          fromAuth: location.pathname === "/auth",
        },
      }); // SUCCESS redirect
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      console.log(formData);
      await signup(formData);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setForgotPasswordMode(false); // Reset forgot password mode when toggling
  };

  // Forgot password handlers
  const handleForgotPassword = () => {
    setForgotPasswordMode(true);
    setOtpSent(false);
    setForgotPasswordEmail(formData.email || ""); // Pre-fill with current email if available
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email");
      return;
    }
    try {
      // Simulate sending OTP (in real app, call your backend API)
      setLoading(true);
      const response = await axiosInstance.post("/forgot-password", {
        forgotPasswordEmail,
      });
      toast.success(`OTP sent to ${forgotPasswordEmail}`);
      setOtpSent(true);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to send OTP");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    try {
      // Simulate OTP verification (in real app, call your backend API)
      const response = await axiosInstance.post("/verify-code", {
        email: forgotPasswordEmail,
        code: otp,
      });

      toast.success(response.data.message);
      setOtpSent("verified");
    } catch (error) {
      toast.error("Failed to verify OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      // Simulate password reset (in real app, call your backend API)
      const response = await axiosInstance.post("/reset-password", {
        email: forgotPasswordEmail,
        newPassword,
      });
      toast.success(response.data.message);
      setForgotPasswordMode(false);
      setIsLogin(true);
      // Clear the form
      setForgotPasswordEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleBackToLogin = () => {
    setForgotPasswordMode(false);
    setOtpSent(false);
  };

  return (
    <div className="bg-white min-h-80vh">
      <Navbar />
      <div className="flex justify-center items-center p-4 md:p-20">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {forgotPasswordMode ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="bg-white p-8 rounded-3xl shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={handleBackToLogin}
                      className="text-gray-600 hover:text-black"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-center text-gray-800 flex-grow">
                      {otpSent === "verified"
                        ? "Reset Password"
                        : otpSent
                        ? "Verify OTP"
                        : "Forgot Password"}
                    </h2>
                  </div>

                  {otpSent === "verified" ? (
                    <form className="space-y-6" onSubmit={handleResetPassword}>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                          placeholder="Enter new password"
                          required
                          minLength="6"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                          placeholder="Confirm new password"
                          required
                          minLength="6"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        Reset Password
                      </button>
                    </form>
                  ) : otpSent ? (
                    <form className="space-y-6" onSubmit={handleVerifyOtp}>
                      <p className="text-gray-600 text-center">
                        We've sent a 6-digit code to {forgotPasswordEmail}
                      </p>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Enter OTP
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                          placeholder="Enter 6-digit OTP"
                          required
                          maxLength="6"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        Verify OTP
                      </button>
                      <p className="text-center text-sm text-gray-500">
                        Didn't receive code?{" "}
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-black font-medium"
                        >
                          Resend
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form className="space-y-6" onSubmit={handleSendOtp}>
                      <p className="text-gray-600 text-center">
                        Enter your email to receive a password reset OTP
                      </p>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) =>
                            setForgotPasswordEmail(e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" /> Send OTP
                          </>
                        ) : (
                          <>Send OTP</>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            ) : isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="bg-white p-8 rounded-3xl shadow-xl">
                  <div className="flex justify-center mb-8">
                    <motion.div
                      className="relative w-20 h-20 bg-black rounded-full flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-center text-gray-600 mb-8">
                    Login to your account
                  </p>

                  <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="example@email.com"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                            minLength="6"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                          // onChange={handleRemember}
                        />
                        <label
                          htmlFor="remember-me"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Remember me
                        </label>
                      </div>
                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="font-medium text-black hover:text-gray-700"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Log In"
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.button>
                  </form>
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">
                          or continue with
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{" "}
                    <button
                      onClick={toggleAuthMode}
                      className="text-black font-medium hover:underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="bg-white p-8 rounded-3xl shadow-xl">
                  <div className="flex justify-center mb-8">
                    <motion.div
                      className="relative w-20 h-20 bg-black rounded-full flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    Create Account
                  </h2>
                  <p className="text-center text-gray-600 mb-8">
                    Join us today
                  </p>

                  <form className="space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="John Doe"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="phoneNumber"
                            type="number"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="John Doe"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.003 5.884A1 1 0 012.999 5h2a1 1 0 01.95.69l1.3 3.9a1 1 0 01-.217 1.03l-1.516 1.517a11.037 11.037 0 005.516 5.516l1.517-1.516a1 1 0 011.03-.217l3.9 1.3a1 1 0 01.69.95v2a1 1 0 01-.884.993C16.243 19.983 3.757 19.983 2.003 5.884z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="example@email.com"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                            minLength="8"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <div className="relative">
                          <input
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                            minLength="8"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Sign Up
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.button>
                  </form>

                  <p className="text-center text-gray-600 mt-6">
                    Already have an account?{" "}
                    <button
                      onClick={toggleAuthMode}
                      className="text-black font-medium hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
