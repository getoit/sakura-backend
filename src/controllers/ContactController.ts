import { Request, Response } from "express";
import admin from "firebase-admin";

export class ContactController {
	// Get the single contact (if it exists)
	static async getContact(req: Request, res: Response): Promise<void> {
		try {
			const snapshot = await admin.database().ref("contact").once("value");
			const contact = snapshot.val();

			if (!contact) {
				res.status(404).json({ message: "Contact not found!" });
				return;
			}

			res.status(200).json(contact);
		} catch (error: any) {
			console.error("Error fetching contact:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}

	// Update the existing contact (only one contact in DB)
	static async updateContact(req: Request, res: Response): Promise<void> {
		try {
			const { address, phone, fax, emergency } = req.body;

			const contactRef = admin.database().ref("contact");
			const snapshot = await contactRef.once("value");
			const contact = snapshot.val();

			if (!contact) {
				res.status(404).json({ message: "Contact not found!" });
				return;
			}

			// Update the contact with new details
			const updatedContact = {
				address: address || contact.address,
				phone: phone || contact.phone,
				fax: fax || contact.fax,
				emergency: emergency || contact.emergency,
			};

			await contactRef.set(updatedContact);

			res.status(200).json({
				message: "Contact updated successfully!",
				contact: updatedContact,
			});
		} catch (error: any) {
			console.error("Error updating contact:", error);
			res
				.status(500)
				.json({ message: "Internal server error", error: error.message });
		}
	}
}
