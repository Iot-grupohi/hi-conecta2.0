# Hi-Conecta RH

Plataforma profissional de RH/DP com autenticação, permissões, Prisma e CRUD de colaboradores.

## Stack

- Next.js (App Router) + React 19
- TypeScript strict
- Tailwind CSS v4 + CSS variables
- Prisma + SQLite (pronto para migrar para PostgreSQL)
- Auth.js (NextAuth v5) com roles

## Como rodar

```bash
npm install
npm run db:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Usuários demo

| Papel | E-mail | Senha | Permissões |
|---|---|---|---|
| Admin | `admin@hiconecta.local` | `admin123` | Tudo |
| RH | `rh@hiconecta.local` | `rh1234` | CRUD colaboradores + relatórios |
| Gestor | `gestor@hiconecta.local` | `gestor123` | Leitura |
| Viewer | `viewer@hiconecta.local` | `viewer123` | Leitura |

## Banco de dados

- Schema: `prisma/schema.prisma`
- Seed: `npm run db:seed`
- Push schema: `npm run db:push`

Para PostgreSQL no futuro, altere o `provider` no schema e a `DATABASE_URL`.

## O que já está pronto

- Login com sessão JWT
- Middleware protegendo rotas
- Roles e permissões
- Dashboard e módulos de RH
- CRUD de colaboradores (criar, editar, desligar)
- Tela de usuários (Admin)
