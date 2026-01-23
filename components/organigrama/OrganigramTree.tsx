"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronRight, Users, Building2, Bell } from "lucide-react";
import { useAlertsStore } from "@/store/alertsStore";
import { useWorks } from "@/hooks/api/works";
import { useRoles } from "@/hooks/api/roles";
import Link from "next/link";
import { Employee } from "@/lib/types/employee";
import { Work } from "@/lib/types/work";
import { Role } from "@/lib/types/role";
import { Alert } from "@/store/alertsStore";

interface TreeNode {
  id: string;
  label: string;
  role: string;
  employees: Employee[];
  children?: TreeNode[];
  isExpanded?: boolean;
}

interface OrganigramTreeProps {
  employees: Employee[];
  onEmployeeClick?: (employee: Employee) => void;
}

export function OrganigramTree({ employees, onEmployeeClick }: OrganigramTreeProps) {
  const { alerts } = useAlertsStore();
  const { works } = useWorks();
  const { roles } = useRoles();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["direccion"]));

  const getWorkName = (workId?: string) => {
    if (!workId) return null;
    const work = works.find((w: Work) => w.id === workId);
    if (!work) return null;
    return work.name || workId;
  };

  const getRoleName = (roleId?: string) => {
    if (!roleId) return null;
    const role = roles.find((r: Role) => r.id === roleId || r.name === roleId);
    return role?.name || roleId;
  };

  const getEmployeeAlerts = (employeeId: string) => {
    return alerts.filter((alert: Alert) => {
      // Check if alert is related to this employee via user_id or metadata
      return alert.user_id === employeeId || (alert.metadata && typeof alert.metadata === 'object' && 'personId' in alert.metadata && (alert.metadata as { personId?: string }).personId === employeeId);
    });
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Estructura jerárquica del organigrama basada en roles reales del backend
  const buildTree = (): TreeNode[] => {
    // Obtener roles reales del backend y construir jerarquía dinámica
    // Si no hay roles en el backend, usar estructura por defecto
    const roleHierarchy: Record<string, { parent?: string; label: string }> = {};
    
    // Agregar roles del backend a la jerarquía
    roles.forEach((role: Role) => {
      const roleName = role.name || (role as any).nombre || role.id;
      const roleKey = role.id || roleName;
      
      // Determinar jerarquía basada en el nombre del rol
      const nameLower = roleName.toLowerCase();
      
      if (nameLower.includes("admin") || nameLower.includes("director") || nameLower.includes("gerente")) {
        roleHierarchy[roleKey] = { label: roleName };
      } else if (nameLower.includes("supervisor") || nameLower.includes("jefe")) {
        roleHierarchy[roleKey] = { parent: "direccion", label: roleName };
      } else if (nameLower.includes("operador") || nameLower.includes("obrero") || nameLower.includes("empleado")) {
        roleHierarchy[roleKey] = { parent: "supervisor", label: roleName };
      } else {
        // Rol genérico sin jerarquía específica
        roleHierarchy[roleKey] = { label: roleName };
      }
    });
    
    // Estructura por defecto si no hay roles en el backend
    if (Object.keys(roleHierarchy).length === 0) {
      roleHierarchy["direccion"] = { label: "Dirección" };
      roleHierarchy["administracion"] = { label: "Administración" };
      roleHierarchy["supervisor"] = { parent: "direccion", label: "Supervisores" };
      roleHierarchy["operador"] = { parent: "supervisor", label: "Operadores" };
    }

    // Los empleados se agrupan dentro de buildNode, no necesitamos pre-agruparlos

    // Construir árbol
    const buildNode = (roleKey: string): TreeNode | null => {
      const config = roleHierarchy[roleKey];
      if (!config) return null;

      // Buscar empleados que tengan este rol (por roleId o role)
      const nodeEmployees: Employee[] = [];
      employees.forEach((emp) => {
        const empRoleId = (emp as any).roleId || (emp as any).role;
        if (empRoleId === roleKey || empRoleId === config.label) {
          nodeEmployees.push(emp);
        }
      });

      const children: TreeNode[] = [];

      // Buscar hijos
      Object.keys(roleHierarchy).forEach((childKey) => {
        if (roleHierarchy[childKey].parent === roleKey) {
          const childNode = buildNode(childKey);
          if (childNode && (childNode.employees.length > 0 || (childNode.children && childNode.children.length > 0))) {
            children.push(childNode);
          }
        }
      });

      // Solo retornar nodo si tiene empleados o hijos
      if (nodeEmployees.length === 0 && children.length === 0) {
        return null;
      }

      return {
        id: roleKey.toLowerCase().replace(/\s+/g, "-"),
        label: config.label,
        role: roleKey,
        employees: nodeEmployees,
        children: children.length > 0 ? children : undefined,
      };
    };

    // Construir desde las raíces (roles sin parent)
    const roots: TreeNode[] = [];
    Object.keys(roleHierarchy).forEach((roleKey) => {
      if (!roleHierarchy[roleKey].parent) {
        const rootNode = buildNode(roleKey);
        if (rootNode) {
          roots.push(rootNode);
        }
      }
    });
    
    // Si no hay raíces, crear una raíz genérica
    if (roots.length === 0) {
      const allEmployees: Employee[] = [];
      employees.forEach((emp) => {
        allEmployees.push(emp);
      });
      return [
        {
          id: "organigrama",
          label: "Organigrama",
          role: "all",
          employees: allEmployees,
        },
      ];
    }
    
    return roots;
  };

  const tree = buildTree();

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const hasEmployees = node.employees.length > 0;

    return (
      <div key={node.id} className="mb-4">
        {/* Nodo del área/rol */}
        <div
          className={`flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${
            level === 0 ? "font-semibold" : ""
          }`}
          onClick={() => toggleNode(node.id)}
        >
          {hasChildren && (
            <div className="text-gray-400">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-900">{node.label}</span>
          {hasEmployees && (
            <Badge variant="default" className="text-xs ml-auto">
              {node.employees.length}
            </Badge>
          )}
        </div>

        {/* Empleados del nodo */}
        {isExpanded && hasEmployees && (
          <div className="ml-6 mb-3 space-y-2">
            {node.employees.map((employee) => {
              const name = employee.fullName || employee.name || employee.nombre || "Sin nombre";
              const isActive = employee.isActive !== false;
              const workName = getWorkName(employee.workId ?? undefined);
              const employeeAlerts = getEmployeeAlerts(employee.id);
              const hasAlerts = employeeAlerts.length > 0;
              const unreadAlerts = employeeAlerts.filter((a) => !a.read).length;

              return (
                <div
                  key={employee.id}
                  onClick={() => onEmployeeClick?.(employee)}
                  className={`flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                    {employee.subrole && (
                      <p className="text-xs text-gray-500">{employee.subrole}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {workName && employee.workId && (
                      <Link href={`/works/${employee.workId}`}>
                        <Badge variant="info" className="text-xs cursor-pointer hover:opacity-80">
                          <Building2 className="h-3 w-3 mr-1" />
                          {workName}
                        </Badge>
                      </Link>
                    )}
                    {hasAlerts && (
                      <Badge variant="error" className="text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        {unreadAlerts}
                      </Badge>
                    )}
                    {!isActive && (
                      <Badge variant="default" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nodos hijos */}
        {isExpanded && hasChildren && (
          <div className="ml-6 border-l border-gray-200 pl-4">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (tree.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-pmd p-12 text-center">
        <p className="text-gray-600">No hay personal registrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-pmd p-6">
      <div className="space-y-2">{tree.map((node) => renderNode(node))}</div>
    </div>
  );
}

