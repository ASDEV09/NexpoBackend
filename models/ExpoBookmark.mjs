import mongoose from "mongoose";

const expoBookmarkSchema = new mongoose.Schema({
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expo",
        required: true
    }
}, { timestamps: true });

// Prevent duplicate bookmarks
expoBookmarkSchema.index({ attendeeId: 1, expoId: 1 }, { unique: true });

export default mongoose.model("ExpoBookmark", expoBookmarkSchema);
