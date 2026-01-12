import Schedule from "../models/scheduleModel.mjs";

// GET BY EXPO
export const getSchedulesByExpo = async (req, res) => {
  const filter = { expoId: req.params.expoId };
  if (req.query.includeInactive !== "true") {
    filter.isActive = true;
  }
  const schedules = await Schedule.find(filter);
  res.json(schedules);
};

// CREATE SINGLE
export const createSchedule = async (req, res) => {
  const data = {
    ...req.body,
    eventImage: req.file ? req.file.path : ""
  };

  const schedule = await Schedule.create(data);

  res.status(201).json({ success: true, schedule });
};

// ✅ BULK UPDATE (FIXED IMAGE MAPPING)
export const updateSchedulesByExpo = async (req, res) => {
  const parsed = JSON.parse(req.body.schedules);
  const uploadedImages = req.files || [];

  let uploadCursor = 0;

  for (const s of parsed) {
    const data = { ...s };

    if (s.imageIndex !== null && uploadedImages[uploadCursor]) {
      data.eventImage = uploadedImages[uploadCursor].path;
      uploadCursor++;
    }

    delete data.imageIndex;

    if (s._id) {
      await Schedule.findByIdAndUpdate(s._id, data);
    } else {
      await Schedule.create({
        ...data,
        expoId: req.params.expoId
      });
    }
  }

  res.json({ success: true });
};

// DELETE
export const deleteSchedule = async (req, res) => {
  await Schedule.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const toggleScheduleStatus = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Event not found" });

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    res.json({
      success: true,
      message: `Event ${schedule.isActive ? "activated" : "deactivated"} successfully`,
      schedule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getAllEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.includeInactive !== "true") {
      filter.isActive = true;
    }

    const events = await Schedule.find(filter)
      .populate("expoId", "title startDate endDate location thumbnailImage")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};