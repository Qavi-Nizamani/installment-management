"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Building2, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { setupWorkspace, WorkspaceSetupPayload } from "@/services/onboarding/setup-workspace";
import { toast } from "sonner";

const WorkspaceSetupSchema = z.object({
  workspaceName: z.string()
    .min(1, "Workspace name is required")
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_'&.]+$/, "Workspace name contains invalid characters"),
});

export default function SetupWorkspaceScreen() {
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<WorkspaceSetupPayload>({
    resolver: zodResolver(WorkspaceSetupSchema),
    defaultValues: {
      workspaceName: "",
    },
  });

  const onSubmit = (data: WorkspaceSetupPayload) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await setupWorkspace(data);
        
        if (result.success) {
          toast.success(result.message || "Workspace created successfully!");
          router.push("/dashboard");
        } else {
          setError(result.error || "Failed to create workspace. Please try again.");
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Workspace setup error:", error);
      }
    });
  };

  const generateSuggestion = () => {
    const suggestions = [
      "My Company",
      "Acme Corp",
      "Tech Solutions",
      "Business Hub",
      "Prime Ventures",
      "Elite Services",
      "Digital Works",
      "Smart Enterprise"
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    form.setValue("workspaceName", randomSuggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Workspace
          </h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s set up your workspace to get started with managing customers and installments
          </p>
        </div>

        {/* Setup Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Almost there!</CardTitle>
            <CardDescription>
              Choose a name for your workspace. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your workspace name"
                            {...field}
                            disabled={isPending}
                            className="pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={generateSuggestion}
                            disabled={isPending}
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      Create Workspace
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">🎉 Your workspace will include:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>✅ Sample customers</div>
            <div>✅ Dashboard analytics</div>
            <div>✅ Installment tracking</div>
            <div>✅ Payment management</div>
          </div>
        </div>
      </div>
    </div>
  );
} 