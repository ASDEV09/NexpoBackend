import express from "express";
import {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession,
    toggleSessionStatus,
    getSessionRegistrations,

    adminRegisterUser,
    updateSessionRegistration,
    deleteSessionRegistration
} from "../controllers/sessionController.mjs";
import { upload } from "../config/cloudinaryConfigUser.mjs";
import auth from "../middleware/middleware.mjs";
import isAdmin from "../middleware/isAdmin.mjs";

const router = express.Router();

// Create Session (Admin only)
router.post(
    "/create",
    auth,
    isAdmin,
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "speakerImages", maxCount: 10 }
    ]),
    createSession
);

// Read Sessions
router.get("/", getAllSessions);
router.get("/:id", getSessionById);

// Update/Delete (Admin only)
router.patch("/:id/status", auth, isAdmin, toggleSessionStatus);

router.put(
    "/:id",
    auth,
    isAdmin,
    upload.fields([
        { name: "bannerImage", maxCount: 1 },
        { name: "speakerImages", maxCount: 10 }
    ]),
    updateSession
);

router.delete("/:id", auth, isAdmin, deleteSession);

// Registrations (Admin only)
router.get("/:id/registrations", auth, isAdmin, getSessionRegistrations);

router.post("/:id/register-user", auth, isAdmin, adminRegisterUser);
router.put("/registrations/:id", auth, isAdmin, updateSessionRegistration); // Update by Registration ID
router.delete("/registrations/:id", auth, isAdmin, deleteSessionRegistration); // Delete Registration

export default router;
