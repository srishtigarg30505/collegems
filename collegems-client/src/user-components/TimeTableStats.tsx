import React from "react";

interface Course {
  _id: string;
  name: string;
}

interface Teacher {
  _id: string;
  name: string;
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

interface StatsProps {
  schedules: ScheduleSlot[];
}

const TimeTableStats: React.FC<StatsProps> = ({ schedules }) => {
  const role = localStorage.getItem("role") || "student";

  // 1. Total Classes
  const totalClasses = schedules.length;

  // 2. Today's Classes
  const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysMap[new Date().getDay()];
  const todaysClasses = schedules.filter(s => s.day === currentDayName).length;

  // 3. Unique Teachers or Rooms
  let dynamicLabel = "Professors Assigned";
  let dynamicValue = 0;

  if (role === "teacher") {
    dynamicLabel = "Active Classrooms";
    dynamicValue = new Set(schedules.map(s => s.classroom).filter(Boolean)).size;
  } else {
    dynamicValue = new Set(schedules.map(s => s.teacher?._id).filter(Boolean)).size;
  }

  const stats = [
    {
      title: "Total Classes",
      value: totalClasses,
    },
    {
      title: `Today's Classes (${currentDayName === "Sunday" || currentDayName === "Saturday" ? "Weekend" : currentDayName})`,
      value: todaysClasses,
    },
    {
      title: dynamicLabel,
      value: dynamicValue,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {stat.value}
          </h2>
        </div>
      ))}
    </div>
  );
};

export default TimeTableStats;