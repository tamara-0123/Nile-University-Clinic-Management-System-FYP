import { MongoClient, ClientEncryption } from "mongodb";
import { kmsProviders, keyVaultNamespace, getMasterKey } from "../config/encryption.config.js";

let dataKeyId = null;
let clientEncryption = null;

export const initializeEncryption = async () => {
  try {
    const masterKey = getMasterKey();
    kmsProviders.local.key = masterKey;

    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/clinic";
    const client = new MongoClient(uri);
    await client.connect();

    clientEncryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders
    });

    const keyVault = client.db("encryption").collection("__keyVault");
    const existingKey = await keyVault.findOne({
      keyAltNames: "clinic-data-key"
    });

    if (existingKey) {
      dataKeyId = existingKey._id;
      console.log("Using existing data key");
    } else {
      dataKeyId = await clientEncryption.createDataKey("local", {
        keyAltNames: ["clinic-data-key"]
      });
      console.log("Created new data key");
    }

    return { dataKeyId, clientEncryption };
  } catch (error) {
    console.error("Encryption initialization failed:", error.message);
    throw error;
  }
};

export const getDataKeyId = () => dataKeyId;
export const getClientEncryption = () => clientEncryption;