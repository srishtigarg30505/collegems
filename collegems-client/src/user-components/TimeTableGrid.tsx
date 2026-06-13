import React from "react";
import { MapPin, User, Clock } from "lucide-react";

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

interface GridProps {
  schedules: ScheduleSlot[];
}

const TimeTableGrid: React.FC<GridProps> = ({ schedules }) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = [
    "9:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 1:00",
    "2:00 - 3:00",
  ];

  // Helper to generate a consistent background/text color class based on course code
  const getCourseColorClass = (code: string = "") => {
    const sum = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = [
      { bg: "bg-blue-50 border-blue-200 text-blue-800", badge: "bg-blue-100 text-blue-700" },
      { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", badge: "bg-emerald-100 text-emerald-700" },
      { bg: "bg-amber-50 border-amber-200 text-amber-800", badge: "bg-amber-100 text-amber-700" },
      { bg: "bg-purple-50 border-purple-200 text-purple-800", badge: "bg-purple-100 text-purple-700" },
      { bg: "bg-indigo-50 border-indigo-200 text-indigo-800", badge: "bg-indigo-100 text-indigo-700" },
      { bg: "bg-teal-50 border-teal-200 text-teal-800", badge: "bg-teal-100 text-teal-700" },
      { bg: "bg-rose-50 border-rose-200 text-rose-800", badge: "bg-rose-100 text-rose-700" },
    ];
    return options[sum % options.length];
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-6 min-w-[1000px] divide-x divide-y divide-gray-100">
        
        {/* Top-Left Corner cell */}
        <div className="bg-gray-50/50 p-4 font-semibold text-gray-700 flex items-center justify-center text-sm">
          Day / Time
        </div>

        {/* Days Headers */}
        {days.map((day) => (
          <div
            key={day}
            className="bg-gray-50/50 p-4 text-center font-semibold text-gray-700 text-sm"
          >
            {day}
          </div>
        ))}

        {/* Timetable Slots Rows */}
        {slots.map((slot) => (
          <React.Fragment key={slot}>
            {/* Time Slot Label Column */}
            <div className="p-4 font-semibold text-gray-700 text-xs bg-gray-50/20 flex flex-col justify-center items-center gap-1 min-h-[120px]">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{slot}</span>
            </div>

            {/* Daily schedule columns */}
            {days.map((day) => {
              // Find matches for this day and slot
              const cellSlots = schedules.filter(
                (s) => s.day === day && s.timeSlot === slot
              );

              return (
                <div
                  key={`${day}-${slot}`}
                  className="p-3 min-h-[120px] bg-white flex flex-col gap-2 justify-center"
                >
                  {cellSlots.length > 0 ? (
                    cellSlots.map((item) => {
                      const colorScheme = getCourseColorClass(item.course?.code);
                      return (
                        <div
                          key={item._id}
                          className={`p-3 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${colorScheme.bg} flex flex-col gap-1.5`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-sm leading-snug tracking-tight">
                              {item.course?.name || "Unknown Course"}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${colorScheme.badge}`}>
                              {item.course?.code || "SUB"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs opacity-90">
                            <User className="w-3.5 h-3.5 opacity-70" />
                            <span className="font-medium truncate max-w-[120px]" title={item.teacher?.name}>
                              {item.teacher?.name || "Staff"}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-black/5 text-[10px] opacity-80 font-semibold">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {item.classroom}
                            </span>
                            <span>Sec {item.section}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-gray-300 text-xs italic text-center select-none">Free Period</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TimeTableGrid;