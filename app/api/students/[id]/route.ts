import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id } = await params;
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("firstName" in body) ||
      typeof body.firstName !== "string" ||
      !("lastName" in body) ||
      typeof body.lastName !== "string"
    ) {
      return NextResponse.json(
        { error: "Nombre y apellido son obligatorios" },
        { status: 400 }
      );
    }

    const firstName = body.firstName.trim();
    const lastName = body.lastName.trim();
    const email =
      "email" in body && typeof body.email === "string"
        ? body.email.trim()
        : "";

    if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Ingresá un nombre y apellido válidos (máximo 100 caracteres)" },
        { status: 400 }
      );
    }

    if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido" },
        { status: 400 }
      );
    }

    const result = await prisma.student.updateMany({
      where: { id, tenantId: tenant.id },
      data: { firstName, lastName, email: email || null },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }

    const student = await prisma.student.findFirst({
      where: { id, tenantId: tenant.id },
    });
    return NextResponse.json(student);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id } = await params;
    const student = await prisma.student.findFirst({
      where: { id, tenantId: tenant.id },
      select: {
        id: true,
        _count: { select: { grades: true, attendances: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }

    if (student._count.grades > 0 || student._count.attendances > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: el alumno tiene notas o asistencias registradas" },
        { status: 409 }
      );
    }

    await prisma.student.deleteMany({
      where: { id, tenantId: tenant.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
