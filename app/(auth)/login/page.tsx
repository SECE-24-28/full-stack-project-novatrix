"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@apollo/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { LOGIN_MUTATION } from "@/lib/graphql/operations/auth";
import { loginSchema } from "@/lib/validators/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input }  from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AuthUser } from "@/components/providers/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginMutationResult {
  login: {
    user:   AuthUser;
    tokens: { accessToken: string; refreshToken: string };
  };
}

type FormState  = { email: string; password: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const [form,        setForm]        = useState<FormState>({ email: "", password: "" });
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [loginMutation, { loading }] = useMutation<LoginMutationResult>(LOGIN_MUTATION, {
    onCompleted: ({ login: data }) => {
      login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push(callbackUrl);
    },
    onError: (err) => {
      const code = err.graphQLErrors[0]?.extensions?.code;
      setServerError(
        code === "UNAUTHENTICATED"
          ? "Invalid email or password."
          : err.message
      );
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email:    fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    loginMutation({ variables: { input: { email: form.email, password: form.password } } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your IWMS account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <Input
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            autoFocus
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Create one
            </Link>
          </p>

        </form>
      </CardContent>
    </Card>
  );
}
