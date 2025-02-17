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

  socket.on("message", (message) => {
    console.log("Message received:", message);

    socket.broadcast.emit("message", message);
  });

  socket.on("ping", (msg) => {
    console.log("Ping received:", msg);
    socket.emit("pong", "still-alive");
  });

  socket.on("disconnect", () => {
    console.log("WebSocket connection closed:", socket.id);
  });
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
