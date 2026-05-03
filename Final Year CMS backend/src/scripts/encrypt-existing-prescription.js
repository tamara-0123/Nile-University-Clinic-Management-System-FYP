import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { initializeEncryption, getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const encryptExistingPrescriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ Connected to MongoDB");

    await initializeEncryption();
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    console.log("✅ Encryption initialized\n");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("cms");
    const prescriptionsCollection = db.collection("prescriptions");

    const allPrescriptions = await prescriptionsCollection.find({}).toArray();
    console.log(`📊 Found ${allPrescriptions.length} prescriptions total\n`);

    let encrypted = 0;
    let skipped = 0;
    let errors = 0;

    for (const prescription of allPrescriptions) {
      try {
        // Check if medications exist and need encryption
        if (!prescription.medications || !Array.isArray(prescription.medications)) {
          skipped++;
          continue;
        }

        let needsUpdate = false;
        const updatedMedications = [];

        for (const med of prescription.medications) {
          const encryptedMed = { ...med };
          
          // Only encrypt if not already encrypted
          if (med.name && typeof med.name === 'string' && med.name._bsontype !== 'Binary') {
            console.log(`   Encrypting medication: "${med.name}"`);
            encryptedMed.name = await clientEncryption.encrypt(med.name, {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
            });
            needsUpdate = true;
          }
          
          if (med.dosage && typeof med.dosage === 'string' && med.dosage._bsontype !== 'Binary') {
            encryptedMed.dosage = await clientEncryption.encrypt(med.dosage, {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
            });
            needsUpdate = true;
          }
          
          if (med.frequency && typeof med.frequency === 'string' && med.frequency._bsontype !== 'Binary') {
            encryptedMed.frequency = await clientEncryption.encrypt(med.frequency, {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
            });
            needsUpdate = true;
          }
          
          if (med.duration && typeof med.duration === 'string' && med.duration._bsontype !== 'Binary') {
            encryptedMed.duration = await clientEncryption.encrypt(med.duration, {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
            });
            needsUpdate = true;
          }
          
          if (med.instructions && typeof med.instructions === 'string' && med.instructions._bsontype !== 'Binary') {
            encryptedMed.instructions = await clientEncryption.encrypt(med.instructions, {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
            });
            needsUpdate = true;
          }
          
          updatedMedications.push(encryptedMed);
        }

        if (needsUpdate) {
          await prescriptionsCollection.updateOne(
            { _id: prescription._id },
            { $set: { medications: updatedMedications } }
          );
          encrypted++;
          console.log(`✅ Prescription ${prescription._id}: Encrypted successfully\n`);
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error encrypting prescription ${prescription._id}:`, error.message, "\n");
      }
    }

    console.log("=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Encrypted: ${encrypted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total: ${allPrescriptions.length}`);
    console.log("=".repeat(50));

    console.log("\n🔍 Verifying migration...");
    const sample = await prescriptionsCollection.findOne({
      "medications.name": { $type: "binData" }
    });
    
    if (sample) {
      console.log("✅ Sample prescription is encrypted");
      const decryptedName = await clientEncryption.decrypt(sample.medications[0].name);
      console.log("📝 Sample decrypted medication:", decryptedName);
    } else {
      console.log("⚠️  No encrypted prescriptions found");
    }

    await client.close();
    console.log("\n✅ Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

console.log("🚀 Starting prescription data encryption migration...");
console.log("⚠️  Make sure you have a backup of your database!\n");
encryptExistingPrescriptions();