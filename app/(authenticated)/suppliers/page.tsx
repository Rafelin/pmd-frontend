"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSuppliers, supplierApi } from "@/hooks/api/suppliers";
import { LoadingState } from "@/components/ui/LoadingState";
import { SuppliersList } from "@/components/suppliers/SuppliersList";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SupplierForm } from "@/components/forms/SupplierForm";
import { useToast } from "@/components/ui/Toast";
import { Plus } from "lucide-react";
import { Supplier, CreateSupplierData, UpdateSupplierData, SupplierType } from "@/lib/types/supplier";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";

function SuppliersContent() {
  const [contractorsOnly, setContractorsOnly] = useState(false);
  const { suppliers, isLoading, error, mutate } = useSuppliers({
    type: contractorsOnly ? SupplierType.CONTRACTOR : undefined,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "provisional" | "approved" | "blocked" | "rejected">("all");
  const toast = useToast();
  
  // Verificar permisos
  const canCreate = useCan("suppliers.create");

  // Filtrar proveedores según el filtro seleccionado
  const filteredSuppliers = suppliers?.filter((supplier: Supplier) => {
    if (filter === "all") return true;
    const status = (supplier.estado || supplier.status || "pendiente").toLowerCase();
    if (filter === "provisional") {
      return status === "provisional" || status === "pending" || status === "pendiente";
    }
    if (filter === "approved") {
      return status === "approved" || status === "active";
    }
    if (filter === "blocked") {
      return status === "blocked" || status === "bloqueado";
    }
    if (filter === "rejected") {
      return status === "rejected" || status === "inactive";
    }
    return true;
  }) || [];

  const handleCreate = async (data: CreateSupplierData | UpdateSupplierData) => {
    setIsSubmitting(true);
    try {
      // Asegurar que name esté presente para crear
      if (!data.name) {
        toast.error("El nombre es requerido");
        setIsSubmitting(false);
        return;
      }
      await supplierApi.create(data as CreateSupplierData);
      await mutate();
      toast.success("Proveedor creado correctamente");
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al crear proveedor:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando proveedores…" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error al cargar los proveedores: {error.message || "Error desconocido"}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <BotonVolver />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Proveedores</h1>
              <p className="text-gray-600">Listado de proveedores registrados en PMD</p>
            </div>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setContractorsOnly((v) => !v)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              contractorsOnly
                ? "bg-pmd-darkBlue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {contractorsOnly ? "Solo contratistas" : "Todos los proveedores"}
          </button>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "provisional", "approved", "blocked", "rejected"] as const).map((f) => {
            const filterLabels: Record<typeof f, string> = {
              all: "Todos",
              provisional: "Provisionales",
              approved: "Aprobados",
              blocked: "Bloqueados",
              rejected: "Rechazados",
            };
            const filterCounts: Record<typeof f, number> = {
              all: suppliers?.length || 0,
              provisional: suppliers?.filter((s: Supplier) => {
                const status = (s.estado || s.status || "pendiente").toLowerCase();
                return status === "provisional" || status === "pending" || status === "pendiente";
              }).length || 0,
              approved: suppliers?.filter((s: Supplier) => {
                const status = (s.estado || s.status || "pendiente").toLowerCase();
                return status === "approved" || status === "active";
              }).length || 0,
              blocked: suppliers?.filter((s: Supplier) => {
                const status = (s.estado || s.status || "pendiente").toLowerCase();
                return status === "blocked" || status === "bloqueado";
              }).length || 0,
              rejected: suppliers?.filter((s: Supplier) => {
                const status = (s.estado || s.status || "pendiente").toLowerCase();
                return status === "rejected" || status === "inactive";
              }).length || 0,
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize flex items-center gap-2 ${
                  filter === f
                    ? "bg-pmd-darkBlue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filterLabels[f]}
                {filterCounts[f] > 0 && (
                  <Badge variant={filter === f ? "default" : "info"} className="text-[11px] px-[6px] py-[2px]">
                    {filterCounts[f]}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <SuppliersList suppliers={filteredSuppliers} onRefresh={mutate} />

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nuevo Proveedor"
          size="lg"
        >
          <SupplierForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </>
  );
}

export default function SuppliersPage() {
  return (
    <ProtectedRoute>
      <SuppliersContent />
    </ProtectedRoute>
  );
}
