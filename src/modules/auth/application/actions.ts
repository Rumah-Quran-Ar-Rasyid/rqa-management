"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { createUserSession, revokeCurrentSession } from "./session";
import { loginSchema } from "../domain/login-schema";

const INVALID_PASSWORD_HASH =
  "$2b$12$mxVUngaxjsR3eAtr.jRSMeWFNFiwVEdSBXidGe7mgFR0YHXeT.pjS";

export type LoginState = {
  message?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const organizations = await db.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
    take: 2,
  });

  if (organizations.length !== 1) {
    return {
      message: "Email atau kata sandi tidak sesuai.",
    };
  }

  const organizationId = organizations[0].id;
  const user = await db.user.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: parsed.data.email,
      },
    },
    select: {
      id: true,
      organizationId: true,
      passwordHash: true,
      status: true,
      roles: {
        where: { revokedAt: null },
        select: { roleId: true },
        take: 1,
      },
    },
  });

  const passwordMatches = await compare(
    parsed.data.password,
    user?.passwordHash ?? INVALID_PASSWORD_HASH,
  );

  if (
    !user ||
    !passwordMatches ||
    user.status !== "ACTIVE" ||
    user.roles.length === 0
  ) {
    return {
      message: "Email atau kata sandi tidak sesuai.",
    };
  }

  await createUserSession(user.id, user.organizationId);
  redirect("/app");
}

export async function logoutAction() {
  await revokeCurrentSession();
  redirect("/login");
}
