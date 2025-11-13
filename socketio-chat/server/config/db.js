import mongoose from "mongoose";

const connnectDb = async () => {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI, {
               
            });
           
            console.log("MongoDB connected");
        } else {
            console.error("MongoDB connection error: MONGO_URI is not defined");
        }
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}
export default connnectDb;