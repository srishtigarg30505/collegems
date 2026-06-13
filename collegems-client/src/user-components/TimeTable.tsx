import { useEffect, useState } from "react";
import TimeTableHeader from "./TimeTableHeader";
import TimeTableStats from "./TimeTableStats";
import TimeTableGrid from "./TimeTableGrid";
import api from "../api/axios";
import { Loader2 } from "lucide-react";

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

export default function TimeTable() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role") || "student";

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        // Call student endpoint for student/parent, teacher endpoint for teacher
        const endpoint = (role === "teacher") ? "/timetable/teacher" : "/timetable/student";
        const res = await api.get(endpoint);
        setSchedules(res.data);
      } catch (err: any) {
        console.error("Error fetching timetable:", err);
        setError("Failed to load your timetable schedule.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [role]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500 text-sm">Loading academic timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TimeTableHeader role={role} />
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      ) : (
        <>
          <TimeTableStats schedules={schedules} />
          <TimeTableGrid schedules={schedules} />
        </>
      )}
    </div>
  );
}