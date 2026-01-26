"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCan } from "@/lib/acl";
import { usePrintReceipts } from "@/hooks/api/receipts";
import type { ReceiptPrintType } from "@/lib/types/receipts";
import { PrintableReceipts } from "@/components/receipts/PrintableReceipts";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function ReceiptsPage() {
  const canRead = useCan("payroll.read");

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(getWeekStart(new Date())));
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [printType, setPrintType] = useState<ReceiptPrintType>("all");
  const [autoPrint, setAutoPrint] = useState<ReceiptPrintType | null>(null);

  const weekStartDate = useMemo(() => {
    try {
      return getWeekStart(new Date(selectedDate));
    } catch {
      return getWeekStart(new Date());
    }
  }, [selectedDate]);
  const weekStartDateStr = formatDate(weekStartDate);

  const { receipts, isLoading, error } = usePrintReceipts(weekStartDateStr, printType, {
    filterByOrganization,
  });

  useEffect(() => {
    if (!autoPrint) return;
    if (isLoading) return;
    if (error) return;
    if (!receipts) return;
    if (receipts.type !== autoPrint) return;
    window.print();
    setAutoPrint(null);
  }, [autoPrint, isLoading, error, receipts]);

  const handleQuickPrint = (type: ReceiptPrintType) => {
    setPrintType(type);
    setAutoPrint(type);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BotonVolver />

        <div className="no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Recibos</h1>
              <p className="text-gray-600">Generación e impresión de recibos (A4)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleQuickPrint("employees")} disabled={!canRead || isLoading}>
                Imprimir empleados
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickPrint("contractors")}
                disabled={!canRead || isLoading}
              >
                Imprimir contratistas
              </Button>
              <Button variant="primary" onClick={() => handleQuickPrint("all")} disabled={!canRead || isLoading}>
                Imprimir todos
              </Button>
            </div>
          </div>

          {!canRead ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mt-4">
              No tenés permisos para acceder a Recibos.
            </div>
          ) : (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Semana:</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        setSelectedDate(formatDate(getWeekStart(date)));
                      }}
                      className="w-auto"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Vista:</label>
                    <select
                      value={printType}
                      onChange={(e) => setPrintType(e.target.value as ReceiptPrintType)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">Todos</option>
                      <option value="employees">Empleados</option>
                      <option value="contractors">Contratistas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="checkbox"
                      id="filterByOrganizationReceipts"
                      checked={filterByOrganization}
                      onChange={(e) => setFilterByOrganization(e.target.checked)}
                      className="w-4 h-4 text-pmd-darkBlue border-gray-300 rounded focus:ring-pmd-darkBlue"
                    />
                    <label
                      htmlFor="filterByOrganizationReceipts"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Filtrar por mi organización
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {canRead ? (
          <>
            {isLoading ? <LoadingState message="Cargando recibos…" /> : null}
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar recibos: {error.message || "Error desconocido"}
              </div>
            ) : null}

            <div className="print-area">
              <PrintableReceipts items={receipts?.items ?? []} />
            </div>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}

