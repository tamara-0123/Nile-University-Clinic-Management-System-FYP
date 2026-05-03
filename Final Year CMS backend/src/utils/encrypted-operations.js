import { getEncryptedClient } from "../config/encrypted-client.js";
import { getClientEncryption, getDataKeyId } from "./encryption-setup.js";

// Check if value is encrypted (Binary/Buffer)
const isEncrypted = (value) => {
  if (!value) return false;
  return value._bsontype === 'Binary' || Buffer.isBuffer(value);
};

// Encrypt a single value
const encryptValue = async (value, useRandom = true) => {
  const clientEncryption = getClientEncryption();
  const dataKeyId = getDataKeyId();
  
  const algorithm = useRandom 
    ? "AEAD_AES_256_CBC_HMAC_SHA_512-Random" 
    : "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic";
  
  return await clientEncryption.encrypt(value, {
    keyId: dataKeyId,
    algorithm: algorithm
  });
};

// Decrypt a single value
const decryptValue = async (value) => {
  if (!value) return value;
  if (!isEncrypted(value)) return value;
  
  const clientEncryption = getClientEncryption();
  return await clientEncryption.decrypt(value);
};

// Encrypt patient fields
const encryptPatientFields = async (data) => {
  const encryptedData = { ...data };
  
  if (data.allergies) {
    encryptedData.allergies = await encryptValue(data.allergies, true);
  }
  
  if (data.chronicConditions) {
    encryptedData.chronicConditions = await encryptValue(data.chronicConditions, true);
  }
  
  if (data.emergencyContact) {
    encryptedData.emergencyContact = {
      name: data.emergencyContact.name ? await encryptValue(data.emergencyContact.name, false) : undefined,
      phone: data.emergencyContact.phone ? await encryptValue(data.emergencyContact.phone, false) : undefined,
    };
  }
  
  return encryptedData;
};

// Decrypt patient fields
const decryptPatientFields = async (data) => {
  if (!data) return data;
  
  const decryptedData = { ...data };
  
  if (data.allergies) {
    decryptedData.allergies = await decryptValue(data.allergies);
  }
  
  if (data.chronicConditions) {
    decryptedData.chronicConditions = await decryptValue(data.chronicConditions);
  }
  
  if (data.emergencyContact) {
    decryptedData.emergencyContact = {
      name: await decryptValue(data.emergencyContact?.name),
      phone: await decryptValue(data.emergencyContact?.phone),
    };
  }
  
  return decryptedData;
};

// Encrypt appointment fields
const encryptAppointmentFields = async (data) => {
  const encryptedData = { ...data };
  
  if (data.reason) encryptedData.reason = await encryptValue(data.reason, true);
  if (data.condition) encryptedData.condition = await encryptValue(data.condition, true);
  if (data.clinicalNotes) encryptedData.clinicalNotes = await encryptValue(data.clinicalNotes, true);
  
  return encryptedData;
};

// Decrypt appointment fields
const decryptAppointmentFields = async (data) => {
  if (!data) return data;
  
  const decryptedData = { ...data };
  
  if (data.reason) decryptedData.reason = await decryptValue(data.reason);
  if (data.condition) decryptedData.condition = await decryptValue(data.condition);
  if (data.clinicalNotes) decryptedData.clinicalNotes = await decryptValue(data.clinicalNotes);
  
  return decryptedData;
};

// PUBLIC API
export const saveEncryptedPatient = async (patientData) => {
  const client = await getEncryptedClient();
  const db = client.db("cms");
  const encryptedData = await encryptPatientFields(patientData);
  return await db.collection("patients").insertOne(encryptedData);
};

export const findEncryptedPatient = async (query) => {
  const client = await getEncryptedClient();
  const db = client.db("cms");
  const result = await db.collection("patients").findOne(query);
  return await decryptPatientFields(result);
};

export const saveEncryptedAppointment = async (appointmentData) => {
  const client = await getEncryptedClient();
  const db = client.db("cms");
  const encryptedData = await encryptAppointmentFields(appointmentData);
  return await db.collection("appointments").insertOne(encryptedData);
};

export const findEncryptedAppointment = async (query) => {
  const client = await getEncryptedClient();
  const db = client.db("cms");
  const result = await db.collection("appointments").findOne(query);
  return await decryptAppointmentFields(result);
};

export const saveEncryptedData = async (collectionName, data) => {
  if (collectionName === "patients") return saveEncryptedPatient(data);
  if (collectionName === "appointments") return saveEncryptedAppointment(data);
  throw new Error(`Unknown collection: ${collectionName}`);
};

export const findEncryptedData = async (collectionName, query) => {
  if (collectionName === "patients") return findEncryptedPatient(query);
  if (collectionName === "appointments") return findEncryptedAppointment(query);
  throw new Error(`Unknown collection: ${collectionName}`);
};