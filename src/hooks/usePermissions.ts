// src/hooks/usePermissions.ts
export const getPermissions = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
};

export function hasPermission(permission: string): boolean {
  try {
    const stored = localStorage.getItem("extra_permissions");
    if (!stored) return false;

    const permissions: string[] = JSON.parse(stored);
    return permissions.includes(permission);
  } catch {
    return false;
  }
}