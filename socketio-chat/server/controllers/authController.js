import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // validate inputs
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        // if user exists, return error
        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // if not, create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        // generate JWT token for automatic login after registration
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // return success response
        res.status(201).json({ token, message: "User registered successfully", user: { id: newUser._id, username: newUser.username, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        console.error("Registration error:", error);
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // validate inputs
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        // check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found Please register" });
        }
        // check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // generate JWT token
        const token = jwt.sign({ userId: user._id , username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // return success response with token
        res.status(200).json({ token, message: "Login successful", user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        console.error("Login error:", error);
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        console.error("Get current user error:", error);
    }
}