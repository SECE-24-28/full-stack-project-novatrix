"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@apollo/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { REGISTER_MUTATION } from "@/lib/graphql/operations/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input }  from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AuthUser } from "@/components/providers/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterMutationResult {
  register: {
    user: AuthUser;
    tokens: { accessToken: string; refreshToken: string };
  };
}

type FormState = {
  firstName:       string;
  lastName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Password strength ────────────────────────────────────────────────────────

const STRENGTH_CHECKS = [
  { label: "At least 8 characters",   test: (p: string) => p.length >= 8              },
  { label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p)            },
  { label: "One number",               test: (p: string) => /[0-9]/.test(p)            },
  { label: "One special character",    test: (p: string) => /[^A-Za-z0-9]/.test(p)    },
];

function PasswordStrength({ password }: { password: string }) {
  const passed = STRENGTH_CHECKS.filter((c) => c.test(password)).length;
  const barColors  = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const barLabel   = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {STRENGTH_CHECKS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < passed ? (barColors[passed - 1] ?? "bg-gray-200") : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strength:{" "}
        <span className="font-medium">{barLabel[passed - 1] ?? "Too short"}</span>
      </p>
      <ul className="space-y-0.5">
        {STRENGTH_CHECKS.map((check) => (
          <li
            key={check.label}
            className={`flex items-center gap-1.5 text-xs ${
              check.test(password) ? "text-green-600" : "text-gray-400"
            }`}
          >
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {check.test(password) ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.firstName.trim())                    errs.firstName       = "First name is required.";
  if (!form.lastName.trim())                     errs.lastName        = "Last name is required.";
  if (!form.email.includes("@"))                 errs.email           = "Please enter a valid email.";
  if (form.password.length < 8)                  errs.password        = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(form.password))         errs.password        = "Password must contain an uppercase letter.";
  else if (!/[0-9]/.test(form.password))         errs.password        = "Password must contain a number.";
  else if (!/[^A-Za-z0-9]/.test(form.password))  errs.password        = "Password must contain a special character.";
  if (form.password !== form.confirmPassword)    errs.confirmPassword = "Passwords do not match.";
  return errs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router    = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const [registerMutation, { loading }] = useMutation<RegisterMutationResult>(REGISTER_MUTATION, {
    onCompleted: ({ register: data }) => {
      login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push("/dashboard");
    },
    onError: (err) => {
      const code = err.graphQLErrors[0]?.extensions?.code;
      setServerError(
        code === "CONFLICT"
          ? "An account with this email already exists."
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

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    registerMutation({
      variables: {
        input: {
          email:     form.email.trim(),
          password:  form.password,
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Get started with IWMS today</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              error={errors.firstName}
              autoComplete="given-name"
              autoFocus
              required
            />
            <Input
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              error={errors.lastName}
              autoComplete="family-name"
              required
            />
          </div>

          <Input
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
          />

          <div className="space-y-2">
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={form.password} />
          </div>

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
