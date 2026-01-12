import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    enum: ["admin", "attendee", "exhibitor"]
  },

  // 🔐 EMAIL VERIFICATION
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: String,
  otpExpiry: Date,

  profilePicture: {
    type: String,
    default: "https://res.cloudinary.com/dpkazflwy/image/upload/v1768156891/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH_lvncbo_drhzi6.jpg"
  },
  phone: String,
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  dob: String,

  // 🧠 AI INTERESTS
  interests: {
    type: [String],
    default: []
  },

  // exhibitor
  companyName: String,
  productsServices: String,
  companyLogo: {
    type: String,
    default: "https://res.cloudinary.com/dpkazflwy/image/upload/v1768156890/images_oknyty_vqtukf.png"
  },
  documents: [String],

  status: {
    type: String,
    default: "unapproved"
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("User", userSchema);
