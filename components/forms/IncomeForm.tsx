"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { validatePositiveNumber, validateRequired } from "@/lib/validations";
import { IncomeType, PaymentMethod } from "@/lib/types/income";
import { Currency } from "@/lib/types/work";
import { useWorks } from "@/hooks/api/works";

interface IncomeFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IncomeForm({ initialData, onSubmit, onCancel, isLoading }: IncomeFormProps) {
  const { works } = useWorks();
  
  // Función helper para obtener datos iniciales del formulario
  // Asegura que todos los valores estén siempre definidos para mantener inputs controlados
  const getInitialFormData = (data?: any) => {
    const defaults = {
      work_id: "",
      amount: 0,
      currency: Currency.ARS,
      type: IncomeType.ADVANCE,
      date: new Date().toISOString().split("T")[0],
      payment_method: "",
      document_number: "",
      file_url: "",
      observations: "",
    };
    
    if (!data) return defaults;
    
    // Filtrar undefined/null de initialData para evitar valores no controlados
    const sanitizedData: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value !== undefined && value !== null) {
        sanitizedData[key] = value;
      }
    });
    
    return {
      ...defaults,
      ...sanitizedData,
      // Asegurar valores específicos siempre definidos
      work_id: sanitizedData.work_id || sanitizedData.workId || "",
      amount: sanitizedData.amount !== undefined && sanitizedData.amount !== null 
        ? Number(sanitizedData.amount) 
        : 0,
      currency: sanitizedData.currency || Currency.ARS,
      type: sanitizedData.type || IncomeType.ADVANCE,
      date: sanitizedData.date 
        ? (typeof sanitizedData.date === 'string' 
          ? sanitizedData.date.split("T")[0] 
          : new Date(sanitizedData.date).toISOString().split("T")[0]) 
        : new Date().toISOString().split("T")[0],
      payment_method: sanitizedData.payment_method ?? "",
      document_number: sanitizedData.document_number ?? "",
      file_url: sanitizedData.file_url ?? "",
      observations: sanitizedData.observations ?? "",
    };
  };
  
  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Usar la función helper para asegurar valores siempre definidos
    const newFormData = getInitialFormData(initialData);
    setFormData(newFormData);
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.work_id) {
      newErrors.work_id = "La obra es obligatoria";
    }
    
    const amountValidation = validatePositiveNumber(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error || "El monto debe ser mayor que 0";
    }
    
    if (!formData.currency) {
      newErrors.currency = "La moneda es obligatoria";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Determinar si estamos editando (si hay initialData con id)
    const isEditing = !!initialData?.id;
    e.preventDefault();
    if (!validate()) return;
    
    // Mapear datos al formato del backend
    const submitData: any = {
      type: formData.type,
      amount: Number(formData.amount), // Asegurar que amount sea un número
      date: formData.date,
    };
    
    // Solo incluir work_id y currency si estamos creando (no editando)
    // Nota: work_id y currency no se pueden actualizar según el backend UpdateIncomeDto
    if (!isEditing) {
      submitData.work_id = formData.work_id;
      submitData.currency = formData.currency;
    }
    
    // Campos opcionales - siempre incluir para asegurar que se actualicen
    submitData.payment_method = formData.payment_method || null;
    submitData.document_number = formData.document_number || null;
    submitData.file_url = formData.file_url || null;
    submitData.observations = formData.observations || null;
    
    // Incluir is_validated si está presente en initialData (solo para edición)
    if (isEditing && initialData?.is_validated !== undefined) {
      submitData.is_validated = initialData.is_validated;
    }
    
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Obra"
        value={formData.work_id || ""}
        onChange={(e) => {
          setFormData({ ...formData, work_id: e.target.value });
          if (errors.work_id) setErrors({ ...errors, work_id: "" });
        }}
        onBlur={() => {
          setTouched({ ...touched, work_id: true });
          if (!formData.work_id) {
            setErrors({ ...errors, work_id: "La obra es obligatoria" });
          } else {
            setErrors({ ...errors, work_id: "" });
          }
        }}
        error={errors.work_id}
        required
        disabled={!!initialData?.id} // Deshabilitar en modo edición (no se puede cambiar)
      >
        <option value="">Seleccionar obra</option>
        {works?.map((work: any) => (
          <option key={work.id} value={work.id}>
            {work.name || work.nombre || `Obra ${work.id.slice(0, 8)}`}
          </option>
        ))}
      </Select>
      <Select
        label="Tipo de ingreso"
        value={formData.type || IncomeType.ADVANCE}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as IncomeType })}
        required
      >
        <option value={IncomeType.ADVANCE}>Anticipo</option>
        <option value={IncomeType.CERTIFICATION}>Certificación</option>
        <option value={IncomeType.FINAL_PAYMENT}>Pago Final</option>
        <option value={IncomeType.ADJUSTMENT}>Ajuste</option>
        <option value={IncomeType.REIMBURSEMENT}>Reembolso</option>
        <option value={IncomeType.OTHER}>Otro</option>
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount ?? ""}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            setFormData({ ...formData, amount: value });
            if (errors.amount) setErrors({ ...errors, amount: "" });
          }}
          onBlur={() => {
            setTouched({ ...touched, amount: true });
            const amountValidation = validatePositiveNumber(formData.amount);
            if (!amountValidation.isValid) {
              setErrors({ ...errors, amount: amountValidation.error || "El monto debe ser mayor que 0" });
            } else {
              setErrors({ ...errors, amount: "" });
            }
          }}
          error={errors.amount}
          required
        />
        <Select
          label="Moneda"
          value={formData.currency || Currency.ARS}
          onChange={(e) => {
            setFormData({ ...formData, currency: e.target.value as Currency });
            if (errors.currency) setErrors({ ...errors, currency: "" });
          }}
          onBlur={() => {
            setTouched({ ...touched, currency: true });
            if (!formData.currency) {
              setErrors({ ...errors, currency: "La moneda es obligatoria" });
            } else {
              setErrors({ ...errors, currency: "" });
            }
          }}
          error={errors.currency}
          required
          disabled={!!initialData?.id} // Deshabilitar en modo edición (no se puede cambiar)
        >
          <option value={Currency.ARS}>ARS (Pesos Argentinos)</option>
          <option value={Currency.USD}>USD (Dólares)</option>
        </Select>
      </div>
      <Input
        label="Fecha"
        type="date"
        value={formData.date || new Date().toISOString().split("T")[0]}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />
      <Select
        label="Método de pago"
        value={formData.payment_method || ""}
        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value || undefined })}
      >
        <option value="">Seleccionar método (opcional)</option>
        <option value={PaymentMethod.TRANSFER}>Transferencia</option>
        <option value={PaymentMethod.CHECK}>Cheque</option>
        <option value={PaymentMethod.CASH}>Efectivo</option>
        <option value={PaymentMethod.PAYMENT_LINK}>Link de pago</option>
      </Select>
      <Input
        label="Número de documento"
        value={formData.document_number || ""}
        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
      />
      <Input
        label="URL del archivo"
        type="url"
        value={formData.file_url || ""}
        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
      />
      <Textarea
        label="Observaciones"
        value={formData.observations || ""}
        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
        rows={4}
      />
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

