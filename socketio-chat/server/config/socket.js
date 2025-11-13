
import { Server } from "socket.io";
import { updateUserStatus } from "../sockets/userEvent.js";
import { roomEventHandlers } from "../sockets/roomEvent.js";
import { messageEventHandlers } from "../sockets/sendMessageEvent.js";
export const connectSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);
        // Handle user status updates
        updateUserStatus(socket);
        // Setup room event handlers
        roomEventHandlers(io, socket);
        // Setup message event handlers
        messageEventHandlers(io, socket);
    });

    return io;
};