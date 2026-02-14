import { create } from "zustand";
import {
  CapitalLedgerEntry,
  CapitalStats,
  CreateCapitalEntryPayload,
  getCapitalEntries,
  getCapitalStats,
  createCapitalEntry,
} from "@/services/capital/capital.service";
import { useUserStore } from "@/store/user.store";

interface CapitalState {
  entries: CapitalLedgerEntry[];
  stats: CapitalStats | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  fetchEntries: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createEntry: (payload: CreateCapitalEntryPayload) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  entries: [],
  stats: null,
  isLoading: false,
  isCreating: false,
  error: null,
};

export const useCapitalStore = create<CapitalState>((set, get) => ({
  ...initialState,

  fetchEntries: async () => {
    set({ isLoading: true, error: null });

    try {
      const tenantId = useUserStore.getState().tenant?.id;
      if (!tenantId) {
        set({ entries: [], isLoading: false, error: "No tenant selected" });
        return;
      }
      const response = await getCapitalEntries(tenantId);

      if (response.success) {
        set({ entries: response.data || [], isLoading: false });
      } else {
        set({
          entries: [],
          isLoading: false,
          error: response.error || "Failed to fetch capital entries",
        });
      }
    } catch {
      set({ error: "An unexpected error occurred", isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      if (!tenantId) return;
      const response = await getCapitalStats(tenantId);

      if (response.success) {
        set({ stats: response.data || null });
      } else {
        set({
          stats: {
            totalInvestment: 0,
            totalWithdrawal: 0,
            totalAdjustment: 0,
            balance: 0,
            capitalDeployed: 0,
            availableFunds: 0,
            profitPaid: 0,
          },
        });
      }
    } catch {
      set({
        stats: {
          totalInvestment: 0,
          totalWithdrawal: 0,
          totalAdjustment: 0,
          balance: 0,
          capitalDeployed: 0,
          availableFunds: 0,
          profitPaid: 0,
        },
      });
    }
  },

  createEntry: async (
    payload: CreateCapitalEntryPayload
  ): Promise<boolean> => {
    set({ isCreating: true, error: null });

    try {
      const tenantId = useUserStore.getState().tenant?.id;
      if (!tenantId) {
        set({ isCreating: false, error: "No tenant selected" });
        return false;
      }
      const response = await createCapitalEntry(payload, tenantId);

      if (response.success) {
        await get().fetchEntries();
        await get().fetchStats();
        set({ isCreating: false });
        return true;
      } else {
        set({
          error: response.error || "Failed to create entry",
          isCreating: false,
        });
        return false;
      }
    } catch {
      set({ error: "An unexpected error occurred", isCreating: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
