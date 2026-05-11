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
      if (!clientEncryption) {
        console.error('ClientEncryption not available');
        return value;
      }
      const decrypted = await clientEncryption.decrypt(value);
      return decrypted;
    }
    return value;
  } catch (error) {
    console.error('Decrypt error:', error.message);
    return value;
  }
};

// Check if value is already encrypted
const isEncrypted = (value) => {
  return value && (value._bsontype === 'Binary' || Buffer.isBuffer(value));
};

// Encrypt before saving
patientSchema.pre('save', async function(next) {
  try {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    if (!clientEncryption || !dataKeyId) {
      console.error('Encryption setup not ready');
      return next(new Error('Encryption not initialized'));
    }
    
    // Only encrypt if field is modified AND not already encrypted
    if (this.isModified('allergies') && this.allergies && !isEncrypted(this.allergies)) {
      this.allergies = await clientEncryption.encrypt(this.allergies, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
      console.log('Encrypted allergies');
    }
    
    if (this.isModified('chronicConditions') && this.chronicConditions && !isEncrypted(this.chronicConditions)) {
      this.chronicConditions = await clientEncryption.encrypt(this.chronicConditions, {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
      });
      console.log('Encrypted chronicConditions');
    }
    
    if (this.isModified('emergencyContact') && this.emergencyContact) {
      if (this.emergencyContact.name && !isEncrypted(this.emergencyContact.name)) {
        this.emergencyContact.name = await clientEncryption.encrypt(this.emergencyContact.name, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
        });
        console.log('Encrypted emergencyContact name');
      }
      if (this.emergencyContact.phone && !isEncrypted(this.emergencyContact.phone)) {
        this.emergencyContact.phone = await clientEncryption.encrypt(this.emergencyContact.phone, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
        });
        console.log('Encrypted emergencyContact phone');
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
  
  try {
    const docObj = doc.toObject ? doc.toObject() : doc;
    
    if (docObj.allergies && isEncrypted(docObj.allergies)) {
      doc.allergies = await decryptValue(doc.allergies);
    }
    
    if (docObj.chronicConditions && isEncrypted(docObj.chronicConditions)) {
      doc.chronicConditions = await decryptValue(doc.chronicConditions);
    }
    
    if (docObj.emergencyContact) {
      if (docObj.emergencyContact.name && isEncrypted(docObj.emergencyContact.name)) {
        doc.emergencyContact.name = await decryptValue(doc.emergencyContact.name);
      }
      if (docObj.emergencyContact.phone && isEncrypted(docObj.emergencyContact.phone)) {
        doc.emergencyContact.phone = await decryptValue(doc.emergencyContact.phone);
      }
    }
  } catch (error) {
    console.error('Decrypt document error:', error);
  }
  
  return doc;
};

// Use find hooks that work with queries
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

// For findOneAndUpdate, we need to handle differently
patientSchema.post('findOneAndUpdate', async function(doc) {
  await decryptDoc(doc);
});

// Also handle save for updates
patientSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  if (update && (update.allergies || update.chronicConditions || update.emergencyContact)) {
    const clientEncryption = getClientEncryption();
    const dataKeyId = getDataKeyId();
    
    if (clientEncryption && dataKeyId) {
      // Encrypt fields in the update
      if (update.allergies && !isEncrypted(update.allergies)) {
        update.allergies = await clientEncryption.encrypt(update.allergies, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
        });
      }
      
      if (update.chronicConditions && !isEncrypted(update.chronicConditions)) {
        update.chronicConditions = await clientEncryption.encrypt(update.chronicConditions, {
          keyId: dataKeyId,
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
        });
      }
      
      if (update.emergencyContact) {
        if (update.emergencyContact.name && !isEncrypted(update.emergencyContact.name)) {
          update.emergencyContact.name = await clientEncryption.encrypt(update.emergencyContact.name, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
          });
        }
        if (update.emergencyContact.phone && !isEncrypted(update.emergencyContact.phone)) {
          update.emergencyContact.phone = await clientEncryption.encrypt(update.emergencyContact.phone, {
            keyId: dataKeyId,
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
          });
        }
      }
      
      this.setUpdate(update);
    }
  }
  
  next();
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;