import { Request, Response } from "express";
import admin from "firebase-admin";
import { sendNotification } from "../app";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { NotificationController } from "./NotificationController";
config();

interface User {
    email: string;
    matricNo: string;
    name: string;
    password: string;
    role: string;
    userId: string;
}

export class ComplaintController {
    static async listComplaints(req: Request, res: Response): Promise<void> {
        try {
            const snapshot = await admin.database().ref("complaints").once("value");
            const complaints = snapshot.val() ? Object.values(snapshot.val()) : [];
            res.status(200).json(complaints);
        } catch (error: any) {
            console.error("Error fetching complaints:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async createComplaint(req: Request, res: Response): Promise<void> {
        try {
            const {
                phoneNumber,
                roomNumber,
                category,
                description,
                priority,
                comment,
            } = req.body;

            const submittedBy = req.user?.userId;
            if (!submittedBy) {
                res.status(403).json({
                    message: "User must be authenticated to submit a complaint.",
                });
                return;
            }

            const userSnapshot = await admin
                .database()
                .ref("users")
                .orderByChild("userId")
                .equalTo(submittedBy)
                .once("value");

            if (!userSnapshot.exists()) {
                res.status(404).json({ message: "User not found!" });
                return;
            }

            const users = userSnapshot.val() as Record<string, User>;
            const user = Object.values(users)[0];
            const { name, matricNo } = user;

            if (!name || !matricNo) {
                res.status(500).json({ message: "User data is incomplete!" });
                return;
            }

            const newComplaintRef = admin.database().ref("complaints").push();
            const complaint = {
                id: newComplaintRef.key,
                name,
                matricNo,
                phoneNumber,
                submittedBy,
                roomNumber,
                category,
                description,
                priority,
                comment: null,
                status: "Pending",
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString(),
            };

            await newComplaintRef.set(complaint);

            // Create notification for ComplaintSubmit
            await NotificationController.createNotification({
                userId: submittedBy,
                message: "Your complaint has been submitted.",
                type: "ComplaintSubmit",
                data: { complaintId: newComplaintRef.key },
                createdDate: new Date().toISOString(),
                id: ""
            });

            // Send email notification
            await sendEmailNotification(matricNo, "Your complaint has been submitted.");

            res
                .status(201)
                .json({ message: "Complaint created successfully!", complaint });
        } catch (error: any) {
            console.error("Error creating complaint:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async updateComplaint(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { status, comment } = req.body;

        try {
            const complaintRef = admin.database().ref(`complaints/${id}`);
            const snapshot = await complaintRef.once("value");

            if (!snapshot.exists()) {
                res.status(404).json({ message: "Complaint not found!" });
                return;
            }

            const complaint = snapshot.val();
            const updatedData = {
                status,
                comment,
                updatedDate: new Date().toISOString(),
            };

            await complaintRef.update(updatedData);

            const updatedComplaint = { ...complaint, ...updatedData };

            // Create notification for ComplaintUpdate
            await NotificationController.createNotification({
                userId: complaint.submittedBy,
                message: `Your complaint has been updated to "${status}" with a comment "${comment}"`,
                type: "ComplaintUpdate",
                data: { complaintId: id },
                createdDate: new Date().toISOString(),
                id: ""
            });

            // Send email notification
            await sendEmailNotification(complaint.matricNo, `Your complaint has been updated to "${status}" with a comment "${comment}"`);

            res.status(200).json({
                message: "Complaint updated successfully!",
                complaint: updatedComplaint,
            });
        } catch (error: any) {
            console.error("Error updating complaint:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async getComplaintsByMatricNo(
        req: Request,
        res: Response
    ): Promise<void> {
        const { matricNo } = req.params;

        try {
            const snapshot = await admin
                .database()
                .ref("complaints")
                .orderByChild("matricNo")
                .equalTo(matricNo)
                .once("value");
            const complaints = snapshot.val() ? Object.values(snapshot.val()) : [];

            if (complaints.length === 0) {
                res
                    .status(404)
                    .json({ message: `No complaints found for matricNo: ${matricNo}` });
                return;
            }

            res.status(200).json(complaints);
        } catch (error: any) {
            console.error("Error fetching complaints:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async getComplaintsById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const snapshot = await admin
                .database()
                .ref(`complaints/${id}`)
                .once("value");

            if (!snapshot.exists()) {
                res
                    .status(404)
                    .json({ message: `No complaints found for complaintId: ${id}` });
                return;
            }

            res.status(200).json(snapshot.val());
        } catch (error: any) {
            console.error("Error fetching complaints:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }
}

export async function sendEmailNotification(
    matricNo: string,
    message: string
): Promise<void> {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });

        const userSnapshot = await admin
            .database()
            .ref("users")
            .orderByChild("matricNo")
            .equalTo(matricNo)
            .once("value");

        if (!userSnapshot.exists()) {
            console.error(`User with matricNo ${matricNo} not found.`);
            return; // Or handle the error as needed
        }

        const users = userSnapshot.val() as Record<string, User>;
        const user = Object.values(users)[0];
        const email = user.email;

		console.log(user);

		if (!user || !email) {
            console.error("User not found or email not available");
            return;
        }

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Complaint Update",
            text: message,
        });

        console.log(`Email sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}