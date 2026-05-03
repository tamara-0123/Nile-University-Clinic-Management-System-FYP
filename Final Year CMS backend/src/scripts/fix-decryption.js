import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { initializeEncryption, getClientEncryption } from "../utils/encryption-setup.js";
import Patient from "../models/Patient.js";
import { MongoClient } from "mongodb";

const fixDecryption = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    await initializeEncryption();
    
    const clientEncryption = getClientEncryption();
    
    // Get raw data from MongoDB
    const rawClient = new MongoClient(process.env.MONGO_URI);
    await rawClient.connect();
    const rawDb = rawClient.db("cms");
    const rawPatient = await rawDb.collection("patients").findOne({});
    
    console.log("\n🔒 RAW ENCRYPTED DATA:");
    console.log("Allergies type:", rawPatient.allergies?._bsontype || typeof rawPatient.allergies);
    console.log("Emergency name type:", rawPatient.emergencyContact?.name?._bsontype || typeof rawPatient.emergencyContact?.name);
    
    // Try to decrypt manually
    if (rawPatient.allergies?._bsontype === 'Binary') {
      const decryptedAllergies = await clientEncryption.decrypt(rawPatient.allergies);
      console.log("\n✅ MANUAL DECRYPTION WORKS:");
      console.log("Allergies:", decryptedAllergies);
    }
    
    // Now test through Mongoose
    console.log("\n🔍 Testing Mongoose findOne...");
    const patient = await Patient.findOne({});
    console.log("Allergies:", patient.allergies);
    console.log("Chronic Conditions:", patient.chronicConditions);
    console.log("Emergency Contact:", patient.emergencyContact);
    
    await rawClient.close();
    console.log("\n✅ Check complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixDecryption();