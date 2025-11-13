import Room from "../models/Rooms.js";

export const getAllRooms = async (req, res) => {
    try {
        // const userId = req.user.id;
        const rooms = await Room.find().populate("members", "username email");

        // get rooms last messages
        res.status(200).json({rooms});
    } catch (error) {
        res.status(500).json({message: "Server error"});
        console.error("Get all rooms error:", error);
    }
}

export const createRoom = async (req, res) => {
    const {name, memberIds} = req.body;
    try {
        const newRoom = new Room({
            name,
            members: memberIds
        });
        await newRoom.save();
        res.status(201).json({room: newRoom});
    } catch (error) {
        res.status(500).json({message: "Server error"});
        console.error("Create room error:", error);
    }
 }

 export const getRoomDetails = async (req, res) => {
    const {roomId} = req.params;
    try {
        const room = await Room.findById(roomId).populate("members", "username email");
        if (!room) {
            return res.status(404).json({message: "Room not found"});
        }
        res.status(200).json({room});
    } catch (error) {
        res.status(500).json({message: "Server error"});
        console.error("Get room details error:", error);
    }
}
