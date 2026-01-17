import mongoose from "mongoose";

const expoRegistrationSchema = new mongoose.Schema({
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

export default mongoose.model("ExpoRegistration", expoRegistrationSchema);
