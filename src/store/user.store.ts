import { create } from "zustand";
import { getCurrentSubscription } from "@/services/subscription/subscription.service";
import { getTenantContextSummary } from "@/services/tenant/tenant-context.service";
import type { SubscriptionWithPlan } from "@/types/subscription";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  initials: string;
}

export interface MemberSummary {
  tenantId: string;
  role: string;
}

export interface TenantSummary {
  id: string;
  name: string;
}

interface UserState {
  user: AuthUser | null;
  member: MemberSummary | null;
  tenant: TenantSummary | null;
  subscription: SubscriptionWithPlan | null;
  isLoadingSubscription: boolean;
  needsOnboarding: boolean;
  error: string | null;

  setUser: (user: AuthUser | null) => void;
  setMember: (member: MemberSummary | null) => void;
  setTenant: (tenant: TenantSummary | null) => void;
  fetchTenantContext: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  member: null,
  tenant: null,
  subscription: null,
  isLoadingSubscription: true,
  needsOnboarding: false,
  error: null,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setMember: (member) => set({ member }),
  setTenant: (tenant) => set({ tenant }),

  fetchTenantContext: async () => {
    set({ error: null });

    try {
      const response = await getTenantContextSummary();
      if (response.success && response.data) {
        set({
          tenant: response.data.tenant,
          member: response.data.member,
          needsOnboarding: false,
        });
      } else {
        set({
          tenant: null,
          member: null,
          needsOnboarding: response.code === "NO_TENANT",
          error: response.error || "Failed to fetch tenant context",
        });
      }
    } catch {
      set({
        tenant: null,
        member: null,
        needsOnboarding: false,
        error: "An unexpected error occurred",
      });
    }
  },

  fetchSubscription: async () => {
    set({ isLoadingSubscription: true, error: null });

    try {
      const tenantId = get().tenant?.id;
      if (!tenantId) {
        set({ subscription: null, isLoadingSubscription: false });
        return;
      }
      const response = await getCurrentSubscription(tenantId);
      if (response.success) {
        set({
          subscription: response.data || null,
          isLoadingSubscription: false,
        });
      } else {
        set({
          subscription: null,
          isLoadingSubscription: false,
          error: response.error || "Failed to fetch subscription",
        });
      }
    } catch {
      set({
        subscription: null,
        isLoadingSubscription: false,
        error: "An unexpected error occurred",
      });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
