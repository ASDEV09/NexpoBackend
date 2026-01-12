import mongoose from "mongoose";

const boothSchema = new mongoose.Schema({
  name: String,
  size: String,

  price: {
    type: Number,
    required: true
  },

  expoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expo"
  },
  exhibitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  productsServices: {
    type: [String], // ✅ ARRAY OF STRINGS
    default: []
  },
  
  targetInterests: {
    type: [String],
    default: []
  },

  staff: [
    {
      name: String,
      role: String,
      contact: String
    }
  ]
});


export default mongoose.model("Booth", boothSchema);
