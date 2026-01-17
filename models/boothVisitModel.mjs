import mongoose from "mongoose";

const boothVisitSchema = new mongoose.Schema({
  boothId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booth",
    required: true
  },
  expoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expo",
    required: true
  },
  attendeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  visitedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("BoothVisit", boothVisitSchema);
