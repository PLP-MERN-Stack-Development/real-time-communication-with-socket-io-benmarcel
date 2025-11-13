import express from "express";
import { createRoom, getAllRooms, getRoomDetails } from "../controllers/roomController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

// Route to create a new room
router.post("/", isAuthenticated, createRoom);

// Route to get all rooms
router.get("/", isAuthenticated, getAllRooms);

// Route to get a specific room by ID
router.get("/:roomId", isAuthenticated, getRoomDetails);

export default router;