import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { initializeEncryption, getClientEncryption } from "./utils/encryption-setup.js";
import { saveEncryptedData, findEncryptedData } from "./utils/encrypted-operations.js";
import { MongoClient, ObjectId } from "mongodb";

const testEncryption = async () => {
  let regularClient;
  let savedId;
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ Connected to MongoDB");

    // Initialize encryption
    await initializeEncryption();
    console.log("✅ Encryption initialized");

    // Test data
    const testPatient = {
      user: new ObjectId(),
      bloodGroup: "A+",
      allergies: ["Penicillin", "Peanuts", "Latex"],
      chronicConditions: ["Asthma", "Diabetes"],
      emergencyContact: {
        name: "Jane Doe",
        phone: "555-0123"
      }
    };

    // 1. SAVE encrypted data
    console.log("\n📝 Saving encrypted patient data...");
    const saveResult = await saveEncryptedData("patients", testPatient);
    savedId = saveResult.insertedId;
    console.log("✅ Saved patient with ID:", savedId.toString());

    // 2. READ encrypted data (auto-decrypts through our functions)
    console.log("\n🔍 Reading encrypted patient data...");
    const foundPatient = await findEncryptedData("patients", { 
      _id: savedId 
    });
    
    console.log("✅ Retrieved patient (decrypted):");
    console.log("  - Allergies:", foundPatient.allergies);
    console.log("  - Chronic Conditions:", foundPatient.chronicConditions);
    console.log("  - Emergency Contact:", foundPatient.emergencyContact);
    console.log("  - Blood Group:", foundPatient.bloodGroup);

    // Verify decryption worked
    const allergiesMatch = JSON.stringify(foundPatient.allergies) === JSON.stringify(testPatient.allergies);
    const emergencyMatch = JSON.stringify(foundPatient.emergencyContact) === JSON.stringify(testPatient.emergencyContact);
    
    // 3. CHECK RAW MONGODB (without encryption)
    console.log("\n🔒 Checking raw MongoDB data...");
    regularClient = new MongoClient(process.env.MONGO_URI);
    await regularClient.connect();
    const rawDb = regularClient.db("clinic");
    const rawPatient = await rawDb.collection("patients").findOne({ 
      _id: savedId 
    });
    
    console.log("Raw MongoDB data:");
    console.log("  - Blood Group:", rawPatient.bloodGroup, "(should be plain text ✅)");
    console.log("  - Allergies:", rawPatient.allergies?.constructor?.name || typeof rawPatient.allergies);
    console.log("  - Chronic Conditions:", rawPatient.chronicConditions?.constructor?.name || typeof rawPatient.chronicConditions);
    console.log("  - Emergency Contact name:", rawPatient.emergencyContact?.name?.constructor?.name || typeof rawPatient.emergencyContact?.name);
    console.log("  - Emergency Contact phone:", rawPatient.emergencyContact?.phone?.constructor?.name || typeof rawPatient.emergencyContact?.phone);

    // Check if data is actually encrypted in MongoDB
    const isAllergiesEncrypted = rawPatient.allergies && rawPatient.allergies._bsontype === 'Binary';
    const isEmergencyEncrypted = rawPatient.emergencyContact?.name && rawPatient.emergencyContact.name._bsontype === 'Binary';
    
    console.log("\n📊 Encryption Status:");
    console.log(`  Allergies Encrypted: ${isAllergiesEncrypted ? '✅ YES' : '❌ NO'}`);
    console.log(`  Emergency Contact Encrypted: ${isEmergencyEncrypted ? '✅ YES' : '❌ NO'}`);
    console.log(`  Decryption Working: ${allergiesMatch ? '✅ YES' : '❌ NO'}`);
    
    if (isAllergiesEncrypted && isEmergencyEncrypted && allergiesMatch) {
      console.log("\n🎉 SUCCESS! Encryption is working perfectly!");
    } else {
      console.log("\n⚠️  Partial success - check the details above");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    // Clean up test data
    if (regularClient && savedId) {
      try {
        await regularClient.db("clinic").collection("patients").deleteOne({ _id: savedId });
        console.log("\n🧹 Test data cleaned up");
      } catch (cleanupError) {
        console.log("⚠️  Cleanup failed:", cleanupError.message);
      }
    }
    
    // Close connections
    if (regularClient) await regularClient.close().catch(() => {});
    console.log("Test complete");
    process.exit(0);
  }
};

testEncryption();