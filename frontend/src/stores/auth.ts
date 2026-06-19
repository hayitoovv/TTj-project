import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authApi } from "@/lib/api/auth";
import { clearTokens, saveTokens } from "@/lib/api/client";
import type { UserResponse } from "@/lib/api/types";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  hydrated: boolean;
  setUser: (user: UserResponse | null) => void;
  fetchMe: () => Promise<void>;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  loginWithHemis: (hemis_login: string, password: string) => Promise<void>;
  setTokensAndFetch: (access_token: string, refresh_token: string) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      hydrated: false,

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const user = await authApi.me();
          set({ user, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
          clearTokens();
        }
      },

      loginWithPassword: async (phone, password) => {
        set({ isLoading: true });
        try {
          const tokens = await authApi.login({ phone, password });
          saveTokens(tokens.access_token, tokens.refresh_token);
          const user = await authApi.me();
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      loginWithHemis: async (hemis_login, password) => {
        set({ isLoading: true });
        try {
          const tokens = await authApi.loginHemis({ hemis_login, password });
          saveTokens(tokens.access_token, tokens.refresh_token);
          const user = await authApi.me();
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      setTokensAndFetch: async (access, refresh) => {
        saveTokens(access, refresh);
        await get().fetchMe();
      },

      logout: () => {
        clearTokens();
        set({ user: null });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ttj-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
