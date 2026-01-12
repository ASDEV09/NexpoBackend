import Booth from "../models/boothModel.mjs";
import Expo from "../models/expoModel.mjs";
import User from "../models/userModel.mjs";
import expoMailer from "../utils/expoMailer.mjs";
import generateBoothPass from "../utils/generateBoothPass.mjs"
import sendBoothPass from "../utils/sendBoothPass.mjs"
import ExpoRegistration from "../models/ExpoRegistration.mjs";

// CREATE SINGLE BOOTH
export const createSingleBooth = async (req, res) => {
  try {
    const { name, size, price, expoId } = req.body;

    if (!name || !size || !price || !expoId) {
      return res.status(400).json({
        success: false,
        message: "Name, size, price and expoId are required"
      });
    }

    const booth = await Booth.create({
      name,
      size,
      price,
      expoId
    });

    res.status(201).json({
      success: true,
      message: "Booth created successfully",
      booth
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// CREATE MULTIPLE BOOTHS
export const createMultipleBooths = async (req, res) => {
  try {
    const { expoId, boothGroups } = req.body;

    if (!expoId) {
      return res.status(400).json({ message: "expoId is required" });
    }

    if (!boothGroups || boothGroups.length === 0) {
      return res.status(400).json({ message: "Booth groups required" });
    }

    const booths = [];

    boothGroups.forEach(group => {
      for (let i = 1; i <= Number(group.count); i++) {
        booths.push({
          name: `${group.prefix}${i}`,
          size: group.size,
          price: group.price, // ✅ PRICE
          expoId
        });
      }
    });

    await Booth.insertMany(booths);

    res.status(201).json({
      success: true,
      message: "Multiple booths created successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET BOOTHS OF EXPO
export const getBoothsByExpo = async (req, res) => {
  try {
    const booths = await Booth.find({ expoId: req.params.expoId })
      .populate("exhibitorId", "companyName name email"); // ✅ POPULATE

    res.json(booths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE BOOTH
export const updateBooth = async (req, res) => {
  const { name, size, price } = req.body;

  if (!name || !size || price === undefined) {
    return res.status(400).json({
      success: false,
      message: "Name, size and price are required"
    });
  }

  if (Number(price) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be greater than 0"
    });
  }

  const booth = await Booth.findByIdAndUpdate(
    req.params.id,
    {
      name,
      size,
      price: Number(price)
    },
    { new: true }
  );

  res.json({
    success: true,
    booth
  });
};


// ✅ DELETE BOOTH
export const deleteBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found"
      });
    }

    // ❌ booked booth cannot be deleted
    if (booth.isBooked) {
      return res.status(400).json({
        success: false,
        message: "Booked booth cannot be deleted"
      });
    }

    await Booth.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Booth deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// export const reserveBooth = async (req, res) => {
//   try {
//     const { exhibitorId } = req.body;

//     const booth = await Booth.findById(req.params.id);

//     if (!booth) {
//       return res.status(404).json({ message: "Booth not found" });
//     }

//     if (booth.status !== "available") {
//       return res.status(400).json({ message: "Booth not available" });
//     }

//     booth.status = "reserved";
//     booth.exhibitorId = exhibitorId;

//     await booth.save();

//     res.json({
//       success: true,
//       message: "Booth reserved",
//       booth
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// export const bookBooth = async (req, res) => {
//   try {
//     const { productsServices, staff } = req.body;

//     const booth = await Booth.findById(req.params.id);
//     if (!booth) {
//       return res.status(404).json({ message: "Booth not found" });
//     }

//     if (booth.isBooked) {
//       return res.status(400).json({ message: "Booth already booked" });
//     }

//     booth.isBooked = true;
//     booth.productsServices = productsServices;
//     booth.staff = staff;
//     booth.exhibitorId = req.user._id;

//     await booth.save();

//     // 🔹 GET DATA FOR EMAIL
//     const exhibitor = await User.findById(req.user._id);
//     const expo = await Expo.findById(booth.expoId);

//     // 🔹 EMAIL CONTENT
//     const emailHtml = `
//       <h2>Booth Booking Confirmation</h2>

//       <p>Hello <b>${exhibitor.name}</b>,</p>

//       <p>Your booth has been <b>successfully booked</b>.</p>

//       <h3>📌 Booking Details</h3>
//       <ul>
//         <li><b>Expo:</b> ${expo.title}</li>
//         <li><b>Booth Name:</b> ${booth.name}</li>
//         <li><b>Booth Size:</b> ${booth.size} ft</li>
//         <li><b>Location:</b> ${expo.location}</li>
//         <li><b>Start Date:</b> ${new Date(expo.startDate).toDateString()}</li>
//         <li><b>End Date:</b> ${new Date(expo.endDate).toDateString()}</li>
//       </ul>

//       <h3>🛍 Products / Services</h3>
//       <p>${productsServices.join(", ")}</p>

//       <h3>👥 Staff Added</h3>
//       <ul>
//         ${staff.map(s =>
//           `<li>${s.name} – ${s.role} (${s.contact})</li>`
//         ).join("")}
//       </ul>

//       <p>Thank you for choosing our platform.</p>

//       <p><b>Expo Management System</b></p>
//     `;

//     // 🔹 SEND EMAIL
//     await expoMailer({
//       to: exhibitor.email,
//       subject: "🎉 Booth Booking Confirmation",
//       html: emailHtml
//     });

//     res.json({
//       success: true,
//       message: "Booth booked & email sent",
//       booth
//     });

//   } catch (error) {
//     console.error("BOOK BOOTH ERROR:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const getSingleBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    res.json(booth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN ASSIGN BOOTH
export const adminAssignBooth = async (req, res) => {
  try {
    const { exhibitorId } = req.body;

    if (!exhibitorId) {
      return res.status(400).json({ message: "Exhibitor ID required" });
    }

    const booth = await Booth.findById(req.params.id);
    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    const newExhibitor = await User.findById(exhibitorId);
    if (!newExhibitor || newExhibitor.role !== "exhibitor") {
      return res.status(400).json({ message: "Invalid exhibitor" });
    }

    const expo = await Expo.findById(booth.expoId);

    /* ================= PREVIOUS EXHIBITOR ================= */
    let previousExhibitor = null;
    if (booth.exhibitorId) {
      previousExhibitor = await User.findById(booth.exhibitorId);
    }

    /* ================= ASSIGN / REASSIGN ================= */
    booth.isBooked = true;
    booth.exhibitorId = exhibitorId;
    await booth.save();

    /* ================= EMAIL TO NEW EXHIBITOR ================= */
    const newEmailHtml = `
      <h2>Booth Assignment Confirmation</h2>

      <p>Hello <b>${newExhibitor.name}</b>,</p>

      <p>You have been <b>assigned a booth</b> by the admin.</p>

      <h3>📌 Booth Details</h3>
      <ul>
        <li><b>Expo:</b> ${expo.title}</li>
        <li><b>Booth Name:</b> ${booth.name}</li>
        <li><b>Booth Size:</b> ${booth.size} ft</li>
        <li><b>Location:</b> ${expo.location}</li>
        <li><b>Dates:</b> 
          ${new Date(expo.startDate).toDateString()} – 
          ${new Date(expo.endDate).toDateString()}
        </li>
      </ul>

      <p>If you have any questions, please contact support.</p>

      <p><b>Expo Management System</b></p>
    `;

    await expoMailer({
      to: newExhibitor.email,
      subject: "🎉 Booth Assigned",
      html: newEmailHtml
    });

    /* ================= EMAIL TO PREVIOUS EXHIBITOR ================= */
    if (previousExhibitor && previousExhibitor._id.toString() !== exhibitorId) {
      const oldEmailHtml = `
        <h2>Booth Reassignment Notice</h2>

        <p>Hello <b>${previousExhibitor.name}</b>,</p>

        <p>
          This is to inform you that your assigned booth 
          <b>${booth.name}</b> at <b>${expo.title}</b> has been 
          <b>reassigned</b> by the admin.
        </p>

        <p>
          If you believe this is a mistake, please contact the admin.
        </p>

        <p><b>Expo Management System</b></p>
      `;

      await expoMailer({
        to: previousExhibitor.email,
        subject: "⚠️ Booth Reassigned",
        html: oldEmailHtml
      });
    }

    res.json({
      success: true,
      message: "Booth assigned & emails sent",
      booth
    });

  } catch (error) {
    console.error("ADMIN ASSIGN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};


// ADMIN MAKE BOOTH AVAILABLE
// ADMIN MAKE BOOTH AVAILABLE + EMAIL
export const adminMakeBoothAvailable = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    if (!booth.isBooked) {
      return res.status(400).json({ message: "Booth is already available" });
    }

    // 🔹 SAVE PREVIOUS EXHIBITOR
    let previousExhibitor = null;
    if (booth.exhibitorId) {
      previousExhibitor = await User.findById(booth.exhibitorId);
    }

    const expo = await Expo.findById(booth.expoId);

    // 🔹 MAKE AVAILABLE
    booth.isBooked = false;
    booth.exhibitorId = null;
    booth.productsServices = [];
    booth.staff = [];

    await booth.save();

    // 🔹 SEND EMAIL TO PREVIOUS EXHIBITOR
    if (previousExhibitor) {
      const emailHtml = `
        <h2>Booth Availability Notice</h2>

        <p>Hello <b>${previousExhibitor.name}</b>,</p>

        <p>
          This is to inform you that your previously booked booth
          <b>${booth.name}</b> at <b>${expo.title}</b> has been
          <b>made available</b> by the admin.
        </p>

        <h3>📌 Booth Details</h3>
        <ul>
          <li><b>Expo:</b> ${expo.title}</li>
          <li><b>Booth Name:</b> ${booth.name}</li>
          <li><b>Booth Size:</b> ${booth.size} ft</li>
          <li><b>Location:</b> ${expo.location}</li>
          <li><b>Dates:</b>
            ${new Date(expo.startDate).toDateString()} –
            ${new Date(expo.endDate).toDateString()}
          </li>
        </ul>

        <p>
          If you have any questions, please contact the admin or support team.
        </p>

        <p><b>Expo Management System</b></p>
      `;

      await expoMailer({
        to: previousExhibitor.email,
        subject: "ℹ️ Booth Made Available",
        html: emailHtml
      });
    }

    res.json({
      success: true,
      message: "Booth marked as available & email sent",
      booth
    });

  } catch (error) {
    console.error("MAKE AVAILABLE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyBookedBooths = async (req, res) => {
  try {
    const exhibitorId = req.user._id;

    const booths = await Booth.aggregate([
      { $match: { exhibitorId, isBooked: true } },

      // Booth visits
      {
        $lookup: {
          from: "boothvisits",
          localField: "_id",
          foreignField: "boothId",
          as: "visits"
        }
      },
      { $addFields: { visitCount: { $size: "$visits" } } },

      // Expo registrations
      {
        $lookup: {
          from: "exporegistrations", // 👈 collection name (plural)
          localField: "expoId",
          foreignField: "expoId",
          as: "registrations"
        }
      },
      {
        $addFields: {
          registrationCount: { $size: "$registrations" }
        }
      }
    ]);

    // Populate expo details
    await Booth.populate(booths, {
      path: "expoId",
      select: "title location startDate endDate thumbnailImage"
    });

    res.status(200).json({
      success: true,
      booths
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch booths",
      error: error.message
    });
  }
};


export const getExpoExhibitors = async (req, res) => {
  try {
    const { expoId } = req.params;

    const booths = await Booth.find({
      expoId,
      isBooked: true,
      exhibitorId: { $ne: null }
    })
      .populate("exhibitorId", "companyName companyLogo productsServices email");

    // duplicate exhibitors hata do
    const uniqueExhibitors = [];
    const seen = new Set();

    booths.forEach(b => {
      if (
        b.exhibitorId &&
        !seen.has(b.exhibitorId._id.toString())
      ) {
        seen.add(b.exhibitorId._id.toString());

        // Convert to plain object to allow modification
        const exhibitorObj = b.exhibitorId.toObject();

        // Use BOOTH's products (Array) if available, otherwise keep User's
        if (b.productsServices && b.productsServices.length > 0) {
          exhibitorObj.productsServices = b.productsServices;
        }

        uniqueExhibitors.push(exhibitorObj);
      }
    });

    res.json(uniqueExhibitors);
  } catch (err) {
    res.status(500).json({ message: "Failed to load exhibitors" });
  }
};



// 🔹 BOOK BOOTH API
export const bookBooth = async (req, res) => {
  try {
    const { productsServices, staff, targetInterests } = req.body;

    const booth = await Booth.findById(req.params.id);
    if (!booth) return res.status(404).json({ message: "Booth not found" });
    if (booth.isBooked) return res.status(400).json({ message: "Booth already booked" });

    booth.isBooked = true;
    booth.productsServices = productsServices;
    booth.staff = staff;
    booth.targetInterests = targetInterests || [];
    booth.exhibitorId = req.user._id;
    await booth.save();

    const exhibitor = await User.findById(req.user._id);
    const expo = await Expo.findById(booth.expoId);

    // ✅ Generate PDF with QR
    // Generate PDF with QR
    const { buffer, fileName } = await generateBoothPass({ booth, exhibitor, expo });

    // Send email with PDF + HTML content
    await sendBoothPass({
      to: exhibitor.email,
      pdfBuffer: buffer,
      passName: fileName,
      exhibitor,
      booth,
      expo,
      productsServices,
      staff
    });


    // Optional: normal email content (old HTML) bhi bhejna agar chaho
    // ya is PDF attachment email ko hi use karo

    res.json({
      success: true,
      message: "Booth booked & QR pass emailed",
      booth
    });

  } catch (error) {
    console.error("BOOK BOOTH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};


// 🔹 GET RECOMMENDED BOOTHS
export const getRecommendedBooths = async (req, res) => {
  try {
    const { expoId } = req.params;
    const userId = req.user._id;

    // 1. Get Attendee
    const attendee = await User.findById(userId);
    if (!attendee) return res.status(404).json({ message: "Attendee not found" });

    const userInterests = attendee.interests || [];

    // 2. Get All Booked Booths for Expo
    const booths = await Booth.find({
      expoId,
      isBooked: true,
      exhibitorId: { $ne: null }
    }).populate("exhibitorId", "companyName companyLogo productsServices email");

    // 3. Filter Booths by Interest Match
    const recommendedBooths = booths.filter(booth => {
      const boothInterests = booth.targetInterests || [];
      const hasMatch = boothInterests.some(interest => userInterests.includes(interest));
      return hasMatch;
    });

    // 4. Format Result (Unique Exhibitors + Booth Info)
    const uniqueExhibitorsMap = new Map();

    recommendedBooths.forEach(b => {
      if (b.exhibitorId) {
        const exhibitorIdStr = b.exhibitorId._id.toString();

        if (!uniqueExhibitorsMap.has(exhibitorIdStr)) {
          uniqueExhibitorsMap.set(exhibitorIdStr, {
            exhibitor: b.exhibitorId,
            booths: []
          });
        }

        uniqueExhibitorsMap.get(exhibitorIdStr).booths.push({
          _id: b._id,
          name: b.name,
          size: b.size
        });
      }
    });

    const result = Array.from(uniqueExhibitorsMap.values());

    res.json({
      success: true,
      recommended: result,
      matchCount: result.length
    });

  } catch (err) {
    console.error("RECOMMENDATION ERROR:", err);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
};






// UPDATE BOOKED BOOTH (For Exhibitors)
export const updateBookedBooth = async (req, res) => {
  try {
    const { productsServices, staff, targetInterests } = req.body;
    const userId = req.user._id;

    // 1. Find Booth
    const booth = await Booth.findById(req.params.id);
    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    // 2. Verify Ownership
    if (!booth.exhibitorId || booth.exhibitorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this booth." });
    }

    // 3. Update Fields
    if (productsServices) booth.productsServices = productsServices;
    if (staff) booth.staff = staff;
    if (targetInterests) booth.targetInterests = targetInterests;

    await booth.save();

    res.json({
      success: true,
      message: "Booth details updated successfully",
      booth
    });

  } catch (error) {
    console.error("UPDATE BOOKED BOOTH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
