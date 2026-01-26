"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { useSuppliers } from "@/hooks/api/suppliers";
import { SupplierType, Supplier } from "@/lib/types/supplier";
import { useContractorCertifications } from "@/hooks/api/contractorCertifications";
import { useContracts } from "@/hooks/api/contracts";
import { ContractorProgress } from "@/components/contractors/ContractorProgress";
import { ContractorCertificationList } from "@/components/contractors/ContractorCertificationList";

function ContractorCertificationsContent() {
  const { suppliers, isLoading: suppliersLoading } = useSuppliers({ type: SupplierType.CONTRACTOR });
  const [supplierId, setSupplierId] = useState<string>("");
  const selectedSupplier = useMemo(() => {
    return suppliers?.find((s: Supplier) => s.id === supplierId) || null;
  }, [suppliers, supplierId]);

  const { certifications, isLoading: certsLoading, mutate } = useContractorCertifications({
    supplier_id: supplierId,
    enabled: Boolean(supplierId),
  });
  const { contracts } = useContracts();

  return (
    <div className="space-y-6">
      <div>
        <BotonVolver backTo="/suppliers" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Certificaciones de Contratistas</h1>
        <p className="text-gray-600">
          Seleccioná un contratista para gestionar certificaciones semanales y sus gastos asociados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar contratista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suppliersLoading ? (
            <LoadingState message="Cargando contratistas…" />
          ) : (
            <Select
              label="Contratista"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Seleccionar</option>
              {suppliers.map((s: Supplier) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.nombre}
                </option>
              ))}
            </Select>
          )}
        </CardContent>
      </Card>

      {supplierId && selectedSupplier && (
        <div className="space-y-4">
          <ContractorProgress supplier={selectedSupplier as any} />
          {certsLoading ? (
            <LoadingState message="Cargando certificaciones…" />
          ) : (
            <ContractorCertificationList
              supplierId={supplierId}
              certifications={certifications || []}
              contracts={contracts || []}
              onRefresh={async () => {
                await mutate();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ContractorCertificationsPage() {
  return (
    <ProtectedRoute>
      <ContractorCertificationsContent />
    </ProtectedRoute>
  );
}

