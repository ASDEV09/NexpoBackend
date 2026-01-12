import express from "express";
import {
  getBoothsByExpo,
  updateBooth,
  deleteBooth,
  createSingleBooth,
  createMultipleBooths,
  bookBooth,
  getSingleBooth,
  adminAssignBooth,
  adminMakeBoothAvailable,
  getMyBookedBooths,
  getExpoExhibitors,
  getRecommendedBooths,
  updateBookedBooth
} from "../controllers/boothController.mjs";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";
import isExhibitor from "../middleware/isExhibitor.mjs";
const router = express.Router();

/* ===== EXHIBITOR ROUTES (TOP) ===== */
router.get(
  "/exhibitor/my-booths",
  auth,
  isExhibitor,
  getMyBookedBooths
);

/* ===== EXPO ===== */
router.get("/expo/:expoId", getBoothsByExpo);

/* ===== ADMIN ===== */
router.post("/single", auth, isAdmin, createSingleBooth);
router.post("/multiple", auth, isAdmin, createMultipleBooths);
router.put("/:id", auth, isAdmin, updateBooth);
router.delete("/:id", auth, isAdmin, deleteBooth);
router.post("/:id/assign", auth, isAdmin, adminAssignBooth);
router.post("/:id/make-available", auth, isAdmin, adminMakeBoothAvailable);

/* ===== EXHIBITOR BOOK & EDIT ===== */
router.post("/:id/book", auth, isExhibitor, bookBooth);
router.put("/:id/update-details", auth, isExhibitor, updateBookedBooth);

/* ===== SINGLE BOOTH (LAST) ===== */
router.get("/:id", getSingleBooth);

router.get("/expo/:expoId/exhibitors", auth, getExpoExhibitors);
router.get("/expo/:expoId/recommended", auth, getRecommendedBooths);

export default router;
