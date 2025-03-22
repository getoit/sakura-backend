import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import admin from "firebase-admin";

// Define the type for a user
interface User {
	userId: string;
	password: string;
	role: string;
}

export class UserController {
	// Student Login
	static async studentLogin(req: Request, res: Response): Promise<void> {
		const { userId, password } = req.body;

		try {
			// Find the student in Firebase database
			const snapshot = await admin
				.database()
				.ref("users")
				.orderByChild("userId")
				.equalTo(userId)
				.once("value");

			const students = snapshot.val();
			if (!students) {
				res.status(404).json({ message: "Student not found!" });
				return;
			}

			// Cast the retrieved data to the User type
			const student = Object.values(students)[0] as User;
			if (student.role !== "student") {
				res.status(404).json({ message: "Student not found!" });
				return;
			}

			// Compare passwords
			const passwordMatch = await bcrypt.compare(password, student.password);
			if (!passwordMatch) {
				res.status(401).json({ message: "Invalid credentials!" });
				return;
			}

			// Generate JWT
			const token = jwt.sign(
				{ userId: student.userId, role: student.role },
				process.env.JWT_SECRET || "secret",
				{ expiresIn: "1h" }
			);

			res.status(200).json({ message: "Login successful!", token });
		} catch (error) {
			console.error("Error during student login:", error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	// Admin Login
	static async adminLogin(req: Request, res: Response): Promise<void> {
		const { userId, password } = req.body;

		try {
			// Find the admin in Firebase database
			const snapshot = await admin
				.database()
				.ref("users")
				.orderByChild("userId")
				.equalTo(userId)
				.once("value");

			const admins = snapshot.val();
			if (!admins) {
				res.status(404).json({ message: "Admin not found!" });
				return;
			}

			// Cast the retrieved data to the User type
			const adminUser = Object.values(admins)[0] as User;
			if (adminUser.role !== "admin") {
				res.status(404).json({ message: "Admin not found!" });
				return;
			}

			// Compare passwords
			const passwordMatch = await bcrypt.compare(password, adminUser.password);
			if (!passwordMatch) {
				res.status(401).json({ message: "Invalid credentials!" });
				return;
			}

			// Generate JWT
			const token = jwt.sign(
				{ userId: adminUser.userId, role: adminUser.role },
				process.env.JWT_SECRET || "secret",
				{ expiresIn: "1h" }
			);

			res.status(200).json({ message: "Login successful!", token });
		} catch (error) {
			console.error("Error during admin login:", error);
			res.status(500).json({ message: "Internal server error" });
		}
	}
}
