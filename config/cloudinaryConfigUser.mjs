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
    let folder = "expo";

    if (file.fieldname === "map") folder = "expo/maps";
    if (file.fieldname === "thumbnail") folder = "expo/thumbnails";
    if (file.fieldname === "eventImages") folder = "expo/events";

    return {
      folder,
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg", "webp"]
    };
  }
});

export const upload = multer({ storage });
