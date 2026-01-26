"use client";

import { useState, useEffect } from "react";
import { FormField, InputField, SelectField, TextareaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useWorks } from "@/hooks/api/works";
import { useUsers } from "@/hooks/api/users";
import { useWorkDocuments } from "@/hooks/api/workDocuments";
import { useSuppliers } from "@/hooks/api/suppliers";
import { normalizeId } from "@/lib/normalizeId";
import { AlertType, AlertSeverity } from "@/lib/types/alert";

interface AlertFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  defaultWorkId?: string;
  defaultPersonId?: string;
  defaultDocumentId?: string;
}

// Backend AlertType enum - debe coincidir EXACTAMENTE con el backend
// pmd-backend/src/common/enums/alert-type.enum.ts
const ALERT_TYPE_OPTIONS: Array<{ value: AlertType; label: string }> = [
  { value: AlertType.EXPIRED_DOCUMENTATION, label: "Documentación vencida" },
  { value: AlertType.CASHBOX_DIFFERENCE, label: "Diferencia de caja" },
  { value: AlertType.CONTRACT_ZERO_BALANCE, label: "Contrato sin saldo" },
  { value: AlertType.CONTRACT_INSUFFICIENT_BALANCE, label: "Contrato con saldo insuficiente" },
  { value: AlertType.CONTRACTOR_BUDGET_LOW, label: "Presupuesto de contratista bajo" },
  { value: AlertType.DUPLICATE_INVOICE, label: "Factura duplicada" },
  { value: AlertType.OVERDUE_STAGE, label: "Etapa vencida" },
  { value: AlertType.OBSERVED_EXPENSE, label: "Gasto observado" },
  { value: AlertType.REJECTED_EXPENSE, label: "Gasto rechazado" },
  { value: AlertType.ANNULLED_EXPENSE, label: "Gasto anulado" },
  { value: AlertType.POST_CLOSURE_EXPENSE, label: "Gasto post cierre" },
  { value: AlertType.MISSING_VALIDATION, label: "Validación pendiente" },
  { value: AlertType.PENDING_INCOME_CONFIRMATION, label: "Confirmación de ingreso pendiente" },
];

// Backend severity enum: "info" | "warning" | "critical" (optional)
const SEVERITY_OPTIONS: Array<{ value: AlertSeverity; label: string }> = [
  { value: AlertSeverity.INFO, label: "Info" },
  { value: AlertSeverity.WARNING, label: "Advertencia" },
  { value: AlertSeverity.CRITICAL, label: "Crítico" },
];

