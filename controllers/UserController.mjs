import fs from "fs";
import path from "path";
import User from "../models/userModel.mjs";
import expoMailer from "../utils/expoMailer.mjs";
import accountApprovedTemplate from "../utils/accountApprovedTemplate.mjs";
import accountUnapprovedTemplate from "../utils/accountUnapprovedTemplate.mjs";
import bcrypt from "bcrypt";
/* ================= ADMIN LIST ================= */
export const getAdmins = async (req, res) => {
  const admins = await User.find({ role: "admin" })
    .select("name email role profilePicture status isActive gender phone dob");
  res.json(admins);
};


import ExpoRegistration from "../models/ExpoRegistration.mjs";

/* ================= ATTENDEE LIST ================= */
export const getAttendees = async (req, res) => {
  try {
    const attendeesRaw = await User.find({ role: "attendee" })
      .select("name email role profilePicture status isActive gender phone dob createdAt");

    const attendees = await Promise.all(attendeesRaw.map(async (user) => {
      const registrations = await ExpoRegistration.find({ attendeeId: user._id })
        .populate("expoId", "title startDate city location");

      return {
        ...user.toObject(),
        registeredExpos: registrations.map(r => r.expoId).filter(Boolean)
      };
    }));

    res.json(attendees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendees" });
  }
};

/* ================= EXHIBITOR LIST ================= */
export const getExhibitors = async (req, res) => {
  const exhibitors = await User.find({ role: "exhibitor" })
    .select("name email role documents productsServices companyLogo companyName status isActive");
  res.json(exhibitors);
};

/* ================= SEARCH USER BY EMAIL ================= */
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};

/* ================= UPDATE ADMIN ================= */

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const oldUser = await User.findById(id);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    const allowedFields = [
      "name",
      "email",
      "status",
      "isActive",
      "gender",
      "phone",
      "dob",
      "role"
    ];

    let updateData = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    if (req.file) updateData.profilePicture = req.file.path;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    /* ===== SEND EMAIL ON STATUS CHANGE ===== */
    if (
      oldUser.status !== user.status ||
      oldUser.isActive !== user.isActive
    ) {
      const isApproved = user.status === "approved" && user.isActive;

      await expoMailer({
        to: user.email,
        subject: isApproved
          ? "Your account has been approved"
          : "Your account has been deactivated",
        html: isApproved
          ? accountApprovedTemplate({
            name: user.name,
            role: user.role
          })
          : accountUnapprovedTemplate({
            name: user.name,
            role: user.role
          })
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= UPDATE ATTENDEE ================= */
export const updateAttendeeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const oldUser = await User.findById(id);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    const allowedFields = [
      "name",
      "email",
      "status",
      "isActive",
      "gender",
      "phone",
      "dob",
      "role"
    ];

    let updateData = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    if (req.file) updateData.profilePicture = req.file.path;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (
      oldUser.status !== user.status ||
      oldUser.isActive !== user.isActive
    ) {
      const isApproved = user.status === "approved" && user.isActive;

      await expoMailer({
        to: user.email,
        subject: isApproved
          ? "Your account has been approved"
          : "Your account has been deactivated",
        html: isApproved
          ? accountApprovedTemplate({
            name: user.name,
            role: user.role
          })
          : accountUnapprovedTemplate({
            name: user.name,
            role: user.role
          })
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= UPDATE EXHIBITOR ================= */
export const updateExhibitorUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const oldUser = await User.findById(id);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    const prevStatus = oldUser.status;
    const prevActive = oldUser.isActive;

    const allowedFields = [
      "name",
      "email",
      "productsServices",
      "companyName",
      "status",
      "isActive",
      "role"
    ];

    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        oldUser[f] = req.body[f];
      }
    });

    if (req.files?.companyLogo) {
      oldUser.companyLogo = req.files.companyLogo[0].path;
    }

    if (req.files?.documents) {
      const newDocs = req.files.documents.map(d => d.path);
      oldUser.documents = [...oldUser.documents, ...newDocs];
    }

    await oldUser.save();

    /* ===== SEND EMAIL ON STATUS CHANGE ===== */
    if (
      prevStatus !== oldUser.status ||
      prevActive !== oldUser.isActive
    ) {
      const isApproved =
        oldUser.status === "approved" && oldUser.isActive;

      await expoMailer({
        to: oldUser.email,
        subject: isApproved
          ? "Your account has been approved"
          : "Your account has been deactivated",
        html: isApproved
          ? accountApprovedTemplate({
            name: oldUser.name,
            role: oldUser.role
          })
          : accountUnapprovedTemplate({
            name: oldUser.name,
            role: oldUser.role
          })
      });
    }

    res.json(oldUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE USER ================= */
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};


export const deleteExhibitorDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { document } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // remove from DB
    user.documents = user.documents.filter(d => d !== document);
    await user.save();

    // remove file from server (if stored locally)
    const filePath = path.join("uploads", path.basename(document));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, documents: user.documents });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


/* ================= ADD ADMIN ================= */
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password, status, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, Email and Password are required"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: "This email is already registered"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hash,
      role: "admin",
      status: status || "approved",
      emailVerified: true, // ✅ ADD THIS
      isActive: isActive === "true" || isActive === true,
      profilePicture: req.file?.path
    });

    /* ===== EMAIL ===== */
    await expoMailer({
      to: email,
      subject: "Admin Account Created",
      html: `
        <h3>Hello ${name}</h3>
        <p>Your admin account has been created successfully.</p>
        <p>You can now login to the Expo Management System.</p>
      `
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin
    });

  } catch (err) {
    console.error("ADD ADMIN ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({
      message: err.message || "Admin create failed"
    });
  }
};



