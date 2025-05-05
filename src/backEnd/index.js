import express, { json, urlencoded } from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { connect } from "mongoose";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import userRoute from "./routes/user.route.js";
import jobRoute from "./routes/job.route.js";

config();

const app = express();
const userSockets = new Map();

// Middleware
app.use(cors({
  origin: ["https://work-4-me.netlify.app", "http://localhost:5173"],
  credentials: true
}));
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

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

  // Wait for client to send the token
  socket.on("authenticate", (token) => {

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Disconnect old socket if user was already connected
      if (userSockets.has(userId)) {
        const oldSocketId = userSockets.get(userId);
        if (oldSocketId !== socket.id) {
          io.sockets.sockets.get(oldSocketId)?.disconnect(true);
        }
      }

      // Store the new socket
      userSockets.set(userId, socket.id);
      console.log(`✅ Authenticated user ${userId} with socket ${socket.id}`);

      // Send confirmation to the client
      socket.emit("authenticated", { success: true });
    } catch (err) {
      console.warn("❌ Invalid token on socket connection");
      socket.emit("unauthorized", { message: "Invalid token" });
      socket.disconnect();
    }
  });

  // Handle disconnection
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
