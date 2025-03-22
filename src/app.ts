// app.ts
import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initializeFirebase } from "./utils/firebaseConfig";
import userRoutes from "./routes/UserRoutes";
import complaintRoutes from "./routes/ComplaintRoutes";
import feedbackRoutes from "./routes/FeedbackRoutes";
import contactRoutes from "./routes/ContactRoutes";
import faqRoutes from "./routes/FaqRoutes";
import notificationRoutes from "./routes/NotificationRoutes";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/users", userRoutes);
app.use("/complaints", complaintRoutes);
app.use("/feedbacks", feedbackRoutes);
app.use("/contacts", contactRoutes);
app.use("/faqs", faqRoutes);
app.use("/notifications", notificationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
	},
});

io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

	socket.on("join", (userId) => {
		console.log(`User joined room: ${userId}`);
		socket.join(userId);
	});

	socket.on("disconnect", () => {
		console.log(`User disconnected: ${socket.id}`);
	});
});

export const sendNotification = (userId: string, notification: object) => {
	io.to(userId).emit("notification", notification);
};

initializeFirebase().then(() => {
	app.listen(PORT, () =>
		console.log(`Server running on http://localhost:${PORT}`)
	);
});
