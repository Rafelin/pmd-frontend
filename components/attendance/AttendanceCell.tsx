"use client";

import { AttendanceStatus } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface AttendanceCellProps {
  status: AttendanceStatus | null;
  lateHours?: number | null;
  onClick: () => void;
  disabled?: boolean;
}

export function AttendanceCell({
  status,
  lateHours,
  onClick,
  disabled = false,
}: AttendanceCellProps) {
  const getStatusColor = () => {
    if (!status) return "bg-gray-100 hover:bg-gray-200";
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "bg-green-100 hover:bg-green-200 text-green-800";
      case AttendanceStatus.ABSENT:
        return "bg-red-100 hover:bg-red-200 text-red-800";
      case AttendanceStatus.LATE:
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800";
      default:
        return "bg-gray-100 hover:bg-gray-200";
    }
  };

  const getStatusLabel = () => {
    if (!status) return "—";
    switch (status) {
      case AttendanceStatus.PRESENT:
        return "✓";
      case AttendanceStatus.ABSENT:
        return "✗";
      case AttendanceStatus.LATE:
        return lateHours ? `⏰ ${lateHours}h` : "⏰";
      default:
        return "—";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-10 rounded border transition-colors text-sm font-medium",
        getStatusColor(),
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer"
      )}
      title={
        status === AttendanceStatus.LATE && lateHours
          ? `${lateHours} horas de tardanza`
          : status || "Sin registro"
      }
    >
      {getStatusLabel()}
    </button>
  );
}
