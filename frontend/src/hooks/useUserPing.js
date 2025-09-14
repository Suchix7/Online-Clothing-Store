import { useEffect } from "react";
import socket from "../lib/socket.js";
import { v4 as uuidv4 } from "uuid";

const userId =
  localStorage.getItem("guest_id") ||
  (() => {
    const newId = uuidv4();
    localStorage.setItem("guest_id", newId);
    return newId;
  })();

export function useUserPing(authUser) {
  useEffect(() => {
    const sendPing = () => {
      if (authUser?._id) {
        socket.emit("auth-ping", authUser._id);
      } else {
        socket.emit("guest-ping", userId);
      }
    };

    // Send ping immediately
    sendPing();

    // Repeat every 15 seconds
    const interval = setInterval(sendPing, 15000);

    return () => {
      clearInterval(interval);
      // Optional: send one final ping before unload
      sendPing();
    };
  }, [authUser, socket]);
}
