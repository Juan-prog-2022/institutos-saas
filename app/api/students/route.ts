// app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getCurrentTenant();
    const students = await prisma.student.findMany({
      where: { tenantId: tenant.id },
      orderBy: { lastName: 'asc' },
    });
    return NextResponse.json(students);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getCurrentTenant();
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

    const student = await prisma.student.create({
      data: { firstName, lastName, email: email || null, tenantId: tenant.id },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}