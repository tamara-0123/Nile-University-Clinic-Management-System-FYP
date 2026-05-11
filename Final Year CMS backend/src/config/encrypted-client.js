import { MongoClient } from "mongodb";
import { kmsProviders, keyVaultNamespace } from "./encryption.config.js";
import { createSchemaMap } from "./schema-map.js";
import { getDataKeyId, getClientEncryption } from "../utils/encryption-setup.js";

let encryptedClient = null;

export const getEncryptedClient = async () => {
  if (encryptedClient) {
    return encryptedClient;
  }

  const dataKeyId = getDataKeyId();
  const clientEncryption = getClientEncryption();
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/cms";

  // Connect WITHOUT autoEncryption
  encryptedClient = new MongoClient(uri);
  await encryptedClient.connect();
  console.log("Encrypted client connected");
  
  return encryptedClient;
};