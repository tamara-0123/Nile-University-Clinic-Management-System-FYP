import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The Nurse
    bp: String,
    temperature: String,
    pulse: String,
    weight: String,
  },
  { timestamps: true }
);

export default mongoose.model("Vitals", vitalsSchema);