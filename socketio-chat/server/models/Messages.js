import mongoose,{Schema} from "mongoose";

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderUsername: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
    isPrivate: { type: Boolean, default: false },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    timeSent: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions:[{userId: { type: Schema.Types.ObjectId, ref: "User" }, emoji: String}],
    deletedAt: { type: Date, default: null }
    
}, { timestamps: true });

// index for faster retrieval by roomId and timeSent
messageSchema.index({ roomId: 1, timeSent: -1 });
messageSchema.index({ recipientId: 1, timeSent: -1 });
messageSchema.index({content: "text"});

const Message = mongoose.model("Message", messageSchema);

export default Message;
