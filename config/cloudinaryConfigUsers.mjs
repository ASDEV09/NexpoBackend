import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = "users";

    if (file.fieldname === "profilePicture") folder = "users/profilePicture";
    if (file.fieldname === "companyLogo") folder = "users/logos";
    if (file.fieldname === "documents") folder = "users/documents";

    return {
      folder,
      resource_type: "auto", // ✅ allows PDF, DOC, images
    };
  }
});

export const upload = multer({ storage });
