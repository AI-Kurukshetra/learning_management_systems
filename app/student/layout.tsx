import type { ReactNode } from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="student">{children}</RoleGuard>;
}
