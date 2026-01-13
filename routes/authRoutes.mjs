import express from "express";
import {
  registerStep1,
  resendOtp,
  verifyEmailOtp,
  registerFinal,
  login,
  forgotPassword,
  resetPassword,
  getAllExhibitors,
  updateExhibitorProfile,
  updateAdminProfile,
  updateAttendeeProfile,
  deleteUserDocument,
  getAllUsers,
  getMe,
} from "../controllers/authController.mjs";
import { upload } from "../config/cloudinaryConfigUsers.mjs";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";
import isExhibitor from "../middleware/isExhibitor.mjs";

const router = express.Router();

router.post("/register-step1", registerStep1);
router.post("/resend-otp", resendOtp); // ✅ New Route
router.post("/verify-email", verifyEmailOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post(
  "/register-final",
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  registerFinal
);


router.post("/login", login);
router.get("/me", auth, getMe);


router.get("/exhibitors", auth, isAdmin, getAllExhibitors);
router.get("/allusers", auth, isAdmin, getAllUsers);

router.put(
  "/exhibitorprofile",
  auth,
  isExhibitor,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  updateExhibitorProfile
);
router.delete("/delete-document", auth, isExhibitor, deleteUserDocument);

router.put(
  "/admin/profile",
  auth,
  isAdmin,
  upload.single("profilePicture"), // ✅ ADD
  updateAdminProfile
);

router.put(
  "/attendee/profile",
  auth,
  upload.single("profilePicture"), // ✅ ADD
  updateAttendeeProfile
);
export default router;
