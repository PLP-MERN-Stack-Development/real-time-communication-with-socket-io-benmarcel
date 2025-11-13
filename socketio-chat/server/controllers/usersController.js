import User from "../models/User.js";

export const getAllOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ online: true }).select("username email online lastseen");
        return res.status(200).json(onlineUsers);
    } catch (error) {
        console.error("Error fetching online users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select("username email online lastseen");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
