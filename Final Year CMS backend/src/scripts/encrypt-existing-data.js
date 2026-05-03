import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { initializeEncryption, getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const encryptExistingData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ Connected to MongoDB");

    // Initialize encryption
    await initializeEncryption();
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    console.log("✅ Encryption initialized");

    // Connect with regular client to see raw data
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("cms");
    const patientsCollection = db.collection("patients");

    // Find all patients
    const allPatients = await patientsCollection.find({}).toArray();
    console.log(`\n📊 Found ${allPatients.length} patients total`);

    let encrypted = 0;
    let skipped = 0;
    let errors = 0;

    for (const patient of allPatients) {
      try {
        // Check if already encrypted
        const isAllergiesEncrypted = patient.allergies && patient.allergies._bsontype === 'Binary';
        const isEmergencyEncrypted = patient.emergencyContact?.name && patient.emergencyContact.name._bsontype === 'Binary';

        if (isAllergiesEncrypted && isEmergencyEncrypted) {
          console.log(`⏭️  Patient ${patient._id}: Already encrypted, skipping`);
          skipped++;
          continue;
        }

        const updateFields = {};

        // Encrypt allergies if they exist and are not encrypted
        if (patient.allergies && Array.isArray(patient.allergies)) {
          console.log(`   Encrypting allergies: ${patient.allergies}`);
          updateFields.allergies = await clientEncryption.encrypt(patient.allergies, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Encrypt chronicConditions
        if (patient.chronicConditions && Array.isArray(patient.chronicConditions)) {
          console.log(`   Encrypting chronic conditions: ${patient.chronicConditions}`);
          updateFields.chronicConditions = await clientEncryption.encrypt(patient.chronicConditions, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Encrypt emergencyContact
        if (patient.emergencyContact && typeof patient.emergencyContact === 'object') {
          updateFields.emergencyContact = {};
          
          if (patient.emergencyContact.name && typeof patient.emergencyContact.name === 'string') {
            console.log(`   Encrypting emergency name: ${patient.emergencyContact.name}`);
            updateFields.emergencyContact.name = await clientEncryption.encrypt(
              patient.emergencyContact.name, {
                keyId: dataKeyId,
                algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
              }
            );
          }
          
          if (patient.emergencyContact.phone && typeof patient.emergencyContact.phone === 'string') {
            console.log(`   Encrypting emergency phone: ${patient.emergencyContact.phone}`);
            updateFields.emergencyContact.phone = await clientEncryption.encrypt(
              patient.emergencyContact.phone, {
                keyId: dataKeyId,
                algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
              }
            );
          }
        }

        // Update the document
        if (Object.keys(updateFields).length > 0) {
          await patientsCollection.updateOne(
            { _id: patient._id },
            { $set: updateFields }
          );
          encrypted++;
          console.log(`✅ Patient ${patient._id}: Encrypted successfully`);
        } else {
          console.log(`⏭️  Patient ${patient._id}: No fields to encrypt`);
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error encrypting patient ${patient._id}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Encrypted: ${encrypted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total: ${allPatients.length}`);
    console.log("=".repeat(50));

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    const samplePatient = await patientsCollection.findOne({});
    if (samplePatient) {
      const isEncrypted = samplePatient.allergies?._bsontype === 'Binary';
      console.log(`Sample check: ${isEncrypted ? '✅ Data is encrypted' : '❌ Data is NOT encrypted'}`);
    }

    await client.close();
    console.log("\n✅ Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
console.log("🚀 Starting data encryption migration...");
console.log("⚠️  Make sure you have a backup of your database!\n");
encryptExistingData();