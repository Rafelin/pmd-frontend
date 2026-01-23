"use client";

import { EmployeeCard } from "./EmployeeCard";
import { Employee } from "@/lib/types/employee";

interface EmployeesListProps {
  employees: Employee[];
  onRefresh?: () => void;
}

export function EmployeesList({ employees, onRefresh }: EmployeesListProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-12 text-center">
        <p className="text-gray-600 text-lg">No hay empleados registrados</p>
        <p className="text-gray-500 text-sm mt-2">
          Haz clic en &quot;Nuevo Empleado&quot; para agregar uno
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
