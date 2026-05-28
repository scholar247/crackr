'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface SignInFormProps {
  error?: string;
  callbackUrl?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Error starting sign in. Please try again.',
  OAuthCallback: 'Error during sign in. Please try again.',
  OAuthCreateAccount: 'Could not create account. Please try again.',
  EmailCreateAccount: 'Could not create account. Please try again.',
  Callback: 'Error during callback. Please try again.',
  Default: 'An error occurred. Please try again.',
};

export function SignInForm({ error, callbackUrl }: SignInFormProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn('google', {
      callbackUrl: callbackUrl ?? '/dashboard',
    });
    // Loading stays true until page redirect
  };

  const errorMsg = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">crackr</h1>
            <p className="text-muted-foreground mt-1">Learn smarter. Score higher.</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue your preparation</p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-3 h-12"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Practice MCQs', emoji: '📚' },
            { label: 'Mock Tests', emoji: '⏱️' },
            { label: 'Track Progress', emoji: '📈' },
          ].map(({ label, emoji }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 space-y-1">
              <span className="text-2xl">{emoji}</span>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
