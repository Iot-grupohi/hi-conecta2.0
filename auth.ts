import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPermissionsForRole, type Permission } from "@/lib/permissions";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface User {
    role: Role;
    permissions: Permission[];
    employeeId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      permissions: Permission[];
      employeeId?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    permissions?: Permission[];
    employeeId?: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: getPermissionsForRole(user.role),
          employeeId: user.employeeId,
        };
      },
    }),
  ],
});
