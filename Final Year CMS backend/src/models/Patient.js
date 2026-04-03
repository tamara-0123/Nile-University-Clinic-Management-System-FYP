import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: {
    name: String,
    phone: String
  }
}, { timestamps: true });


export default mongoose.model('Patient', patientSchema);