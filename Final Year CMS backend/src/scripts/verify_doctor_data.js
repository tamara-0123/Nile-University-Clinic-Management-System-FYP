import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nile_cms';

async function verifyDoctorData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Find Doctor Yusuf
    const doctor = await User.findOne({ staffID: 'D001' });
    if (!doctor) {
      console.log("Doctor D001 not found!");
      process.exit(1);
    }
    console.log(`Found Doctor: ${doctor.name} (${doctor.staffID}) _id: ${doctor._id}`);

    // Check Appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exact same query as controller
    const futureAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: today },
      status: { $ne: "completed" },
    }).populate('patient');

    console.log(`Found ${futureAppointments.length} future/active appointments for D001:`);
    futureAppointments.forEach(a => {
      console.log(`- Date: ${new Date(a.date).toLocaleString()} | Status: ${a.status} | Patient: ${a.patient ? a.patient.user : 'Unknown'}`);
    });

    // Check ALL appointments just in case
    const allAppointments = await Appointment.find({ doctor: doctor._id });
    console.log(`Total Lifetime Appointments for D001: ${allAppointments.length}`);

    if (futureAppointments.length === 0) {
      console.log("\nPossible Issues:");
      console.log("1. All seeded appointments are in the past.");
      console.log("2. All seeded appointments are assigned to OTHER doctors (e.g. D002).");
      console.log("3. All seeded appointments are 'completed'.");
    }

    process.exit(0);

  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verifyDoctorData();
