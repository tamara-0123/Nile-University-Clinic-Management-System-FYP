import mongoose from "mongoose";
import { getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    medications: [
      {
        name: { type: mongoose.Schema.Types.Mixed, required: true },
        dosage: { type: mongoose.Schema.Types.Mixed },
        frequency: { type: mongoose.Schema.Types.Mixed },
        duration: { type: mongoose.Schema.Types.Mixed },
        instructions: { type: mongoose.Schema.Types.Mixed },
        quantity: Number,
        isPendingPharmacist: {
          type: Boolean,
          default: true
        }
      }
    ],
    status: {
      type: String,
      enum: ['pending-pharmacist', 'completed', 'dispensed'],
      default: 'pending-pharmacist'
    },
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: Date,
    urgency: {
      type: String,
      enum: ['emergency', 'urgent', 'routine'],
      default: 'routine'
    }
  },
  { timestamps: true }
);

// Helper to decrypt a value
const decryptValue = async (value) => {
  if (!value) return value;
  
  try {
    if (value._bsontype === 'Binary' || Buffer.isBuffer(value)) {
      const clientEncryption = getClientEncryption();
      return await clientEncryption.decrypt(value);
    }
    return value;
  } catch (error) {
    console.error('Decrypt error:', error.message);
    return value;
  }
};

// Encrypt before saving
prescriptionSchema.pre('save', async function(next) {
  try {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    // Encrypt each medication in the array
    if (this.isModified('medications') && this.medications) {
      for (let i = 0; i < this.medications.length; i++) {
        const med = this.medications[i];
        
        if (med.name && !med.name._bsontype) {
          this.medications[i].name = await clientEncryption.encrypt(med.name, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
          });
        }
        
        if (med.dosage && !med.dosage._bsontype) {
          this.medications[i].dosage = await clientEncryption.encrypt(med.dosage, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }
        
        if (med.frequency && !med.frequency._bsontype) {
          this.medications[i].frequency = await clientEncryption.encrypt(med.frequency, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }
        
        if (med.duration && !med.duration._bsontype) {
          this.medications[i].duration = await clientEncryption.encrypt(med.duration, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }
        
        if (med.instructions && !med.instructions._bsontype) {
          this.medications[i].instructions = await clientEncryption.encrypt(med.instructions, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Encrypt error:', error);
    next(error);
  }
});

// Decrypt after queries
const decryptDoc = async (doc) => {
  if (!doc) return doc;
  
  // Decrypt medications array
  if (doc.medications && Array.isArray(doc.medications)) {
    for (let i = 0; i < doc.medications.length; i++) {
      doc.medications[i].name = await decryptValue(doc.medications[i].name);
      doc.medications[i].dosage = await decryptValue(doc.medications[i].dosage);
      doc.medications[i].frequency = await decryptValue(doc.medications[i].frequency);
      doc.medications[i].duration = await decryptValue(doc.medications[i].duration);
      doc.medications[i].instructions = await decryptValue(doc.medications[i].instructions);
    }
  }
  
  return doc;
};

prescriptionSchema.post('find', async function(docs) {
  if (Array.isArray(docs)) {
    for (let doc of docs) {
      await decryptDoc(doc);
    }
  }
});

prescriptionSchema.post('findOne', async function(doc) {
  await decryptDoc(doc);
});

prescriptionSchema.post('findOneAndUpdate', async function(doc) {
  await decryptDoc(doc);
});

export default mongoose.model("Prescription", prescriptionSchema);