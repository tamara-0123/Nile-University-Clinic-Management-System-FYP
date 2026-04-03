import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: Date,
    status: { 
      type: String, 
      enum: ['scheduled', 'waiting', 'checked-in', 'in-consultation', 'admitted', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    checkInTime: Date,
    completionTime: Date,
    reason: String,
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine"
    },
    condition: String,
    clinicalNotes: String,
    dischargeDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);