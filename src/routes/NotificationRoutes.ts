import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Fetch notifications
router.get(
	"/:userId",
	authenticateToken,
	NotificationController.getNotifications
);

// Mark notification as read
router.put("/:id/read", authenticateToken, NotificationController.markAsRead);

// Delete notification
router.delete(
	"/:id",
	authenticateToken,
	NotificationController.deleteNotification
);

export default router;
