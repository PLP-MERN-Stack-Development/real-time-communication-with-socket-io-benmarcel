import express from "express";
import { getPrivateMessages, getRoomMessages } from "../controllers/messageController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

// Route to get messages for a specific room
router.get("/rooms/:roomId", isAuthenticated, getRoomMessages);

// Route to get private messages between users
router.get("/private/:recipientId", isAuthenticated, getPrivateMessages);

export default router;