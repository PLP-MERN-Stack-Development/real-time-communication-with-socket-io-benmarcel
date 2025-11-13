import mongoose, {Schema} from "mongoose";

const conversationSchema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
});


const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;