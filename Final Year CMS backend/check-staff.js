import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkStaff() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await mongoose.connection.db.collection('users').find({ role: { $in: ['doctor', 'nurse', 'admin'] } }).toArray();
    console.log(`Staff found: ${users.length}`);
    users.forEach(u => console.log(`- ${u.name} (${u.role}) ID: ${u.staffID || u.studentID}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStaff();
