import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import fs from "fs";

dotenv.config();

const DATA_PATH = "./src/data/raw_staff.txt";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected!");

    console.log(`Reading from ${DATA_PATH}...`);
    const text = fs.readFileSync(DATA_PATH, 'utf-8');
    const lines = text.split("\n");

    let createdCount = 0;
    let updatedCount = 0;

    for (const line of lines) {
      // Skip headers or empty lines
      if (!line.includes("|") || line.startsWith("Role")) continue;

      const [role, id, name] = line.split("|").map(s => s.trim());

      if (!role || !id || !name) continue;

      // Check if user exists
      let user = await User.findOne({ staffID: id });

      if (user) {
        // Update
        user.name = name;
        user.role = role;
        await user.save();
        updatedCount++;
      } else {
        // Create new user
        await User.create({
          name,
          staffID: id,
          role,
          password: 'password123', // Default Password
          isActive: true
        });
        createdCount++;
      }
    }

    console.log(`\nImport Complete!`);
    console.log(`New Staff: ${createdCount}`);
    console.log(`Updated Staff: ${updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
}

seed();
