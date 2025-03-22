import { Router } from "express";
import { UserController } from "../controllers/UserController";

const router = Router();

router.post("/students/login", UserController.studentLogin);
router.post("/admins/login", UserController.adminLogin);

export default router;
