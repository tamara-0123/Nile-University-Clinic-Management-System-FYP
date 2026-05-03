import mongoose from "mongoose";
import { getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: Date,
    status: { 
      type: String, 
      enum: ['scheduled', 'waiting', 'checked-in', 'in-consultation', 'admitted', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    checkInTime: Date,
    completionTime: Date,
    reason: { type: mongoose.Schema.Types.Mixed },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine"
    },
    condition: { type: mongoose.Schema.Types.Mixed },
    clinicalNotes: { type: mongoose.Schema.Types.Mixed },
    dischargeDate: { type: Date }
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
appointmentSchema.pre('save', async function(next) {
  try {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    if (this.isModified('reason') && this.reason && !this.reason._bsontype) {
      this.reason = await clientEncryption.encrypt(this.reason, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
    }
    
    if (this.isModified('condition') && this.condition && !this.condition._bsontype) {
      this.condition = await clientEncryption.encrypt(this.condition, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
    }
    
    if (this.isModified('clinicalNotes') && this.clinicalNotes && !this.clinicalNotes._bsontype) {
      this.clinicalNotes = await clientEncryption.encrypt(this.clinicalNotes, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
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
  
  doc.reason = await decryptValue(doc.reason);
  doc.condition = await decryptValue(doc.condition);
  doc.clinicalNotes = await decryptValue(doc.clinicalNotes);
  
  return doc;
};

appointmentSchema.post('find', async function(docs) {
  if (Array.isArray(docs)) {
    for (let doc of docs) {
      await decryptDoc(doc);
    }
  }
});

appointmentSchema.post('findOne', async function(doc) {
  await decryptDoc(doc);
});

appointmentSchema.post('findOneAndUpdate', async function(doc) {
  await decryptDoc(doc);
});

export default mongoose.model("Appointment", appointmentSchema);