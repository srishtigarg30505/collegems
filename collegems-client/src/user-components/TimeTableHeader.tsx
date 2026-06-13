import React from "react";

interface HeaderProps {
  role?: string;
}

const TimeTableHeader: React.FC<HeaderProps> = ({ role }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {role === "teacher" ? "My Teaching Timetable" : "My Class Timetable"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {role === "teacher" 
            ? "View your assigned classes, semesters, and classroom sessions" 
            : "Track your daily lecture slots, course professors, and room locations"}
        </p>
      </div>
    </div>
  );
};

export default TimeTableHeader;