import Expo from "../models/expoModel.mjs";
import Booth from "../models/boothModel.mjs";
import Schedule from "../models/scheduleModel.mjs";
import Notification from "../models/notificationModel.mjs";
import User from "../models/userModel.mjs";


export const createExpo = async (req, res) => {
  try {
    const errors = [];

    const {
      title,
      description,
      theme,
      location,
      startDate,
      endDate,
      isPaid,
      price
    } = req.body;
    const paid = isPaid === "true" || isPaid === true;

    if (paid && (!price || price <= 0)) {
      errors.push("Price is required for paid expo");
    }

    if (!title) errors.push("Title is required");
    if (!theme) errors.push("Theme is required");
    if (!location) errors.push("Location is required");
    if (!description) errors.push("Description is required");
    if (!startDate) errors.push("Start date is required");
    if (!endDate) errors.push("End date is required");

    if (!req.files?.thumbnail)
      errors.push("Thumbnail image is required");

    if (!req.files?.map)
      errors.push("Map image is required");

    // ================= BOOTH GROUPS =================
    const boothGroups = req.body.boothGroups
      ? JSON.parse(req.body.boothGroups)
      : [];

    if (boothGroups.length === 0) {
      errors.push("At least one booth group is required");
    } else {
      boothGroups.forEach((g, i) => {
        if (!g.prefix)
          errors.push(`Booth group ${i + 1}: prefix required`);
        if (!g.count || g.count <= 0)
          errors.push(`Booth group ${i + 1}: count required`);
        if (!g.size)
          errors.push(`Booth group ${i + 1}: size required`);
        if (!g.price || g.price <= 0)
          errors.push(`Booth group ${i + 1}: price required`);
      });
    }

    // ================= EVENTS =================
    const schedules = req.body.schedules
      ? JSON.parse(req.body.schedules)
      : [];

    schedules.forEach((e, i) => {
      if (!e.date)
        errors.push(`Event ${i + 1}: date required`);
      if (!e.eventName)
        errors.push(`Event ${i + 1}: event name required`);
      if (!e.startTime)
        errors.push(`Event ${i + 1}: start time required`);
      if (!e.endTime)
        errors.push(`Event ${i + 1}: end time required`);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // ================= CREATE EXPO =================
    const expo = await Expo.create({
      title,
      description,
      theme,
      location,
      startDate,
      endDate,

      isPaid: paid,
      price: paid ? price : 0,

      thumbnailImage: req.files.thumbnail[0].path,
      mapImage: req.files.map[0].path,
      interests: req.body.interests ? JSON.parse(req.body.interests) : []
    });

    // ================= CREATE BOOTHS =================
    const booths = [];

    boothGroups.forEach(group => {
      for (let i = 1; i <= Number(group.count); i++) {
        booths.push({
          name: `${group.prefix}${i}`,
          size: group.size,
          price: group.price,
          expoId: expo._id
        });
      }
    });

    await Booth.insertMany(booths);

    // ================= CREATE EVENTS =================
    const eventImages = req.files?.eventImages || [];

    const scheduleDocs = schedules.map((item, index) => ({
      expoId: expo._id,
      ...item,
      eventImage: eventImages[index]?.path || ""
    }));

    if (scheduleDocs.length > 0) {
      await Schedule.insertMany(scheduleDocs);
    }

    // ================= NOTIFY USERS (Attendees & Exhibitors) =================
    try {
      const users = await User.find({ role: { $in: ['attendee', 'exhibitor'] } }).select('_id role');

      const notificationDocs = users.map(u => ({
        recipientId: u._id,
        type: "expo",
        title: `New Expo: ${title}`,
        content: `Check out the new expo starting on ${startDate} at ${location}`,
        link: u.role === 'attendee' ? `/attendee/expo/${expo._id}` : `/exhibitor/expo/${expo._id}`
      }));

      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs);
      }
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Expo created successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



// GET ALL EXPOS
export const getAllExpos = async (req, res) => {
  const filter = {};
  if (req.query.includeInactive !== "true") {
    filter.isActive = true;
  }
  const expos = await Expo.find(filter).sort({ createdAt: -1 });
  res.json(expos);
};

// GET SINGLE EXPO
export const getSingleExpo = async (req, res) => {
  const expo = await Expo.findById(req.params.id);
  if (!expo) return res.status(404).json({ message: "Expo not found" });

  if (!expo.isActive && req.query.includeInactive !== "true") {
    return res.status(404).json({ message: "Expo is inactive" });
  }

  res.json(expo);
};

// UPDATE EXPO
export const updateExpo = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Convert isPaid from string to boolean
    const isPaid = req.body.isPaid === "true" || req.body.isPaid === true;
    updateData.isPaid = isPaid;

    // Convert price to number only if Paid
    updateData.price = isPaid ? Number(req.body.price || 0) : 0;

    // Images
    if (req.files?.thumbnail) {
      updateData.thumbnailImage = req.files.thumbnail[0].path;
    }
    if (req.files?.map) {
      updateData.mapImage = req.files.map[0].path;
    }

    if (req.body.interests) {
      try {
        updateData.interests = typeof req.body.interests === 'string'
          ? JSON.parse(req.body.interests)
          : req.body.interests;
      } catch (e) {
        console.error("Error parsing interests in updateExpo:", e);
        // Don't overwrite if parse fails, or set empty? 
        // Better to set empty to avoid saving garbage string
        updateData.interests = [];
      }
    }

    const expo = await Expo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Expo updated successfully",
      expo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE EXPO STATUS
export const toggleExpoStatus = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.id);
    if (!expo) return res.status(404).json({ message: "Expo not found" });

    expo.isActive = !expo.isActive;
    await expo.save();

    res.json({
      success: true,
      message: `Expo ${expo.isActive ? "activated" : "deactivated"} successfully`,
      expo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
