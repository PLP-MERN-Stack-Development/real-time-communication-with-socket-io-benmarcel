import Room from '../models/Rooms.js';
import Message from '../models/Messages.js';
import User from '../models/User.js';

export const roomEventHandlers = (io, socket) => {
  
  // EVENT: Join Room
  
  socket.on("join-room", async (data, callback) => {
    try {
      const { roomId } = data;
      
      //  Validation
      if (!roomId) {
        const error = { error: "Room ID is required" };
        if (callback) callback(error);
        return socket.emit("room-error", error);
      }
      
      //  Check if room exists
      const room = await Room.findById(roomId)
        .populate('members', 'username avatar status');
      
      if (!room) {
        const error = { error: "Room not found" };
        if (callback) callback(error);
        return socket.emit("room-error", error);
      }
      
      //  Add user to room in database (use socket.userId, NOT client's userId!)
      await Room.findByIdAndUpdate(roomId, {
        $addToSet: { members: socket.userId }  // ← Secure: from auth
      });
      
      //  Join Socket.io room (for broadcasting)
      socket.join(roomId);
      
      //  Get recent messages for this room
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('senderId', 'username avatar');
      
      //  Get online users in this room
      const onlineUsers = await User.find({
        _id: { $in: room.members.map(m => m._id) },
        status: 'online'
      }).select('username avatar status');
      
      //  Send room data to the user who joined
      socket.emit("room-joined", {
        room: {
          _id: room._id,
          name: room.name,
          description: room.description,
          members: room.members,
          createdAt: room.createdAt
        },
        messages: messages.reverse(), // Oldest first
        onlineUsers
      });
      
      //  Notify others in the room that someone joined
      socket.to(roomId).emit("user-joined-room", {
        userId: socket.userId,
        username: socket.username,
        roomId,
        timestamp: new Date()
      });
      
      // Send acknowledgment
      if (callback) {
        callback({ 
          success: true, 
          roomId,
          message: "Successfully joined room" 
        });
      }
      
    } catch (error) {
      console.error("Error joining room:", error);
      const errorMsg = { error: "Failed to join room", details: error.message };
      if (callback) callback(errorMsg);
      socket.emit("room-error", errorMsg);
    }
  });
  
  
  // EVENT: Leave Room
  socket.on("leave-room", async (data, callback) => {
    try {
      const { roomId } = data;

      //  Validation
      if (!roomId) {
        const error = { error: "Room ID is required" };
        if (callback) callback(error);
        return socket.emit("room-error", error);
      }

      // Check if room exists
      const room = await Room.findById(roomId);
      if (!room) {
        const error = { error: "Room not found" };
        if (callback) callback(error);
        return socket.emit("room-error", error);
      }
      
      // Remove user from room in database
      await Room.findByIdAndUpdate(roomId, {
        $pull: { members: socket.userId }  // ← Secure: from auth
      });

      // Leave Socket.io room
      socket.leave(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit("user-left-room", {
        userId: socket.userId,
        username: socket.username,
        roomId,
        timestamp: new Date()
      });
      
      // Confirm to user who left
      socket.emit("room-left", {
        roomId,
        message: "Successfully left room"
      });
      
      // Send acknowledgment
      if (callback) {
        callback({ 
          success: true, 
          roomId,
          message: "Successfully left room" 
        });
      }
      
    } catch (error) {
      console.error("Error leaving room:", error);
      const errorMsg = { error: "Failed to leave room", details: error.message };
      if (callback) callback(errorMsg);
      socket.emit("room-error", errorMsg);
    }
  });
  
  
  // EVENT: User Typing Indicator
 
  socket.on("typing", ({ roomId }) => {
    
    // broadcast to others in the room
    socket.to(roomId).emit("user-typing", {
      userId: socket.userId,
      username: socket.username,
      roomId
    });
  });
  
  
 
  // EVENT: User Stop Typing
  
  socket.on("stop-typing", ({ roomId }) => {
    socket.to(roomId).emit("user-stop-typing", {
      userId: socket.userId,
      username: socket.username,
      roomId
    });
  });
  
};