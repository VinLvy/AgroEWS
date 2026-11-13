/**
 * src/server/auth/rbac.ts
 * Role-Based Access Control (RBAC) dan kepemilikan wilayah (region access).
 * Sesuai TECH_SPEC.md §4, §11 (A01) dan PRD FR-4.
 */

import { auth } from "./config";
import { db } from "../db/client";
import { pplAssignments, type userRoleEnum } from "../db/schema";
import { and, eq } from "drizzle-orm";

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

/**
 * Memverifikasi sesi aktif dan memeriksa apakah pengguna memiliki salah satu role yang diizinkan.
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new AuthError("Sesi kedaluwarsa atau tidak terautentikasi. Silakan login kembali.", 401);
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    throw new AuthError(
      `Akses ditolak. Peran '${session.user.role}' tidak memiliki izin untuk tindakan ini.`,
      403
    );
  }

  return session.user;
}

/**
 * Memeriksa hak akses pengguna terhadap suatu wilayah spesifik (mencegah IDOR / A01).
 * - Admin: Memiliki akses penuh ke seluruh wilayah.
 * - BPP Coordinator: Memiliki akses ke seluruh wilayah binaan.
 * - PPL: WAJIB terdaftar pada tabel ppl_assignments untuk regionId tersebut.
 */
export async function requireRegionAccess(
  userId: string,
  userRole: UserRole,
  regionId: string,
  dbInstance = db
): Promise<boolean> {
  // Admin dan Koordinator BPP memiliki hak akses ke semua region binaan
  if (userRole === "admin" || userRole === "bpp_coordinator") {
    return true;
  }

  // PPL wajib terdaftar di ppl_assignments
  const assignment = await dbInstance.query.pplAssignments.findFirst({
    where: and(
      eq(pplAssignments.userId, userId),
      eq(pplAssignments.regionId, regionId)
    ),
  });

  if (!assignment) {
    throw new AuthError(
      `Akses terlarang. Anda tidak memiliki penugasan resmi pada wilayah ID: ${regionId}`,
      403
    );
  }

  return true;
}
