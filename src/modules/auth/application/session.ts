import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { RoleCode } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isSessionUsable } from "@/modules/auth/domain/session-policy";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/modules/auth/domain/session-token";

const SESSION_COOKIE_NAME = "rqa_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthenticatedUser = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  roles: RoleCode[];
};

function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createUserSession(
  userId: string,
  organizationId: string,
) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token, env.AUTH_SECRET);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.$transaction([
    db.userSession.create({
      data: {
        userId,
        organizationId,
        tokenHash,
        expiresAt,
      },
    }),
    db.user.update({
      where: {
        id_organizationId: {
          id: userId,
          organizationId,
        },
      },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(expiresAt),
  );
}

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const tokenHash = hashSessionToken(token, env.AUTH_SECRET);
    const session = await db.userSession.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        revokedAt: true,
        organization: {
          select: { status: true },
        },
        user: {
          select: {
            id: true,
            organizationId: true,
            name: true,
            email: true,
            status: true,
            roles: {
              where: { revokedAt: null },
              select: {
                role: {
                  select: { code: true },
                },
              },
            },
          },
        },
      },
    });

    const roles = session?.user.roles.map(({ role }) => role.code) ?? [];
    const usable = isSessionUsable(
      session
        ? {
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt,
            organizationStatus: session.organization.status,
            userStatus: session.user.status,
            roles,
          }
        : null,
    );

    if (!session || !usable) {
      return null;
    }

    return {
      id: session.user.id,
      organizationId: session.user.organizationId,
      name: session.user.name,
      email: session.user.email,
      roles,
    };
  },
);

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.userSession.updateMany({
      where: {
        tokenHash: hashSessionToken(token, env.AUTH_SECRET),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
