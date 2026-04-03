import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    admittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The Nurse
    dischargedBy : { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // The Nurse who discharged
    admissionDate: { type: Date, default: Date.now },
    dischargeDate: { type: Date },
    reason: String,
    isActive: { type: Boolean, default: true }, 
  },
  { timestamps: true }
);

export default mongoose.model("Admission", admissionSchema);