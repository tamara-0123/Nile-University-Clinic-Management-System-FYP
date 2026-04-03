import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    diagnosis: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Consultation", consultationSchema);