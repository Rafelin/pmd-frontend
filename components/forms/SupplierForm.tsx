"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { mapCreateSupplierPayload } from "@/lib/payload-mappers";
import { Supplier, CreateSupplierData, UpdateSupplierData, SupplierType, FiscalCondition } from "@/lib/types/supplier";
import { validateCuit, formatCuit, validateEmail, validateRequired } from "@/lib/validations";

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSubmit: (data: CreateSupplierData | UpdateSupplierData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SupplierForm({ initialData, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    name: "",
    cuit: "",
    email: "",
    telefono: "",
    phone: "",
    direccion: "",
    address: "",
    contacto: "",
    contactName: "",
    existstatus: "provisional", // Backend enum: ["provisional", "approved", "blocked", "rejected"]
    type: "",
    fiscal_condition: "",
    notes: "",
    notas: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      // Normalizar datos del backend (puede venir como name o nombre)
      setFormData({
        nombre: (initialData as any).nombre || initialData.name || "",
        name: initialData.name || (initialData as any).nombre || "",
        cuit: initialData.cuit || (initialData as any).CUIT || "",
        email: initialData.email || "",
        telefono: (initialData as any).telefono || initialData.phone || "",
        phone: initialData.phone || (initialData as any).telefono || "",
        direccion: (initialData as any).direccion || initialData.address || "",
        address: initialData.address || (initialData as any).direccion || "",
        contacto: initialData.contact || (initialData as any).contacto || (initialData as any).contactName || "",
        contactName: initialData.contact || (initialData as any).contactName || (initialData as any).contacto || "",
        existstatus: (initialData as any).existstatus || (initialData as any).status || (initialData as any).estado || "provisional",
        type: initialData.type || "",
        fiscal_condition: initialData.fiscal_condition || "",
        notes: (initialData as any).notes || (initialData as any).notas || "",
        notas: (initialData as any).notas || (initialData as any).notes || "",
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validación obligatoria: nombre
    const nombre = formData.nombre || formData.name;
    const nombreValidation = validateRequired(nombre);
    if (!nombreValidation.isValid) {
      newErrors.nombre = nombreValidation.error || "El nombre o razón social es obligatorio";
    }
    
    // Validar email si está presente
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || "El email no es válido";
      }
    }
    
    // Validar CUIT si está presente
    if (formData.cuit) {
      const cuitValidation = validateCuit(formData.cuit);
      if (!cuitValidation.isValid) {
        newErrors.cuit = cuitValidation.error || "El CUIT no es válido";
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

    // Usar función de mapeo para alinear EXACTAMENTE con el DTO del backend
    const payload = mapCreateSupplierPayload(formData);

    try {
      await onSubmit(payload as any);
    } catch (error) {
      // El error ya se maneja en el componente padre
      if (process.env.NODE_ENV === "development") {
        console.error("Error en SupplierForm:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Nombre o Razón Social - OBLIGATORIO */}
      <FormField label="Nombre o Razón Social" required error={errors.nombre}>
        <Input
          type="text"
          value={formData.nombre || formData.name}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value, name: e.target.value })}
          placeholder="Ej: Proveedora S.A."
          required
        />
      </FormField>

      {/* CUIT y Email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="CUIT" error={errors.cuit}>
          <Input
            type="text"
            value={formData.cuit}
            onChange={(e) => {
              // Permitir solo números y guiones, formatear automáticamente
              const value = e.target.value.replace(/\D/g, "");
              const formatted = formatCuit(value);
              setFormData({ ...formData, cuit: formatted });
              // Limpiar error si el campo cambia
              if (errors.cuit) {
                setErrors({ ...errors, cuit: "" });
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, cuit: true });
              if (formData.cuit) {
                const cuitValidation = validateCuit(formData.cuit);
                if (!cuitValidation.isValid) {
                  setErrors({ ...errors, cuit: cuitValidation.error || "El CUIT no es válido" });
                } else {
                  setErrors({ ...errors, cuit: "" });
                }
              }
            }}
            placeholder="20-12345678-9"
            maxLength={13}
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              // Limpiar error si el campo cambia
              if (errors.email) {
                setErrors({ ...errors, email: "" });
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, email: true });
              if (formData.email) {
                const emailValidation = validateEmail(formData.email);
                if (!emailValidation.isValid) {
                  setErrors({ ...errors, email: emailValidation.error || "El email no es válido" });
                } else {
                  setErrors({ ...errors, email: "" });
                }
              }
            }}
            placeholder="proveedor@ejemplo.com"
          />
        </FormField>
      </div>

      {/* Teléfono y Contacto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Teléfono">
          <Input
            type="tel"
            value={formData.telefono || formData.phone}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value, phone: e.target.value })}
            placeholder="+54 11 1234-5678"
          />
        </FormField>
        <FormField label="Contacto">
          <Input
            type="text"
            value={formData.contacto || formData.contactName}
            onChange={(e) => setFormData({ ...formData, contacto: e.target.value, contactName: e.target.value })}
            placeholder="Nombre del contacto"
          />
        </FormField>
      </div>

      {/* Dirección */}
      <FormField label="Dirección">
        <Textarea
          value={formData.direccion || formData.address}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value, address: e.target.value })}
          rows={3}
          placeholder="Dirección completa del proveedor"
        />
      </FormField>

      {/* Estado y Tipo de Proveedor */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <FormField label="Estado" required>
          <Select
            value={formData.existstatus || "provisional"}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                existstatus: e.target.value
              });
            }}
          >
            <option value="provisional">Provisional</option>
            <option value="approved">Aprobado</option>
            <option value="blocked">Bloqueado</option>
            <option value="rejected">Rechazado</option>
          </Select>
        </FormField>
        <FormField label="Tipo de Proveedor">
          <Select
            value={formData.type || ""}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                type: e.target.value
              });
            }}
          >
            <option value="">Seleccionar tipo</option>
            <option value={SupplierType.LABOR}>Mano de obra</option>
            <option value={SupplierType.MATERIALS}>Materiales</option>
            <option value={SupplierType.CONTRACTOR}>Contratista</option>
            <option value={SupplierType.SERVICES}>Servicios</option>
            <option value={SupplierType.LOGISTICS}>Logística</option>
            <option value={SupplierType.OTHER}>Otro</option>
          </Select>
        </FormField>
      </div>

      {/* Condición Fiscal */}
      <FormField label="Condición Fiscal">
        <Select
          value={formData.fiscal_condition || ""}
          onChange={(e) => {
            setFormData({ 
              ...formData, 
              fiscal_condition: e.target.value
            });
          }}
        >
          <option value="">Seleccionar condición</option>
          <option value={FiscalCondition.RI}>Responsable Inscripto</option>
          <option value={FiscalCondition.MONOTRIBUTISTA}>Monotributista</option>
          <option value={FiscalCondition.EXEMPT}>Exento</option>
          <option value={FiscalCondition.OTHER}>Otro</option>
        </Select>
      </FormField>

      {/* Notas */}
      <FormField label="Notas">
        <Textarea
          value={formData.notes || formData.notas}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value, notas: e.target.value })}
          rows={3}
          placeholder="Notas adicionales sobre el proveedor"
        />
      </FormField>

      {/* Botones */}
      <div style={{ display: "flex", gap: "var(--space-sm)", paddingTop: "var(--space-md)" }}>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear Proveedor"}
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
