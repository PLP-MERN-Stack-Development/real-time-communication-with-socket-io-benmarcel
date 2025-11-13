import Message from "../models/Messages.js";
import Room from "../models/Rooms.js";
import User from "../models/User.js";

export const messageEventHandlers = (io, socket) => {
  // EVENT: Send Message

  socket.on("send-message", async (data, callback) => {
    try {
      const { content, roomId, isPrivate, recipientId } = data;

      // Validation
      if (!content || content.trim() === "") {
        const error = { error: "Message content cannot be empty" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // Validate room/recipient based on message type
      if (isPrivate) {
        if (!recipientId) {
          const error = { error: "Recipient ID required for private messages" };
          if (callback) callback(error);
          return socket.emit("message-error", error);
        }

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          const error = { error: "Recipient not found" };
          if (callback) callback(error);
          return socket.emit("message-error", error);
        }
      } else {
        if (!roomId) {
          const error = { error: "Room ID required for room messages" };
          if (callback) callback(error);
          return socket.emit("message-error", error);
        }

        // Verify room exists and user is member
        const room = await Room.findById(roomId);
        if (!room) {
          const error = { error: "Room not found" };
          if (callback) callback(error);
          return socket.emit("message-error", error);
        }

        if (!room.members.includes(socket.userId) && room.isGlobal !== true) {
          const error = { error: "You are not a member of this room" };
          if (callback) callback(error);
          return socket.emit("message-error", error);
        }
      }

      // Create message (using socket.userId and socket.username!)
      const newMessage = await Message.create({
        senderId: socket.userId, // From authentication!
        senderUsername: socket.username, // From authentication!
        content: content.trim(),
        roomId: isPrivate ? null : roomId,
        isPrivate: isPrivate || false,
        recipientId: isPrivate ? recipientId : null,
        readBy: [socket.userId], // Sender has read their own message
      });

      // Populate sender details for response
      await newMessage.populate("senderId", "username avatar");

      // Update room metadata (if room message)
      if (!isPrivate && roomId) {
        await Room.findByIdAndUpdate(roomId, {
          lastMessageAt: new Date(),
          $inc: { messageCount: 1 },
        });
      }

      // Prepare message data
      const messageData = {
        _id: newMessage._id,
        senderId: newMessage.senderId,
        senderUsername: newMessage.senderUsername,
        content: newMessage.content,
        roomId: newMessage.roomId,
        isPrivate: newMessage.isPrivate,
        recipientId: newMessage.recipientId,
        createdAt: newMessage.createdAt,
        reactions: [],
        readBy: newMessage.readBy,
      };

      // Emit to relevant users
      if (isPrivate) {
        // Private message: send to both sender and recipient
        io.to(recipientId).emit("new-private-message", messageData);
        socket.emit("new-private-message", messageData); // Send to sender too
      } else {
        // Room message: broadcast to all in room
        io.to(roomId).emit("new-room-message", messageData);
      }

      // Send acknowledgment
      if (callback) {
        callback({
          success: true,
          messageId: newMessage._id,
          message: "Message sent successfully",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg = { error: "Failed to send message" };
      if (callback) callback(errorMsg);
      socket.emit("message-error", errorMsg);
    }
  });

  // EVENT: Delete Message

  socket.on("delete-message", async (data, callback) => {
    try {
      const { messageId, roomId, isPrivate } = data;

      //  Find message
      const message = await Message.findById(messageId);
      if (!message) {
        const error = { error: "Message not found" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // Security: Only sender can delete their own message
      if (message.senderId.toString() !== socket.userId) {
        const error = { error: "You can only delete your own messages" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // // Soft delete (set deletedAt instead of actually deleting)
      message.deletedAt = new Date();
      message.content = "[Message deleted]"; // Optional: hide content
      await message.save();

      // Alternative: Hard delete
      // await Message.findByIdAndDelete(messageId);

      // Emit deletion event
      if (isPrivate) {
        io.to(message.recipientId.toString()).emit("message-deleted", {
          messageId,
        });
        socket.emit("message-deleted", { messageId });
      } else if (roomId) {
        io.to(roomId).emit("message-deleted", { messageId });
      }

      // Send acknowledgment
      if (callback) {
        callback({
          success: true,
          messageId,
          message: "Message deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      const errorMsg = { error: "Failed to delete message" };
      if (callback) callback(errorMsg);
      socket.emit("message-error", errorMsg);
    }
  });

  // EVENT: Add Reaction
  socket.on("add-reaction", async (data, callback) => {
    try {
      const { messageId, emoji, roomId, isPrivate } = data;

      // Validate emoji
      if (!emoji) {
        const error = { error: "Emoji is required for reaction" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // Find message
      const message = await Message.findById(messageId);
      if (!message) {
        const error = { error: "Message not found" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        (reaction) =>
          reaction.userId.toString() === socket.userId &&
          reaction.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction (toggle behavior)
        message.reactions = message.reactions.filter(
          (r) => !(r.userId.toString() === socket.userId && r.emoji === emoji)
        );
        await message.save();

        // Emit reaction removed
        if (isPrivate) {
          io.to(message.recipientId.toString()).emit("reaction-removed", {
            messageId,
            userId: socket.userId,
            emoji,
          });
          socket.emit("reaction-removed", {
            messageId,
            userId: socket.userId,
            emoji,
          });
        } else if (roomId) {
          io.to(roomId).emit("reaction-removed", {
            messageId,
            userId: socket.userId,
            emoji,
          });
        }

        if (callback) {
          callback({
            success: true,
            action: "removed",
            message: "Reaction removed",
          });
        }
        return;
      }

      // Add reaction (using socket.userId!)
      message.reactions.push({
        userId: socket.userId, // ← From authentication!
        emoji,
      });
      await message.save();

      // Emit reaction added
      if (isPrivate) {
        io.to(message.recipientId.toString()).emit("reaction-added", {
          messageId,
          userId: socket.userId,
          username: socket.username,
          emoji,
        });
        socket.emit("reaction-added", {
          messageId,
          userId: socket.userId,
          username: socket.username,
          emoji,
        });
      } else if (roomId) {
        io.to(roomId).emit("reaction-added", {
          messageId,
          userId: socket.userId,
          username: socket.username,
          emoji,
        });
      }

      // Send acknowledgment
      if (callback) {
        callback({
          success: true,
          action: "added",
          message: "Reaction added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      const errorMsg = { error: "Failed to add reaction" };
      if (callback) callback(errorMsg);
      socket.emit("message-error", errorMsg);
    }
  });

  // EVENT: Mark Message as Read
  socket.on("mark-message-read", async (data, callback) => {
    try {
      const { messageId, roomId, isPrivate } = data;
      // Notice: NO userId from client! Using socket.userId

      // Find message
      const message = await Message.findById(messageId);
      if (!message) {
        const error = { error: "Message not found" };
        if (callback) callback(error);
        return socket.emit("message-error", error);
      }

      // Check if already read by this user
      if (message.readBy.includes(socket.userId)) {
        // Already read, no need to update
        if (callback) {
          callback({
            success: true,
            alreadyRead: true,
            message: "Message already marked as read",
          });
        }
        return;
      }

      // Add user to readBy array
      message.readBy.push(socket.userId);

      // Check if all recipients have read (for "read by all" indicator)
      let allRead = false;
      if (isPrivate) {
        // Private: both sender and recipient have read
        allRead = message.readBy.length >= 2;
      } // Corrected Logic
      else if (roomId) {
        // Get the current room members
        const room = await Room.findById(roomId).select("members");

        if (room && room.members.length > 0) {
          // Convert Mongoose IDs to strings for reliable comparison
          const readByStrings = message.readBy.map((id) => id.toString());

          // Check if ALL current room members are included in the readBy list.
          // This ensures the message is only marked 'allRead' relative to
          // the current members who are expected to see it.
          const allCurrentMembersHaveRead = room.members.every((memberId) =>
            readByStrings.includes(memberId.toString())
          );

          allRead = allCurrentMembersHaveRead;
        }
        // If room is not found or has no members, allRead remains false.
      }

      if (allRead) {
        message.read = true;
      }

      await message.save();

      // Notify message sender that someone read their message
      const readData = {
        messageId,
        userId: socket.userId,
        username: socket.username,
        allRead,
      };

      if (isPrivate) {
        // Notify sender in private chat
        io.to(message.senderId.toString()).emit("message-read", readData);
      } else if (roomId) {
        // Notify in room (sender will see read receipt)
        io.to(roomId).emit("message-read", readData);
      }

      // Send acknowledgment
      if (callback) {
        callback({
          success: true,
          allRead,
          message: "Message marked as read",
        });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      const errorMsg = { error: "Failed to mark message as read" };
      if (callback) callback(errorMsg);
      socket.emit("message-error", errorMsg);
    }
  });
};
