import express from "express";
import {
  getSchedulesByExpo,
  createSchedule,
  updateSchedulesByExpo,
  deleteSchedule,
  getAllEvents,
  toggleScheduleStatus
} from "../controllers/scheduleController.mjs";

import { upload } from "../config/cloudinaryConfigUser.mjs";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";

const router = express.Router();

router.get("/expo/:expoId", getSchedulesByExpo);

router.post(
  "/",
  auth,
  isAdmin,
  upload.single("image"),
  createSchedule
);

// ✅ BULK UPDATE
router.put(
  "/expo/:expoId",
  auth,
  isAdmin,
  upload.array("eventImages"),
  updateSchedulesByExpo
);
router.patch("/:id/status", auth, isAdmin, toggleScheduleStatus);
router.get("/events", getAllEvents);

router.delete("/:id", auth, isAdmin, deleteSchedule);

export default router;
