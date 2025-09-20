import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const origins =
  process.env.NODE_ENV === "production"
    ? ["https://try.vercel.app"]
    : ["http://localhost:8080", "http://localhost:5173"];

// ✅ Create a new Socket.IO server instance
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

export { io, app, server, origins };
