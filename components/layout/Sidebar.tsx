"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAlertsStore } from "@/store/alertsStore";
import { useDocumentsStore } from "@/store/documentsStore";
import { useCashboxStore } from "@/store/cashboxStore";
import { useCan } from "@/lib/acl";
import { useEffect, useMemo, memo } from "react";
import LogoPMD from "@/components/LogoPMD";
import styles from "./Sidebar.module.css";
import {
  LayoutDashboard,
  Building2,
  Truck,
  Calculator,
  Wallet,
  FileText,
  ScrollText,
  Bell,
  Shield,
  Settings,
  UserCog,
  BookOpen,
  Receipt,
  FileCheck,
  TrendingUp,
  FolderTree,
  Users,
  CalendarCheck,
  HandCoins,
  Banknote,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  section?: string;
  hasPermission?: boolean; // Indica si el usuario tiene permiso para este módulo
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

// Mover lista de módulos fuera del componente para evitar re-renders
const ALL_NAV_ITEMS: NavItem[] = [
  // Gestión
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "always", section: "Gestión" },
  { label: "Obras", href: "/works", icon: Building2, permission: "works.read", section: "Gestión" },
  
  // Operaciones
  { label: "Proveedores", href: "/suppliers", icon: Truck, permission: "suppliers.read", section: "Operaciones" },
  { label: "Gastos", href: "/expenses", icon: Receipt, permission: "expenses.read", section: "Operaciones" },
  { label: "Contratos", href: "/contracts", icon: FileCheck, permission: "contracts.read", section: "Operaciones" },
  { label: "Ingresos", href: "/incomes", icon: TrendingUp, permission: "incomes.read", section: "Operaciones" },
  { label: "Cajas", href: "/cashbox", icon: Wallet, permission: "cashboxes.read", section: "Operaciones" },
  { label: "Documentación", href: "/documents", icon: FileText, permission: "documents.read", section: "Operaciones" },
  
  // RRHH
  { label: "Empleados", href: "/rrhh", icon: Users, permission: "employees.read", section: "RRHH" },
  { label: "Control de Asistencia", href: "/attendance", icon: CalendarCheck, permission: "attendance.read", section: "RRHH" },
  { label: "Adelantos", href: "/employee-advances", icon: HandCoins, permission: "employee_advances.read", section: "RRHH" },
  { label: "Nómina", href: "/payroll", icon: Banknote, permission: "payroll.read", section: "RRHH" },
  { label: "Recibos", href: "/receipts", icon: ScrollText, permission: "payroll.read", section: "RRHH" },
  
  // Administración
  { label: "Contabilidad", href: "/accounting", icon: Calculator, permission: "accounting.read", section: "Administración" },
  { label: "Alertas", href: "/alerts", icon: Bell, permission: "alerts.read", section: "Administración" },
  { label: "Auditoría", href: "/audit", icon: Shield, permission: "audit.read", section: "Administración" },
  
  // Sistema
  { label: "Usuarios", href: "/settings/users", icon: UserCog, permission: "users.read", section: "Sistema" },
  { label: "Roles", href: "/roles", icon: BookOpen, permission: "roles.read", section: "Sistema" },
  { label: "Rúbricas", href: "/rubrics", icon: FolderTree, permission: "rubrics.read", section: "Sistema" },
  { label: "Configuración", href: "/settings", icon: Settings, permission: "settings.read", section: "Sistema" },
];

