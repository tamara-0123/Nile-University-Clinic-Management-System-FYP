import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Models
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Vitals from '../models/Vitals.js';
import Notification from '../models/Notification.js';
import Prescription from '../models/Prescription.js';
import Consultation from '../models/Consultation.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nile_cms';

async function seedActivity() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Get Users
    const doctors = await User.find({ role: 'doctor', isActive: true });
    const nurses = await User.find({ role: 'nurse', isActive: true });

    // Fetch all patients
    const allPatients = await Patient.find().populate('user');

    if (doctors.length === 0 || allPatients.length === 0) {
      console.error("No doctors or patients found. Please run seed_students.js and seed_staff.js first.");
      process.exit(1);
    }

    // 2. Select 20 Random Students (Patients)
    // Shuffle array
    const shuffled = allPatients.sort(() => 0.5 - Math.random());
    const targetPatients = shuffled.slice(0, 20);

    console.log(`Targeting ${targetPatients.length} students for rich data population...`);

    // 3. Clear old Activity Data
    console.log("Clearing old activity data...");
    await Appointment.deleteMany({});
    await Vitals.deleteMany({});
    await Notification.deleteMany({});
    await Prescription.deleteMany({});
    await Consultation.deleteMany({});

    // 4. Generate Data for Each Target Patient
    const medicalConcerns = [
      { diagnosis: "Malaria", meds: ["Artemether-Lumefantrine"], notes: "Patient reported fever and headache." },
      { diagnosis: "Typhoid Fever", meds: ["Ciprofloxacin", "Paracetamol"], notes: "Persistent high fever." },
      { diagnosis: "Common Cold", meds: ["Vitamin C", "Loratadine"], notes: "Runny nose and cough." },
      { diagnosis: "Gastritis", meds: ["Omeprazole", "Antacid"], notes: "Stomach pain after eating." },
      { diagnosis: "Allergic Reaction", meds: ["Cetirizine"], notes: "Skin rash and itching." },
      { diagnosis: "Migraine", meds: ["Ibuprofen"], notes: "Severe headache and light sensitivity." }
    ];

    let apptCount = 0;

    for (const patient of targetPatients) {
      const studentUser = patient.user; // properties like name, idNumber
      console.log(`Populating data for: ${studentUser.name} (${studentUser.idNumber})`);

      // A. Create 3 Past (Completed) Appointments
      for (let i = 1; i <= 3; i++) {
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        const randomNurse = nurses.length > 0 ? nurses[Math.floor(Math.random() * nurses.length)] : doctors[0];
        const concern = medicalConcerns[Math.floor(Math.random() * medicalConcerns.length)];

        // Date: ~ i*5 days ago
        const date = new Date();
        date.setDate(date.getDate() - (i * 5 + Math.floor(Math.random() * 3)));
        date.setHours(9 + Math.floor(Math.random() * 6), 0, 0, 0);

        // 1. Appointment
        const appt = await Appointment.create({
          patient: patient._id,
          doctor: randomDoctor._id,
          date: date,
          status: 'completed'
        });
        apptCount++;

        // 2. Vitals
        await Vitals.create({
          appointment: appt._id,
          patient: patient._id,
          recordedBy: randomNurse._id,
          bp: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
          temperature: `${(36.5 + Math.random() * 1.0).toFixed(1)}°C`,
          pulse: `${65 + Math.floor(Math.random() * 20)} bpm`,
          weight: `${55 + Math.floor(Math.random() * 30)} kg`
        });

        // 3. Consultation
        const consultation = await Consultation.create({
          appointment: appt._id,
          diagnosis: concern.diagnosis,
          notes: concern.notes
        });

        // 4. Prescription
        await Prescription.create({
          consultation: consultation._id,
          createdBy: randomDoctor._id,
          medications: concern.meds.map(m => ({
            name: m,
            dosage: "500mg",
            frequency: "Twice daily",
            duration: "5 days",
            instructions: "Take after food"
          })),
          version: 1
        });
      }

      // B. Create 1 Future Appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days in future
      futureDate.setHours(10, 0, 0, 0);

      await Appointment.create({
        patient: patient._id,
        doctor: doctors[Math.floor(Math.random() * doctors.length)]._id,
        date: futureDate,
        status: 'scheduled'
      });
      apptCount++;

      // C. Notifications
      await Notification.create({
        user: studentUser._id,
        title: "Appointment Reminder",
        message: `You have an appointment scheduled for ${futureDate.toLocaleDateString()}.`,
        type: "appointment",
        isRead: false
      });
      await Notification.create({
        user: studentUser._id,
        title: "Lab Results",
        message: `Your recent lab results are ready for pickup.`,
        type: "system",
        isRead: true
      });

    }

    console.log(`Successfully populated ${targetPatients.length} students with ${apptCount} appointments, vitals, consultations, and prescriptions.`);
    console.log("Here are the IDs to test with:");
    targetPatients.forEach(p => console.log(`- Name: ${p.user.name.padEnd(25)} | Login ID: ${p.user.studentID}`));

    process.exit(0);

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedActivity();
