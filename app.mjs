import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from "path";
import "./cron/expoReminderCron.mjs";
import expoRoutes from './routes/expoRoutes.mjs'
import boothRoutes from './routes/boothRoutes.mjs'
import scheduleRoutes from './routes/scheduleRoutes.mjs'
import authRoutes from './routes/authRoutes.mjs'
import UserRoutes from './routes/UserRoutes.mjs'
import AttendeeRoutes from './routes/attendeeRoutes.mjs'
import boothvisit from './routes/boothVisitRoutes.mjs'
import messageRoutes from './routes/messageRoutes.mjs'
import sessionRoutes from './routes/sessionRoutes.mjs'
import notificationRoutes from './routes/notificationRoutes.mjs'
import aiRoutes from './routes/aiRoutes.mjs';

dotenv.config();

const app = express();

// ✅ CORS Fix
const allowedOrigins = [
  "https://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: true, // This automatically sets Access-Control-Allow-Origin to the request origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// Routes
app.use("/api/expo", expoRoutes);
app.use("/api/booths", boothRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", UserRoutes);
app.use("/api/attendee", AttendeeRoutes);
app.use("/api/boothvisit", boothvisit);
app.use("/api/messages", messageRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);

// Root Route for checking status
app.get("/", (req, res) => {
  res.send("Expo API is running...");
});

// Start server only if not in production (Vercel handles it via export)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
