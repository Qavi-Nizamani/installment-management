"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/database/server";

export interface WorkspaceSetupPayload {
  workspaceName: string;
}

export interface WorkspaceSetupResponse {
  success: boolean;
  message?: string;
  error?: string;
  tenantId?: string;
}

export async function setupWorkspace(data: WorkspaceSetupPayload): Promise<WorkspaceSetupResponse> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to create a workspace.",
      };
    }

    // Check if user already has a tenant
    const { data: existingMember } = await supabase
      .from('members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return {
        success: false,
        error: "You already have a workspace. Please contact support if you need help.",
      };
    }

    // Create the tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.workspaceName,
      })
      .select('id')
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant creation error:', tenantError);
      return {
        success: false,
        error: "Failed to create workspace. Please try again.",
      };
    }

    // Create the member record (user as OWNER)
    const { error: memberError } = await supabase
      .from('members')
      .insert({
        user_id: user.id,
        tenant_id: tenant.id,
        role: 'OWNER',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Try to clean up the tenant if member creation failed
      await supabase.from('tenants').delete().eq('id', tenant.id);
      
      return {
        success: false,
        error: "Failed to set up workspace membership. Please try again.",
      };
    }

    // Add sample customers to help users get started
    const { error: customersError } = await supabase
      .from('customers')
      .insert([
        {
          tenant_id: tenant.id,
          name: 'Alice Johnson',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, New York, NY',
          national_id: '123-45-6789',
        },
        {
          tenant_id: tenant.id,
          name: 'Bob Smith',
          phone: '+1 (555) 987-6543',
          address: '456 Oak Ave, Los Angeles, CA',
          national_id: '987-65-4321',
        },
        {
          tenant_id: tenant.id,
          name: 'Carol Davis',
          phone: '+1 (555) 456-7890',
          address: '789 Pine St, Chicago, IL',
          national_id: '456-78-9012',
        },
        {
          tenant_id: tenant.id,
          name: 'David Wilson',
          phone: '+1 (555) 321-0987',
          address: '321 Elm St, Houston, TX',
          national_id: '321-09-8765',
        },
      ]);

    if (customersError) {
      console.error('Sample customers creation error:', customersError);
      // Don't fail the whole process for sample data
    }

    return {
      success: true,
      message: "Workspace created successfully! Welcome to your dashboard.",
      tenantId: tenant.id,
    };
  } catch (error) {
    console.error('Unexpected error during workspace setup:', error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function redirectAfterWorkspaceSetup() {
  redirect("/dashboard");
} 