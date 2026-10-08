"""
Monta a árvore organizacional da empresa a partir do Bitrix24.

Percorre todos os departamentos (department.get), todos os usuários (user.get),
tenta enriquecer com dados de RH (humanresources.hcmlink.*) e gera uma árvore com:
departamento -> chefe, cargos (WORK_POSITION) -> usuários, subdepartamentos.

Uso:
    python bitrix_org_tree.py                      # imprime a árvore e salva org_tree.json
    python bitrix_org_tree.py --inativos           # inclui usuários desativados
    python bitrix_org_tree.py --raiz 465           # árvore a partir de um departamento
    python bitrix_org_tree.py --saida arvore.json --texto arvore.txt

O webhook pode ser passado por --webhook ou pela variável de ambiente BITRIX_WEBHOOK.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict

DEFAULT_WEBHOOK = "https://grupohi.bitrix24.com.br/rest/721611/k3uer2sws2ck1imm/"

USER_FIELDS = (
    "ID", "ACTIVE", "NAME", "LAST_NAME", "SECOND_NAME", "EMAIL", "WORK_POSITION",
    "PERSONAL_PROFESSION", "WORK_PHONE", "PERSONAL_MOBILE", "UF_PHONE_INNER",
    "UF_EMPLOYMENT_DATE", "UF_DEPARTMENT", "USER_TYPE", "LAST_LOGIN", "PERSONAL_PHOTO",
)


class BitrixError(Exception):
    pass


class Bitrix:
    def __init__(self, webhook, timeout=60, max_retries=5):
        self.base = webhook.rstrip("/") + "/"
        self.timeout = timeout
        self.max_retries = max_retries

    def call(self, method, params=None):
        data = json.dumps(params or {}).encode("utf-8")
        for attempt in range(self.max_retries):
            req = urllib.request.Request(
                self.base + method + ".json",
                data=data,
                headers={"Content-Type": "application/json"},
            )
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    body = json.load(resp)
            except urllib.error.HTTPError as e:
                try:
                    body = json.loads(e.read().decode("utf-8"))
                except ValueError:
                    body = {"error": f"HTTP_{e.code}", "error_description": e.reason}
            except (urllib.error.URLError, TimeoutError) as e:
                if attempt == self.max_retries - 1:
                    raise BitrixError(f"{method}: falha de rede: {e}")
                time.sleep(2 ** attempt)
                continue

            if "error" in body:
                if body["error"] in ("QUERY_LIMIT_EXCEEDED", "OPERATION_TIME_LIMIT"):
                    time.sleep(2 ** attempt)
                    continue
                raise BitrixError(f"{method}: {body['error']} - {body.get('error_description', '')}")
            return body
        raise BitrixError(f"{method}: limite de tentativas excedido")

    def list_all(self, method, params=None):
        """Percorre todas as páginas (50 itens por página) de um método de listagem."""
        params = dict(params or {})
        start = 0
        items = []
        while True:
            params["start"] = start
            body = self.call(method, params)
            result = body.get("result", [])
            if isinstance(result, dict):  # alguns métodos retornam {"items": [...]}
                result = result.get("items", list(result.values()))
            items.extend(result)
            if "next" not in body:
                break
            start = body["next"]
            time.sleep(0.25)  # respeita o limite de ~2 req/s do Bitrix
        return items


def full_name(u):
    parts = [u.get("NAME"), u.get("SECOND_NAME"), u.get("LAST_NAME")]
    return " ".join(p.strip() for p in parts if p and p.strip()) or u.get("EMAIL") or f"Usuário {u['ID']}"


def position(u):
    """Cargo normalizado (minúsculas, espaços colapsados) para agrupar variações de escrita."""
    return " ".join((u.get("WORK_POSITION") or "").split()).lower() or None


def fetch_departments(bx):
    deps = bx.list_all("department.get", {"sort": "SORT", "order": "ASC"})
    return {str(d["ID"]): d for d in deps}


def fetch_users(bx, include_inactive):
    # Sem filtro ACTIVE o user.get com ADMIN_MODE devolve ativos e inativos.
    user_filter = {"USER_TYPE": "employee"}
    if not include_inactive:
        user_filter["ACTIVE"] = True
    users = bx.list_all("user.get", {
        "ADMIN_MODE": True,
        "FILTER": user_filter,
        "SORT": "ID",
        "ORDER": "ASC",
    })
    return {
        str(u["ID"]): u for u in users
        if include_inactive or u.get("ACTIVE") in (True, "Y", "1", 1)
    }


def fetch_hr(bx):
    """Dados opcionais do módulo humanresources (HCMLink). Requer contexto de aplicação,
    então normalmente falha via webhook — nesse caso apenas seguimos sem eles."""
    hr = {"companies": [], "employees": {}, "available": False}
    try:
        companies = bx.list_all("humanresources.hcmlink.company.list")
    except BitrixError as e:
        hr["error"] = str(e)
        return hr
    hr["available"] = True
    hr["companies"] = companies
    for c in companies:
        cid = c.get("id") or c.get("ID")
        try:
            for emp in bx.list_all("humanresources.hcmlink.employee.list", {"companyId": cid}):
                uid = str(emp.get("userId") or emp.get("USER_ID") or "")
                if uid:
                    hr["employees"].setdefault(uid, []).append({"companyId": cid, **emp})
        except BitrixError as e:
            hr.setdefault("warnings", []).append(str(e))
    return hr


def user_summary(u, hr_employees):
    s = {
        "id": str(u["ID"]),
        "nome": full_name(u),
        "cargo": position(u),
        "cargo_original": (u.get("WORK_POSITION") or "").strip() or None,
        "email": u.get("EMAIL") or None,
        "ativo": bool(u.get("ACTIVE")),
        "telefone_interno": u.get("UF_PHONE_INNER") or None,
        "data_admissao": (u.get("UF_EMPLOYMENT_DATE") or "")[:10] or None,
        "departamentos": [str(d) for d in (u.get("UF_DEPARTMENT") or [])],
    }
    if hr_employees.get(s["id"]):
        s["rh"] = hr_employees[s["id"]]
    return s


def build_tree(departments, users, hr):
    children = defaultdict(list)
    roots = []
    for dep_id, d in departments.items():
        parent = str(d.get("PARENT") or "")
        if parent and parent in departments:
            children[parent].append(dep_id)
        else:
            roots.append(dep_id)

    members = defaultdict(list)
    no_department = []
    for u in users.values():
        dep_ids = [str(d) for d in (u.get("UF_DEPARTMENT") or [])]
        valid = [d for d in dep_ids if d in departments]
        if not valid:
            no_department.append(u)
        for d in valid:
            members[d].append(u)

    sort_key = lambda dep_id: (int(departments[dep_id].get("SORT") or 0), departments[dep_id]["NAME"])

    def node(dep_id, path):
        d = departments[dep_id]
        head_id = str(d.get("UF_HEAD") or "") or None
        head = users.get(head_id) if head_id else None
        path = path + [d["NAME"]]

        dep_users = sorted(members[dep_id], key=full_name)
        cargos = defaultdict(list)
        for u in dep_users:
            cargos[position(u) or "(sem cargo)"].append(
                user_summary(u, hr["employees"]) | {"chefe": str(u["ID"]) == head_id}
            )

        subs = [node(c, path) for c in sorted(children[dep_id], key=sort_key)]
        ids = {str(u["ID"]) for u in dep_users}
        for s in subs:
            ids |= s.pop("_ids")
        return {
            "id": dep_id,
            "nome": d["NAME"],
            "caminho": " > ".join(path),
            "nivel": len(path) - 1,
            "pai_id": str(d.get("PARENT") or "") or None,
            "chefe": (
                {"id": head_id, "nome": full_name(head), "cargo": position(head),
                 "ativo": bool(head.get("ACTIVE"))}
                if head else ({"id": head_id, "nome": None, "observacao": "usuário não encontrado/inativo"}
                              if head_id else None)
            ),
            "total_usuarios": len(dep_users),
            "total_usuarios_recursivo": len(ids),
            "cargos": dict(sorted(cargos.items())),
            "subdepartamentos": subs,
            "_ids": ids,
        }

    tree = [node(r, []) for r in sorted(roots, key=sort_key)]
    for n in tree:
        n.pop("_ids")

    all_positions = defaultdict(list)
    for u in users.values():
        all_positions[position(u) or "(sem cargo)"].append(
            {"id": str(u["ID"]), "nome": full_name(u),
             "departamentos": [departments[str(d)]["NAME"] for d in (u.get("UF_DEPARTMENT") or [])
                               if str(d) in departments]}
        )

    return {
        "resumo": {
            "departamentos": len(departments),
            "usuarios": len(users),
            "usuarios_ativos": sum(1 for u in users.values() if u.get("ACTIVE")),
            "cargos_distintos": len(all_positions),
            "usuarios_sem_departamento": len(no_department),
            "rh_hcmlink_disponivel": hr["available"],
        },
        "arvore": tree,
        "cargos": dict(sorted(all_positions.items())),
        "usuarios_sem_departamento": [user_summary(u, hr["employees"]) for u in no_department],
        "rh": {k: v for k, v in hr.items() if k != "employees"},
    }


def find_node(tree, dep_id):
    for n in tree:
        if n["id"] == dep_id:
            return n
        found = find_node(n["subdepartamentos"], dep_id)
        if found:
            return found
    return None


def render_text(nodes, show_users=True):
    lines = []

    def walk(n, prefix, is_last, is_root):
        branch = "" if is_root else ("└── " if is_last else "├── ")
        head = f" | chefe: {n['chefe']['nome']}" if n.get("chefe") and n["chefe"].get("nome") else ""
        lines.append(f"{prefix}{branch}🏢 {n['nome']} [ID {n['id']}] "
                     f"({n['total_usuarios']} / {n['total_usuarios_recursivo']} total){head}")
        child_prefix = prefix + ("" if is_root else ("    " if is_last else "│   "))

        entries = []
        if show_users:
            for cargo, us in n["cargos"].items():
                entries.append(("cargo", cargo, us))
        for s in n["subdepartamentos"]:
            entries.append(("dep", None, s))

        for i, (kind, cargo, payload) in enumerate(entries):
            last = i == len(entries) - 1
            if kind == "dep":
                walk(payload, child_prefix, last, False)
                continue
            lines.append(f"{child_prefix}{'└── ' if last else '├── '}💼 {cargo}")
            sub_prefix = child_prefix + ("    " if last else "│   ")
            for j, u in enumerate(payload):
                mark = " ★chefe" if u.get("chefe") else ""
                inactive = " (inativo)" if not u["ativo"] else ""
                lines.append(f"{sub_prefix}{'└── ' if j == len(payload) - 1 else '├── '}"
                             f"👤 {u['nome']}{mark}{inactive}" + (f" <{u['email']}>" if u.get("email") else ""))

    for n in nodes:
        walk(n, "", True, True)
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="Árvore organizacional do Bitrix24")
    ap.add_argument("--webhook", default=os.environ.get("BITRIX_WEBHOOK", DEFAULT_WEBHOOK))
    ap.add_argument("--inativos", action="store_true", help="inclui usuários desativados")
    ap.add_argument("--raiz", help="ID do departamento a usar como raiz")
    ap.add_argument("--saida", default="org_tree.json", help="arquivo JSON de saída")
    ap.add_argument("--texto", help="também salva a árvore em texto neste arquivo")
    ap.add_argument("--sem-usuarios", action="store_true", help="imprime só departamentos")
    args = ap.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    bx = Bitrix(args.webhook)
    print("Buscando departamentos...", file=sys.stderr)
    departments = fetch_departments(bx)
    print(f"  {len(departments)} departamentos", file=sys.stderr)
    print("Buscando usuários...", file=sys.stderr)
    users = fetch_users(bx, args.inativos)
    print(f"  {len(users)} usuários", file=sys.stderr)
    print("Buscando dados de RH (humanresources)...", file=sys.stderr)
    hr = fetch_hr(bx)
    print("  disponível" if hr["available"] else f"  indisponível: {hr.get('error')}", file=sys.stderr)

    result = build_tree(departments, users, hr)
    if args.raiz:
        root = find_node(result["arvore"], str(args.raiz))
        if not root:
            sys.exit(f"Departamento {args.raiz} não encontrado")
        result["arvore"] = [root]

    with open(args.saida, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    text = render_text(result["arvore"], show_users=not args.sem_usuarios)
    if result["usuarios_sem_departamento"] and not args.raiz and not args.sem_usuarios:
        text += "\n\n⚠ Usuários sem departamento:\n" + "\n".join(
            f"  👤 {u['nome']} — {u['cargo'] or '(sem cargo)'}" for u in result["usuarios_sem_departamento"])
    print(text)
    if args.texto:
        with open(args.texto, "w", encoding="utf-8") as f:
            f.write(text + "\n")

    r = result["resumo"]
    print(f"\nResumo: {r['departamentos']} departamentos, {r['usuarios']} usuários "
          f"({r['usuarios_ativos']} ativos), {r['cargos_distintos']} cargos. JSON salvo em {args.saida}",
          file=sys.stderr)


if __name__ == "__main__":
    main()
