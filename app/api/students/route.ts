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
    const body = await request.json();

    const student = await prisma.student.create({
      data: { ...body, tenantId: tenant.id },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}