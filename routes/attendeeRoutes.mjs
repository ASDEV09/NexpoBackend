import express from "express";
import auth from "../middleware/middleware.mjs";
import {
  analytics,
  checkRegistration,
  registerAttendeeByAdmin,
  registerExpo,
  registeruser,
  updateRegistration,
  getMyRegistrations,
  toggleBookmark,
  getBookmarkedExpos
} from "../controllers/attendeeExpoController.mjs";
import { registerSession, checkSessionRegistration, toggleSessionBookmark, getBookmarkedSessions } from "../controllers/attendeeSessionController.mjs";
import { getNotifications, markAsRead } from "../controllers/notificationController.mjs";
import isAdmin from "../middleware/isAdmin.mjs";

const router = express.Router();

router.get("/notifications", auth, getNotifications);
router.post("/notifications/read", auth, markAsRead);

router.get("/my-registrations", auth, getMyRegistrations);
router.get("/bookmarks", auth, getBookmarkedExpos);
router.post("/bookmark/:expoId", auth, toggleBookmark);

router.get("/expo/:expoId/status", auth, checkRegistration);
router.post("/expo/:expoId/register", auth, registerExpo);

router.get("/session/:sessionId/status", auth, checkSessionRegistration);
router.post("/session/:sessionId/register", auth, registerSession);
router.get("/session/bookmarks", auth, getBookmarkedSessions);
router.post("/session/:sessionId/bookmark", auth, toggleSessionBookmark);
router.get("/expo/:expoId/registrations", auth, isAdmin, registeruser)
router.get("/expo/:expoId/analytics", auth, isAdmin, analytics)
router.put(
  "/registration/:id",
  auth,
  isAdmin,
  updateRegistration
);
router.post(
  "/expo/:expoId/register-attendee",
  auth,
  isAdmin,
  registerAttendeeByAdmin
);

export default router;
