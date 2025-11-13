import User from "../models/User.js";

// update user status on connection and disconnection
export const updateUserStatus = async (socket) => {
    const userId = socket.userId;
    
    // Handle successful connection (User comes online)
    // This logic executes immediately upon a successful, authenticated connection
    if (userId) {
        try {
            // Set status to online and record lastseen
            await User.findByIdAndUpdate(userId, { online: true, lastseen: Date.now() });
            
            // Notify all other users that this user is now online
            // Use 'socket.broadcast.emit' to send the message to everyone EXCEPT the sender
            socket.broadcast.emit("user-online", { userId });
            console.log(`User ${userId} is now online.`);
        } catch (error) {
            console.error(`Error setting user ${userId} to online:`, error);
        }
    }

    // Handle disconnection (User goes offline)
    // This sets up the listener for when the socket closes
    socket.on("disconnect", async () => {
        // userId is still available from the closure
        if (userId) {
            try {
                // Set status to offline and record lastseen
                await User.findByIdAndUpdate(userId, { online: false, lastseen: Date.now() });
                
                // Notify all other users that this user is now offline
                socket.broadcast.emit("user-offline", { userId });
                console.log(`User ${userId} is now offline.`);
            } catch (error) {
                console.error(`Error setting user ${userId} to offline:`, error);
            }
        }
    });
};