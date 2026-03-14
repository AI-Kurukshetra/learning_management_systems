import type { ReactNode } from "react";
import { requireAuthenticatedViewer } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: ReactNode;
}

export async function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  await requireAuthenticatedViewer(allowedRoles);

  return <>{children}</>;
}
