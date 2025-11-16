
import express from 'express';
import http from 'http';
// import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'; // Assuming you need this for middleware
import dotenv from 'dotenv';
dotenv.config();
import connectDb from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import roomRoutes from './routes/roomRotes.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';
import createGlobalRoom from "./init/globalRoom.js";
import { connectSocketIO } from './config/socket.js';
const app = express();
// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL, // Replace with your client URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};
app.use(cors(corsOptions));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const startServer = async () => {
    try {
        await connectDb();
        await createGlobalRoom();
    } catch (error) {
        console.error("Error starting server:", error); 
    }
}
startServer();

// Initialize Express and HTTP Server

const httpServer = http.createServer(app);

// Initialize Socket.IO Server
const io = connectSocketIO(httpServer);


// This runs BEFORE any of your handlers and attaches socket.userId
io.use((socket, next) => {
    const token = socket.handshake.query.token || socket.handshake.auth.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId; // <-- userId is attached here!
            socket.username = decoded.username
            next();
        } catch (err) {
            next(new Error("Authentication failed: Invalid token."));
        }
    } else {
        next(new Error("Authentication failed: No token provided."));
    }
});

// Auth routes
app.use('/api/auth', authRoutes);
// Message routes
app.use('/api/messages', messageRoutes);
// Room routes
app.use('/api/rooms', roomRoutes);
// User routes
app.use('/api/users', userRoutes);


// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});