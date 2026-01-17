import Notification from "../models/notificationModel.mjs";

export const getNotifications = async (req, res) => {
    try {
        const recipientId = req.user.id;
        const notifications = await Notification.find({ recipientId })
            .sort({ createdAt: -1 })
            .limit(20);

        // Count unread
        const unreadCount = await Notification.countDocuments({
            recipientId,
            isRead: false
        });

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error("GET NOTIFICATIONS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const recipientId = req.user.id;
        await Notification.updateMany(
            { recipientId, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("MARK READ ERROR:", err);
        res.status(500).json({ message: "Failed to mark as read" });
    }
};
