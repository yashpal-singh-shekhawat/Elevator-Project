'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import type { ApiResponse, PlatformLoginResponse } from '@lift-saas/shared-types';
import { platformClient, setPlatformAccessToken } from '@/lib/platform-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type FormValues = z.infer<typeof schema>;

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await platformClient.post<ApiResponse<PlatformLoginResponse>>('/auth/login', values);
      if (res.data.success) {
        setPlatformAccessToken(res.data.data.accessToken);
        router.replace('/super-admin/dashboard');
      }
    } catch (err) {
      const message =
        err instanceof AxiosError ? err.response?.data?.error?.message ?? 'Login failed' : 'Login failed';
      setServerError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-1.5 rounded-sm bg-primary" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight">Lift SaaS — Platform</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Super Admin</CardTitle>
            <CardDescription>Platform administration console</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@platform.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {serverError && (
                <p className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {serverError}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="mt-1">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
