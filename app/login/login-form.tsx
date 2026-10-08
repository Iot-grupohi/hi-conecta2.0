"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/brand/logo";

const demoUsers = [
  { email: "admin@hiconecta.local", password: "admin123", role: "Admin" },
  { email: "rh@hiconecta.local", password: "rh1234", role: "RH" },
  { email: "gestor@hiconecta.local", password: "gestor123", role: "Gestor" },
  { email: "viewer@hiconecta.local", password: "viewer123", role: "Viewer" },
  { email: "colaborador@hiconecta.local", password: "cola123", role: "Colaborador (Meu espaço)" },
];

export function LoginForm() {
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
    <div className="relative mx-auto grid w-full max-w-5xl gap-6 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="relative overflow-hidden border-0 text-white shadow-none hover:translate-y-0 hover:shadow-none" style={{ background: "var(--gradient-mesh)" }}>
        <div className="brand-orb -left-10 top-8 h-44 w-44 bg-[rgba(0,217,49,0.22)]" />
        <div className="brand-orb -right-8 bottom-8 h-40 w-40 bg-[rgba(0,24,200,0.35)]" />
        <CardHeader className="relative space-y-4 p-8">
          <BrandMark size="lg" />
          <div>
            <p className="brand-eyebrow">Ecossistema Grupo HI</p>
            <CardTitle className="mt-3 text-3xl font-extrabold text-white">
              Hi-Conecta <span className="text-[var(--color-green)]">RH</span>
            </CardTitle>
            <CardDescription className="mt-3 max-w-md text-sm font-medium normal-case tracking-normal text-white/75">
              Transformamos tecnologia em eficiência para o seu negócio — gestão de pessoas com
              escala, automação e alto desempenho.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-3 px-8 pb-8">
          <p className="text-xs font-bold tracking-[0.18em] text-[var(--color-green)]">
            Usuários de demonstração
          </p>
          {demoUsers.map((user) => (
            <div
              key={user.email}
              className="rounded-[var(--radius-lg)] border border-white/10 bg-white/10 px-3 py-2 text-sm backdrop-blur"
            >
              <p className="font-bold">{user.role}</p>
              <p className="text-xs normal-case tracking-normal text-white/70">
                {user.email} · {user.password}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="hover:translate-y-0">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription className="normal-case tracking-normal">
            Use um dos usuários demo para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4 normal-case" data-preserve-case="true">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-[var(--color-navy)]">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue="admin@hiconecta.local"
                required
                autoComplete="username"
                className="rounded-[var(--radius-pill)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-[var(--color-navy)]">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="admin123"
                required
                autoComplete="current-password"
                className="rounded-[var(--radius-pill)]"
              />
            </div>
            {error ? (
              <p className="rounded-[var(--radius-lg)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Acessar plataforma →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
