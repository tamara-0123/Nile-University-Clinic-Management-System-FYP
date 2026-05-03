import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { initializeEncryption } from "./utils/encryption-setup.js";
import { getEncryptedClient } from "./config/encrypted-client.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeEncryption();
    
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ MongoDB connected");
    
    await getEncryptedClient();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
};

startServer();