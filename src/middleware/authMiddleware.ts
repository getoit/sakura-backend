import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		res.status(401).json({ message: "Access token is missing!" });
		return;
	}

	jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
		if (err) {
			res.status(403).json({ message: "Invalid or expired token!" });
			return;
		}

		req.user = user as { userId: string; role: string };
		next();
	});
};

export const authorizeRole = (role: string) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (req.user?.role !== role) {
			res.status(403).json({ message: `Access restricted to ${role}s only!` });
			return;
		}
		next();
	};
};
