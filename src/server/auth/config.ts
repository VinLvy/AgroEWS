/**
 * src/server/auth/config.ts
 * Konfigurasi autentikasi Auth.js / NextAuth dengan Credentials Provider dan Argon2id.
 * Sesuai TECH_SPEC.md §2, §7.1, §11 (A07).
 */

import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/server/db/client";
import { users, type userRoleEnum } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { recordAuditLog } from "@/server/audit";
import { checkRateLimit } from "./rate-limit";

export type UserRole = (typeof userRoleEnum.enumValues)[number];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Cek Rate Limit login (TECH_SPEC §11 A07)
        const rateLimit = checkRateLimit(`login:${normalizedEmail}`, {
          maxAttempts: 10,
          windowMs: 60 * 1000,
        });
        if (!rateLimit.allowed) {
          throw new Error(
            `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`
          );
        }

        // Cari user di database
        const user = await db.query.users.findFirst({
          where: eq(users.email, normalizedEmail),
        });

        if (!user || !user.isActive) {
          return null;
        }

        const now = new Date();

        // 1. Cek status penguncian akun (lockout 15 menit setelah 5x gagal)
        if (user.lockedUntil && user.lockedUntil > now) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - now.getTime()) / 60000
          );
          throw new Error(
            `Akun terkunci sementara karena 5 kali kegagalan login. Coba lagi dalam ${remainingMinutes} menit.`
          );
        }

        // 2. Verifikasi hash argon2id
        const isValidPassword = await argon2.verify(user.passwordHash, password);

        if (!isValidPassword) {
          const newFailedCount = user.failedLogins + 1;
          const lockUntil =
            newFailedCount >= 5
              ? new Date(Date.now() + 15 * 60 * 1000) // 15 menit
              : null;

          await db
            .update(users)
            .set({
              failedLogins: newFailedCount,
              lockedUntil: lockUntil,
            })
            .where(eq(users.id, user.id));

          if (newFailedCount >= 5) {
            throw new Error(
              "Akun terkunci selama 15 menit akibat 5 kali kegagalan login berturut-turut."
            );
          }

          return null;
        }

        // 3. Reset failed login counter setelah login berhasil
        if (user.failedLogins > 0 || user.lockedUntil) {
          await db
            .update(users)
            .set({
              failedLogins: 0,
              lockedUntil: null,
            })
            .where(eq(users.id, user.id));
        }

        // 4. Catat audit log login berhasil
        await recordAuditLog({
          actorId: user.id,
          action: "login",
          entity: "users",
          entityId: user.id,
          diff: { email: user.email, role: user.role },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 Jam (TECH_SPEC §11 A07)
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
