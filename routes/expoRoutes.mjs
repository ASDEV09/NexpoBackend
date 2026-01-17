import express from "express";
import {
  createExpo,
  getAllExpos,
  getSingleExpo,
  updateExpo,
  toggleExpoStatus
} from "../controllers/expoController.mjs";
import { upload } from "../config/cloudinaryConfigUser.mjs";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";

const router = express.Router();

router.post(
  "/create",
  auth,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "map", maxCount: 1 },
    { name: "eventImages", maxCount: 20 }
  ]),
  createExpo
);

router.get("/", getAllExpos);
router.get("/:id", getSingleExpo);

router.patch("/:id/status", auth, isAdmin, toggleExpoStatus);

router.put(
  "/:id",
  auth,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "map", maxCount: 1 }
  ]),
  updateExpo
);

export default router;
