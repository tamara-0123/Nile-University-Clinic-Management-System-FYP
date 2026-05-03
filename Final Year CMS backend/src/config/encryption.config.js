import { writeFileSync, readFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getMasterKey = () => {
  const keyPath = path.join(__dirname, "master-key.txt");
  
  if (existsSync(keyPath)) {
    return readFileSync(keyPath);
  }
  
  const keyData = randomBytes(96);
  writeFileSync(keyPath, keyData);
  console.log("Master key generated");
  
  return keyData;
};

const kmsProviders = {
  local: {
    key: Buffer.alloc(0)
  }
};

const keyVaultNamespace = "encryption.__keyVault";

const connectionString = process.env.MONGO_URI || "mongodb://localhost:27017/cms"; 

export { kmsProviders, connectionString, keyVaultNamespace, getMasterKey };
