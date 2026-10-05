import { create } from "zustand";

interface TenantState {
  tenantId: string | null;
  tenantSlug: string | null;
  setTenant: (tenantId: string, tenantSlug: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenantId: null,
  tenantSlug: null,
  setTenant: (tenantId, tenantSlug) => set({ tenantId, tenantSlug }),
  clearTenant: () => set({ tenantId: null, tenantSlug: null }),
}));
