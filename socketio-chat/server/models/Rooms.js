import mongoose , {Schema} from "mongoose";

const roomSchema = new Schema({
    name: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: function() { return !this.isGlobal; } },
    isGlobal: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: {type: Date, default: Date.now},
    messageCount: { type: Number, default: 0 }
}, { timestamps: true });

const Room = mongoose.model("Room", roomSchema);

export default Room;
