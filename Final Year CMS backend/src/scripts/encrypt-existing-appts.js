import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { initializeEncryption, getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const encryptExistingAppointments = async () => {
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
    const appointmentsCollection = db.collection("appointments");

    // Find all appointments
    const allAppointments = await appointmentsCollection.find({}).toArray();
    console.log(`📊 Found ${allAppointments.length} appointments total\n`);

    let encrypted = 0;
    let skipped = 0;
    let errors = 0;

    for (const appointment of allAppointments) {
      try {
        // Check if already encrypted
        const isReasonEncrypted = appointment.reason && appointment.reason._bsontype === 'Binary';
        const isConditionEncrypted = appointment.condition && appointment.condition._bsontype === 'Binary';
        const isNotesEncrypted = appointment.clinicalNotes && appointment.clinicalNotes._bsontype === 'Binary';

        // Skip if all encrypted fields are already encrypted
        if (isReasonEncrypted && isConditionEncrypted && isNotesEncrypted) {
          skipped++;
          continue;
        }

        const updateFields = {};

        // Encrypt reason
        if (appointment.reason && typeof appointment.reason === 'string' && !isReasonEncrypted) {
          console.log(`   Encrypting reason: "${appointment.reason.substring(0, 50)}..."`);
          updateFields.reason = await clientEncryption.encrypt(appointment.reason, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Encrypt condition
        if (appointment.condition && typeof appointment.condition === 'string' && !isConditionEncrypted) {
          console.log(`   Encrypting condition: "${appointment.condition.substring(0, 50)}..."`);
          updateFields.condition = await clientEncryption.encrypt(appointment.condition, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Encrypt clinicalNotes
        if (appointment.clinicalNotes && typeof appointment.clinicalNotes === 'string' && !isNotesEncrypted) {
          console.log(`   Encrypting clinicalNotes: "${appointment.clinicalNotes.substring(0, 50)}..."`);
          updateFields.clinicalNotes = await clientEncryption.encrypt(appointment.clinicalNotes, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }

        // Update the document
        if (Object.keys(updateFields).length > 0) {
          await appointmentsCollection.updateOne(
            { _id: appointment._id },
            { $set: updateFields }
          );
          encrypted++;
          console.log(`✅ Appointment ${appointment._id}: Encrypted successfully\n`);
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error encrypting appointment ${appointment._id}:`, error.message, "\n");
      }
    }

    console.log("=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Encrypted: ${encrypted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total: ${allAppointments.length}`);
    console.log("=".repeat(50));

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    const sampleAppointment = await appointmentsCollection.findOne({
      $or: [
        { reason: { $type: "binData" } },
        { condition: { $type: "binData" } },
        { clinicalNotes: { $type: "binData" } }
      ]
    });
    
    if (sampleAppointment) {
      console.log("✅ Sample appointment is encrypted");
      
      // Test decryption
      const decryptedReason = sampleAppointment.reason?._bsontype === 'Binary' 
        ? await clientEncryption.decrypt(sampleAppointment.reason) 
        : sampleAppointment.reason;
      console.log("📝 Sample decrypted reason:", decryptedReason);
    } else {
      console.log("⚠️  No encrypted appointments found for verification");
    }

    await client.close();
    console.log("\n✅ Migration complete!");
    console.log("🔐 Existing appointment data is now encrypted!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
console.log("🚀 Starting appointment data encryption migration...");
console.log("⚠️  Make sure you have a backup of your database!\n");
encryptExistingAppointments();