import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function verifyCollections() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI.split('@')[1]);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to:', mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:');

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyCollections();
