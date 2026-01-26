"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Contract } from "@/lib/types/contract";
import {
  CreateContractorCertificationData,
  ContractorCertification,
  UpdateContractorCertificationData,
} from "@/lib/types/contractorCertification";

type Props = {
  supplierId: string;
  contracts?: Contract[];
  initial?: ContractorCertification | null;
  onSubmit: (
    data: CreateContractorCertificationData | UpdateContractorCertificationData,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ContractorCertificationForm({
  supplierId,
  contracts,
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: Props) {
  const [week_start_date, setWeekStartDate] = useState(
    initial?.week_start_date ? String(initial.week_start_date).slice(0, 10) : "",
  );
  const [amount, setAmount] = useState(
    initial?.amount !== undefined && initial?.amount !== null ? String(initial.amount) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contract_id, setContractId] = useState<string>(
    (initial?.contract_id ?? "") || "",
  );

  const availableContracts = useMemo(() => {
    return (contracts || []).filter((c) => c?.supplier_id === supplierId);
  }, [contracts, supplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!week_start_date) return;
    if (Number.isNaN(n) || n < 0) return;

    if (initial?.id) {
      const payload: UpdateContractorCertificationData = {
        week_start_date,
        amount: n,
        description: description ? String(description) : null,
        contract_id: contract_id ? contract_id : null,
      };
      await onSubmit(payload);
      return;
    }

    const payload: CreateContractorCertificationData = {
      supplier_id: supplierId,
      week_start_date,
      amount: n,
      description: description ? String(description) : undefined,
      contract_id: contract_id ? contract_id : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Semana (fecha de inicio)" required>
          <Input
            type="date"
            value={week_start_date}
            onChange={(e) => setWeekStartDate(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Monto certificado" required>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </FormField>
      </div>

      <FormField label="Contrato (opcional)">
        <Select value={contract_id} onChange={(e) => setContractId(e.target.value)}>
          <option value="">Seleccionar contrato</option>
          {availableContracts.map((c) => (
            <option key={c.id} value={c.id}>
              Obra {c.work_id} — {c.currency} — {Number(c.amount_total).toFixed(2)}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Descripción">
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </FormField>

      <div style={{ display: "flex", gap: "var(--space-sm)", paddingTop: "var(--space-md)" }}>
        <Button type="submit" variant="primary" disabled={isLoading} style={{ flex: 1 }}>
          {isLoading ? "Guardando..." : initial?.id ? "Actualizar" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

