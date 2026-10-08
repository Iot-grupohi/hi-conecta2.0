import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import type { Permission } from "@/lib/permissions";

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth");
}

function isCollaboratorAllowed(pathname: string) {
  return pathname.startsWith("/meu-espaco");
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role as Role | undefined;

      if (isPublicPath(pathname)) {
        if (auth?.user && pathname === "/login") {
          const dest = role === "COLABORADOR" ? "/meu-espaco" : "/";
          return Response.redirect(new URL(dest, request.nextUrl));
        }
        return true;
      }

      if (!auth?.user) return false;

      if (role === "COLABORADOR" && !isCollaboratorAllowed(pathname)) {
        return Response.redirect(new URL("/meu-espaco", request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: Role }).role;
        token.permissions = (user as { permissions: Permission[] }).permissions;
        token.employeeId = (user as { employeeId?: string | null }).employeeId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.permissions = (token.permissions as Permission[]) ?? [];
        session.user.employeeId = (token.employeeId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
