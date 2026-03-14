import type { ReactNode } from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="parent">{children}</RoleGuard>;
}
