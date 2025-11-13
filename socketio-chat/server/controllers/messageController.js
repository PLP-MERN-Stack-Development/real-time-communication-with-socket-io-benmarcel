import Messages from "../models/Messages.js";
import Rooms from "../models/Rooms.js";

export const getRoomMessages = async (req, res) => {

    // validate roomId
    const {roomId} = req.params;
    if (!roomId) {
        return res.status(400).json({message: "Room ID is required"});
    }
    // check if room exists
    const room =  await Rooms.findById(roomId);
    if (!room) {
        return res.status(404).json({message: "Room not found"});
    }
    // check if user has access to the room
    const isAMember = await Rooms.findOne({_id: roomId, members: { $in: [req.user._id] }});
    if (!isAMember) {
        return res.status(403).json({message: "Access denied to this room"});
    }
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        // retrieve messages for the room with pagination
        const messages = await Messages.find({roomId}).populate("sender", "username").skip(skip).limit(limit).sort({createdAt: -1});
        res.status(200).json({messages});
    } catch (error) {
        res.status(500).json({message: "Server error"});
        console.error("Get room messages error:", error);
    }

}

export const getPrivateMessages = async (req, res) => {
    const senderId = req.user.id;
    // validate senderId
    if (!senderId) {
        return res.status(400).json({message: "Sender ID is required"});
    }
    // validate recipientId
    const {recipientId} = req.params;
    if (!recipientId) {
        return res.status(400).json({message: "Recipient ID is required"});
    }
    try{
        const privateMessages = await Messages.find({
            isPrivate: true,
            $or: [
                { sender: senderId, recipientId: recipientId },
                { sender: recipientId, recipientId: senderId }
            ]
        }).populate("sender", "username").populate("recipientId", "username").sort({createdAt: -1});
        res.status(200).json({messages: privateMessages});
    } catch (error) {
        res.status(500).json({message: "Server error"});
        console.error("Get private messages error:", error);
    }
    
}