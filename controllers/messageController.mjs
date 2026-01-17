import Message from "../models/messageModel.mjs";
import User from "../models/userModel.mjs";
import Notification from "../models/notificationModel.mjs";
import sendEmail from "../utils/sendEmail.mjs";

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, type, content, appointmentDate } = req.body;
        const senderId = req.user.id;

        // Validate receiver
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create Message
        const message = await Message.create({
            senderId,
            receiverId,
            type,
            content,
            appointmentDate: type === "appointment" ? appointmentDate : undefined,
        });

        const sender = await User.findById(senderId);

        // ================= NOTIFICATION LOGIC =================
        if (receiver.role === 'admin') {
            // BROADCAST TO ALL ADMINS
            const allAdmins = await User.find({ role: 'admin' });
            const notifDocs = allAdmins.map(admin => ({
                recipientId: admin._id,
                type: "message",
                title: `New Message from ${sender.name}`,
                content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                link: '/admin/messages'
            }));
            if (notifDocs.length > 0) await Notification.insertMany(notifDocs);

        } else {
            // Standard notification for single user
            await Notification.create({
                recipientId: receiverId,
                type: "message",
                title: `New Message from ${sender.name}`,
                content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                link: receiver.role === 'attendee' ? '/attendee/messages' :
                    receiver.role === 'exhibitor' ? '/exhibitor/messages' :
                        '/admin/messages'
            });
        }
        // ======================================================


        // Notify via Email (Keep it simple: only to direct receiver for now, or broadcast if critical)
        try {
            // Basic email to the direct receiver (even if it's one of the admins)
            const subject = type === "appointment" ? "New Appointment Request" : "New Inquiry Message";
            const emailContent = `
                <h3>You have a new ${type} from ${sender.name}</h3>
                <p><strong>Message:</strong> ${content}</p>
                ${type === 'appointment' ? `<p><strong>Requested Date:</strong> ${new Date(appointmentDate).toLocaleString()}</p>` : ''}
                <p>Login to your dashboard to reply.</p>
             `;
            if (receiver.email) {
                await sendEmail({ email: receiver.email, subject, message: emailContent });
            }
        } catch (emailErr) {
            console.error("Failed to send email notification", emailErr);
        }

        res.status(201).json({ success: true, message: "Message sent successfully", data: message });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Server error sending message" });
    }
};

export const getMyMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentUser = await User.findById(userId);

        let query;

        if (currentUser.role === 'admin') {
            // SHARED INBOX: Admins see messages sent to ANY admin or sent BY ANY admin
            const adminIds = await User.find({ role: 'admin' }).distinct('_id');
            query = {
                $or: [
                    { senderId: { $in: adminIds } },
                    { receiverId: { $in: adminIds } }
                ]
            };
        } else {
            // Standard user (Exhibitor/Attendee): See only their own messages
            query = {
                $or: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            };
        }

        const messages = await Message.find(query)
            .populate("senderId", "name email role profilePicture companyName companyLogo")
            .populate("receiverId", "name email role profilePicture companyName companyLogo")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};
