import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["daily", "monthly"] },
    data: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);