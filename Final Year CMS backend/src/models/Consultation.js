import mongoose from "mongoose";
import { getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    diagnosis: { type: mongoose.Schema.Types.Mixed },
    notes: { type: mongoose.Schema.Types.Mixed },
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
consultationSchema.pre('save', async function(next) {
  try {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    if (this.isModified('diagnosis') && this.diagnosis && !this.diagnosis._bsontype) {
      this.diagnosis = await clientEncryption.encrypt(this.diagnosis, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
    }
    
    if (this.isModified('notes') && this.notes && !this.notes._bsontype) {
      this.notes = await clientEncryption.encrypt(this.notes, {
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
  
  doc.diagnosis = await decryptValue(doc.diagnosis);
  doc.notes = await decryptValue(doc.notes);
  
  return doc;
};

consultationSchema.post('find', async function(docs) {
  if (Array.isArray(docs)) {
    for (let doc of docs) {
      await decryptDoc(doc);
    }
  }
});

consultationSchema.post('findOne', async function(doc) {
  await decryptDoc(doc);
});

consultationSchema.post('findOneAndUpdate', async function(doc) {
  await decryptDoc(doc);
});

export default mongoose.model("Consultation", consultationSchema);