import express, { json, urlencoded } from "express";
import { Server } from "socket.io";
import http, { get } from "http";
import cors from "cors";
import { connect } from "mongoose";
import { config } from "dotenv";
import userRoute from "./routes/user.route.js";
import jobRoute from "./routes/job.route.js";

config();

const app = express();
const userSockets = new Map();

// Middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

// Routes
app.use("/user", userRoute);
app.use("/jobs", jobRoute);

// Database connection
const dbUrl = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=W4M`;

connect(dbUrl)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// HTTP server
const server = http.createServer(app);

// Socket.IO configuration
export const io = new Server(server, {
  cors: {
    origin: ["https://work-4-me.netlify.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// New WebSocket connection handler
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  // Register user event handler
  socket.on("registerUser", (userId) => {
    // Remove old socket
    if (userSockets.has(userId)) {
      const oldSocketId = userSockets.get(userId);
      if (oldSocketId !== socket.id) {
        io.sockets.sockets.get(oldSocketId)?.disconnect(true);
      }
    }
    // Add new socket
    userSockets.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  // Message event handler
  socket.on("message", (message) => {
    socket.broadcast.emit("message", message);
  });

  // Disconnect event handler
  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Get user socketId function
export const getUserSocketId = (userId) => {
  const userIdStr = String(userId);
  if (userSockets.has(userIdStr)) {
    const socketId = userSockets.get(userIdStr);
    console.log(`✅ Found socket ${socketId} for user ${userIdStr}`);
    return socketId;
  } else {
    console.log(`❌ User ${userIdStr} not found in userSockets.`);
  }
};

// Notify user function
export const notifyUser = (userId, job) => {
  const socketId = getUserSocketId(userId);
  if (io.sockets.sockets.has(socketId)) {
    // Emit a jobNotification event for the user
    io.to(socketId).emit("jobNotification", job);
  } else {
    console.log(`⚠️ Socket ${socketId} not found for user ${userId}`);
  }
};

// Start HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
