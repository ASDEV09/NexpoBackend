import mongoose from "mongoose";
import Expo from "../models/expoModel.mjs";
import ExpoRegistration from "../models/ExpoRegistration.mjs";
import ExpoBookmark from "../models/ExpoBookmark.mjs";
import Booth from "../models/boothModel.mjs";
import User from "../models/userModel.mjs";
import { generateExpoPass } from "../utils/generateExpoPass.mjs";
import { sendAttendeePass } from "../utils/attendeePassMailer.mjs";
import crypto from "crypto";
import { sendRegistrationCancelledEmail } from "../utils/registrationCancelledMailer.mjs";
import Session from "../models/sessionModel.mjs";
import SessionRegistration from "../models/SessionRegistration.mjs";
import { generateSessionPass } from "../utils/generateSessionPass.mjs";
import { sendSessionPass } from "../utils/sendSessionPass.mjs";

export const registerExpo = async (req, res) => {
  try {
    const { expoId } = req.params;
    const attendeeId = req.user.id;
    const { name, phone, city } = req.body;

    // already registered?
    const exists = await ExpoRegistration.findOne({ expoId, attendeeId });
    if (exists) {
      return res.status(400).json({ message: "Already registered" });
    }

    const attendee = await User.findById(attendeeId);
    const expo = await Expo.findById(expoId);

    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    if (!expo.isActive) {
      return res.status(400).json({ message: "Registration is disabled for this expo" });
    }

    const serial = crypto.randomBytes(4).toString("hex").toUpperCase();

    // ✅ SAVE FORM DATA
    const registration = await ExpoRegistration.create({
      expoId,
      attendeeId,
      serial,
      fullName: name,
      phone,
      city
    });

    // ✅ PASS GENERATION (FORM NAME)
    const { buffer, fileName } = await generateExpoPass({
      expo,
      attendeeName: registration.fullName,
      attendeeEmail: attendee.email,
      serial
    });

    await sendAttendeePass({
      to: attendee.email,
      expo,
      pdfBuffer: buffer,
      passName: fileName
    });

    // ✅ 4. HANDLE ADDITIONAL SESSIONS (Upsell)
    const { additionalSessions } = req.body; // Array of session IDs

    if (additionalSessions && Array.isArray(additionalSessions) && additionalSessions.length > 0) {
      for (const sessionId of additionalSessions) {
        try {
          // Check if session exists
          const session = await Session.findById(sessionId);
          if (!session) continue;

          // Check if already registered
          const already = await SessionRegistration.findOne({ sessionId, attendeeId });
          if (already) continue;

          // Register
          const sessionSerial = crypto.randomBytes(4).toString("hex").toUpperCase();
          const sessionReg = await SessionRegistration.create({
            sessionId,
            attendeeId,
            serial: sessionSerial,
            fullName: name,
            phone,
            city
          });

          // Generate & Send Pass
          const { buffer: sBuffer, fileName: sFileName } = await generateSessionPass({
            session,
            attendeeName: sessionReg.fullName,
            attendeeEmail: attendee.email,
            serial: sessionSerial
          });

          await sendSessionPass({
            to: attendee.email,
            session,
            pdfBuffer: sBuffer,
            passName: sFileName
          });

        } catch (sErr) {
          console.error(`Failed to register session ${sessionId}:`, sErr);
          // Continue with other sessions even if one fails
        }
      }
    }

    res.json({
      success: true,
      message: "Registration successful. Passes sent to email."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const checkRegistration = async (req, res) => {
  const { expoId } = req.params;
  const attendeeId = req.user.id;

  const reg = await ExpoRegistration.findOne({ expoId, attendeeId });

  res.json({ registered: !!reg });
};

export const registeruser = async (req, res) => {
  try {
    const registrations = await ExpoRegistration.find({
      expoId: req.params.expoId
    })
      .populate("attendeeId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





// export const analytics = async (req, res) => {
//   try {
//     const { expoId } = req.params;

//     const expo = await Expo.findById(expoId);
//     if (!expo) {
//       return res.status(404).json({ message: "Expo not found" });
//     }

//     /* 👥 TOTAL ATTENDEES */
//     const totalAttendees = await ExpoRegistration.countDocuments({
//       expoId,
//       status: "registered"
//     });

//     /* 🎟 ATTENDEE REVENUE */
//     const attendeeRevenue = expo.isPaid
//       ? totalAttendees * expo.price
//       : 0;

//     /* 🧱 BOOTHS */
//     const booths = await Booth.find({ expoId });
//     const totalBooths = booths.length;

//     const bookedBoothsArr = booths.filter(b => b.isBooked);
//     const bookedBooths = bookedBoothsArr.length;

//     /* 🏢 COMPANIES (unique exhibitors) */
//     const totalCompanies = new Set(
//       bookedBoothsArr.map(b => String(b.exhibitorId))
//     ).size;

//     /* 💰 BOOTH REVENUE */
//     const boothRevenue = bookedBoothsArr.reduce(
//       (sum, booth) => sum + booth.price,
//       0
//     );

//     /* 💵 TOTAL EXPO REVENUE */
//     const totalRevenue = boothRevenue + attendeeRevenue;

//     res.json({
//       /* ATTENDEE */
//       totalAttendees,
//       attendeeRevenue,
//       isPaidExpo: expo.isPaid,
//       ticketPrice: expo.price,

//       /* BOOTH */
//       totalBooths,
//       bookedBooths,
//       boothRevenue,

//       /* COMPANY */
//       totalCompanies,

//       /* TOTAL */
//       totalRevenue
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Analytics error" });
//   }
// };



export const analytics = async (req, res) => {
  try {
    const { expoId } = req.params;

    const expo = await Expo.findById(expoId);
    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    /* 👥 TOTAL ATTENDEES */
    const totalAttendees = await ExpoRegistration.countDocuments({
      expoId
    });

    /* 📈 LINE GRAPH — DATE WISE REGISTRATIONS */
    // const registrationTrend = await ExpoRegistration.aggregate([
    //   {
    //     $match: {
    //       expoId: new mongoose.Types.ObjectId(expoId)
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: {
    //         $dateToString: {
    //           format: "%Y-%m-%d",
    //           date: "$createdAt"
    //         }
    //       },
    //       count: { $sum: 1 }
    //     }
    //   },
    //   { $sort: { _id: 1 } }
    // ]);

    const registrationTrend = await ExpoRegistration.aggregate([
      {
        $match: {
          expoId: new mongoose.Types.ObjectId(expoId)
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%H:%M",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    /* 🧱 BOOTHS */
    const booths = await Booth.find({ expoId });
    const totalBooths = booths.length;

    const bookedBoothsArr = booths.filter(b => b.isBooked);
    const bookedBooths = bookedBoothsArr.length;

    /* 🏢 COMPANIES */
    const totalCompanies = new Set(
      bookedBoothsArr.map(b => String(b.exhibitorId))
    ).size;

    /* 💰 BOOTH REVENUE */
    const boothRevenue = bookedBoothsArr.reduce(
      (sum, booth) => sum + booth.price,
      0
    );

    /* 🎟 ATTENDEE REVENUE */
    const attendeeRevenue = expo.isPaid
      ? totalAttendees * expo.price
      : 0;

    res.json({
      totalAttendees,
      registrationTrend, // 🔥 REAL DB DATA

      totalBooths,
      bookedBooths,
      totalCompanies,

      boothRevenue,
      attendeeRevenue,

      isPaidExpo: expo.isPaid,
      ticketPrice: expo.price
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Analytics error" });
  }
};


export const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, city, status } = req.body;

    const existing = await ExpoRegistration.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const oldStatus = existing.status;

    // update fields
    existing.fullName = fullName;
    existing.phone = phone;
    existing.city = city;
    existing.status = status;

    await existing.save();

    const attendee = await User.findById(existing.attendeeId);
    const expo = await Expo.findById(existing.expoId);

    /* ================= CANCEL EMAIL ================= */
    if (oldStatus === "registered" && status === "cancelled") {
      if (attendee?.email && expo) {
        await sendRegistrationCancelledEmail({
          to: attendee.email,
          attendeeName: existing.fullName,
          expoName: expo.title
        });
      }
    }

    /* ================= RE-REGISTER → PASS EMAIL ================= */
    if (oldStatus === "cancelled" && status === "registered") {
      const serial = existing.serial; // same ticket number

      // regenerate pass
      const { buffer, fileName } = await generateExpoPass({
        expo,
        attendeeName: existing.fullName,
        attendeeEmail: attendee.email,
        serial
      });

      await sendAttendeePass({
        to: attendee.email,
        expo,
        pdfBuffer: buffer,
        passName: fileName
      });
    }

    res.json({
      success: true,
      registration: existing
    });

  } catch (err) {
    console.error("UPDATE REG ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

export const registerAttendeeByAdmin = async (req, res) => {
  try {
    const { expoId } = req.params;
    const { email, fullName, phone, city } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: "Email & name required" });
    }

    const expo = await Expo.findById(expoId);
    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    /* ================= FIND OR CREATE USER ================= */
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: fullName,
        email,
        role: "attendee",
        emailVerified: true,
        isActive: true
      });
    }

    /* ================= ALREADY REGISTERED CHECK ================= */
    const already = await ExpoRegistration.findOne({
      expoId,
      attendeeId: user._id
    });

    if (already) {
      return res.status(400).json({
        message: "Attendee already registered"
      });
    }

    /* ================= CREATE REGISTRATION ================= */
    const serial = crypto.randomBytes(4).toString("hex").toUpperCase();

    const registration = await ExpoRegistration.create({
      expoId,
      attendeeId: user._id,
      serial,
      fullName,
      phone,
      city,
      status: "registered"
    });

    /* ================= GENERATE & SEND PASS ================= */
    const { buffer, fileName } = await generateExpoPass({
      expo,
      attendeeName: fullName,
      attendeeEmail: email,
      serial
    });

    await sendAttendeePass({
      to: email,
      expo,
      pdfBuffer: buffer,
      passName: fileName,
      isAdminRegistration: true
    });

    res.status(201).json({
      success: true,
      registration
    });

  } catch (err) {
    console.error("ADMIN REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ================= GET MY REGISTRATIONS ================= */
export const getMyRegistrations = async (req, res) => {
  try {
    const attendeeId = req.user.id;

    // Find all registrations for this attendee
    const registrations = await ExpoRegistration.find({ attendeeId })
      .populate("expoId") // Get full expo details
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    console.error("GET MY REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

/* ================= BOOKMARKING ================= */
export const toggleBookmark = async (req, res) => {
  try {
    const { expoId } = req.params;
    const attendeeId = req.user.id;

    const existing = await ExpoBookmark.findOne({ expoId, attendeeId });

    if (existing) {
      await ExpoBookmark.findByIdAndDelete(existing._id);
      return res.json({ bookmarked: false, message: "Removed from bookmarks" });
    } else {
      await ExpoBookmark.create({ expoId, attendeeId });
      return res.json({ bookmarked: true, message: "Added to bookmarks" });
    }
  } catch (err) {
    console.error("TOGGLE BOOKMARK ERROR:", err);
    res.status(500).json({ message: "Bookmark action failed" });
  }
};

export const getBookmarkedExpos = async (req, res) => {
  try {
    const attendeeId = req.user.id;
    const bookmarks = await ExpoBookmark.find({ attendeeId })
      .populate("expoId")
      .sort({ createdAt: -1 });

    res.json(bookmarks);
  } catch (err) {
    console.error("GET BOOKMARKS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch bookmarks" });
  }
};