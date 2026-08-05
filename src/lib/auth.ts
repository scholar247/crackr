import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { UserRole } from '@/lib/roles';
import { userRepository } from '@/server/repositories/user.repository';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    // 30-day session, refreshed whenever the JWT is re-issued (default Auth.js
    // behaviour) — matches the length of a typical exam-prep study cycle
    // without forcing frequent re-auth.
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    // Resolves/creates the application user and rejects sign-in outright for
    // disabled accounts or malformed OAuth responses. All DB access here goes
    // through the repository — never inline queries in this file.
    async signIn({ user, account }) {
      if (!user.email || !account?.providerAccountId) return false;

      try {
        const dbUser = await userRepository.provisionGoogleUser({
          email: user.email,
          name: user.name,
          image: user.image,
          providerAccountId: account.providerAccountId,
        });

        if (dbUser.status === 'DISABLED') return false;

        await userRepository.recordGoogleLogin({
          userId: dbUser.id,
          name: user.name,
          image: user.image,
        });

        return true;
      } catch (err) {
        // Drizzle wraps the real driver error in `.cause` (a DrizzleQueryError's own
        // `.message` is just "Failed query: ..." — the actual reason, e.g. a connection
        // failure or auth error, is on `.cause`) — log both or this fails silently.
        const cause = err instanceof Error ? err.cause : undefined;
        console.error('[auth] signIn provisioning failed:', err instanceof Error ? err.message : err, cause ? { cause } : '');
        return false;
      }
    },

    async jwt({ token, user, account, trigger }) {
      if (user && account?.providerAccountId) {
        // First sign-in this session: resolve the definitive internal user via
        // provider identity (already provisioned/validated in signIn above) —
        // not email, which is only a legacy-migration fallback at the repo layer.
        try {
          const dbUser = await userRepository.findByProviderIdentity('google', account.providerAccountId);
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.onboardingCompleted = dbUser.onboardingCompletedAt !== null;
          }
        } catch {
          token.role = 'STUDENT';
          token.onboardingCompleted = false;
        }
      } else if (trigger === 'update' && token.id) {
        // Manual session refresh — re-read authorization state so a role
        // change or account disable takes effect without waiting for the
        // session to naturally expire.
        try {
          const snapshot = await userRepository.getAuthorizationSnapshot(token.id as string);
          if (snapshot) {
            token.role = snapshot.role;
            token.onboardingCompleted = snapshot.onboardingCompleted;
          }
        } catch {
          // keep existing token values
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
