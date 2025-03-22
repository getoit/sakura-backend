import { Request, Response } from "express";
import admin from "firebase-admin";

type NotificationType = "ComplaintSubmit" | "ComplaintUpdate" | "FeedbackSubmit" | "FeedbackReply";

interface Notification {
    id: string;
    userId: string;
    message: string;
    type: NotificationType;
    data: any;
    createdDate: string;
}

export class NotificationController {
    // Fetch all notifications for a specific user
    static async getNotifications(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const snapshot = await admin
                .database()
                .ref("notifications")
                .orderByChild("userId")
                .equalTo(userId)
                .once("value");

            const notifications = snapshot.val()
                ? Object.values(snapshot.val()).sort(
                        (a: any, b: any) => b.timestamp - a.timestamp
                  )
                : [];

            if (notifications.length === 0) {
                res.status(404).json({ message: "No notifications found." });
                return;
            }

            res.status(200).json(notifications);
        } catch (error: any) {
            console.error("Error fetching notifications:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    // Mark a specific notification as read
    static async markAsRead(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const notificationRef = admin.database().ref(`notifications/${id}`);
            const snapshot = await notificationRef.once("value");

            if (!snapshot.exists()) {
                res.status(404).json({ message: "Notification not found." });
                return;
            }

            const updatedData = {
                isRead: true,
                updatedDate: new Date().toISOString(),
            };
            await notificationRef.update(updatedData);

            const updatedNotification = { ...snapshot.val(), ...updatedData };

            res.status(200).json({
                message: "Notification marked as read.",
                notification: updatedNotification,
            });
        } catch (error: any) {
            console.error("Error marking notification as read:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    // Delete a specific notification
    static async deleteNotification(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const notificationRef = admin.database().ref(`notifications/${id}`);
            const snapshot = await notificationRef.once("value");

            if (!snapshot.exists()) {
                res.status(404).json({ message: "Notification not found." });
                return;
            }

            await notificationRef.remove();

            res.status(200).json({ message: "Notification deleted successfully." });
        } catch (error: any) {
            console.error("Error deleting notification:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    // Mark all notifications as read for a specific user
    static async markAllAsRead(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const snapshot = await admin
                .database()
                .ref("notifications")
                .orderByChild("userId")
                .equalTo(userId)
                .once("value");

            if (!snapshot.exists()) {
                res
                    .status(404)
                    .json({ message: "No notifications found for the user." });
                return;
            }

            // Explicitly typing the updates object
            const updates: { [key: string]: any } = {};

            snapshot.forEach((childSnapshot) => {
                const notificationId = childSnapshot.key;
                updates[`notifications/${notificationId}/isRead`] = true;
                updates[`notifications/${notificationId}/updatedDate`] =
                    new Date().toISOString();
            });

            await admin.database().ref().update(updates);

            res.status(200).json({ message: "All notifications marked as read." });
        } catch (error: any) {
            console.error("Error marking all notifications as read:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    // Delete all notifications for a specific user
    static async deleteAllNotifications(
        req: Request,
        res: Response
    ): Promise<void> {
        const { userId } = req.params;

        try {
            const snapshot = await admin
                .database()
                .ref("notifications")
                .orderByChild("userId")
                .equalTo(userId)
                .once("value");

            if (!snapshot.exists()) {
                res
                    .status(404)
                    .json({ message: "No notifications found for the user." });
                return;
            }

            const updates: { [key: string]: any } = {};
            snapshot.forEach((childSnapshot) => {
                const notificationId = childSnapshot.key;
                updates[`notifications/${notificationId}`] = null;
            });

            await admin.database().ref().update(updates);

            res
                .status(200)
                .json({ message: "All notifications deleted successfully." });
        } catch (error: any) {
            console.error("Error deleting all notifications:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async createNotification(notification: Notification): Promise<void> {
        try {
            const newNotificationRef = admin.database().ref("notifications").push();
            notification.id = newNotificationRef.key!;
            await newNotificationRef.set(notification);
        } catch (error: any) {
            console.error("Error creating notification:", error);
        }
    }
}