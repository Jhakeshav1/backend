import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;

export function initSocket(server) {
  const corsOrigins = process.env.SOCKET_CORS_ORIGINS === '*' ? true : 
    (process.env.SOCKET_CORS_ORIGINS || "http://localhost:4000").split(',');
    
  io = new Server(server, { 
    cors: { 
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true
    } 
  });

  // Optional: JWT authentication middleware (can be disabled for demo)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      // For demo purposes, allow connections without auth
      if (!token) {
        socket.user = { _id: 'demo_user', displayName: 'Demo User' };
        return next();
      }

      // If token provided, verify it
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      return next();
    } catch (err) {
      console.log("Socket auth error:", err.message);
      // For demo, allow connection even with invalid token
      socket.user = { _id: 'demo_user', displayName: 'Demo User' };
      return next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log("User connected:", user.displayName, socket.id);

    // Join user to their personal room
    socket.join(user._id.toString());

    // Handle joining a chat room (for product-specific chats)
    socket.on("joinChat", (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${user.displayName} joined chat ${chatId}`);
    });

    // Handle leaving a chat room
    socket.on("leaveChat", (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${user.displayName} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on("chatMessage", (data) => {
      console.log("Message received:", data);
      
      const messageData = {
        id: Date.now().toString(),
        senderId: user._id,
        senderName: user.displayName,
        text: data.text,
        timestamp: new Date().toISOString(),
        chatId: data.chatId || 'general'
      };

      // Broadcast to the specific chat room
      if (data.chatId) {
        io.to(`chat_${data.chatId}`).emit("chatMessage", messageData);
      } else {
        // Broadcast to all connected clients
        io.emit("chatMessage", messageData);
      }
    });

    // Handle negotiation messages
    socket.on("negotiationMessage", (data) => {
      console.log("Negotiation message:", data);
      
      const messageData = {
        id: Date.now().toString(),
        senderId: user._id,
        senderName: user.displayName,
        text: data.text,
        type: 'negotiation',
        offer: data.offer,
        timestamp: new Date().toISOString(),
        chatId: data.chatId
      };

      if (data.chatId) {
        io.to(`chat_${data.chatId}`).emit("negotiationMessage", messageData);
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userTyping", {
        userId: user._id,
        userName: user.displayName,
        chatId: data.chatId
      });
    });

    socket.on("stopTyping", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userStopTyping", {
        userId: user._id,
        chatId: data.chatId
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", user.displayName, socket.id);
    });
  });

  return io;
}

export function getIo() {
  return io;
}
