"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/user.store";

interface UserStoreProviderProps {
  children: React.ReactNode;
}

export function UserStoreProvider({ children }: UserStoreProviderProps) {
  const { user, loading } = useAuth();
  const { setUser, fetchSubscription, reset } = useUserStore();

  useEffect(() => {
    if (loading) return;

    if (user) {
      setUser(user);
      fetchSubscription();
    } else {
      reset();
    }
  }, [user, loading, setUser, fetchSubscription, reset]);

  return <>{children}</>;
}
