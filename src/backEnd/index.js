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

// Connessione al database
const dbUrl = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=W4M`;

connect(dbUrl)
  .then(() => {
    console.log("Connessione al database avvenuta con successo.");
  })
  .catch((err) => {
    console.error("Errore di connessione al database:", err);
  });

// Creazione del server HTTP
const server = http.createServer(app);

// Configurazione di Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Configurare secondo le necessità
  },
});

// Evento di connessione Socket.IO
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

    // Invia il messaggio a tutti i client tranne il mittente
    socket.broadcast.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Utente disconnesso");
  });

// Avvio del server HTTP e WebSocket
const PORT = process.env.VITE_PORT; // Porta configurabile tramite variabile d'ambiente
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
