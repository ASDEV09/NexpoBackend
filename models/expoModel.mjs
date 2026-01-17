import mongoose from "mongoose";

const expoSchema = new mongoose.Schema({
  title: String,
  description: String,
  theme: String,
  location: String,

  startDate: Date,
  endDate: Date,

  isPaid: {
    type: Boolean,
    default: false
  },

  price: {
    type: Number,
    default: 0
  },

  entranceInfo: String,

  mapImage: String,
  thumbnailImage: String,

  interests: {
    type: [String],
    default: []
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("Expo", expoSchema);
