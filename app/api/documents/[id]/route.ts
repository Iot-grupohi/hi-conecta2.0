import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canReadEmployeeDocument } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const document = await prisma.employeeDocument.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  const allowed = canReadEmployeeDocument({
    role: session.user.role as Role,
    viewerEmployeeId: session.user.employeeId,
    documentEmployeeId: document.employeeId,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "uploads", "documents", document.filePath);
  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no armazenamento" }, { status: 404 });
  }
}
