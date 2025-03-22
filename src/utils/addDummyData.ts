import admin from "firebase-admin";
import bcrypt from "bcrypt";
import { config } from "dotenv";

config();

const serviceAccount = require("../../sakura-database-firebase.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount), // Ensure Firebase is initialized with the correct credentials
	databaseURL: process.env.FIREBASE_DATABASE_URL, // Replace with your Firebase database URL
});

// Sample dummy data for one student and one admin
const dummyData = {
	students: [
		{
			userId: "82430",
			password: "anis1234", // Plain password, will be hashed
			role: "student",
			name: "Anis Sofea Binti Zahamdan",
			matricNo: "82430",
			email: "82430@siswa.unimas.my",
		},
		{
			userId: "75848",
			password: "danial1234", // Plain password, will be hashed
			role: "student",
			name: "Muhammad Danial Bin Zamri",
			matricNo: "75848",
			email: "75848@siswa.unimas.my",
		},
		{
			userId: "84701",
			password: "hazim1234", // Plain password, will be hashed
			role: "student",
			name: "Muhammad Hazim Bin Rohani",
			matricNo: "84701",
			email: "84701@siswa.unimas.my",
		},
		{
			userId: "82905",
			password: "sha1234", // Plain password, will be hashed
			role: "student",
			name: "Phlyzesha Phua",
			matricNo: "82905",
			email: "82905@siswa.unimas.my",
		},
		{
			userId: "82925",
			password: "ros1234", // Plain password, will be hashed
			role: "student",
			name: "Rosita Anak Uja",
			matricNo: "82925",
			email: "82925@siswa.unimas.my",
		},
		{
			userId: "82938",
			password: "azleen1234", // Plain password, will be hashed
			role: "student",
			name: "Sharifah Azleen Aleesya Binti Wan Awat",
			matricNo: "82938",
			email: "82938@siswa.unimas.my",
		},
	],
	admins: [
		{
			userId: "admin1",
			password: "admin1234", // Plain password, will be hashed
			role: "admin",
			name: "admin1",
			matricNo: "admin1",
			email: "admin1@unimas.my",
		}
	]
};

// Function to hash the password and add dummy data to Firebase
const addDummyDataToFirebase = async () => {
    try {
        const usersRef = admin.database().ref("users");

        // Add student data to Firebase
        for (const student of dummyData.students) {
            const hashedPassword = await bcrypt.hash(student.password, 10); // Hash the password
            await usersRef.push({
                userId: student.userId,
                password: hashedPassword,
                role: student.role,
                name: student.name,
                matricNo: student.matricNo,
                email: student.email,
            });
        }

        // Add admin data to Firebase
        for (const adminData of dummyData.admins) {
            const hashedPassword = await bcrypt.hash(adminData.password, 10); // Hash the password
            await usersRef.push({
                userId: adminData.userId,
                password: hashedPassword,
                role: adminData.role,
                name: adminData.name,
                matricNo: adminData.matricNo,
                email: adminData.email,
            });
        }

        console.log("Dummy student and admin data added successfully!");
    } catch (error) {
        console.error("Error adding dummy data to Firebase:", error);
    }
};

// Run the function to add the dummy data
addDummyDataToFirebase();
