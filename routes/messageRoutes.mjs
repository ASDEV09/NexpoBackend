import express from "express";
import { sendMessage, getMyMessages } from "../controllers/messageController.mjs";
import auth from "../middleware/middleware.mjs";

const router = express.Router();

router.post("/send", auth, sendMessage);
router.get("/my", auth, getMyMessages);

export default router;
