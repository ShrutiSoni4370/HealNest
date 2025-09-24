import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import initSocket from "./config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

(async () => {
  try {
    await connectRedis();
    await connectDB();

    // Initialize socket logic
    initSocket(io);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    console.log("Starting backend...");
  } catch (error) {
    console.error("Failed to start server:", error);
  }
})();
