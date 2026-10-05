import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getCurrentTenant();
    const grades = await prisma.grade.findMany({
      where: { tenantId: tenant.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(grades);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getCurrentTenant();
    const { studentId, courseId, value } = await request.json();

    if (!studentId || typeof value !== "number") {
      return NextResponse.json(
        { error: "studentId y value (número) son requeridos" },
        { status: 400 }
      );
    }

    const grade = await prisma.grade.create({
      data: { studentId, courseId: courseId || null, value, tenantId: tenant.id },
    });
    return NextResponse.json(grade, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
