import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toDisplayCase } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const needle = q.toLowerCase();
  const cpfNeedle = q.replace(/\D/g, "");

  const employees = await prisma.employee.findMany({
    include: { position: true, department: true },
    orderBy: { name: "asc" },
  });

  const results = employees
    .filter((employee) => {
      const haystack = [
        employee.name,
        employee.cpf,
        employee.externalCode,
        employee.position?.name,
        employee.department?.name,
        employee.contractType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (haystack.includes(needle)) return true;
      if (cpfNeedle.length >= 3 && (employee.cpf ?? "").replace(/\D/g, "").includes(cpfNeedle)) {
        return true;
      }
      return false;
    })
    .slice(0, 8)
    .map((employee) => ({
      id: employee.id,
      name: toDisplayCase(employee.name),
      cpf: employee.cpf,
      status: employee.status,
      positionName: employee.position?.name ? toDisplayCase(employee.position.name) : null,
      departmentName: employee.department?.name ? toDisplayCase(employee.department.name) : null,
    }));

  return NextResponse.json({ results, query: q });
}
