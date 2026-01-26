"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ContractorCertificationForm } from "./ContractorCertificationForm";
import {
  ContractorCertification,
  CreateContractorCertificationData,
  UpdateContractorCertificationData,
} from "@/lib/types/contractorCertification";
import { contractorCertificationApi } from "@/hooks/api/contractorCertifications";
import { expenseApi } from "@/hooks/api/expenses";
import { Contract } from "@/lib/types/contract";
import { Plus, Pencil, Trash2, ReceiptText } from "lucide-react";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function ContractorCertificationList({
  supplierId,
  certifications,
  contracts,
  onRefresh,
}: {
  supplierId: string;
  certifications: ContractorCertification[];
  contracts?: Contract[];
  onRefresh: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContractorCertification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ordered = useMemo(() => {
    return [...(certifications || [])].sort((a, b) =>
      String(b.week_start_date).localeCompare(String(a.week_start_date)),
    );
  }, [certifications]);

  const handleSubmit = async (
    data: CreateContractorCertificationData | UpdateContractorCertificationData,
  ) => {
    setIsSubmitting(true);
    try {
      if (editing?.id) {
        await contractorCertificationApi.update(editing.id, data as UpdateContractorCertificationData);
        toast.success("Certificación actualizada");
      } else {
        await contractorCertificationApi.create(data as CreateContractorCertificationData);
        toast.success("Certificación creada");
      }
      await onRefresh();
      setIsModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar certificación";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await contractorCertificationApi.delete(id);
      toast.success("Certificación eliminada");
      await onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar certificación";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (certificationId: string) => {
    setIsSubmitting(true);
    try {
      // Endpoint manual: POST /expenses/from-certification/:certification_id
      await expenseApi.createFromCertification(certificationId);
      toast.success("Gasto creado desde certificación");
      await onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear gasto";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">Certificaciones</div>
          <div className="text-xs text-gray-600">Historial semanal del contratista</div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {ordered.length === 0 ? (
        <div className="text-sm text-gray-600">No hay certificaciones aún.</div>
      ) : (
        <div className="space-y-2">
          {ordered.map((c) => {
            const hasExpense = Boolean(c.expense_id);
            return (
              <div
                key={c.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100 rounded-lg p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900">
                      {String(c.week_start_date).slice(0, 10)}
                    </div>
                    {hasExpense ? <Badge variant="success">Con gasto</Badge> : <Badge variant="warning">Sin gasto</Badge>}
                  </div>
                  <div className="text-sm text-gray-700">{formatMoney(Number(c.amount ?? 0))}</div>
                  {c.description ? (
                    <div className="text-xs text-gray-600 truncate">{c.description}</div>
                  ) : null}
                  {hasExpense ? (
                    <div className="text-xs text-gray-600">
                      Gasto:{" "}
                      <Link className="underline" href={`/expenses/${c.expense_id}`}>
                        {c.expense_id}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  {!hasExpense && (
                    <Button
                      variant="outline"
                      onClick={() => handleCreateExpense(c.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <ReceiptText className="h-4 w-4" />
                      Crear Gasto
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(c);
                      setIsModalOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(c.id)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                    style={{ borderColor: "rgba(255, 59, 48, 1)", color: "rgba(255, 59, 48, 1)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        title={editing?.id ? "Editar certificación" : "Nueva certificación"}
        size="lg"
      >
        <ContractorCertificationForm
          supplierId={supplierId}
          contracts={contracts}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditing(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

