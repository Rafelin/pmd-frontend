"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

interface LateHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hours: number) => void;
  initialHours?: number | null;
  isLoading?: boolean;
}

export function LateHoursModal({
  isOpen,
  onClose,
  onConfirm,
  initialHours,
  isLoading = false,
}: LateHoursModalProps) {
  const [hours, setHours] = useState<string>(
    initialHours?.toString() || ""
  );
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hours);

    if (isNaN(hoursNum) || hoursNum < 0) {
      setError("Las horas deben ser un número mayor o igual a 0");
      return;
    }

    if (hoursNum > 8) {
      setError("Las horas no pueden ser mayores a 8");
      return;
    }

    setError("");
    onConfirm(hoursNum);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Horas de Tardanza"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Horas de Tardanza" required error={error}>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="8"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              setError("");
            }}
            placeholder="Ej: 1.5"
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Ingrese las horas de retraso (máximo 8 horas)
          </p>
        </FormField>

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Guardando..." : "Confirmar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
