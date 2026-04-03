import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing with Mongoose version:', mongoose.version);
console.log('Connecting to:', process.env.MONGO_URI.split('@')[1]);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🚀 SUCCESS: Connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE: Connection error');
    console.error(err);
    process.exit(1);
  });
