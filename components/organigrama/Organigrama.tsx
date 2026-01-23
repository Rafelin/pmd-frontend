"use client";

import { AreaNode } from "./AreaNode";
import { EmptyState } from "@/components/ui/EmptyState";
import { Employee } from "@/lib/types/employee";

interface OrganigramaProps {
  employees: Employee[];
}

export function Organigrama({ employees }: OrganigramaProps) {
  // Traducir área al español
  const translateArea = (area: string | undefined): string => {
    if (!area) return "Sin área";
    const areaLower = area.toLowerCase();
    const translations: Record<string, string> = {
      arquitectura: "Arquitectura",
      architecture: "Arquitectura",
      obras: "Obras",
      works: "Obras",
      logistica: "Logística",
      logistics: "Logística",
      pañol: "Pañol",
      almacen: "Pañol",
      mantenimiento: "Mantenimiento",
      maintenance: "Mantenimiento",
      administracion: "Administración",
      administration: "Administración",
      direccion: "Dirección",
      direction: "Dirección",
      rrhh: "Recursos Humanos",
      "recursos humanos": "Recursos Humanos",
    };
    return translations[areaLower] || area;
  };

  // Agrupar empleados por área
  const agruparPorArea = (employees: Employee[]) => {
    const grupos: Record<string, Employee[]> = {};

    employees.forEach((emp) => {
      const area = emp.area || (emp as any).areaTrabajo || "Sin área";
      const areaTraducida = translateArea(area);
      
      if (!grupos[areaTraducida]) {
        grupos[areaTraducida] = [];
      }
      grupos[areaTraducida].push(emp);
    });

    return grupos;
  };

  const gruposPorArea = agruparPorArea(employees);

  // Orden de áreas (prioridad visual)
  const ordenAreas = [
    "Dirección",
    "Arquitectura",
    "Obras",
    "Logística",
    "Pañol",
    "Mantenimiento",
    "Administración",
    "Recursos Humanos",
    "Sin área",
  ];

  // Ordenar áreas según prioridad
  const areasOrdenadas = Object.keys(gruposPorArea).sort((a, b) => {
    const indexA = ordenAreas.indexOf(a);
    const indexB = ordenAreas.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-pmd p-12">
        <EmptyState
          icon="🏢"
          title="No hay empleados registrados"
          description="El organigrama aparecerá aquí cuando se registren empleados en el sistema."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {areasOrdenadas.map((areaName) => (
        <AreaNode key={areaName} areaName={areaName} employees={gruposPorArea[areaName]} />
      ))}
    </div>
  );
}

