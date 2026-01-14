import Session from "../models/sessionModel.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";
import User from "../models/userModel.mjs";
import sendEmail from "../utils/sendEmail.mjs";

export const createSession = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            // speaker, removed
            topic,
            date,
            startTime,
            endTime,
            location,
            expoId,
            isPaid,
            price,
            capacity,
            interests // Raw interests (string or array)
        } = req.body;

        // Basic Validation
        if (!title || !description || !date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        let bannerImage = "";
        if (req.files?.bannerImage) {
            bannerImage = req.files.bannerImage[0].path;
        }

        // Parse speakers (handle both array and string input from FormData)
        // Parse speakers (handle both array and string input from FormData)
        let speakers = [];
        if (req.body.speakers) {
            speakers = Array.isArray(req.body.speakers) ? req.body.speakers : JSON.parse(req.body.speakers);
        }

        let parsedInterests = [];
        if (req.body.interests) {
            parsedInterests = Array.isArray(req.body.interests) ? req.body.interests : JSON.parse(req.body.interests);
        }

        // Map uploaded speaker images
        if (req.files?.speakerImages) {
            req.files.speakerImages.forEach((file, index) => {
                // Determine which speaker this image belongs to based on originalname or order
                // For simplicity, we assume the frontend sends images in order or with a mapping index
                // A more robust way is to use specific field names like "speakerImage_0"
                if (speakers[index]) {
                    speakers[index].image = file.path;
                }
            });
        }

        // BETTER APPROACH: Match by filename or index if needed.
        // Assuming the frontend appends files in order of speakers who have new images.
        // However, standard FormData with array of files doesn't guarantee deep linking.
        // We will trust the index for now, but in future can use specific keys.

        const session = await Session.create({
            title,
            description,
            type,
            speakers, // Changed from speaker to speakers
            topic,
            date,
            startTime,
            endTime,
            location,
            expoId: expoId || null,
            bannerImage,
            isPaid: isPaid || false,
            price: price || 0,
            capacity: capacity || 0,
            interests: parsedInterests
        });

        res.status(201).json({ success: true, message: "Session created successfully", session });

    } catch (error) {
        console.error("Create Session Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const filter = {};
        if (req.query.expoId) {
            filter.expoId = req.query.expoId;
        }
        if (req.query.includeInactive !== "true") {
            filter.isActive = true;
        }

        const sessions = await Session.find(filter).populate('expoId', 'title').sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('expoId', 'title price isPaid');
        if (!session) return res.status(404).json({ message: "Session not found" });

        if (!session.isActive && req.query.includeInactive !== "true") {
            return res.status(404).json({ message: "Session is inactive" });
        }

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSession = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.files?.bannerImage) {
            updateData.bannerImage = req.files.bannerImage[0].path;
        }

        // Handle speakers parsing if present
        if (req.body.speakers) {
            try {
                updateData.speakers = Array.isArray(req.body.speakers) ? req.body.speakers : JSON.parse(req.body.speakers);
            } catch (e) {
                console.error("Error parsing speakers:", e);
                updateData.speakers = [];
            }
        }

        if (req.body.interests) {
            try {
                updateData.interests = typeof req.body.interests === 'string' ? JSON.parse(req.body.interests) : req.body.interests;
            } catch (e) {
                console.error("Error parsing interests:", e);
                updateData.interests = [];
            }
        }

        // Map uploaded speaker images
        if (req.files?.speakerImages) {
            // Ensure speakers array exists to map images to
            if (!updateData.speakers || !Array.isArray(updateData.speakers)) {
                // Fetch current session to get existing speakers if not provided in update
                const currentSession = await Session.findById(req.params.id);
                updateData.speakers = currentSession ? currentSession.speakers : [];
            }

            req.files.speakerImages.forEach((file, index) => {
                if (updateData.speakers[index]) {
                    updateData.speakers[index].image = file.path;
                }
            });
        }


        // Handle Expo ID (if empty string, set to null)
        if (req.body.expoId === "") {
            updateData.expoId = null;
        }

        const session = await Session.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!session) return res.status(404).json({ message: "Session not found" });

        res.json({ success: true, message: "Session updated successfully", session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteSession = async (req, res) => {
    try {
        await Session.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Session deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleSessionStatus = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: "Session not found" });

        session.isActive = !session.isActive;
        await session.save();

        res.json({
            success: true,
            message: `Session ${session.isActive ? "activated" : "deactivated"} successfully`,
            session
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all registrations for a session
export const getSessionRegistrations = async (req, res) => {
    try {
        const { id } = req.params;
        const registrations = await SessionRegistration.find({ sessionId: id })
            .populate("attendeeId", "email name")
            .sort({ createdAt: -1 });
        res.status(200).json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Manually register a user (Admin)
export const adminRegisterUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, fullName, phone, city } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ message: "Session not found" });

        // Find user by email
        const user = await User.findOne({ email });

        // Define duplicate check query
        let duplicateQuery = { sessionId: id };
        if (user) {
            duplicateQuery.attendeeId = user._id;
        } else {
            duplicateQuery.email = email;
        }

        // Check if already registered
        const existing = await SessionRegistration.findOne(duplicateQuery);
        if (existing) return res.status(400).json({ message: "User/Email is already registered for this session." });

        const serial = `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const registration = await SessionRegistration.create({
            sessionId: id,
            attendeeId: user ? user._id : null,
            email: email,
            fullName: fullName || (user ? user.name : "Guest"),
            phone: phone || "N/A",
            city: city || "N/A",
            serial
        });

        // Populate immediately for frontend (only works if attendeeId exists)
        if (registration.attendeeId) {
            await registration.populate("attendeeId", "email name");
        }

        // Send Confirmation Email
        const emailMessage = `
            <h3>Session Registration Confirmed!</h3>
            <p>Hello <b>${registration.fullName}</b>,</p>
            <p>You have been successfully registered for the session: <b>${session.title}</b>.</p>
            <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p><b>📅 Date:</b> ${new Date(session.date).toLocaleDateString()}</p>
                <p><b>⏰ Time:</b> ${session.startTime} - ${session.endTime}</p>
                <p><b>📍 Location:</b> ${session.location}</p>
                <p><b>🔢 Serial Number:</b> <span style="font-family: monospace; font-size: 1.1em;">${serial}</span></p>
            </div>
            <p>Please show this serial number at the entrance.</p>
            <p>Thank you!</p>
        `;

        try {
            await sendEmail({
                email: email, // Use the email from body/registration
                subject: `Registration Confirmed: ${session.title}`,
                message: emailMessage
            });
        } catch (emailErr) {
            console.error("Failed to send session registration email:", emailErr);
        }

        res.status(201).json({ success: true, message: "Attendee registered manually & email sent.", registration });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Registration Details (Admin)
export const updateSessionRegistration = async (req, res) => {
    try {
        const { id } = req.params; // Registration ID
        const { fullName, phone, city, status } = req.body;

        const previousRegistration = await SessionRegistration.findById(id);

        const updatedRegistration = await SessionRegistration.findByIdAndUpdate(
            id,
            { fullName, phone, city, status },
            { new: true }
        ).populate("attendeeId", "email name").populate("sessionId");

        if (!updatedRegistration) return res.status(404).json({ message: "Registration not found" });

        // If status changed to 'cancelled', send email
        if (status === 'cancelled' && previousRegistration.status !== 'cancelled') {
            const emailMessage = `
                <h3>Session Registration Cancelled</h3>
                <p>Hello <b>${updatedRegistration.fullName}</b>,</p>
                <p>Your registration for the session <b>${updatedRegistration.sessionId.title}</b> has been cancelled.</p>
                <p>If you believe this is a mistake, please contact support.</p>
            `;
            try {
                await sendEmail({
                    email: updatedRegistration.attendeeId.email,
                    subject: `Registration Cancelled: ${updatedRegistration.sessionId.title}`,
                    message: emailMessage
                });
            } catch (emailErr) {
                console.error("Failed to send cancellation email:", emailErr);
            }
        }

        res.json({ success: true, message: "Registration updated successfully", registration: updatedRegistration });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Registration (Admin)
export const deleteSessionRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await SessionRegistration.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Registration not found" });
        res.json({ success: true, message: "Registration deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

