import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    details: Object,
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);