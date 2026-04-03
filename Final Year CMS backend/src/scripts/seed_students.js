import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import fs from "fs";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
dotenv.config();

const DATA_PATH = "./src/data/students.json";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected!");

    const students = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    console.log(`Loading ${students.length} students to import...`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const s of students) {
      // Check if user exists
      let user = await User.findOne({ studentID: s.studentID });

      if (user) {
        // Update name if needed
        user.name = s.name;
        await user.save();
        updatedCount++;
      } else {
        // Create new user
        user = await User.create({
          name: s.name,
          studentID: s.studentID,
          role: 'student',
          password: 'password123', // Default Password
          isActive: true
        });
        createdCount++;
      }

      // Ensure Patient profile exists
      const patient = await Patient.findOne({ user: user._id });
      if (!patient) {
        await Patient.create({
          user: user._id,
          studentID: user.studentID
        });
      }
    }

    console.log(`\nImport Complete!`);
    console.log(`New Students: ${createdCount}`);
    console.log(`Updated Students: ${updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
}

seed();
