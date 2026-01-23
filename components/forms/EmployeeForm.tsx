"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeTrade } from "@/lib/types/employee";
import { useWorks } from "@/hooks/api/works";
import { validateEmail, validateRequired } from "@/lib/validations";

interface EmployeeFormProps {
  initialData?: Employee | null;
  onSubmit: (data: CreateEmployeeData | UpdateEmployeeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
  const { works } = useWorks();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    daily_salary: "",
    trade: "",
    work_id: "",
    area: "",
    position: "",
    role: "",
    subrole: "",
    hireDate: "",
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || initialData.name || initialData.nombre || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        daily_salary: initialData.daily_salary?.toString() || "",
        trade: initialData.trade || "",
        work_id: initialData.work_id || initialData.workId || initialData.obraId || "",
        area: initialData.area || "",
        position: initialData.position || initialData.puesto || "",
        role: initialData.role || "",
        subrole: initialData.subrole || "",
        hireDate: initialData.hireDate || "",
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const fullNameValidation = validateRequired(formData.fullName);
    if (!fullNameValidation.isValid) {
      newErrors.fullName = fullNameValidation.error || "El nombre completo es obligatorio";
    }
    
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || "El email no es válido";
      }
    }

    if (formData.daily_salary) {
      const salary = parseFloat(formData.daily_salary);
      if (isNaN(salary) || salary < 0) {
        newErrors.daily_salary = "El salario diario debe ser un número mayor o igual a 0";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const payload: CreateEmployeeData | UpdateEmployeeData = {
      fullName: formData.fullName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      daily_salary: formData.daily_salary ? parseFloat(formData.daily_salary) : undefined,
      trade: formData.trade ? (formData.trade as EmployeeTrade) : undefined,
      work_id: formData.work_id || undefined,
      area: formData.area || undefined,
      position: formData.position || undefined,
      role: formData.role || undefined,
      subrole: formData.subrole || undefined,
      hireDate: formData.hireDate || undefined,
      isActive: formData.isActive,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error en EmployeeForm:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Nombre completo - OBLIGATORIO */}
      <FormField label="Nombre Completo" required error={errors.fullName}>
        <Input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Ej: Juan Pérez"
          required
        />
      </FormField>

      {/* Email y Teléfono */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Email" error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="juan@example.com"
          />
        </FormField>
        <FormField label="Teléfono" error={errors.phone}>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+541112345678"
          />
        </FormField>
      </div>

      {/* Salario diario y Rubro */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Salario Diario" error={errors.daily_salary}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.daily_salary}
            onChange={(e) => setFormData({ ...formData, daily_salary: e.target.value })}
            placeholder="15000.00"
          />
        </FormField>
        <FormField label="Rubro / Trade">
          <Select
            value={formData.trade}
            onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
          >
            <option value="">Seleccionar rubro</option>
            <option value={EmployeeTrade.ALBANILERIA}>Albañilería</option>
            <option value={EmployeeTrade.STEEL_FRAMING}>Steel Framing</option>
            <option value={EmployeeTrade.PINTURA}>Pintura</option>
            <option value={EmployeeTrade.PLOMERIA}>Plomería</option>
            <option value={EmployeeTrade.ELECTRICIDAD}>Electricidad</option>
          </Select>
        </FormField>
      </div>

      {/* Obra */}
      <FormField label="Obra">
        <Select
          value={formData.work_id}
          onChange={(e) => setFormData({ ...formData, work_id: e.target.value })}
        >
          <option value="">Seleccionar obra</option>
          {works?.map((work) => (
            <option key={work.id} value={work.id}>
              {work.name}
            </option>
          ))}
        </Select>
      </FormField>

      {/* Área y Puesto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Área">
          <Input
            type="text"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="Ej: Construcción"
          />
        </FormField>
        <FormField label="Puesto">
          <Input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Ej: Oficial"
          />
        </FormField>
      </div>

      {/* Rol y Subrol */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Rol (Cargo)">
          <Input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Ej: Operario"
          />
        </FormField>
        <FormField label="Subrol">
          <Input
            type="text"
            value={formData.subrole}
            onChange={(e) => setFormData({ ...formData, subrole: e.target.value })}
            placeholder="Ej: Ayudante"
          />
        </FormField>
      </div>

      {/* Fecha de contratación */}
      <FormField label="Fecha de Contratación">
        <Input
          type="date"
          value={formData.hireDate}
          onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
        />
      </FormField>

      {/* Estado activo */}
      <FormField label="Estado">
        <Select
          value={formData.isActive ? "true" : "false"}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </Select>
      </FormField>

      {/* Botones */}
      <div style={{ display: "flex", gap: "var(--space-sm)", paddingTop: "var(--space-md)" }}>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear Empleado"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
