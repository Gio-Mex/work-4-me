import express, { json, urlencoded } from "express";
import { Server } from "socket.io";
import http from "http";
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
const io = new Server(server, {
  cors: {
    origin: ["https://work-4-me.netlify.app", "http://localhost:5173"], // Configurare secondo le necessità
    methods: ["GET", "POST"],
  },
});

// Socket.IO event handler
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

  socket.on("registerUser", (userId) => {
    console.log(`📌 registerUser event received for userId: ${userId} with socket ${socket.id}`);

    // Se l'utente è già registrato con un altro socket, lo aggiorniamo
    if (userSockets.has(userId)) {
      console.log(`🔄 Updating connection for user ${userId}`);
    }
  
    userSockets.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  // Quando riceviamo un messaggio
  socket.on("message", (message) => {
    console.log("📩 Message received:", message);
    socket.broadcast.emit("message", message);
  });

  // Quando un utente si disconnette
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

// Funzione per notificare un utente specifico
export const notifyUser = (userId, updatedJob) => {
  console.log(`📢 Trying to notify user ${userId}`);
  console.log("Current userSockets map:", userSockets);

  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit("jobUpdated", updatedJob);
    console.log(`✅ Notification sent to user ${userId} on socket ${socketId}`);
  } else {
    console.log(`⚠️ User ${userId} not connected. Sockets available:`, [...userSockets.entries()]);
  }
};

// Start HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
