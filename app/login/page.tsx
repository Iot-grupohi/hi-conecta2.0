import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { DemoCredentials, LoginHeroNote } from "@/app/login/demo-credentials";

const showDemo = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--color-background)" }}>
      <Suspense fallback={<div className="text-sm text-[var(--color-muted-foreground)]">Carregando...</div>}>
        <LoginForm
          showDemo={showDemo}
          defaultEmail={showDemo ? "admin@hiconecta.local" : ""}
          defaultPassword={showDemo ? "admin123" : ""}
        >
          {showDemo ? <DemoCredentials /> : <LoginHeroNote />}
        </LoginForm>
      </Suspense>
    </div>
  );
}
