"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmailVerifySchema, EmailVerifyPayload } from "@/types/auth";
import { resendVerificationEmail } from "@/services/auth/resend-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function EmailVerifyScreen() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const form = useForm<EmailVerifyPayload>({
    resolver: zodResolver(EmailVerifySchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [searchParams, form]);

  const reason = searchParams.get("reason");
  const infoMessage =
    reason === "unconfirmed"
      ? "Your email isn't verified yet. Resend the verification email below."
      : "Verify your email to finish setting up your account.";

  const onSubmit = (data: EmailVerifyPayload) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await resendVerificationEmail(data);

      if (result.success) {
        setSuccess(result.message || "Verification email sent successfully!");
      } else {
        setError(result.error || "Failed to send verification email. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">{infoMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            className="pl-10"
                            {...field}
                            disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending verification email...
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-green-600 text-sm">{success}</div>
              <p className="text-gray-600 text-sm">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess("");
                }}
                className="w-full"
              >
                Send another email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-medium inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>

          {!success && (
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
