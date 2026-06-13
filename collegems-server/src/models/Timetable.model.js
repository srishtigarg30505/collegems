import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroom: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      required: true,
    },
    timeSlot: {
      type: String,
      enum: ["9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 1:00", "2:00 - 3:00"],
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      default: "A",
    },
  },
  { timestamps: true }
);

// Unique compound index to prevent spatial classroom collision at the database layer
timetableSchema.index({ day: 1, timeSlot: 1, classroom: 1 }, { unique: true });

export default mongoose.model("Timetable", timetableSchema);
