import Booth from "../models/boothModel.mjs";
import ExpoRegistration from "../models/ExpoRegistration.mjs";
import BoothVisit from "../models/boothVisitModel.mjs";

export const boothVisit = async (req, res) => {
  try {
    const { expoId, boothId } = req.params;  // dono params
    const userId = req.user._id;

    const booth = await Booth.findById(boothId);
    if (!booth) return res.status(404).json({ message: "Booth not found" });

    // Optional: check expoId matches booth.expoId
    if (booth.expoId.toString() !== expoId) {
      return res.status(400).json({ message: "Expo ID does not match the booth" });
    }

    const registration = await ExpoRegistration.findOne({
      expoId,
      attendeeId: userId,
      status: "registered"
    });

    if (!registration) {
      return res.status(403).json({ message: "You are not registered for this expo" });
    }

    const alreadyVisited = await BoothVisit.findOne({
      boothId,
      attendeeId: userId
    });

    if (alreadyVisited) {
      return res.status(400).json({ message: "You have already marked visit for this booth" });
    }

    const visit = await BoothVisit.create({
      boothId,
      expoId,
      attendeeId: userId
    });

    res.json({ success: true, message: "Visit recorded successfully", visit });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
