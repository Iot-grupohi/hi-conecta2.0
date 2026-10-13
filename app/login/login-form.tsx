"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/brand/logo";

export function LoginForm({
  showDemo,
  defaultEmail = "",
  defaultPassword = "",
  children,
}: {
  showDemo: boolean;
  defaultEmail?: string;
  defaultPassword?: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="relative overflow-hidden border-0 text-white shadow-none" style={{ background: "var(--gradient-mesh)" }}>
        <div className="brand-orb -right-16 -top-16 h-56 w-56 bg-[rgba(0,217,49,0.14)]" aria-hidden />
        <CardHeader className="relative space-y-6 p-8 md:p-10">
          <BrandMark size="lg" />
          <div>
            <p className="brand-eyebrow">Ecossistema Grupo HI</p>
            <CardTitle className="mt-3 text-3xl text-white md:text-4xl">
              Hi-Conecta <span className="text-[var(--color-green)]">RH</span>
            </CardTitle>
            <CardDescription className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Transformamos tecnologia em eficiência para o seu negócio — gestão de pessoas com
              escala, automação e alto desempenho.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-2 px-8 pb-8 md:px-10 md:pb-10">{children}</CardContent>
      </Card>

      <Card className="flex flex-col justify-center p-2 md:p-4">
        <CardHeader>
          <CardTitle className="text-xl">Entrar</CardTitle>
          <CardDescription>
            {showDemo
              ? "Use um dos usuários demo para acessar a plataforma."
              : "Entre com o e-mail e a senha fornecidos pelo RH."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4 normal-case" data-preserve-case="true">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[var(--color-heading)]">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultEmail}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[var(--color-heading)]">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={defaultPassword}
                required
                autoComplete="current-password"
              />
            </div>
            {error ? (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger-text)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Acessar plataforma"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
