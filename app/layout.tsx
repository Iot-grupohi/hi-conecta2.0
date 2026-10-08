import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/auth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hi-Conecta RH | Grupo HI",
  description: "Plataforma de gestão de pessoas do ecossistema Grupo HI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="pt-BR" suppressHydrationWarning className={jakarta.variable}>
      <body className={jakarta.className}>
        <AppShell
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                  role: session.user.role,
                  permissions: session.user.permissions,
                  employeeId: session.user.employeeId,
                }
              : null
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
