import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { UserRole } from '@/types';
import { DEFAULT_PROFILE } from '@/types';
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
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const existing = await userRepository.findByEmail(user.email);

        if (!existing) {
          const { randomUUID } = await import('crypto');
          const { getMongoDb } = await import('@/lib/mongodb');
          const { nowIso } = await import('@/server/repositories/mongo/helpers');
          const db = await getMongoDb();
          const now = nowIso();
          await db.collection('users').insertOne({
            id: randomUUID(),
            email: user.email,
            name: user.name ?? '',
            photoURL: user.image ?? '',
            role: 'STUDENT' as UserRole,
            groupIds: [],
            profile: DEFAULT_PROFILE,
            createdAt: now,
            updatedAt: now,
          });
        } else if (!existing.profile) {
          // Backfill profile for users who signed up before profile was added
          await userRepository.ensureProfile(existing.id);
        }
      } catch (err) {
        console.error('[auth] signIn error:', err);
        return false;
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        // First sign-in: look up MongoDB user by email (user.id may be OAuth sub, not our UUID)
        try {
          const dbUser = await userRepository.findByEmail(user.email!);
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as UserRole;
            token.onboardingCompleted = dbUser.profile?.onboardingCompleted ?? false;
          }
        } catch {
          token.role = 'STUDENT';
          token.onboardingCompleted = false;
        }
      } else if (trigger === 'update') {
        // Manual session refresh: re-read from DB using stored MongoDB ID
        try {
          const dbUser = await userRepository.findById(token.id as string);
          if (dbUser) {
            token.role = dbUser.role as UserRole;
            token.onboardingCompleted = dbUser.profile?.onboardingCompleted ?? false;
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
