import { create } from "zustand";
import { persist } from 'zustand/middleware'
import { INSTITUTE_THEMES, InstituteCode } from "@/lib/institute-theme";

interface TenantState {
  tenantId: string | null;
  tenantSlug: string | null;
  instituteCode: InstituteCode | null;
  logoUrl: string | null;
  primaryColor: string | null;
  setTenant: (tenantId: string, tenantSlug: string, code?: InstituteCode) => void;
  setInstituteBranding: (logoUrl: string, color: string) => void;
  clearTenant: () => void;
  theme: typeof INSTITUTE_THEMES[InstituteCode] | null
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      tenantSlug: null,
      instituteCode: null,
      logoUrl: null,
      primaryColor: null,
      theme: null,

      setTenant: (tenantId, tenantSlug, code = 'IAS') => {
        const theme = INSTITUTE_THEMES[code]
        set({
          tenantId,
          tenantSlug,
          instituteCode: code,
          primaryColor: theme.primary,
          theme
        })
      },
      setInstituteBranding: (logoUrl, color) => set({ logoUrl, primaryColor: color }),
      clearTenant: () => set({ tenantId: null, tenantSlug: null, instituteCode: null, logoUrl: null, primaryColor: null, theme: null }),
    }),
    { name: 'aula-base-tenant' }
  )
)