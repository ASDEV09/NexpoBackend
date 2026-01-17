import mongoose from "mongoose";

const sessionBookmarkSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

export default mongoose.model("SessionBookmark", sessionBookmarkSchema);
