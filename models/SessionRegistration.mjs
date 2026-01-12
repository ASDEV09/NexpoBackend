import mongoose from "mongoose";

const sessionRegistrationSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },

    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    serial: {
        type: String,
        unique: true
    },

    fullName: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    city: {
        type: String
    },

    status: {
        type: String,
        enum: ["registered", "cancelled"],
        default: "registered"
    }

}, { timestamps: true });

export default mongoose.model("SessionRegistration", sessionRegistrationSchema);
