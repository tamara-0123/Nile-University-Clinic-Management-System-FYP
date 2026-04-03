import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: {
      type: String, // HH:mm format
      required: true,
    },
    endTime: {
      type: String, // HH:mm format
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date, // Optional: for specific date overrides
    }
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);
export default Availability;
