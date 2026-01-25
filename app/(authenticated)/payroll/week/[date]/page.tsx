"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { PayrollDashboard } from "@/components/payroll/PayrollDashboard";

export default function PayrollWeekPage({ params }: { params: { date: string } }) {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BotonVolver />
        <PayrollDashboard initialWeekStartDate={params.date} showWeekPicker={false} />
      </div>
    </ProtectedRoute>
  );
}

