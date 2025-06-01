"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/database/client";
import type { User } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  initials: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error getting user:", error);
          setUser(null);
        } else if (user) {
          setUser(formatUser(user));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Unexpected error getting user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(formatUser(session.user));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const formatUser = (supabaseUser: User): AuthUser => {
    const email = supabaseUser.email || "";
    const name = supabaseUser.user_metadata?.full_name || 
                 supabaseUser.user_metadata?.name || 
                 email.split("@")[0] || 
                 "User";
    
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      id: supabaseUser.id,
      email,
      name,
      avatar: supabaseUser.user_metadata?.avatar_url,
      initials,
    };
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
} 