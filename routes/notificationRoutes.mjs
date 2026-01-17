import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController.mjs";
import auth from "../middleware/middleware.mjs";

const router = express.Router();

router.get("/", auth, getNotifications); // Get my notifications
router.put("/read", auth, markAsRead);   // Mark all as read

export default router;
