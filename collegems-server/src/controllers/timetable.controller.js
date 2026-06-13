import Timetable from "../models/Timetable.model.js";
import User from "../models/User.model.js";

// Helper: Conflict detection algorithm
const detectConflicts = async ({ teacher, classroom, day, timeSlot, semester, department, section, excludeId }) => {
  const conflicts = [];
  const queryBase = { day, timeSlot };
  if (excludeId) {
    queryBase._id = { $ne: excludeId };
  }

  // 1. Teacher Collision Check
  const teacherClash = await Timetable.findOne({ ...queryBase, teacher }).populate("course", "name code");
  if (teacherClash) {
    conflicts.push({
      type: "FACULTY_COLLISION",
      message: `Teacher is already scheduled for class "${teacherClash.course?.name || 'Another Course'}" during this slot.`,
    });
  }

  // 2. Classroom Spatial Collision Check
  const classroomClash = await Timetable.findOne({ ...queryBase, classroom }).populate("course", "name code");
  if (classroomClash) {
    conflicts.push({
      type: "ROOM_COLLISION",
      message: `Classroom ${classroom} is already occupied by "${classroomClash.course?.name || 'Another Course'}" (Sem ${classroomClash.semester}, Dept ${classroomClash.department}).`,
    });
  }

  // 3. Student Cohort Collision Check (same department, semester, and section)
  const batchClash = await Timetable.findOne({ 
    ...queryBase, 
    department, 
    semester, 
    section: section || "A" 
  }).populate("course", "name code");
  if (batchClash) {
    conflicts.push({
      type: "COHORT_COLLISION",
      message: `This student cohort (Sem ${semester}, Dept ${department}, Sec ${section || "A"}) is already scheduled for "${batchClash.course?.name || 'Another Course'}" during this slot.`,
    });
  }

  return conflicts;
};

// ── Check Conflicts (Dry-Run / Diagnostic) ──────────────────────────────────
export const checkConflicts = async (req, res) => {
  try {
    const { teacher, classroom, day, timeSlot, semester, department, section, excludeId } = req.body;

    if (!teacher || !classroom || !day || !timeSlot || !semester || !department) {
      return res.status(400).json({ message: "All scheduling parameters are required for collision checking." });
    }

    const conflicts = await detectConflicts({
      teacher,
      classroom,
      day,
      timeSlot,
      semester: Number(semester),
      department,
      section,
      excludeId,
    });

    res.json({ conflicts, available: conflicts.length === 0 });
  } catch (err) {
    console.error("Conflict checking error:", err);
    res.status(500).json({ message: "Failed to validate schedule conflicts" });
  }
};

// ── Create Schedule Slot ───────────────────────────────────────────────────
export const createSchedule = async (req, res) => {
  try {
    const { course, teacher, classroom, day, timeSlot, semester, department, section } = req.body;

    if (!course || !teacher || !classroom || !day || !timeSlot || !semester || !department) {
      return res.status(400).json({ message: "All fields are required to create a schedule slot" });
    }

    // Run constraint-satisfaction solver check
    const conflicts = await detectConflicts({
      teacher,
      classroom,
      day,
      timeSlot,
      semester: Number(semester),
      department,
      section,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: "Constraint violation: Schedule collisions detected",
        conflicts,
      });
    }

    const newSlot = await Timetable.create({
      course,
      teacher,
      classroom,
      day,
      timeSlot,
      semester: Number(semester),
      department,
      section: section || "A",
    });

    const populated = await Timetable.findById(newSlot._id)
      .populate("course", "name code")
      .populate("teacher", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create schedule error:", err);
    res.status(500).json({ message: "Failed to create timetable slot" });
  }
};

// ── Student / Parent: Get Timetable ─────────────────────────────────────────
export const getStudentSchedule = async (req, res) => {
  try {
    let studentId = req.user.id;

    if (req.user.role === "parent") {
      const parent = await User.findById(req.user.id);
      if (!parent || !parent.childId) {
        return res.status(400).json({ message: "No child linked to parent account" });
      }
      studentId = parent.childId;
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const query = {
      department: student.course,
      semester: Number(student.semester) || student.semester,
    };

    const schedules = await Timetable.find(query)
      .populate("course", "name code")
      .populate("teacher", "name email")
      .sort({ day: 1, timeSlot: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get student schedule error:", err);
    res.status(500).json({ message: "Failed to fetch timetable schedule" });
  }
};

// ── Teacher: Get Timetable ──────────────────────────────────────────────────
export const getTeacherSchedule = async (req, res) => {
  try {
    const schedules = await Timetable.find({ teacher: req.user.id })
      .populate("course", "name code")
      .populate("teacher", "name email")
      .sort({ day: 1, timeSlot: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get teacher schedule error:", err);
    res.status(500).json({ message: "Failed to fetch teacher schedule" });
  }
};

// ── HOD / Admin: Get All Timetables ──────────────────────────────────────────
export const getAllSchedules = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const query = {};

    if (department && department !== "Select Department") {
      query.department = department;
    }
    if (semester && semester !== "Select Semester") {
      // semester can be stored as number or e.g. "1", "2"
      const semNum = Number(semester.replace("-", "")); // support both e.g. "1", "1-1", etc.
      query.semester = isNaN(semNum) ? semester : semNum;
    }

    const schedules = await Timetable.find(query)
      .populate("course", "name code")
      .populate("teacher", "name email")
      .sort({ day: 1, timeSlot: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("Get all schedules error:", err);
    res.status(500).json({ message: "Failed to fetch all schedules" });
  }
};

// ── Delete Schedule Slot ────────────────────────────────────────────────────
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await Timetable.findById(id);
    if (!slot) {
      return res.status(404).json({ message: "Schedule slot not found" });
    }

    await Timetable.findByIdAndDelete(id);
    res.json({ message: "Schedule slot deleted successfully" });
  } catch (err) {
    console.error("Delete schedule error:", err);
    res.status(500).json({ message: "Failed to delete schedule slot" });
  }
};
