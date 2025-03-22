import { Router } from "express";
import { FaqController } from "../controllers/FaqController";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";

const router = Router();

router.post(
	"/",
	authenticateToken,
	authorizeRole("admin"),
	FaqController.createFaq
);
router.get("/", authenticateToken, FaqController.listFaqs);
router.put(
	"/:id",
	authenticateToken,
	authorizeRole("admin"),
	FaqController.updateFaq
);
router.delete(
	"/:id",
	authenticateToken,
	authorizeRole("admin"),
	FaqController.deleteFaq
);

export default router;
