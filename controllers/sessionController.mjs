import Session from "../models/sessionModel.mjs";

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
