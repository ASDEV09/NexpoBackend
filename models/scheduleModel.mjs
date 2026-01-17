import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true
    },

    date: { type: String, required: true },

    eventName: { type: String, required: true },

    description: {
      type: String,
      required: true   // ✅ REQUIRED
    },

    // OPTIONAL FIELDS
    speaker: String,
    topic: String,
    location: String,

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    eventImage: String,

    interests: {
      type: [String],
      default: []
    },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