function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { alerts, fetchAlerts } = useAlertsStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  const { cashboxes, fetchCashboxes } = useCashboxStore();
  // ✅ FUENTE ÚNICA DE VERDAD: useAuthStore desde @/store/authStore
  // Este hook está conectado al store persistido en localStorage con key "pmd-auth-storage"
  // El componente se re-renderiza reactivamente cuando state.user cambia
  const userFromStore = useAuthStore((state) => state.user);
  
  // Usar user desde el store
  const user = userFromStore;

  // ✅ Variable normalizada: siempre es string[]
  const permissions: string[] = user?.role?.permissions ?? [];

  // ACL hooks - deben ejecutarse siempre antes de cualquier return
  const canWorks = useCan("works.read");
  const canSuppliers = useCan("suppliers.read");
  const canExpenses = useCan("expenses.read");
  const canContracts = useCan("contracts.read");
  const canIncomes = useCan("incomes.read");
  const canAccounting = useCan("accounting.read");
  const canCashbox = useCan("cashboxes.read");
  const canDocuments = useCan("documents.read");
  const canEmployees = useCan("employees.read");
  const canAttendance = useCan("attendance.read");
  const canEmployeeAdvances = useCan("employee_advances.read");
  const canPayroll = useCan("payroll.read");
  const canAlerts = useCan("alerts.read");
  const canAudit = useCan("audit.read");
  const canUsers = useCan("users.read");
  const canRoles = useCan("roles.read");
  const canSettings = useCan("settings.read");
  

  // Hook reactivo para organizationId
  const organizationId = useAuthStore((state) => state.user?.organizationId);

  useEffect(() => {
    if (organizationId) {
      fetchAlerts();
      fetchDocuments();
      fetchCashboxes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Memoizar items visibles según permisos ACL - solo se calcula cuando user existe
  const visibleItems = useMemo(() => {
    // Si no hay user, retornar solo Dashboard para evitar cálculo innecesario
    if (!user) {
      const dashboardItem = ALL_NAV_ITEMS.find(item => item.href === "/dashboard");
      return dashboardItem ? [dashboardItem] : [];
    }

    const filtered = ALL_NAV_ITEMS.filter((item) => {
      // Dashboard siempre visible si hay usuario
      if (item.permission === "always" || item.href === "/dashboard") {
        return true;
      }
      
      // Verificar permiso específico
      let hasPermission = false;
      switch (item.permission) {
        case "works.read":
          hasPermission = canWorks;
          break;
        case "suppliers.read":
          hasPermission = canSuppliers;
          break;
        case "expenses.read":
          hasPermission = canExpenses;
          break;
        case "contracts.read":
          hasPermission = canContracts;
          break;
        case "incomes.read":
          hasPermission = canIncomes;
          break;
        case "accounting.read":
          hasPermission = canAccounting;
          break;
        case "cashboxes.read":
          hasPermission = canCashbox;
          break;
        case "documents.read":
          hasPermission = canDocuments;
          break;
        case "employees.read":
          hasPermission = canEmployees;
          break;
        case "attendance.read":
          hasPermission = canAttendance;
          break;
        case "employee_advances.read":
          hasPermission = canEmployeeAdvances;
          break;
        case "payroll.read":
          hasPermission = canPayroll;
          break;
        case "alerts.read":
          hasPermission = canAlerts;
          break;
        case "audit.read":
          hasPermission = canAudit;
          break;
        case "users.read":
          hasPermission = canUsers;
          break;
        case "roles.read":
          hasPermission = canRoles;
          break;
        case "settings.read":
          hasPermission = canSettings;
          break;
        case "rubrics.read":
          // Solo Direction y Administration pueden ver rúbricas
          hasPermission = user?.role?.name?.toLowerCase() === "direction" || user?.role?.name?.toLowerCase() === "administration";
          break;
        default:
          hasPermission = true;
      }
      
      return hasPermission;
    });
    
    // Fallback defensivo: asegurar que al menos Dashboard esté visible
    if (filtered.length === 0) {
      const dashboardItem = ALL_NAV_ITEMS.find(item => item.href === "/dashboard");
      if (dashboardItem) {
        return [dashboardItem];
      }
    }
    
    return filtered;
  }, [user, canWorks, canSuppliers, canExpenses, canContracts, canIncomes, canAccounting, canCashbox, canDocuments, canEmployees, canAttendance, canEmployeeAdvances, canPayroll, canAlerts, canAudit, canUsers, canRoles, canSettings]);

  // Memoizar agrupación por sección - antes del early return
  const itemsBySection = useMemo(() => {
    return visibleItems.reduce((acc, item) => {
      const section = item.section || "Otros";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [visibleItems]);

  // Early return después de todos los hooks
  if (!user) {
    return null;
  }

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;
  const pendingDocsCount = documents.filter((d) => d.status === "pendiente").length;
  const openCashboxesCount = cashboxes.filter((c) => !c.isClosed).length;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getBadgeCount = (href: string) => {
    if (href === "/alerts" && unreadAlertsCount > 0) {
      return unreadAlertsCount;
    }
    if (href === "/documents" && pendingDocsCount > 0) {
      return pendingDocsCount;
    }
    if (href === "/cashbox" && openCashboxesCount > 0) {
      return openCashboxesCount;
    }
    return null;
  };

  const getBadgeVariant = (href: string): "error" | "warning" | "info" => {
    if (href === "/alerts") {
      const criticalAlerts = alerts.filter((a) => !a.read && a.severity === "critical").length;
      if (criticalAlerts > 0) return "error";
      const warningAlerts = alerts.filter((a) => !a.read && a.severity === "warning").length;
      if (warningAlerts > 0) return "warning";
      return "info";
    }
    if (href === "/documents") return "warning";
    if (href === "/cashbox") return "info";
    return "info";
  };

  const handleItemClick = (href: string) => {
    if (onClose) {
      onClose();
    }
    router.push(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebarWrapper} 
          /* Base styles - siempre aplicados */
          bg-[#162F7F] border-r border-white/20 
          touch-pan-y touch-manipulation scrollbar-none text-white touch-none select-none
          /* Desktop (md+): siempre visible, static, ancho fijo */
          md:static md:translate-x-0 md:w-64 md:z-auto
          /* Mobile: fixed, condicional según mobileOpen */
          fixed top-0 left-0 z-[9998] 
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${
            mobileOpen
              ? "translate-x-0" /* Mobile: visible cuando mobileOpen es true */
              : "-translate-x-full" /* Mobile: oculto cuando mobileOpen es false */
          }
        `}
        style={{ 
          width: mobileOpen ? "min(85vw, 256px)" : undefined 
        }}
      >
        {/* Logo Section */}
        <div className={`${styles.logoSection} flex justify-center items-center py-6 border-b border-white/10`}>
          <LogoPMD size={56} className="opacity-95 drop-shadow-md" />
        </div>

        {/* Navigation - Scrollable */}
        <nav className={`${styles.menuScroll} flex flex-col gap-2 px-3 py-4 scrollbar-none`}>
          {Object.entries(itemsBySection).map(([section, items]) => (
            <div key={section} className="mb-2">
              {/* Section Title */}
              <p className="px-5 mt-4 mb-1 text-xs uppercase tracking-wide text-white font-medium">
                {section}
              </p>

              {/* Section Items */}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const badgeCount = getBadgeCount(item.href);
                const badgeVariant = badgeCount ? getBadgeVariant(item.href) : null;
                const hasPermission = item.hasPermission !== false; // Por defecto true si no está definido

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (!hasPermission) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      handleItemClick(item.href);
                    }}
                    className={`
                      flex items-center gap-3 px-5 py-4
                      rounded-xl
                      transition-all duration-200
                      text-sm font-semibold
                      touch-none select-none
                      ${
                        hasPermission
                          ? "cursor-pointer active:scale-95 text-white"
                          : "cursor-not-allowed opacity-50 text-white/60"
                      }
                      ${
                        active && hasPermission
                          ? "bg-white/25 border-l-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                          : hasPermission
                          ? "hover:bg-white/15"
                          : ""
                      }
                    `}
                    style={{ minHeight: "48px" }}
                    title={!hasPermission ? `No tienes permisos para acceder a ${item.label}` : undefined}
                  >
                    {/* Icon */}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${hasPermission ? "text-white" : "text-white/60"}`} />

                    {/* Label */}
                    <span className="flex-1">{item.label}</span>

                    {/* Badge */}
                    {badgeCount !== null && badgeCount > 0 && hasPermission && (
                      <span
                        className={`
                          flex items-center justify-center
                          min-w-[20px] h-5 px-1.5
                          rounded-full text-xs font-semibold
                          ${
                            badgeVariant === "error"
                              ? "bg-red-500/90 text-white"
                              : badgeVariant === "warning"
                              ? "bg-yellow-500/90 text-white"
                              : "bg-blue-500/90 text-white"
                          }
                        `}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}

                    {/* Indicador de sin permisos */}
                    {!hasPermission && (
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40"
                        title="Sin permisos"
                      >
                        <span className="text-[8px] text-yellow-400">!</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Section - Anchored at Bottom */}
        {user && (
          <div className={styles.userBlock}>
            <p className="text-sm font-semibold text-white truncate">
              {user.fullName || user.email}
            </p>
            <p className="text-xs text-white truncate opacity-90">
              {user.role?.name || user.roleId || "Sin rol"}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

// Memoizar el componente para evitar re-renders innecesarios
export default memo(Sidebar);
