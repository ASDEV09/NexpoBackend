import cron from "node-cron";
import Expo from "../models/expoModel.mjs";
import Booth from "../models/boothModel.mjs";
import User from "../models/userModel.mjs";
import expoMailer from "../utils/expoMailer.mjs";
import ExpoRegistration from "../models/ExpoRegistration.mjs";

cron.schedule("0 9 * * *", async () => {
  // ⏰ Roz subah 9 baje
  try {
    console.log("🔔 Running Expo Reminder Cron...");

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // date range: kal 00:00 se 23:59 tak
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    // 1️⃣ Kal start hone wale expos
    const expos = await Expo.find({
      startDate: {
        $gte: startOfTomorrow,
        $lte: endOfTomorrow
      }
    });

    for (const expo of expos) {
      // 2️⃣ Is expo ke booked booths
      const booths = await Booth.find({
        expoId: expo._id,
        isBooked: true
      }).populate("exhibitorId");

      for (const booth of booths) {
        const exhibitor = booth.exhibitorId;

        if (!exhibitor || !exhibitor.email) continue;

        // 3️⃣ EMAIL SEND
        await expoMailer({
          to: exhibitor.email,
          subject: `Reminder: Your Expo Starts Tomorrow`,
          html: `
            <h3>Hello ${exhibitor.name}</h3>
            <p>This is a friendly reminder that your expo booth is scheduled for <strong>tomorrow</strong>.</p>

            <h4>Expo Details</h4>
            <p><strong>Title:</strong> ${expo.title}</p>
            <p><strong>Location:</strong> ${expo.location}</p>
            <p><strong>Date:</strong> ${new Date(expo.startDate).toLocaleDateString()}</p>

            <h4>Your Booth</h4>
            <p><strong>Booth Name:</strong> ${booth.name}</p>
            <p><strong>Size:</strong> ${booth.size}</p>

            <p>Please make sure all preparations are complete.</p>
            <br/>
            <p>Best of luck! 🚀</p>
          `
        });

        console.log(`📧 Reminder sent to ${exhibitor.email}`);
      }

      // 4️⃣ ATTENDEE REMINDERS
      const registrations = await ExpoRegistration.find({
        expoId: expo._id,
        status: "registered"
      }).populate("attendeeId");

      for (const reg of registrations) {
        const attendee = reg.attendeeId;
        if (!attendee || !attendee.email) continue;

        await expoMailer({
          to: attendee.email,
          subject: `Reminder: Expo '${expo.title}' Starts Tomorrow!`,
          html: `
            <h3>Hello ${attendee.name}</h3>
            <p>We are excited to see you! The expo you registered for is happening <strong>tomorrow</strong>.</p>
            
            <h4>Expo Details</h4>
            <p><strong>Title:</strong> ${expo.title}</p>
            <p><strong>Location:</strong> ${expo.location}</p>
            <p><strong>Date:</strong> ${new Date(expo.startDate).toLocaleDateString()}</p>
            <p><strong>City:</strong> ${expo.city}</p>

            <p>Don't forget to bring your ticket or registration ID.</p>
            <br/>
            <p>See you there! 🎉</p>
          `
        });
        console.log(`📧 Attendee Reminder sent to ${attendee.email}`);
      }
    }

  } catch (error) {
    console.error("❌ Expo Reminder Cron Error:", error);
  }
});
