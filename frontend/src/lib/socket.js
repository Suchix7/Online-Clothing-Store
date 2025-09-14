import { io } from "socket.io-client";

const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:8080"
    : "https://yugtech.onrender.com",
  {
    widthCredentials: true,
  }
);

export default socket;
