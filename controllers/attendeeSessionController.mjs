import mongoose from "mongoose";
import Session from "../models/sessionModel.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";
import SessionBookmark from "../models/SessionBookmark.mjs";
import User from "../models/userModel.mjs";
import { generateSessionPass } from "../utils/generateSessionPass.mjs";
import { sendSessionPass } from "../utils/sendSessionPass.mjs";
import crypto from "crypto";
import Expo from "../models/expoModel.mjs";
import ExpoRegistration from "../models/ExpoRegistration.mjs";
import { generateExpoPass } from "../utils/generateExpoPass.mjs";
import { sendAttendeePass } from "../utils/attendeePassMailer.mjs";

// Register for Session (Used by both Free and Paid flows)
export const registerSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const attendeeId = req.user.id;
        const { name, phone, city } = req.body;

        // 1. Check if already registered
        const exists = await SessionRegistration.findOne({ sessionId, attendeeId });
        if (exists) {
            return res.status(400).json({ message: "Already registered for this session" });
        }

        const attendee = await User.findById(attendeeId);
        const session = await Session.findById(sessionId).populate("expoId");

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (!session.isActive) {
            return res.status(400).json({ message: "Registration is disabled for this session" });
        }

        // Check Parent Expo Status
        if (session.expoId && !session.expoId.isActive) {
            return res.status(400).json({ message: "Registration is disabled (Expo is inactive)" });
        }

        // 2. Check Capacity (if set)
        if (session.capacity > 0) {
            const count = await SessionRegistration.countDocuments({ sessionId, status: "registered" });
            if (count >= session.capacity) {
                return res.status(400).json({ message: "Session is fully booked" });
            }
        }

        const serial = crypto.randomBytes(4).toString("hex").toUpperCase();

        // 3. Create Registration
        const registration = await SessionRegistration.create({
            sessionId,
            attendeeId,
            email: attendee.email, // Added required field
            serial,
            fullName: name || attendee.name,
            phone,
            city
        });

        // 4. Generate Pass
        const { buffer, fileName } = await generateSessionPass({
            session,
            attendeeName: registration.fullName,
            attendeeEmail: attendee.email,
            serial
        });

        // 5. Send Email
        await sendSessionPass({
            to: attendee.email,
            session,
            pdfBuffer: buffer,
            passName: fileName
        });

        // 6. Handle Additional Expo Registration (Upsell)
        const { additionalExpoId } = req.body;
        if (additionalExpoId) {
            try {
                // Check if already registered
                const expoExists = await ExpoRegistration.findOne({ expoId: additionalExpoId, attendeeId });
                if (!expoExists) {
                    const expo = await Expo.findById(additionalExpoId);
                    if (expo) {
                        const expoSerial = crypto.randomBytes(4).toString("hex").toUpperCase();
                        const expoReg = await ExpoRegistration.create({
                            expoId: additionalExpoId,
                            attendeeId,
                            serial: expoSerial,
                            fullName: name || attendee.name,
                            phone,
                            city
                        });

                        const { buffer: eBuffer, fileName: eFileName } = await generateExpoPass({
                            expo,
                            attendeeName: expoReg.fullName,
                            attendeeEmail: attendee.email,
                            serial: expoSerial
                        });

                        await sendAttendeePass({
                            to: attendee.email,
                            expo,
                            pdfBuffer: eBuffer,
                            passName: eFileName
                        });
                    }
                }
            } catch (eErr) {
                console.error("Expo Upsell Error:", eErr);
            }
        }

        res.json({
            success: true,
            message: "Registration successful. Tickets sent to email."
        });

    } catch (err) {
        console.error("SESSION REG ERROR:", err);
        res.status(500).json({ message: "Registration failed" });
    }
};

// Check if user is registered
export const checkSessionRegistration = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const attendeeId = req.user.id;

        const reg = await SessionRegistration.findOne({ sessionId, attendeeId });
        res.json({ registered: !!reg });
    } catch (err) {
        res.status(500).json({ message: "Error checking registration" });
    }
};

/* ================= BOOKMARKING ================= */
export const toggleSessionBookmark = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const attendeeId = req.user.id;

        const existing = await SessionBookmark.findOne({ sessionId, attendeeId });

        if (existing) {
            await SessionBookmark.findByIdAndDelete(existing._id);
            return res.json({ bookmarked: false, message: "Removed from bookmarks" });
        } else {
            await SessionBookmark.create({ sessionId, attendeeId });
            return res.json({ bookmarked: true, message: "Added to bookmarks" });
        }
    } catch (err) {
        console.error("TOGGLE SESSION BOOKMARK ERROR:", err);
        res.status(500).json({ message: "Bookmark action failed" });
    }
};

export const getBookmarkedSessions = async (req, res) => {
    try {
        const attendeeId = req.user.id;
        const bookmarks = await SessionBookmark.find({ attendeeId })
            .populate("sessionId")
            .sort({ createdAt: -1 });

        res.json(bookmarks);
    } catch (err) {
        console.error("GET SESSION BOOKMARKS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
};

/* ================= GET MY SESSION REGISTRATIONS ================= */
export const getMySessionRegistrations = async (req, res) => {
    try {
        const attendeeId = req.user.id;
        // Find all session registrations for this attendee
        const registrations = await SessionRegistration.find({ attendeeId })
            .populate("sessionId") // Get full session details
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (err) {
        console.error("GET MY SESSION REGISTRATIONS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch session registrations" });
    }
};
