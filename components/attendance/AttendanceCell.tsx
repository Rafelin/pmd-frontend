"use client";

import { useState, useEffect } from "react";
import { AttendanceStatus } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface AttendanceCellProps {
  status: AttendanceStatus | null;
  lateHours?: number | null;
  onChange: (status: AttendanceStatus | null) => void;
  onLateHoursClick?: () => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "Sin registro" },
  { value: AttendanceStatus.PRESENT, label: "Presente" },
  { value: AttendanceStatus.ABSENT, label: "Ausente" },
  { value: AttendanceStatus.LATE, label: "Tarde" },
];

export function AttendanceCell({
  status,
  lateHours,
  onChange,
  onLateHoursClick,
  disabled = false,
}: AttendanceCellProps) {
  // Estado local que se sincroniza con el prop status
  const [localStatus, setLocalStatus] = useState<AttendanceStatus | null>(status);

  // Sincronizar estado local cuando cambia el prop
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const getStatusColor = () => {
    if (!localStatus) return "bg-gray-50 border-gray-300";
    switch (localStatus) {
      case AttendanceStatus.PRESENT:
        return "bg-green-50 border-green-300 text-green-800";
      case AttendanceStatus.ABSENT:
        return "bg-red-50 border-red-300 text-red-800";
      case AttendanceStatus.LATE:
        return "bg-yellow-50 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-300";
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      setLocalStatus(null);
      onChange(null);
    } else if (value === AttendanceStatus.LATE) {
      // Si selecciona "Tarde", primero mostrar modal para horas
      // Mantener el estado anterior visualmente hasta que se confirme
      if (onLateHoursClick) {
        onLateHoursClick();
      }
      // Si se cancela, el useEffect revertirá el estado local al prop
    } else {
      setLocalStatus(value as AttendanceStatus);
      onChange(value as AttendanceStatus);
    }
  };

  return (
    <div className="w-full">
      <select
        value={localStatus || ""}
        onChange={handleSelectChange}
        disabled={disabled}
        className={cn(
          "w-full h-10 rounded border text-xs font-medium px-2 py-1 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-pmd-darkBlue focus:border-pmd-darkBlue",
          getStatusColor(),
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
        title={
          localStatus === AttendanceStatus.LATE && lateHours
            ? `${lateHours} horas de tardanza`
            : localStatus || "Sin registro"
        }
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {localStatus === AttendanceStatus.LATE && lateHours && (
        <div className="text-[10px] text-center mt-0.5 text-gray-600">
          {lateHours}h
        </div>
      )}
    </div>
  );
}
