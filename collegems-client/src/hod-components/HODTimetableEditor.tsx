import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, MapPin, AlertTriangle, 
  CheckCircle2, Trash2, Plus, RefreshCw, Loader2, Sparkles 
} from "lucide-react";
import api from "../api/axios";

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface ScheduleSlot {
  _id: string;
  course: Course;
  teacher: Teacher;
  classroom: string;
  day: string;
  timeSlot: string;
  semester: number;
  department: string;
  section: string;
}

interface ConflictDetail {
  type: string;
  message: string;
}

const HODTimetableEditor: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters for display
  const [filterDept, setFilterDept] = useState("Select Department");
  const [filterSem, setFilterSem] = useState("Select Semester");

  // Form State
  const [formData, setFormData] = useState({
    course: "",
    teacher: "",
    classroom: "",
    day: "Monday",
    timeSlot: "9:00 - 10:00",
    semester: 1,
    department: "CSE",
    section: "A"
  });

  // Conflict Checking State
  const [conflicts, setConflicts] = useState<ConflictDetail[]>([]);
  const [validating, setValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = ["9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 1:00", "2:00 - 3:00"];
  const departments = ["CSE", "ECE", "EEE", "MECH"];

  useEffect(() => {
    fetchSchedules();
    fetchCoursesAndTeachers();
  }, [filterDept, filterSem]);

  // Run collision check when scheduling parameters change
  useEffect(() => {
    if (formData.teacher && formData.classroom && formData.day && formData.timeSlot && formData.department) {
      checkLiveConflicts();
    } else {
      setConflicts([]);
    }
  }, [formData.teacher, formData.classroom, formData.day, formData.timeSlot, formData.semester, formData.department, formData.section]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/timetable/all", {
        params: { department: filterDept, semester: filterSem }
      });
      setSchedules(res.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesAndTeachers = async () => {
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        api.get("/courses/all"),
        api.get("/users/teachers")
      ]);
      setCourses(coursesRes.data);
      setTeachers(teachersRes.data);
    } catch (err) {
      console.error("Error fetching courses/teachers:", err);
    }
  };

  const checkLiveConflicts = async () => {
    try {
      setValidating(true);
      const res = await api.post("/timetable/check-conflicts", {
        teacher: formData.teacher,
        classroom: formData.classroom,
        day: formData.day,
        timeSlot: formData.timeSlot,
        semester: Number(formData.semester),
        department: formData.department,
        section: formData.section
      });
      setConflicts(res.data.conflicts || []);
    } catch (err) {
      console.error("Error validating conflicts:", err);
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "semester" ? Number(value) : value
    }));
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.course || !formData.teacher || !formData.classroom || !formData.day || !formData.timeSlot) {
      setErrorMessage("Please fill all required scheduling fields.");
      return;
    }

    if (conflicts.length > 0) {
      setErrorMessage("Cannot schedule class: Constraint clashing active.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/timetable", formData);
      setSuccessMessage("Class scheduled successfully!");
      setFormData(prev => ({
        ...prev,
        course: "",
        teacher: "",
        classroom: ""
      }));
      setConflicts([]);
      fetchSchedules();
    } catch (err: any) {
      console.error("Error creating schedule:", err);
      setErrorMessage(err.response?.data?.message || "Failed to schedule class.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scheduled class?")) return;
    try {
      await api.delete(`/timetable/${id}`);
      setSchedules(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Timetable Scheduler</h1>
            <p className="text-gray-500 mt-1">Configure classes with algorithmic conflict resolution warnings</p>
          </div>
        </div>
        <button 
          onClick={fetchSchedules} 
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduler Config Form */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Schedule Class
          </h2>

          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Course *</label>
              <select 
                name="course" 
                value={formData.course} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.name} ({course.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Teacher *</label>
              <select 
                name="teacher" 
                value={formData.teacher} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name} ({teacher.email})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Department *</label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Semester *</label>
                <select 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Sem {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Classroom *</label>
                <input 
                  type="text" 
                  name="classroom" 
                  value={formData.classroom} 
                  onChange={handleInputChange}
                  placeholder="e.g., Room 302"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Section *</label>
                <select 
                  name="section" 
                  value={formData.section} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {["A", "B", "C", "D"].map(sec => (
                    <option key={sec} value={sec}>Sec {sec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Day *</label>
                <select 
                  name="day" 
                  value={formData.day} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Time Slot *</label>
                <select 
                  name="timeSlot" 
                  value={formData.timeSlot} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {timeSlots.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Constraint Conflict Warnings */}
            {validating && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Checking for scheduling conflicts...
              </div>
            )}

            {!validating && conflicts.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Collision Warnings
                </div>
                <div className="space-y-1">
                  {conflicts.map((c, i) => (
                    <p key={i} className="text-xs text-rose-700 leading-relaxed">• {c.message}</p>
                  ))}
                </div>
              </div>
            )}

            {!validating && conflicts.length === 0 && formData.teacher && formData.classroom && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Available — No resource clashes detected.
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium">
                {successMessage}
              </div>
            )}

            <button 
              type="submit"
              disabled={submitting || conflicts.length > 0}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publish Schedule
            </button>
          </form>
        </div>

        {/* Schedule List / Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Filter Department</label>
              <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
              >
                <option value="Select Department">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Filter Semester</label>
              <select 
                value={filterSem} 
                onChange={(e) => setFilterSem(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
              >
                <option value="Select Semester">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={String(sem)}>Sem {sem}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Slots Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading timetables...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No classes scheduled for the selected filters. Use the form to schedule one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-gray-600">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                      <th className="px-6 py-3">Day & Time</th>
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Teacher</th>
                      <th className="px-6 py-3">Classroom</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedules.map((slot) => (
                      <tr key={slot._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{slot.day}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {slot.timeSlot}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{slot.course?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Dept {slot.department} • Sem {slot.semester} • Sec {slot.section}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{slot.teacher?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{slot.teacher?.email || ""}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <MapPin className="w-3 h-3" /> {slot.classroom}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteSchedule(slot._id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HODTimetableEditor;
