"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { DOCUMENT_TYPE_TAGS } from "@/lib/tags";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type DocumentActionState = {
  error?: string;
  success?: string;
};

function uploadsDir() {
  return path.join(process.cwd(), "uploads", "documents");
}

export async function uploadEmployeeDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  try {
    const session = await requirePermission("employees:update");
    const employeeId = String(formData.get("employeeId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const documentType = String(formData.get("documentType") ?? "outros");
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const file = formData.get("file");

    if (!employeeId) return { error: "Colaborador inválido." };
    if (!title) return { error: "Informe o título do documento." };
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Selecione um arquivo para anexar." };
    }
    if (file.size > MAX_SIZE) return { error: "Arquivo maior que 10MB." };
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return { error: "Tipo de arquivo não permitido. Use PDF, imagem ou Word." };
    }
    if (!DOCUMENT_TYPE_TAGS.some((tag) => tag.key === documentType)) {
      return { error: "Tipo de documento inválido." };
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return { error: "Colaborador não encontrado." };

    await mkdir(uploadsDir(), { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${employeeId}_${Date.now()}_${safeName}`;
    const absolutePath = path.join(uploadsDir(), storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    await prisma.employeeDocument.create({
      data: {
        employeeId,
        title,
        documentType,
        fileName: file.name,
        filePath: storedName,
        mimeType: file.type || null,
        fileSize: file.size,
        notes,
        uploadedBy: session.user.email,
      },
    });

    revalidatePath(`/colaboradores/${employeeId}`);
    revalidatePath("/documentos");
    return { success: "Documento anexado com sucesso." };
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Você não tem permissão para anexar documentos." };
    }
    console.error(error);
    return { error: "Não foi possível anexar o documento." };
  }
}

export async function deleteEmployeeDocumentAction(formData: FormData): Promise<void> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const document = await prisma.employeeDocument.findUnique({ where: { id } });
    if (!document) return;

    try {
      await unlink(path.join(uploadsDir(), document.filePath));
    } catch {
      // file may already be missing
    }

    await prisma.employeeDocument.delete({ where: { id } });
    revalidatePath(`/colaboradores/${document.employeeId}`);
    revalidatePath("/documentos");
  } catch (error) {
    console.error(error);
  }
}
