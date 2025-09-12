// src/hooks/usePermissions.ts
export const getPermissions = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
};

export const hasPermission = (perm: string): boolean => {
  return getPermissions().includes(perm);
};
