import express from "express";
import { register, login, getCurrentUser } from "../controllers/authController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
const router = express.Router();

// Registration route
router.post("/register", register);

// Login route
router.post("/login", login);

// Get current user route
router.get("/me", isAuthenticated, getCurrentUser);

export default router;