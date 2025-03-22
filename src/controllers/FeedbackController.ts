import { Request, Response } from "express";
import admin from "firebase-admin";
import { NotificationController } from "./NotificationController";
import { sendEmailNotification } from "./ComplaintController"; // Import the sendEmailNotification function

export class FeedbackController {
    static async createFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { complaintId, rating, comments } = req.body;

            const submittedBy = req.user?.userId;
            if (!submittedBy) {
                res.status(403).json({
                    message: "User must be authenticated to submit feedback.",
                });
                return;
            }

            // Create a new feedback entry in Firebase Realtime Database
            const newFeedbackRef = admin.database().ref("feedbacks").push();
            const feedback = {
                id: newFeedbackRef.key,
                complaintId,
                rating,
                comments,
                submittedBy,
                reply: null, // New field for reply
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString(),
            };

            await newFeedbackRef.set(feedback);

            // Create notification for FeedbackSubmit
            await NotificationController.createNotification({
                userId: submittedBy,
                message: "Your feedback has been submitted.",
                type: "FeedbackSubmit",
                data: { feedbackId: newFeedbackRef.key },
                createdDate: new Date().toISOString(),
                id: ""
            });

            // Send email notification
            await sendEmailNotification(submittedBy, "Your feedback has been submitted.");

            res
                .status(201)
                .json({ message: "Feedback submitted successfully!", feedback });
        } catch (error: any) {
            console.error("Error submitting feedback:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async listFeedbacks(req: Request, res: Response): Promise<void> {
        try {
            const snapshot = await admin.database().ref("feedbacks").once("value");
            const feedbacks = snapshot.val() ? Object.values(snapshot.val()) : [];

            res.status(200).json(feedbacks);
        } catch (error: any) {
            console.error("Error fetching feedbacks:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async getFeedbackById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const feedbackRef = admin.database().ref(`feedbacks/${id}`);
            const feedbackSnapshot = await feedbackRef.once("value");

            if (!feedbackSnapshot.exists()) {
                res.status(404).json({ message: "Feedback not found" });
                return;
            }

            res.status(200).json(feedbackSnapshot.val());
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }

    static async replyFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { feedbackId, reply } = req.body;

            const feedbackRef = admin.database().ref(`feedbacks/${feedbackId}`);
            const feedbackSnapshot = await feedbackRef.once("value");

            if (!feedbackSnapshot.exists()) {
                res.status(404).json({ message: "Feedback not found" });
                return;
            }

            await feedbackRef.update({
                reply,
                updatedDate: new Date().toISOString(),
            });

            // Create notification for FeedbackReply
            await NotificationController.createNotification({
                userId: feedbackSnapshot.val().submittedBy,
                message: "Your feedback has been replied.",
                type: "FeedbackReply",
                data: { feedbackId },
                createdDate: new Date().toISOString(),
                id: ""
            });

            // Send email notification
            await sendEmailNotification(feedbackSnapshot.val().submittedBy, "Your feedback has been replied.");

            res.status(200).json({ message: "Reply added successfully!" });
        } catch (error: any) {
            console.error("Error replying to feedback:", error);
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    }
}