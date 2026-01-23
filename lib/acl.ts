/**
 * Sistema de Control de Acceso (ACL) para PMD
 * 
 * Permisos basados en módulos y acciones:
 * - works.read, works.create, works.update, works.delete, works.manage
 * - staff.read, staff.create, staff.update, staff.delete, staff.manage
 * - suppliers.read, suppliers.create, suppliers.update, suppliers.delete, suppliers.manage
 * - expenses.read, expenses.create, expenses.update, expenses.delete, expenses.manage, expenses.validate
 * - contracts.read, contracts.create, contracts.update, contracts.delete, contracts.manage
 * - incomes.read, incomes.create, incomes.update, incomes.delete, incomes.manage
 * - documents.read, documents.create, documents.update, documents.delete, documents.manage
 * - accounting.read, accounting.create, accounting.update, accounting.delete, accounting.manage, accounting.close, accounting.reopen
 * - cashboxes.read, cashboxes.create, cashboxes.update, cashboxes.delete, cashboxes.manage, cashboxes.close, cashboxes.approve
 * - suppliers.read, suppliers.create, suppliers.update, suppliers.delete, suppliers.manage, suppliers.approve, suppliers.reject
 * - clients.read, clients.create, clients.update, clients.delete, clients.manage
 * - alerts.read, alerts.create, alerts.update, alerts.delete, alerts.manage
 * - audit.read, audit.delete, audit.manage
 * - settings.read, settings.update, settings.manage
 * - users.read, users.create, users.update, users.delete, users.manage
 * - roles.read, roles.create, roles.update, roles.delete, roles.manage
 */

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export type Permission = 
  | "works.read" | "works.create" | "works.update" | "works.delete" | "works.manage"
  | "staff.read" | "staff.create" | "staff.update" | "staff.delete" | "staff.manage"
  | "employees.read" | "employees.create" | "employees.update" | "employees.delete" | "employees.manage"
  | "suppliers.read" | "suppliers.create" | "suppliers.update" | "suppliers.delete" | "suppliers.manage" | "suppliers.approve" | "suppliers.reject"
  | "expenses.read" | "expenses.create" | "expenses.update" | "expenses.delete" | "expenses.manage" | "expenses.validate"
  | "contracts.read" | "contracts.create" | "contracts.update" | "contracts.delete" | "contracts.manage"
  | "incomes.read" | "incomes.create" | "incomes.update" | "incomes.delete" | "incomes.manage"
  | "documents.read" | "documents.create" | "documents.update" | "documents.delete" | "documents.manage"
  | "accounting.read" | "accounting.create" | "accounting.update" | "accounting.delete" | "accounting.manage" | "accounting.close" | "accounting.reopen"
  | "cashboxes.read" | "cashboxes.create" | "cashboxes.update" | "cashboxes.delete" | "cashboxes.manage" | "cashboxes.close" | "cashboxes.approve"
  | "clients.read" | "clients.create" | "clients.update" | "clients.delete" | "clients.manage"
  | "alerts.read" | "alerts.create" | "alerts.update" | "alerts.delete" | "alerts.manage"
  | "audit.read" | "audit.delete" | "audit.manage"
  | "settings.read" | "settings.update" | "settings.manage"
  | "users.read" | "users.create" | "users.update" | "users.delete" | "users.manage"
  | "roles.read" | "roles.create" | "roles.update" | "roles.delete" | "roles.manage"
  | "schedule.read" | "schedule.create" | "schedule.update" | "schedule.delete" | "schedule.manage";

/**
 * Obtiene los permisos del usuario desde su rol
 * El frontend NUNCA depende de role.name para permisos
 * Los permisos SIEMPRE vienen en user.role.permissions (inyectados por normalizadores)
 * EXCEPCIÓN: Admin/Administration siempre tiene todos los permisos
 * @returns Array de permisos del usuario
 */
