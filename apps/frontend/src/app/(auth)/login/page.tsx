'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { currentTenantCode, tenantHref } from '@/lib/tenant';
import { getTenantBranding, type TenantBranding } from '@/lib/api/branding';
import { TenantLogo } from '@/components/shared/tenant-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  // The tenant is identified purely by the URL segment (/acme/login -> "acme").
  useEffect(() => {
    const code = currentTenantCode();
    setCompanyCode(code);
    // Fetch the tenant's public branding (name + logo) so the login screen
    // shows the company's identity. Silently ignore failures (unknown tenant).
    // `brandingLoaded` gates the header so the default product name never
    // flashes before the real branding arrives.
    if (code) {
      getTenantBranding(code)
        .then((b) => setBranding(b))
        .catch(() => setBranding(null))
        .finally(() => setBrandingLoaded(true));
    } else {
      setBrandingLoaded(true);
    }
  }, []);

  // Where to land after auth: the tenant-scoped dashboard.
  const homeHref = companyCode ? tenantHref(companyCode, '/') : '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(homeHref);
    }
  }, [isLoading, user, router, homeHref]);

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password, companyCode ?? undefined);
      router.replace(homeHref);
    } catch (err) {
      const message =
        err instanceof AxiosError ? err.response?.data?.error?.message ?? 'Login failed' : 'Login failed';
      setServerError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          {brandingLoaded ? (
            <>
              {branding?.logoUrl ? (
                <TenantLogo name={branding.name} logoUrl={branding.logoUrl} className="h-10 w-10" />
              ) : (
                <div className="h-8 w-1.5 rounded-sm bg-primary" aria-hidden />
              )}
              <span className="font-display text-lg font-semibold tracking-tight">
                {branding?.name ?? 'Lift Management SaaS'}
              </span>
            </>
          ) : (
            // Hold the header space until branding resolves so the default name
            // never flashes before the tenant's real branding.
            <div className="h-10" aria-hidden />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              {!brandingLoaded ? (
                // Hold until branding resolves so the default copy never flashes.
                <span className="inline-block h-4 w-40" aria-hidden />
              ) : companyCode ? (
                <>
                  Company workspace <span className="font-mono font-medium text-foreground">{companyCode}</span>
                </>
              ) : (
                'Installation & AMC operations console'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
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
