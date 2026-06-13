import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  createSchedule,
  checkConflicts,
  getStudentSchedule,
  getTeacherSchedule,
  getAllSchedules,
  deleteSchedule,
} from "../controllers/timetable.controller.js";

const router = express.Router();

// ── Student & Parent endpoints ───────────────────────────────────────
router.get("/student", protect, allowRoles("student", "parent"), getStudentSchedule);

// ── Teacher endpoints ────────────────────────────────────────────────
router.get("/teacher", protect, allowRoles("teacher"), getTeacherSchedule);

// ── HOD / Admin endpoints ───────────────────────────────────────────
router.post("/", protect, allowRoles("hod"), createSchedule);
router.post("/check-conflicts", protect, allowRoles("hod"), checkConflicts);
router.get("/all", protect, allowRoles("hod"), getAllSchedules);
router.delete("/:id", protect, allowRoles("hod"), deleteSchedule);

export default router;
