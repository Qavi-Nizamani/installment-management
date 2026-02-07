import { redirect } from "next/navigation";
import { createClient } from "@/supabase/database/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if user already has a workspace
  const { data: existingMember } = await supabase
    .from('members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    // User already has a workspace, redirect to dashboard
    redirect("/dashboard");
  }

  return <>{children}</>;
} 