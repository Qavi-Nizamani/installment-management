import { create } from "zustand";
import {
  CapitalLedgerEntry,
  CapitalStats,
  CreateCapitalEntryPayload,
  getCapitalEntries,
  getCapitalStats,
  createCapitalEntry,
} from "@/services/capital/capital.service";

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
      const response = await getCapitalEntries();

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
      const response = await getCapitalStats();

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
        },
      });
    }
  },

  createEntry: async (
    payload: CreateCapitalEntryPayload
  ): Promise<boolean> => {
    set({ isCreating: true, error: null });

    try {
      const response = await createCapitalEntry(payload);

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
