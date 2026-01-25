"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { PayrollDashboard } from "@/components/payroll/PayrollDashboard";

export default function PayrollPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BotonVolver />
        <PayrollDashboard />
      </div>
    </ProtectedRoute>
  );
}

