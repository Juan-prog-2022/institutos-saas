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
      !("studentId" in body) ||
      typeof body.studentId !== "string" ||
      !("courseId" in body) ||
      typeof body.courseId !== "string" ||
      !("value" in body) ||
      typeof body.value !== "number" ||
      !Number.isFinite(body.value) ||
      body.value < 1 ||
      body.value > 10
    ) {
      return NextResponse.json(
        { error: "Seleccioná un alumno, un curso y una nota entre 1 y 10" },
        { status: 400 }
      );
    }

    const [student, course] = await Promise.all([
      prisma.student.findFirst({
        where: { id: body.studentId, tenantId: tenant.id },
        select: { id: true },
      }),
      prisma.course.findFirst({
        where: { id: body.courseId, tenantId: tenant.id },
        select: { id: true },
      }),
    ]);

    if (!student || !course) {
      return NextResponse.json(
        { error: "El alumno o el curso no pertenece a tu instituto" },
        { status: 400 }
      );
    }

    const updated = await prisma.grade.updateMany({
      where: { id, tenantId: tenant.id },
      data: { studentId: student.id, courseId: course.id, value: body.value },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    const grade = await prisma.grade.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      ...grade,
      studentName: `${grade.student.firstName} ${grade.student.lastName}`,
      grade: grade.value,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id } = await params;
    const result = await prisma.grade.deleteMany({
      where: { id, tenantId: tenant.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
