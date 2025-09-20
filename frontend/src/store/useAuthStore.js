import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axiosInstance.js";
import { Navigate } from "react-router-dom";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8080"
    : "https://try.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: false,
  onlineUsers: [],
  socket: null,
  token: null,

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      // get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log(data);
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data.user, token: res.data.token });
      toast.success("Account created successfully");
      // get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },
  loginWithGoogle: async ({ name, email }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/google-login", {
        name,
        email,
      });
      set({ authUser: res.data.user, token: res.data.token });
      toast.success("Logged in successfully");
      // get().connectSocket();
    } catch (error) {
      console.log("Error in googleLogin:", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data, {
        withCredentials: true,
      });
      set({ authUser: res.data.user, token: res.data.token });
      toast.success("Logged in successfully");
      // get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
      Navigate("/auth");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      // get().disconnectSocket();
      set({ token: null });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // connectSocket: () => {
  //   const { authUser } = get();

  //   if (!authUser || get().socket?.connected) return;

  //   const socket = io(BASE_URL, {
  //     query: {
  //       userId: authUser._id,
  //     },
  //   });
  //   socket.connect();

  //   set({ socket: socket });

  //   socket.on("getOnlineUsers", (userIds) => {
  //     set({ onlineUsers: userIds });
  //   });
  // },

  // disconnectSocket: () => {
  //   if (get().socket?.connected) get().socket.disconnect();
  // },
}));
