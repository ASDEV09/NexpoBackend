import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ["Session", "Workshop"],
            default: "Session",
            required: true
        },

        // Speaker Details
        // Speaker Details
        speakers: [{
            name: String,
            role: String,
            image: String
        }],
        topic: String,

        // Scheduling
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        location: String,

        // Capacity & Pricing
        isPaid: { type: Boolean, default: false },
        price: { type: Number, default: 0 },
        capacity: { type: Number, default: 0 }, // 0 = Unlimited

        // Media
        bannerImage: String,

        // Optional Link to Expo
        expoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Expo",
            default: null
        },

        interests: {
            type: [String],
            default: []
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
