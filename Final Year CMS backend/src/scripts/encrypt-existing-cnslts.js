import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { initializeEncryption, getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const encryptExistingConsultations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ Connected to MongoDB");

    // Initialize encryption
    await initializeEncryption();
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    console.log("✅ Encryption initialized\n");

    // Connect with regular client to see raw data
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("cms");
    const consultationsCollection = db.collection("consultations");

    // Find all consultations
    const allConsultations = await consultationsCollection.find({}).toArray();
    console.log(`📊 Found ${allConsultations.length} consultations total\n`);

    let encrypted = 0;
    let skipped = 0;
    let errors = 0;

    for (const consultation of allConsultations) {
      try {
        // Check if already encrypted
        const isDiagnosisEncrypted = consultation.diagnosis && consultation.diagnosis._bsontype === 'Binary';
        const isNotesEncrypted = consultation.notes && consultation.notes._bsontype === 'Binary';

        // Skip if all encrypted fields are already encrypted
        if (isDiagnosisEncrypted && isNotesEncrypted) {
          skipped++;
          continue;
        }

        const updateFields = {};

        // Encrypt diagnosis
        if (consultation.diagnosis && typeof consultation.diagnosis === 'string' && !isDiagnosisEncrypted) {
          console.log(`   Encrypting diagnosis: "${consultation.diagnosis.substring(0, 50)}..."`);
          updateFields.diagnosis = await clientEncryption.encrypt(consultation.diagnosis, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Encrypt notes
        if (consultation.notes && typeof consultation.notes === 'string' && !isNotesEncrypted) {
          console.log(`   Encrypting notes: "${consultation.notes.substring(0, 50)}..."`);
          updateFields.notes = await clientEncryption.encrypt(consultation.notes, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Update the document
        if (Object.keys(updateFields).length > 0) {
          await consultationsCollection.updateOne(
            { _id: consultation._id },
            { $set: updateFields }
          );
          encrypted++;
          console.log(`✅ Consultation ${consultation._id}: Encrypted successfully\n`);
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error encrypting consultation ${consultation._id}:`, error.message, "\n");
      }
    }

    console.log("=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Encrypted: ${encrypted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total: ${allConsultations.length}`);
    console.log("=".repeat(50));

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    const sampleConsultation = await consultationsCollection.findOne({
      $or: [
        { diagnosis: { $type: "binData" } },
        { notes: { $type: "binData" } }
      ]
    });
    
    if (sampleConsultation) {
      console.log("✅ Sample consultation is encrypted");
      
      // Test decryption
      if (sampleConsultation.diagnosis?._bsontype === 'Binary') {
        const decryptedDiagnosis = await clientEncryption.decrypt(sampleConsultation.diagnosis);
        console.log("📝 Sample decrypted diagnosis:", decryptedDiagnosis);
      }
    } else {
      console.log("⚠️  No encrypted consultations found for verification");
    }

    await client.close();
    console.log("\n✅ Migration complete!");
    console.log("🔐 Existing consultation data is now encrypted!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
console.log("🚀 Starting consultation data encryption migration...");
console.log("⚠️  Make sure you have a backup of your database!\n");
encryptExistingConsultations();