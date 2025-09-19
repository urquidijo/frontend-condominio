// src/hooks/usePermissions.ts
import { useEffect, useSyncExternalStore } from "react";

/** fuente única de verdad: localStorage -> ["view_users","view_notices", ...] */
function read(): string[] {
  try {
    const raw = localStorage.getItem("permissions");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Para que los componentes se enteren cuando cambien los permisos.
function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener("permissions-changed", handler as any);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("permissions-changed", handler as any);
  };
}

export function usePermissions() {
  const perms = useSyncExternalStore(subscribe, read, () => []);
  return perms;
}

export function hasPermission(code: string): boolean {
  return read().includes(code);
}
