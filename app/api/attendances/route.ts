import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getCurrentTenant();
    const attendances = await prisma.attendance.findMany({
      where: { tenantId: tenant.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        course: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(attendances);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getCurrentTenant();
    const { studentId, courseId, present } = await request.json();

    if (!studentId || typeof present !== "boolean") {
      return NextResponse.json(
        { error: "studentId y present (boolean) son requeridos" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: { studentId, courseId: courseId || null, present, tenantId: tenant.id },
    });
    return NextResponse.json(attendance, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
