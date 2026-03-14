import type { UserRole } from "@/lib/types";

export const USER_ROLES: UserRole[] = ["admin", "teacher", "student"];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function getDashboardPath(role: UserRole) {
  return `/${role}/dashboard`;
}

export function getRoleBasePath(role: UserRole) {
  return `/${role}`;
}

export function buildRolePath(role: UserRole, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getRoleBasePath(role)}${normalizedPath}`;
}

export function canAccessPath(role: UserRole, pathname: string) {
  const basePath = getRoleBasePath(role);

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function resolveAuthorizedRedirect(role: UserRole, redirectTo?: string | null) {
  const safeRedirect = sanitizeRedirectPath(redirectTo);

  if (!safeRedirect) {
    return getDashboardPath(role);
  }

  return canAccessPath(role, safeRedirect) ? safeRedirect : getDashboardPath(role);
}
