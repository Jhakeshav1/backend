import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
dotenv.config();

import { initSocket } from "./services/socket.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import uploadRoutes from "./routes/uploads.js";
import chatRoutes from "./routes/chats.js";
import adminRoutes from "./routes/admin.js";
import {connectDb} from "../src/config/connectDb.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS === '*' ? true : (process.env.CORS_ORIGINS || 'http://localhost:4000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/listings", listingRoutes);
app.use("/v1/uploads", uploadRoutes);
app.use("/v1/chats", chatRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/uploads", express.static("uploads"));


// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    services: {
      api: 'running',
      socket: 'running',
      database: 'connected'
    }
  });
});

// Serve main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/campusX.html'));
});

// Serve chat test page
app.get("/chat-test", (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/chat-test.html'));
});

// DB connect

// Start sockets
initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
    await connectDb();
    console.log(`Server listening on ${PORT}`)
});
