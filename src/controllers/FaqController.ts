import { Request, Response } from "express";
import admin from "firebase-admin";

export class FaqController {
	// Create a new FAQ
	static async createFaq(req: Request, res: Response): Promise<void> {
		try {
			const { question, answer } = req.body;

			const newFaqRef = admin.database().ref("faqs").push();
			const faq = {
				id: newFaqRef.key,
				question,
				answer,
				createdDate: new Date().toISOString(),
			};

			await newFaqRef.set(faq);

			res.status(201).json({ message: "FAQ created successfully!", faq });
		} catch (error: any) {
			console.error("Error creating FAQ:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}

	// List all FAQs
	static async listFaqs(req: Request, res: Response): Promise<void> {
		try {
			const snapshot = await admin.database().ref("faqs").once("value");
			const faqs = snapshot.val() ? Object.values(snapshot.val()) : [];

			res.status(200).json(faqs);
		} catch (error: any) {
			console.error("Error fetching FAQs:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}

	// Update an existing FAQ
	static async updateFaq(req: Request, res: Response): Promise<void> {
		const { id } = req.params;
		const { question, answer } = req.body;

		try {
			const faqRef = admin.database().ref(`faqs/${id}`);
			const snapshot = await faqRef.once("value");

			if (!snapshot.exists()) {
				res.status(404).json({ message: "FAQ not found!" });
				return;
			}

			const updatedFaq = {
				...snapshot.val(),
				question: question || snapshot.val().question,
				answer: answer || snapshot.val().answer,
				updatedDate: new Date().toISOString(),
			};

			await faqRef.set(updatedFaq);

			res
				.status(200)
				.json({ message: "FAQ updated successfully!", faq: updatedFaq });
		} catch (error: any) {
			console.error("Error updating FAQ:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}

	// Delete an FAQ
	static async deleteFaq(req: Request, res: Response): Promise<void> {
		const { id } = req.params;

		try {
			const faqRef = admin.database().ref(`faqs/${id}`);
			const snapshot = await faqRef.once("value");

			if (!snapshot.exists()) {
				res.status(404).json({ message: "FAQ not found!" });
				return;
			}

			await faqRef.remove();

			res.status(200).json({ message: "FAQ deleted successfully!" });
		} catch (error: any) {
			console.error("Error deleting FAQ:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}
}
