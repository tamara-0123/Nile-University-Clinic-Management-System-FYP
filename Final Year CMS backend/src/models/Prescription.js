import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    medications: [
      {
        name: {
          type: String,
          required: true
        },
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
        quantity: Number,
        isPendingPharmacist: {
          type: Boolean,
          default: true  // True means pharmacist needs to complete details
        }
      }
    ],
    status: {
      type: String,
      enum: ['pending-pharmacist', 'completed', 'dispensed'],
      default: 'pending-pharmacist'
    },
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: Date,
    urgency: {
      type: String,
      enum: ['emergency', 'urgent', 'routine'],
      default: 'routine'
    }
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);