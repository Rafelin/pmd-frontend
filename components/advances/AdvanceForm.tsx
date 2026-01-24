"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { validateRequired } from "@/lib/validations";
import { useEmployees } from "@/hooks/api/employees";
import type {
  CreateEmployeeAdvanceData,
  EmployeeAdvance,
  UpdateEmployeeAdvanceData,
} from "@/lib/types/employee-advance";

interface AdvanceFormProps {
  initialData?: EmployeeAdvance | null;
  onSubmit: (data: CreateEmployeeAdvanceData | UpdateEmployeeAdvanceData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AdvanceForm({ initialData, onSubmit, onCancel, isLoading }: AdvanceFormProps) {
  const { employees } = useEmployees();
  const [formData, setFormData] = useState({
    employee_id: "",
    amount: "",
    date: "",
    week_start_date: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setFormData({
      employee_id: initialData.employee_id,
      amount: String(initialData.amount ?? ""),
      date: initialData.date ?? "",
      week_start_date: initialData.week_start_date ?? "",
      description: initialData.description ?? "",
    });
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const employeeValidation = validateRequired(formData.employee_id);
    if (!employeeValidation.isValid) newErrors.employee_id = "El empleado es obligatorio";

    const amountValidation = validateRequired(formData.amount);
    if (!amountValidation.isValid) newErrors.amount = "El monto es obligatorio";
    const amountNumber = Number(formData.amount);
    if (Number.isNaN(amountNumber) || amountNumber < 0) newErrors.amount = "El monto debe ser ≥ 0";

    const dateValidation = validateRequired(formData.date);
    if (!dateValidation.isValid) newErrors.date = "La fecha es obligatoria";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateEmployeeAdvanceData | UpdateEmployeeAdvanceData = {
      employee_id: formData.employee_id,
      amount: Number(formData.amount),
      date: formData.date,
      week_start_date: formData.week_start_date || undefined,
      description: formData.description || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
    >
      <FormField label="Empleado" required error={errors.employee_id}>
        <Select
          value={formData.employee_id}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          required
        >
          <option value="">Seleccionar empleado</option>
          {(employees || []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </Select>
      </FormField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Monto" required error={errors.amount}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="5000.00"
            required
          />
        </FormField>

        <FormField label="Fecha" required error={errors.date}>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </FormField>
      </div>

      <FormField label="Semana de descuento (week_start_date)">
        <Input
          type="date"
          value={formData.week_start_date}
          onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
          placeholder="YYYY-MM-DD"
        />
      </FormField>

      <FormField label="Descripción">
        <Input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Opcional"
        />
      </FormField>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {initialData ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