function getUserPermissions(): Permission[] {
  const user = useAuthStore.getState().user;
  
  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: user no existe");
    }
    return [];
  }

  // VALIDACIÓN 1: user.role existe
  if (!user.role) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: user.role no existe");
    }
    return [];
  }

  // NOTA: Ya no otorgamos permisos automáticos basados en el nombre del rol
  // Todos los permisos deben venir explícitamente del backend en user.role.permissions
  // Esto asegura que los permisos sean consistentes con la base de datos

  // VALIDACIÓN 2: user.role.permissions existe
  if (!user.role.permissions) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: user.role.permissions no existe");
    }
    return [];
  }

  // VALIDACIÓN 3: user.role.permissions es Array
  if (!Array.isArray(user.role.permissions)) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: user.role.permissions no es Array. Tipo:", typeof user.role.permissions);
    }
    return [];
  }

  // VALIDACIÓN 4: user.role.permissions no es vacío
  if (user.role.permissions.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: user.role.permissions está vacío (length: 0)");
    }
    return [];
  }

  // Filtrar solo strings válidos
  const permissions = user.role.permissions.filter((p: string): p is Permission => 
    typeof p === "string" && p.length > 0
  );

  if (permissions.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.error("🟡 [ACL AUDIT] ❌ FAIL: No hay permisos válidos después del filtro");
    }
    return [];
  }
  
  return permissions;
}

/**
 * Hook para verificar permisos
 * @param permission - Permiso a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function useCan(permission: Permission): boolean {
  // 🔍 HACER REACTIVO: Usar selector reactivo en lugar de getState()
  const user = useAuthStore((state) => state.user);
  
  // Obtener permisos de forma reactiva
  const permissions: Permission[] = useMemo(() => {
    // NOTA: Ya no otorgamos permisos automáticos basados en el nombre del rol
    // Todos los permisos deben venir explícitamente del backend en user.role.permissions
    // Esto asegura que los permisos sean consistentes con la base de datos
    
    const roleName = user?.role?.name?.toLowerCase();
    
    // Si no hay usuario, retornar array vacío sin warnings (normal durante carga inicial)
    if (!user) {
      return [];
    }
    
    // Verificar si hay permisos en el usuario
    if (!user.role?.permissions) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[ACL] ⚠️ No permissions found for user ${user.email} (role: ${roleName})`);
        console.warn(`[ACL] ⚠️ user.role.permissions is:`, user.role?.permissions);
      }
      return [];
    }
    
    if (!Array.isArray(user.role.permissions)) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[ACL] ❌ user.role.permissions is not an array. Type: ${typeof user.role.permissions}, Value:`, user.role.permissions);
      }
      return [];
    }
    
    // Filtrar solo strings válidos
    const validPermissions = user.role.permissions.filter((p: string): p is Permission => 
      typeof p === "string" && p.length > 0
    );
    
    return validPermissions;
  }, [user]);
  
  // Normalizar a lowercase para comparación case-insensitive
  const lowerPermission = permission.toLowerCase();
  const lowerPermissions = permissions.map(p => String(p).toLowerCase());
  const hasPermission = lowerPermissions.includes(lowerPermission);
  
  // Logging para debugging (solo en desarrollo) - solo warnings y errores críticos
  // Solo mostrar warnings si el usuario existe pero no tiene permisos (problema real)
  // No mostrar warnings si el usuario es undefined (normal durante carga inicial)
  if (process.env.NODE_ENV === "development") {
    if (!hasPermission && permissions.length === 0 && user) {
      console.warn(`[ACL] ⚠️ Permission denied: "${permission}" - No permissions available for user ${user.email}`);
      console.warn(`[ACL]   This may indicate that permissions were not loaded from backend correctly`);
    }
  }
  
  return hasPermission;
}

/**
 * Función helper para verificar permisos fuera de componentes
 * @param permission - Permiso a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function can(permission: Permission): boolean {
  const permissions = getUserPermissions();
  // Normalizar a lowercase para comparación case-insensitive (consistente con useCan)
  const lowerPermission = permission.toLowerCase();
  const lowerPermissions = permissions.map(p => String(p).toLowerCase());
  return lowerPermissions.includes(lowerPermission);
}

