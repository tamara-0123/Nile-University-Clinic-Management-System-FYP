import mongoose from "mongoose";
import { getClientEncryption, getDataKeyId } from "../utils/encryption-setup.js";

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  allergies: { type: mongoose.Schema.Types.Mixed },
  chronicConditions: { type: mongoose.Schema.Types.Mixed },
  emergencyContact: {
    name: { type: mongoose.Schema.Types.Mixed },
    phone: { type: mongoose.Schema.Types.Mixed }
  },
  department: String,
  gender: String,
  studentID: String,
  staffID: String
}, { timestamps: true });

// Function to decrypt a value
const decryptValue = async (value) => {
  if (!value) return value;
  
  try {
    // Check if it's encrypted (MongoDB Binary type)
    if (value._bsontype === 'Binary' || Buffer.isBuffer(value)) {
      const clientEncryption = getClientEncryption();
      const decrypted = await clientEncryption.decrypt(value);
      return decrypted;
    }
    return value;
  } catch (error) {
    console.error('Decrypt error:', error.message);
    return value;
  }
};

// Encrypt before saving
patientSchema.pre('save', async function(next) {
  try {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    // Only encrypt if modified
    if (this.isModified('allergies') && this.allergies && !this.allergies._bsontype) {
      this.allergies = await clientEncryption.encrypt(this.allergies, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
    }
    
    if (this.isModified('chronicConditions') && this.chronicConditions && !this.chronicConditions._bsontype) {
      this.chronicConditions = await clientEncryption.encrypt(this.chronicConditions, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
    }
    
    if (this.isModified('emergencyContact') && this.emergencyContact) {
      if (this.emergencyContact.name && !this.emergencyContact.name._bsontype) {
        this.emergencyContact.name = await clientEncryption.encrypt(this.emergencyContact.name, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
        });
      }
      if (this.emergencyContact.phone && !this.emergencyContact.phone._bsontype) {
        this.emergencyContact.phone = await clientEncryption.encrypt(this.emergencyContact.phone, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
        });
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
  
  doc.allergies = await decryptValue(doc.allergies);
  doc.chronicConditions = await decryptValue(doc.chronicConditions);
  
  if (doc.emergencyContact) {
    doc.emergencyContact.name = await decryptValue(doc.emergencyContact.name);
    doc.emergencyContact.phone = await decryptValue(doc.emergencyContact.phone);
  }
  
  return doc;
};

patientSchema.post('find', async function(docs) {
  if (Array.isArray(docs)) {
    for (let doc of docs) {
      await decryptDoc(doc);
    }
  }
});

patientSchema.post('findOne', async function(doc) {
  await decryptDoc(doc);
});

patientSchema.post('findOneAndUpdate', async function(doc) {
  await decryptDoc(doc);
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;