'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

interface AuthFormProps {
  mode: 'login' | 'register';
  twitterEnabled?: boolean;
}

export function AuthForm({ mode, twitterEnabled = false }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/desk';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result =
      mode === 'register'
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message || 'Could not authenticate.');
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-5">
      {mode === 'register' ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={event => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </div>
      {error ? <p className="text-sm text-[oklch(0.72_0.16_28)]">{error}</p> : null}
      {twitterEnabled ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-none"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await authClient.signIn.social({
                provider: 'twitter',
                callbackURL: next,
              });
              if (result.error) {
                setError(result.error.message || 'Could not start X sign-in.');
                setPending(false);
              }
            }}
          >
            Continue with X
          </Button>
          <p className="text-center text-[11px] tracking-[0.16em] text-white/30 uppercase">or</p>
        </>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full rounded-none">
        {pending ? 'Working…' : mode === 'register' ? 'Create account' : 'Sign in'}
      </Button>
      <p className="text-sm text-white/50">
        {mode === 'register' ? (
          <>
            Already have an account?{' '}
            <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
