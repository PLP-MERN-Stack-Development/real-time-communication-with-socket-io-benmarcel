import express from 'express';
import { getAllOnlineUsers, getUserById } from '../controllers/usersController.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// Get all online users
router.get('/online', isAuthenticated, getAllOnlineUsers);

// Get user by ID
router.get('/:id', isAuthenticated, getUserById);
export default router;