const demoUsers = [
  { email: "admin@hiconecta.local", password: "admin123", role: "Admin" },
  { email: "rh@hiconecta.local", password: "rh1234", role: "RH" },
  { email: "gestor@hiconecta.local", password: "gestor123", role: "Gestor" },
  { email: "viewer@hiconecta.local", password: "viewer123", role: "Viewer" },
  { email: "colaborador@hiconecta.local", password: "cola123", role: "Colaborador (Meu espaço)" },
];

export function DemoCredentials() {
  return (
    <>
      <p className="text-xs font-semibold text-white/60">Usuários de demonstração</p>
      {demoUsers.map((user) => (
        <div
          key={user.email}
          className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] px-3 py-2 text-sm"
        >
          <p className="font-semibold">{user.role}</p>
          <p className="text-xs text-white/60">
            {user.email} · {user.password}
          </p>
        </div>
      ))}
    </>
  );
}

export function LoginHeroNote() {
  return (
    <p className="text-sm font-medium leading-relaxed text-white/75">
      Acesso restrito à equipe do Grupo HI. Use as credenciais fornecidas pelo RH.
    </p>
  );
}