export function AlertForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  defaultWorkId,
  defaultPersonId,
  defaultDocumentId,
}: AlertFormProps) {
  const { works } = useWorks();
  const { users } = useUsers();
  const { documents } = useWorkDocuments();
  const { suppliers } = useSuppliers();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  // Default: usar un AlertType válido del backend
  const [type, setType] = useState<AlertType>(AlertType.MISSING_VALIDATION);
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.INFO);
  const [workId, setWorkId] = useState(normalizeId(defaultWorkId));
  const [supplierId, setSupplierId] = useState("");
  const [userId, setUserId] = useState(normalizeId(defaultPersonId));
  const [documentId, setDocumentId] = useState(normalizeId(defaultDocumentId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setMessage(initialData.message || initialData.description || "");
      // Normalizar type/severity y fallback a defaults válidos
      const nextType = (initialData.type || initialData.category) as AlertType | undefined;
      setType(nextType && Object.values(AlertType).includes(nextType) ? nextType : AlertType.MISSING_VALIDATION);

      const nextSeverity = initialData.severity as AlertSeverity | undefined;
      setSeverity(nextSeverity && Object.values(AlertSeverity).includes(nextSeverity) ? nextSeverity : AlertSeverity.INFO);
      setWorkId(normalizeId(initialData.work_id || initialData.workId || defaultWorkId));
      setSupplierId(normalizeId(initialData.supplier_id || initialData.supplierId));
      setUserId(normalizeId(initialData.user_id || initialData.userId || defaultPersonId));
      setDocumentId(normalizeId(initialData.document_id || initialData.documentId || defaultDocumentId));
    } else {
      if (defaultWorkId) setWorkId(normalizeId(defaultWorkId));
      if (defaultPersonId) setUserId(normalizeId(defaultPersonId));
      if (defaultDocumentId) setDocumentId(normalizeId(defaultDocumentId));
    }
  }, [initialData, defaultWorkId, defaultPersonId, defaultDocumentId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title || title.trim() === "") {
      newErrors.title = "El título es obligatorio";
    }

    if (title.length > 255) {
      newErrors.title = "El título no puede exceder 255 caracteres";
    }

    if (!message || message.trim() === "") {
      newErrors.message = "El mensaje es obligatorio";
    }

    if (!type || type.trim() === "") {
      newErrors.type = "El tipo es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Construir payload exacto según CreateAlertDto del backend
    const payload: any = {
      type: type, // AlertType enum - required
      title: title.trim(), // required, max 255
      message: message.trim(), // required, string
    };

    // Campos opcionales
    if (severity) payload.severity = severity;
    if (userId) payload.user_id = userId;
    if (workId) payload.work_id = workId;
    if (supplierId) payload.supplier_id = supplierId;
    if (documentId) payload.document_id = documentId;

    await onSubmit(payload);
  };

  const workOptions = [
    { value: "", label: "Seleccionar obra" },
    ...(works?.map((work: any) => ({
      value: work.id,
      label: work.nombre || work.name || work.title || `Obra ${work.id.slice(0, 8)}`,
    })) || []),
  ];

  const userOptions = [
    { value: "", label: "Seleccionar empleado" },
    ...(users?.map((user: any) => ({
      value: user.id,
      label: user.fullName || user.name || user.nombre || `Usuario ${user.id.slice(0, 8)}`,
    })) || []),
  ];

  const documentOptions = [
    { value: "", label: "Seleccionar documento" },
    ...(documents?.map((doc: any) => ({
      value: doc.id,
      label: doc.name || doc.nombre || `Documento ${doc.id.slice(0, 8)}`,
    })) || []),
  ];

  const supplierOptions = [
    { value: "", label: "Seleccionar proveedor" },
    ...(suppliers?.map((sup: any) => ({
      value: sup.id,
      label: sup.nombre || sup.name || `Proveedor ${sup.id.slice(0, 8)}`,
    })) || []),
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <InputField
        label="Título"
        type="text"
        value={title}
        onChange={(e) => {
          const value = e.target.value;
          if (value.length <= 255) {
            setTitle(value);
          }
        }}
        error={errors.title}
        required
        maxLength={255}
        placeholder="Título de la alerta (máximo 255 caracteres)"
      />

      <TextareaField
        label="Mensaje"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Mensaje de la alerta (obligatorio)"
        error={errors.message}
        required
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <SelectField
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as AlertType)}
          options={ALERT_TYPE_OPTIONS}
          error={errors.type}
          required
        />
        <SelectField
          label="Severidad (opcional)"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as typeof severity)}
          options={SEVERITY_OPTIONS}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <SelectField
          label="Usuario (opcional)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          options={userOptions}
          disabled={!!defaultPersonId}
        />
        <SelectField
          label="Obra (opcional)"
          value={workId}
          onChange={(e) => setWorkId(e.target.value)}
          options={workOptions}
          disabled={!!defaultWorkId}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <SelectField
          label="Proveedor (opcional)"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          options={supplierOptions}
        />
        <SelectField
          label="Documento (opcional)"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          options={documentOptions}
          disabled={!!defaultDocumentId}
        />
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "flex-end", paddingTop: "var(--space-md)" }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear Alerta"}
        </Button>
      </div>
    </form>
  );
}

