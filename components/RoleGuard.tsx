import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  return <ProtectedRoute allowedRoles={[role]}>{children}</ProtectedRoute>;
}
