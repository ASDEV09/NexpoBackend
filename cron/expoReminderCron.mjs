import cron from "node-cron";
import Expo from "../models/expoModel.mjs";
import Booth from "../models/boothModel.mjs";
import User from "../models/userModel.mjs";
import expoMailer from "../utils/expoMailer.mjs";
import ExpoRegistration from "../models/ExpoRegistration.mjs";
import ExpoBookmark from "../models/ExpoBookmark.mjs";
import SessionBookmark from "../models/SessionBookmark.mjs";
import Session from "../models/sessionModel.mjs";
import Notification from "../models/notificationModel.mjs";

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

      // 5️⃣ BOOKMARKED EXPOS REMINDERS
      const bookmarks = await ExpoBookmark.find({
        expoId: expo._id
      }).populate("attendeeId");

      for (const bm of bookmarks) {
        const attendee = bm.attendeeId;
        if (!attendee || !attendee.email) continue;

        // Email
        await expoMailer({
          to: attendee.email,
          subject: `Reminder: Bookmarked Expo '${expo.title}' Starts Tomorrow!`,
          html: `
            <h3>Hello ${attendee.name}</h3>
            <p>The expo you bookmarked is starting <strong>tomorrow</strong>.</p>
            
            <h4>Expo Details</h4>
            <p><strong>Title:</strong> ${expo.title}</p>
            <p><strong>Location:</strong> ${expo.location}</p>
            <p><strong>Date:</strong> ${new Date(expo.startDate).toLocaleDateString()}</p>
            
            <p>Check it out in the app!</p>
            <br/>
            <p>See you there! 🎉</p>
          `
        });

        // In-App Notification
        await Notification.create({
          recipientId: attendee._id,
          type: "expo",
          title: `Reminder: ${expo.title}`,
          content: `The expo you bookmarked starts tomorrow!`,
          link: `/attendee/expo/${expo._id}`
        });

        console.log(`📧 Bookmarked Expo Reminder sent to ${attendee.email}`);
      }
    }

    // 6️⃣ SESSION/WORKSHOP REMINDERS
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;

    const sessions = await Session.find({
      date: tomorrowStr
    });

    for (const session of sessions) {
      const sessionBookmarks = await SessionBookmark.find({
        sessionId: session._id
      }).populate("attendeeId");

      for (const bm of sessionBookmarks) {
        const attendee = bm.attendeeId;
        if (!attendee || !attendee.email) continue;

        // Email
        await expoMailer({
          to: attendee.email,
          subject: `Reminder: ${session.type} '${session.title}' is Tomorrow!`,
          html: `
            <h3>Hello ${attendee.name}</h3>
            <p>The ${session.type} you bookmarked is scheduled for <strong>tomorrow</strong>.</p>
            
            <h4>Event Details</h4>
            <p><strong>Title:</strong> ${session.title}</p>
            <p><strong>Topic:</strong> ${session.topic || "N/A"}</p>
            <p><strong>Time:</strong> ${session.startTime} - ${session.endTime}</p>
            <p><strong>Location:</strong> ${session.location || "Online"}</p>
            
            <p>Don't miss it!</p>
          `
        });

        // In-App Notification
        await Notification.create({
          recipientId: attendee._id,
          type: "message",
          title: `Reminder: ${session.title}`,
          content: `The ${session.type} you bookmarked is scheduled for tomorrow at ${session.startTime}.`,
          link: `/attendee/sessions/${session._id}`
        });

        console.log(`📧 Session/Workshop Reminder sent to ${attendee.email}`);
      }
    }

  } catch (error) {
    console.error("❌ Expo Reminder Cron Error:", error);
  }
});
