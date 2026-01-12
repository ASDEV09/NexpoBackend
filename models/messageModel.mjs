import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["chat", "appointment"],
        default: "chat"
    },
    content: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "read"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Message", messageSchema);
