"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useWork, workApi } from "@/hooks/api/works";
import { useUsers } from "@/hooks/api/users";
import { useSuppliers } from "@/hooks/api/suppliers";
import { useContracts } from "@/hooks/api/contracts";
import { useEmployees } from "@/hooks/api/employees";
import { useContractorCertifications } from "@/hooks/api/contractorCertifications";
import { contractApi } from "@/hooks/api/contracts";
import { workUsersApi } from "@/hooks/api/work-users";
import { AssignUserModal } from "@/components/works/AssignUserModal";
import { AssignSupplierModal } from "@/components/works/AssignSupplierModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { WorkForm } from "@/components/forms/WorkForm";
import { useToast } from "@/components/ui/Toast";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Edit, Archive, Trash2, UserPlus, Building2, DollarSign, TrendingUp, TrendingDown, Lock, Calendar } from "lucide-react";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useAuthStore } from "@/store/authStore";
import { UpdateWorkData, Currency } from "@/lib/types/work";
import { User } from "@/lib/types/user";
import { Supplier } from "@/lib/types/supplier";
import { Employee } from "@/lib/types/employee";
import { ProgressIndicators } from "@/components/works/ProgressIndicators";
import { useCan } from "@/lib/acl";

function WorkDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : null;
  const { work, isLoading, error, mutate } = useWork(id);
  const { users } = useUsers();
  const { suppliers } = useSuppliers();
  const { contracts, mutate: mutateContracts } = useContracts();
  const { employees, isLoading: isLoadingEmployees } = useEmployees({ work_id: id || undefined, isActive: true });
  const { certifications: contractorCertifications } = useContractorCertifications({ enabled: !!id });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isPostClosureModalOpen, setIsPostClosureModalOpen] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [isAssignSupplierModalOpen, setIsAssignSupplierModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAllowingPostClosure, setIsAllowingPostClosure] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [isAssigningSupplier, setIsAssigningSupplier] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [isLoadingAssignedUsers, setIsLoadingAssignedUsers] = useState(false);
  const [isUnassignUserModalOpen, setIsUnassignUserModalOpen] = useState(false);
  const [userToUnassign, setUserToUnassign] = useState<User | null>(null);
  const [isUnassigningUser, setIsUnassigningUser] = useState(false);
  const toast = useToast();
  const user = useAuthStore.getState().user;
  const isDirection = user?.role?.name === "DIRECTION" || user?.role?.name === "direction" || user?.role?.name === "administration" || user?.role?.name === "ADMINISTRATION";
  const isSupervisor = user?.role?.name?.toLowerCase() === "supervisor";
  
  // Verificar permisos
  const canUpdateWork = useCan("works.update");
  const canManageWorks = useCan("works.manage");
  const canDeleteWork = useCan("works.delete");
  
  // Para editar, se necesita works.update o works.manage, pero NO para Supervisor
  const canUpdate = (canUpdateWork || canManageWorks) && !isSupervisor;
  const canDelete = canDeleteWork || canManageWorks;
  const canManage = canManageWorks;
  
  // Para asignar/eliminar personal, se necesita works.update o works.manage
  const canManageWorkUsers = canUpdate || canManage;
  
  // Para asignar proveedores (crear contratos), se necesita contracts.create o contracts.manage
  const canCreateContract = useCan("contracts.create");
  const canManageContracts = useCan("contracts.manage");
  const canAssignSupplier = canCreateContract || canManageContracts;
  
  // Para ver contabilidad, se necesita accounting.read o accounting.manage
  const canReadAccounting = useCan("accounting.read");
  const canManageAccounting = useCan("accounting.manage");
  const canViewAccounting = canReadAccounting || canManageAccounting;

  // Cargar usuarios asignados desde el backend
  useEffect(() => {
    if (id) {
      setIsLoadingAssignedUsers(true);
      workUsersApi
        .getAssignedUsers(id)
        .then((users) => {
          setAssignedUsers(users);
        })
        .catch((error) => {
          console.error("Error loading assigned users:", error);
          setAssignedUsers([]);
        })
        .finally(() => {
          setIsLoadingAssignedUsers(false);
        });
    }
  }, [id, isAssignUserModalOpen]);

  if (!id) return null;

  if (isLoading) {
    return (
      <LoadingState message="Cargando obra…" />
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error al cargar la obra: {error.message || "Error desconocido"}
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/works")}>Volver a Obras</Button>
        </div>
      </>
    );
  }

  if (!work) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Obra no encontrada
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/works")}>Volver a Obras</Button>
        </div>
      </>
    );
  }

  const getWorkName = () => {
    return work.nombre || work.name || work.title || "Sin nombre";
  };

  const getWorkDescription = () => {
    return (work as any).descripcion || work.description || "";
  };

  const getWorkStatus = () => {
    return (work as any).estado || work.status || "pendiente";
  };

  const isWorkClosed = () => {
    const status = getWorkStatus().toLowerCase();
    return status === "finished" || status === "finalizada" || 
           status === "administratively_closed" || status === "cerrada administrativamente" ||
           status === "archived" || status === "archivada";
  };

  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completada" || statusLower === "completed") return "success";
    if (statusLower === "activa" || statusLower === "active") return "info";
    if (statusLower === "pendiente" || statusLower === "pending") return "warning";
    return "default";
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") return "Completada";
    if (statusLower === "active") return "Activa";
    if (statusLower === "pending") return "Pendiente";
    return status;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No especificada";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string = work.currency || "ARS") => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleUpdate = async (data: UpdateWorkData) => {
    setIsSubmitting(true);
    try {
      await workApi.update(id, data);
      await mutate();
      toast.success("Obra actualizada correctamente");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al actualizar obra:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setIsSubmitting(true);
    try {
      await workApi.update(id, {
        status: "archived"
      });
      await mutate();
      toast.success("Obra archivada correctamente");
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        router.push("/works");
      }, 1500);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al archivar obra:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await workApi.delete(id);
      toast.success("Obra eliminada correctamente");
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        router.push("/works");
      }, 1500);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al eliminar obra:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    setIsCloseModalOpen(true);
  };

  const confirmClose = async () => {
    setIsCloseModalOpen(false);
    setIsClosing(true);
    try {
      await workApi.close(id);
      await mutate();
      toast.success("Obra cerrada correctamente");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al cerrar obra:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsClosing(false);
    }
  };

  const handleAllowPostClosure = async () => {
    setIsPostClosureModalOpen(true);
  };

  const confirmAllowPostClosure = async () => {
    setIsPostClosureModalOpen(false);
    setIsAllowingPostClosure(true);
    try {
      await workApi.allowPostClosure(id);
      await mutate();
      toast.success("Gastos post-cierre permitidos correctamente");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al permitir gastos post-cierre:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsAllowingPostClosure(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!id) return;
    setIsUpdatingProgress(true);
    try {
      await workApi.updateProgress(id);
      await mutate();
      toast.success("Avances actualizados correctamente");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al actualizar avances:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Handler para asignar usuario
  const handleAssignUser = async (userId: string, role?: string) => {
    if (!id) return;
    setIsAssigningUser(true);
    try {
      await workUsersApi.assignUser(id, userId, role);
      toast.success("Usuario asignado correctamente");
      setIsAssignUserModalOpen(false);
      // Recargar usuarios asignados
      const users = await workUsersApi.getAssignedUsers(id);
      setAssignedUsers(users);
    } catch (error: any) {
      toast.error(parseBackendError(error) || "Error al asignar usuario");
    } finally {
      setIsAssigningUser(false);
    }
  };

  // Handler para asignar proveedor (crear contrato)
  const handleAssignSupplier = async (
    supplierId: string,
    rubricId: string,
    amountTotal: number,
    currency: string
  ) => {
    if (!id) return;
    setIsAssigningSupplier(true);
    try {
      await contractApi.create({
        work_id: id,
        supplier_id: supplierId,
        rubric_id: rubricId,
        amount_total: amountTotal,
        currency: currency === "USD" ? Currency.USD : Currency.ARS,
      });
      toast.success("Proveedor asignado correctamente");
      setIsAssignSupplierModalOpen(false);
      mutateContracts();
    } catch (error: any) {
      toast.error(parseBackendError(error) || "Error al asignar proveedor");
    } finally {
      setIsAssigningSupplier(false);
    }
  };

  // Obtener proveedores asignados desde contratos
  const assignedSuppliers = (contracts || [])
    .filter((contract: any) => contract.work_id === id || contract.workId === id)
    .map((contract: any) => {
      // Buscar el proveedor en la lista de proveedores
      const supplier = suppliers?.find(
        (s: Supplier) => s.id === contract.supplier_id || s.id === contract.supplierId
      );
      return supplier;
    })
    .filter((supplier: Supplier | undefined) => supplier !== undefined) as Supplier[];

  // Obtener contratistas (Supplier tipo CONTRACTOR) de esta obra
  const contractors = assignedSuppliers.filter(
    (s: Supplier) => s.type === "contractor" || s.type === "CONTRACTOR"
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <BotonVolver backTo="/works" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Detalle de la obra</h1>
            <p className="text-gray-600">Información completa de la obra seleccionada</p>
          </div>
          <div className="flex gap-2">
            {isDirection && !isWorkClosed() && (
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isClosing}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isClosing ? "Cerrando..." : "Cerrar Obra"}
              </Button>
            )}
            {canUpdate && (
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/works")}>
              Volver a Obras
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{getWorkName()}</CardTitle>
              <div className="flex gap-2">
                {isWorkClosed() && (
                  <Badge variant="error" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Cerrada
                  </Badge>
                )}
                <Badge variant={getStatusVariant(getWorkStatus())}>
                  {getStatusLabel(getWorkStatus())}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Banner para obras cerradas */}
            {isWorkClosed() && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900 mb-1">
                      Obra Cerrada
                    </p>
                    <p className="text-sm text-orange-700 mb-2">
                      Esta obra está cerrada. No se pueden crear nuevos gastos {work.allow_post_closure_expenses ? "(excepto gastos post-cierre permitidos)" : "(excepto para Dirección)"}.
                    </p>
                    {work.allow_post_closure_expenses && (
                      <p className="text-sm text-green-700 mb-2 font-semibold">
                        ✓ Gastos post-cierre permitidos
                        {work.post_closure_enabled_at && (
                          <span className="text-xs text-green-600 ml-2">
                            (desde {formatDate(typeof work.post_closure_enabled_at === 'string' ? work.post_closure_enabled_at : work.post_closure_enabled_at instanceof Date ? work.post_closure_enabled_at.toISOString() : undefined)})
                          </span>
                        )}
                      </p>
                    )}
                    {!work.allow_post_closure_expenses && isDirection && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAllowPostClosure}
                          disabled={isAllowingPostClosure}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          {isAllowingPostClosure ? "Procesando..." : "Permitir gastos post-cierre"}
                        </Button>
                      </div>
                    )}
                    {work.end_date && (
                      <p className="text-xs text-orange-600 mt-2">
                        Fecha de cierre: {formatDate(typeof work.end_date === 'string' ? work.end_date : work.end_date instanceof Date ? work.end_date.toISOString() : undefined)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {getWorkDescription() && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                <p className="text-gray-600">{getWorkDescription()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(work as any).cliente || work.client ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Cliente</h3>
                  <p className="text-gray-900">{(work as any).cliente || work.client}</p>
                </div>
              ) : null}

              {work.work_type ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tipo de obra</h3>
                  <p className="text-gray-900">
                    {work.work_type === 'house' ? 'Casa' :
                     work.work_type === 'local' ? 'Local' :
                     work.work_type === 'expansion' ? 'Ampliación' :
                     work.work_type === 'renovation' ? 'Renovación' :
                     work.work_type === 'other' ? 'Otro' :
                     work.work_type}
                  </p>
                </div>
              ) : null}

              {work.fechaInicio || work.startDate || work.estimatedStartDate ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Fecha de inicio estimada
                  </h3>
                  <p className="text-gray-900">
                    {formatDate(typeof (work as any).fechaInicio === 'string' ? (work as any).fechaInicio : work.startDate || (work as any).estimatedStartDate)}
                  </p>
                </div>
              ) : null}

              {(work as any).fechaFin || work.endDate || work.end_date ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {isWorkClosed() ? "Fecha de cierre" : "Fecha de fin"}
                  </h3>
                  <p className="text-gray-900">{formatDate(typeof (work as any).fechaFin === 'string' ? (work as any).fechaFin : typeof work.endDate === 'string' ? work.endDate : typeof work.end_date === 'string' ? work.end_date : work.end_date instanceof Date ? work.end_date.toISOString() : undefined)}</p>
                </div>
              ) : null}

              {(work as any).presupuesto || (work as any).budget ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Presupuesto</h3>
                  <p className="text-gray-900">
                    {formatCurrency((work as any).presupuesto || (work as any).budget)}
                  </p>
                </div>
              ) : null}

              {(work as any).createdAt ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Fecha de creación</h3>
                  <p className="text-gray-900">{formatDate((work as any).createdAt)}</p>
                </div>
              ) : null}

              {(work as any).updatedAt ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Última actualización</h3>
                  <p className="text-gray-900">{formatDate((work as any).updatedAt)}</p>
                </div>
              ) : null}
            </div>

            {work.id && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">ID de la obra</h3>
                <p className="text-gray-600 font-mono text-sm">{work.id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Asignado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Asignado</CardTitle>
              {canManageWorkUsers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignUserModalOpen(true)}
                  disabled={isLoadingAssignedUsers}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Personal
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAssignedUsers ? (
              <p className="text-gray-500">Cargando personal asignado...</p>
            ) : assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {assignedUsers.map((emp: User) => {
                  const nombre = emp.fullName || emp.name || "Sin nombre";
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{nombre}</p>
                        {emp.email && <p className="text-sm text-gray-500">{emp.email}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {emp.role && <Badge variant="info">{emp.role.name}</Badge>}
                        {canManageWorkUsers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToUnassign(emp);
                              setIsUnassignUserModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No hay personal asignado a esta obra</p>
            )}
          </CardContent>
        </Card>

        {/* Proveedores Asignados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proveedores Asignados</CardTitle>
              {canAssignSupplier && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignSupplierModalOpen(true)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Asignar Proveedor
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {assignedSuppliers.length > 0 ? (
              <div className="space-y-2">
                {assignedSuppliers.map((sup: Supplier) => {
                  const nombre = sup.name || sup.nombre || "Sin nombre";
                  const estado = sup.status || sup.estado || "";
                  return (
                    <div key={sup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{nombre}</p>
                        {sup.email && <p className="text-sm text-gray-500">{sup.email}</p>}
                      </div>
                      <Badge variant={estado === "approved" || estado === "aprobado" ? "success" : "warning"}>
                        {estado}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No hay proveedores asignados a esta obra</p>
            )}
          </CardContent>
        </Card>

        {/* Empleados de la Obra (Fase 7) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Empleados de la Obra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/rrhh?work_id=${id}`)}
              >
                Ver todos los empleados
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <p className="text-gray-500">Cargando empleados...</p>
            ) : employees && employees.length > 0 ? (
              <div className="space-y-2">
                {employees.slice(0, 5).map((emp: any) => {
                  const nombre = emp.fullName || emp.name || "Sin nombre";
                  const trade = emp.trade || "-";
                  const dailySalary = emp.daily_salary
                    ? formatCurrency(emp.daily_salary, work.currency)
                    : "-";
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{nombre}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500">Rubro: {trade}</p>
                          {dailySalary !== "-" && (
                            <p className="text-sm text-gray-500">Salario diario: {dailySalary}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/rrhh/${emp.id}`)}
                      >
                        Ver detalle
                      </Button>
                    </div>
                  );
                })}
                {employees.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/rrhh?work_id=${id}`)}
                    >
                      Ver {employees.length - 5} empleados más
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No hay empleados asignados a esta obra</p>
            )}
          </CardContent>
        </Card>

        {/* Contratistas de la Obra (Fase 7) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contratistas de la Obra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/suppliers?type=contractor&work_id=${id}`)}
              >
                Ver todos los contratistas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {contractors.length > 0 ? (
              <div className="space-y-2">
                {contractors.slice(0, 5).map((contractor: Supplier) => {
                  const nombre = contractor.name || contractor.nombre || "Sin nombre";
                  const budget = contractor.contractor_budget
                    ? formatCurrency(contractor.contractor_budget, work.currency)
                    : null;
                  const remaining = contractor.contractor_remaining_balance
                    ? formatCurrency(contractor.contractor_remaining_balance, work.currency)
                    : null;
                  const totalPaid = contractor.contractor_total_paid
                    ? formatCurrency(contractor.contractor_total_paid, work.currency)
                    : null;
                  return (
                    <div key={contractor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{nombre}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {budget && <span>Presupuesto: {budget}</span>}
                          {totalPaid && <span>Pagado: {totalPaid}</span>}
                          {remaining !== null && (
                            <span className={Number(contractor.contractor_remaining_balance || 0) < 0 ? "text-red-600 font-semibold" : ""}>
                              Saldo: {remaining}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/suppliers/${contractor.id}`)}
                      >
                        Ver detalle
                      </Button>
                    </div>
                  );
                })}
                {contractors.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/suppliers?type=contractor&work_id=${id}`)}
                    >
                      Ver {contractors.length - 5} contratistas más
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No hay contratistas asignados a esta obra</p>
            )}
          </CardContent>
        </Card>

        {/* Documentos de Obra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documentos de la Obra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/works/${id}/documents`)}
              >
                Ver todos los documentos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Gestiona la documentación relacionada con esta obra
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/works/${id}/documents`)}
            >
              Ver Documentos
            </Button>
          </CardContent>
        </Card>

        {/* Alertas de la Obra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertas de la Obra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/alerts?workId=${id}`)}
              >
                Ver todas las alertas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Revisa las alertas y notificaciones relacionadas con esta obra
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/alerts?workId=${id}`)}
            >
              Ver Alertas
            </Button>
          </CardContent>
        </Card>

        {/* Contabilidad de la Obra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contabilidad de la Obra</CardTitle>
              {canViewAccounting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/accounting?workId=${id}`)}
                >
                  Ver movimientos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Revisa los movimientos contables relacionados con esta obra
            </p>
            {canViewAccounting && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/accounting?workId=${id}`)}
              >
                Ver Contabilidad
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cajas de la Obra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cajas de la Obra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/cashbox?workId=${id}`)}
              >
                Ver cajas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              Gestiona las cajas de efectivo relacionadas con esta obra
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/cashbox?workId=${id}`)}
            >
              Ver Cajas
            </Button>
          </CardContent>
        </Card>

        {/* Resumen Económico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Resumen Económico</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Totales actualizados automáticamente al validar gastos e ingresos
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Presupuesto */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-gray-700">Presupuesto</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency((work as any).total_budget || (work as any).presupuesto || (work as any).budget, work.currency)}
                </p>
              </div>

              {/* Total Gastos */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-gray-700">Total Gastos</p>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency((work as any).total_expenses, work.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Gastos validados</p>
              </div>

              {/* Total Ingresos */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-700">Total Ingresos</p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency((work as any).total_incomes, work.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ingresos validados</p>
              </div>

              {/* Rentabilidad */}
              <div className={`p-4 rounded-lg border ${
                (((work as any).total_incomes || 0) - ((work as any).total_expenses || 0)) >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`h-5 w-5 ${
                    (((work as any).total_incomes || 0) - ((work as any).total_expenses || 0)) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`} />
                  <p className="text-sm font-medium text-gray-700">Rentabilidad</p>
                </div>
                <p className={`text-2xl font-bold ${
                  (((work as any).total_incomes || 0) - ((work as any).total_expenses || 0)) >= 0
                    ? "text-green-900"
                    : "text-red-900"
                }`}>
                  {formatCurrency(((work as any).total_incomes || 0) - ((work as any).total_expenses || 0), work.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(((work as any).total_incomes || 0) - ((work as any).total_expenses || 0)) >= 0 ? "Ganancia" : "Pérdida"}
                </p>
              </div>
            </div>

            {/* Indicador de progreso económico */}
            {(work as any).total_budget && (work as any).total_budget > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Progreso Económico</p>
                  <p className="text-sm text-gray-500">
                    {(((work as any).total_expenses || 0) / (work as any).total_budget * 100).toFixed(1)}% del presupuesto utilizado
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (((work as any).total_expenses || 0) / (work as any).total_budget) > 1
                        ? "bg-red-600"
                        : (((work as any).total_expenses || 0) / (work as any).total_budget) > 0.8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min((((work as any).total_expenses || 0) / (work as any).total_budget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Presupuesto restante: {formatCurrency(Math.max(0, (work as any).total_budget - ((work as any).total_expenses || 0)), work.currency)}
                </p>
              </div>
            )}

            {/* Progress Indicators */}
            <ProgressIndicators
              physicalProgress={work.physical_progress || 0}
              economicProgress={work.economic_progress || 0}
              financialProgress={work.financial_progress || 0}
              onUpdateProgress={handleUpdateProgress}
              showUpdateButton={isDirection}
            />
          </CardContent>
        </Card>

        {/* Dashboard por Obra */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard de la Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Personal Asignado</p>
                <p className="text-2xl font-bold text-blue-700">{assignedUsers.length}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Proveedores</p>
                <p className="text-2xl font-bold text-yellow-700">{assignedSuppliers.length}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={getStatusVariant(getWorkStatus())} className="mt-2">
                  {getStatusLabel(getWorkStatus())}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          {canUpdate && (
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Obra
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archivar / Eliminar
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Obra"
        size="lg"
      >
        <WorkForm
          initialData={work}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Acción"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Qué acción deseas realizar con la obra <strong>{getWorkName()}</strong>?
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleArchive}
              disabled={isSubmitting}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archivar (marcar como finalizada)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar permanentemente
            </Button>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={confirmClose}
        title="Confirmar Cierre de Obra"
        description={`¿Estás seguro de que quieres cerrar la obra "${getWorkName()}"? Una vez cerrada, no se podrán crear nuevos gastos (excepto para Dirección).`}
        confirmText="Cerrar Obra"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isClosing}
      />

      <ConfirmationModal
        isOpen={isPostClosureModalOpen}
        onClose={() => setIsPostClosureModalOpen(false)}
        onConfirm={confirmAllowPostClosure}
        title="Permitir Gastos Post-Cierre"
        description={`¿Estás seguro de que quieres permitir gastos post-cierre para la obra "${getWorkName()}"? Esta acción solo puede ser realizada por Dirección.`}
        confirmText="Permitir"
        cancelText="Cancelar"
        variant="default"
        isLoading={isAllowingPostClosure}
      />

      <AssignUserModal
        isOpen={isAssignUserModalOpen}
        onClose={() => setIsAssignUserModalOpen(false)}
        onAssign={handleAssignUser}
        assignedUserIds={assignedUsers.map((u) => u.id)}
        isLoading={isAssigningUser}
      />

      <AssignSupplierModal
        isOpen={isAssignSupplierModalOpen}
        onClose={() => setIsAssignSupplierModalOpen(false)}
        onAssign={handleAssignSupplier}
        workId={id!}
        isLoading={isAssigningSupplier}
      />

      <ConfirmationModal
        isOpen={isUnassignUserModalOpen}
        onClose={() => {
          setIsUnassignUserModalOpen(false);
          setUserToUnassign(null);
        }}
        onConfirm={async () => {
          if (!id || !userToUnassign) return;
          setIsUnassigningUser(true);
          try {
            await workUsersApi.unassignUser(id, userToUnassign.id);
            toast.success("Usuario desasignado correctamente");
            setAssignedUsers(assignedUsers.filter((u) => u.id !== userToUnassign.id));
            setIsUnassignUserModalOpen(false);
            setUserToUnassign(null);
          } catch (error: any) {
            toast.error(parseBackendError(error) || "Error al desasignar usuario");
          } finally {
            setIsUnassigningUser(false);
          }
        }}
        title="Confirmar Desasignación"
        description={`¿Estás seguro de que deseas desasignar a ${userToUnassign?.fullName || userToUnassign?.name || "este usuario"} de esta obra?`}
        confirmText="Desasignar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isUnassigningUser}
      />
    </>
  );
}

export default function WorkDetailPage() {
  return (
    <ProtectedRoute>
      <WorkDetailContent />
    </ProtectedRoute>
  );
}

