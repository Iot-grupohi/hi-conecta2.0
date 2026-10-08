import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--color-background)" }}>
      <div className="brand-orb left-[10%] top-[15%] h-56 w-56 bg-[rgba(0,217,49,0.12)]" />
      <div className="brand-orb bottom-[10%] right-[12%] h-64 w-64 bg-[rgba(0,0,112,0.12)]" />
      <Suspense fallback={<div className="text-sm text-[var(--color-muted-foreground)]">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
