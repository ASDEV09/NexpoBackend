import express from "express";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";
import { upload } from "../config/cloudinaryConfigUsers.mjs";

import {
  addAdmin,
  addAttendee,
  addExhibitor,
  deleteExhibitorDocument,
  deleteUserByAdmin,
  getAdmins,
  getAttendees,
  getExhibitors,
  updateAdminUser,
  updateAttendeeUser,
  updateExhibitorUserByAdmin,
  searchUserByEmail
} from "../controllers/UserController.mjs";

const router = express.Router();

/* ===== LISTS ===== */
router.get("/admins", auth, getAdmins); // Removed isAdmin to allow Exhibitors/Attendees to see support contact list
router.get("/attendees", auth, isAdmin, getAttendees);
router.get("/exhibitors", auth, isAdmin, getExhibitors);
router.get("/search", auth, isAdmin, searchUserByEmail);

/* ===== UPDATES ===== */
router.put(
  "/admin/:id",
  auth,
  isAdmin,
  upload.single("profilePicture"),
  updateAdminUser
);

router.put(
  "/attendee/:id",
  auth,
  isAdmin,
  upload.single("profilePicture"),
  updateAttendeeUser
);

router.put(
  "/exhibitor/:id",
  auth,
  isAdmin,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  updateExhibitorUserByAdmin
);

// routes/adminUsers.js
router.delete(
  "/exhibitor/:id/document",
  auth,
  isAdmin,
  deleteExhibitorDocument
);

router.delete(
  "/user/:id",
  auth,
  isAdmin,
  deleteUserByAdmin
);


/* ===== ADD ADMIN ===== */
router.post(
  "/admin/add",
  auth,
  isAdmin,
  upload.single("profilePicture"),
  addAdmin
);

/* ===== ADD ATTENDEE ===== */
router.post(
  "/attendee/add",
  auth,
  isAdmin,
  upload.single("profilePicture"),
  addAttendee
);

/* ===== ADD EXHIBITOR ===== */
router.post(
  "/exhibitor/add",
  auth,
  isAdmin,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "documents", maxCount: 10 }
  ]),
  addExhibitor
);

export default router;