/* ================= ADD ATTENDEE ================= */
export const addAttendee = async (req, res) => {
  try {
    const { name, email, password, status, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, Email and Password are required"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: "This email is already registered"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const attendee = await User.create({
      name,
      email,
      password: hash,
      role: "attendee",
      status: status || "approved",
      emailVerified: true, // ✅ ADD THIS

      isActive: isActive === "true" || isActive === true,
      profilePicture: req.file?.path
    });

    /* ===== EMAIL ===== */
    await expoMailer({
      to: email,
      subject: "Attendee Account Created",
      html: `
        <h3>Welcome ${name}</h3>
        <p>Your attendee account has been created successfully.</p>
        <p>You can now login and explore the Expo.</p>
      `
    });

    res.status(201).json({
      message: "Attendee created successfully",
      attendee
    });

  } catch (err) {
    console.error("ADD ATTENDEE ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({
      message: err.message || "Attendee create failed"
    });
  }
};


/* ================= ADD EXHIBITOR ================= */
/* ================= ADD EXHIBITOR ================= */
export const addExhibitor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
      productsServices,
      status,
      isActive
    } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: "This email is already registered"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const exhibitor = await User.create({
      name,
      email,
      password: hash,
      role: "exhibitor",
      companyName,
      productsServices,
      status: status || "unapproved",
      isActive: isActive === "true" || isActive === true,
      emailVerified: true, // ✅ ADD THIS
      companyLogo: req.files?.companyLogo?.[0]?.path,
      documents: req.files?.documents?.map(d => d.path) || []
    });

    /* ===== ✅ EMAIL BASED ON STATUS (SIMPLE WORDING) ===== */
    if (exhibitor.status === "approved") {
      // ✅ APPROVED AT CREATION
      await expoMailer({
        to: email,
        subject: "Your Exhibitor Account is Ready",
        html: `
          <h3>Hello ${name}</h3>
          <p>Your exhibitor account has been created successfully.</p>
          <p>You can now log in to the Expo Management System.</p>
        `
      });
    } else {
      // ⏳ UNDER REVIEW
      await expoMailer({
        to: email,
        subject: "Your Exhibitor Account is Under Review",
        html: `
          <h3>Hello ${name}</h3>
          <p>Your exhibitor account has been created.</p>
          <p>Our team will review your information.</p>
          <p>You will be notified once the review is complete.</p>
        `
      });
    }

    res.status(201).json({
      message: "Exhibitor created successfully",
      exhibitor
    });

  } catch (err) {
    console.error("ADD EXHIBITOR ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({
      message: err.message || "Exhibitor create failed"
    });
  }
};
