import Room from "../models/Rooms.js";

const createGlobalRoom = async () => {
    try {
        const existingGlobalRoom = await Room.findOne({ isGlobal: true, name: "Global Chat" });
        if (existingGlobalRoom) {
            console.log("Global room already exists:", existingGlobalRoom);
            return;
        }
        const globalRoom = new Room({
            name: "Global Chat",
            isGlobal: true
        });
        await globalRoom.save();
        console.log("Global room created:", globalRoom);
    } catch (error) {
        console.error("Error creating global room:", error);
    }
};

export default createGlobalRoom;
