import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.mjs";
import nodemailer from "nodemailer";
import sendEmail from "../utils/sendEmail.mjs"; // tumhara email util
import expoMailer from "../utils/expoMailer.mjs";
import accountApprovedTemplate from "../utils/accountApprovedTemplate.mjs";
import accountUnapprovedTemplate from "../utils/accountUnapprovedTemplate.mjs";

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      productsServices
    } = req.body;

    // ❌ Admin registration blocked
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration not allowed"
      });
    }

    // Check existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ================= ATTENDEE =================
    if (role === "attendee") {
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        status: "approved",
        isActive: true
      });

      return res.status(201).json({
        success: true,
        message: "Attendee registered successfully",
        userId: user._id
      });
    }

    // ================= EXHIBITOR =================
    if (role === "exhibitor") {
      if (!companyName || !productsServices) {
        return res.status(400).json({
          success: false,
          message: "Company details required"
        });
      }

      if (!req.files?.companyLogo?.[0]?.path) {
        return res.status(400).json({
          success: false,
          message: "Company logo required"
        });
      }

      if (!req.files?.documents?.length) {
        return res.status(400).json({
          success: false,
          message: "At least one document required"
        });
      }

      const documents = req.files.documents.map(f => f.path);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        companyName,
        productsServices,
        companyLogo: req.files.companyLogo[0].path,
        documents,
        status: "unapproved",
        isActive: false
      });

      return res.status(201).json({
        success: true,
        message: "Exhibitor registered. Await admin approval.",
        userId: user._id
      });
    }

    res.status(400).json({ success: false, message: "Invalid role" });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const registerStep1 = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });

  let otp;

  if (exists) {
    // If user exists but is NOT verified (incomplete step 1/2) OR has no role (incomplete step 3/4)
    if (!exists.emailVerified || !exists.role) {
      // Allow re-registering -> Update details & send new OTP
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      exists.name = name;
      exists.password = await bcrypt.hash(password, 10);
      exists.emailOtp = otp;
      exists.otpExpiry = Date.now() + 10 * 60 * 1000;
      exists.emailVerified = false; // Force re-verification
      await exists.save();
    } else {
      // User is fully registered and verified
      return res.status(400).json({ message: "Email already registered" });
    }
  } else {
    // New User
    otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      emailOtp: otp,
      otpExpiry: Date.now() + 10 * 60 * 1000
    });
  }

  await sendEmail({
    email,
    subject: "Verify your Email Address",
    message: `
      <div style="text-align: center;">
        <h2>Welcome to NexPo!</h2>
        <p>You are just one step away from creating your account.</p>
        <p>Please use the verification code below to confirm your email address.</p>
        
        <div class="otp">${otp}</div>
        
        <p style="font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `
  });

  res.json({ message: "OTP sent to email" });
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update User
    user.emailOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email
    await sendEmail({
      email,
      subject: "Resend Verification Code",
      message: `
        <div style="text-align: center;">
          <h2>Verification Code Resent</h2>
          <p>You requested a new verification code.</p>
          <p>Please use the code below to verify your email address.</p>
          
          <div class="otp">${otp}</div>
          
          <p style="font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: "OTP resent successfully" });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.emailOtp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.emailVerified = true;
  user.emailOtp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ message: "Email verified" });
};

export const registerFinal = async (req, res) => {
  const { email, role, companyName, productsServices } = req.body;

  const user = await User.findOne({ email });
  if (!user.emailVerified) {
    return res.status(403).json({ message: "Verify email first" });
  }

  user.role = role;

  if (role === "attendee") {
    user.status = "approved";
    user.isActive = true;
  }

  if (role === "exhibitor") {
    user.companyName = companyName;
    user.productsServices = productsServices;
    user.companyLogo = req.files.companyLogo[0].path;
    user.documents = req.files.documents.map(f => f.path);
  }

  await user.save();

  // 👉 SEND FINAL REGISTRATION EMAIL VIA EXPOMAILER
  if (role === "attendee") {
    // Attendees are auto-approved
    await expoMailer({
      to: email,
      subject: "Welcome to NexPo! Account Created",
      html: accountApprovedTemplate({
        name: user.name,
        role: "attendee"
      })
    });
  } else if (role === "exhibitor") {
    // Exhibitors are under review (unapproved)
    await expoMailer({
      to: email,
      subject: "Registration Successful - Account Under Review",
      html: accountUnapprovedTemplate({
        name: user.name,
        role: "exhibitor"
      })
    });
  }

  res.json({ message: "Registration completed" });
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 4️⃣ Email verification
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    // 5️⃣ Role-based checks
    if (user.role !== "admin") {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive"
        });
      }

      if (user.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Account not approved by admin"
        });
      }
    }

    // 6️⃣ Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7️⃣ Redirect route
    let redirectUrl = "/";
    if (user.role === "admin") redirectUrl = "/admin";
    if (user.role === "attendee") redirectUrl = "/attendee";
    if (user.role === "exhibitor") redirectUrl = "/exhibitor";

    // ✅ FINAL RESPONSE (🔥 IMPORTANT)
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      redirectUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        companyLogo: user.companyLogo,
        companyName: user.companyName,
        status: user.status,
        interests: user.interests || []
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // Send Email
    await sendEmail({
      email,
      subject: "Password Reset Request",
      message: `
        <h2>Reset Your Password</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>Use the OTP below to proceed with resetting your password:</p>
        
        <div class="otp">${otp}</div>
        
        <p>If you didn't ask to reset your password, you can ignore this email.</p>
      `
    });

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    // OTP validation
    if (
      user.emailOtp !== otp ||
      !user.otpExpiry ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.emailOtp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllExhibitors = async (req, res) => {
  try {
    const exhibitors = await User.find({
      role: "exhibitor",
      status: "approved"
    }).select("name companyName email");

    res.json(exhibitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateExhibitorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ ALLOWED TEXT FIELDS
    if (req.body.name) user.name = req.body.name;
    if (req.body.companyName) user.companyName = req.body.companyName;
    if (req.body.productsServices) user.productsServices = req.body.productsServices;

    // ✅ COMPANY LOGO
    if (req.files?.companyLogo) {
      user.companyLogo = req.files.companyLogo[0].path;
    }

    // ✅ APPEND DOCUMENTS (ADMIN JESA)
    if (req.files?.documents) {
      const newDocs = req.files.documents.map(f => f.path);
      user.documents = [...user.documents, ...newDocs];
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Profile update failed"
    });
  }
};

export const deleteUserDocument = async (req, res) => {
  try {
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ message: "Document URL required" });
    }

    const user = await User.findById(req.user._id);

    user.documents = user.documents.filter(doc => doc !== documentUrl);

    await user.save();

    res.json({
      success: true,
      documents: user.documents
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const { name, phone, gender, dob } = req.body;

    const admin = await User.findById(adminId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // ✏ EDITABLE FIELDS
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (gender) admin.gender = gender;
    if (dob) admin.dob = dob;

    // 📸 PROFILE PICTURE (Cloudinary)
    if (req.file) {
      admin.profilePicture = req.file.path; // cloudinary URL
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin profile updated",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        gender: admin.gender,
        dob: admin.dob,
        profilePicture: admin.profilePicture
      }
    });

  } catch (error) {
    console.error("ADMIN PROFILE UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


export const updateAttendeeProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const { name, phone, gender, dob, interests } = req.body;

    const admin = await User.findById(adminId);

    if (!admin || admin.role !== "attendee") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // ✏ EDITABLE FIELDS
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (gender) admin.gender = gender;
    if (dob) admin.dob = dob;
    if (interests) {
      // Handle both stringified array or direct array
      try {
        admin.interests = typeof interests === 'string' ? JSON.parse(interests) : interests;
      } catch (e) {
        admin.interests = interests.split(',').map(i => i.trim());
      }
    }

    // 📸 PROFILE PICTURE (Cloudinary)
    if (req.file) {
      admin.profilePicture = req.file.path; // cloudinary URL
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin profile updated",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        gender: admin.gender,
        dob: admin.dob,
        profilePicture: admin.profilePicture,
        interests: admin.interests
      }
    });

  } catch (error) {
    console.error("ADMIN PROFILE UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("id role status");
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
