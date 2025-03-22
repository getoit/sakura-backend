import { Router } from "express";
import { ContactController } from "../controllers/ContactController";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, ContactController.getContact);
router.put(
	"/",
	authenticateToken,
	authorizeRole("admin"),
	ContactController.updateContact
);

export default router;
