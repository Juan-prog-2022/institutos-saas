import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

function parseAttendanceBody(body: unknown) {
  if (
    typeof body !== "object" ||
    body === null ||
    !("studentId" in body) ||
    typeof body.studentId !== "string" ||
    !body.studentId ||
    !("courseId" in body) ||
    (body.courseId !== null && typeof body.courseId !== "string") ||
    !("present" in body) ||
    typeof body.present !== "boolean" ||
    !("date" in body) ||
    typeof body.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
  ) {
    return null;
  }

  const start = new Date(`${body.date}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== body.date) {
    return null;
  }

  return {
    studentId: body.studentId,
    courseId:
      typeof body.courseId === "string" && body.courseId ? body.courseId : null,
    present: body.present,
    date: start,
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id } = await params;
    const values = parseAttendanceBody(await request.json());

    if (!values) {
      return NextResponse.json(
        { error: "Alumno, estado y fecha válida son obligatorios" },
        { status: 400 }
      );
    }

    const [existing, student] = await Promise.all([
      prisma.attendance.findFirst({
        where: { id, tenantId: tenant.id },
        select: { id: true },
      }),
      prisma.student.findFirst({
        where: { id: values.studentId, tenantId: tenant.id },
        select: { id: true },
      }),
    ]);

    if (!existing) {
      return NextResponse.json(
        { error: "Asistencia no encontrada" },
        { status: 404 }
      );
    }
    if (!student) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }

    if (values.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          courseId: values.courseId,
          tenantId: tenant.id,
        },
        select: { courseId: true },
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: "El alumno no está asignado a este curso" },
          { status: 400 }
        );
      }
    }

    const end = new Date(values.date);
    end.setUTCDate(end.getUTCDate() + 1);
    const duplicate = await prisma.attendance.findFirst({
      where: {
        id: { not: id },
        studentId: student.id,
        courseId: values.courseId,
        tenantId: tenant.id,
        date: { gte: values.date, lt: end },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Ya existe una asistencia para este alumno, curso y fecha" },
        { status: 409 }
      );
    }

    const result = await prisma.attendance.updateMany({
      where: { id, tenantId: tenant.id },
      data: { ...values, studentId: student.id },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Asistencia no encontrada" },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id } = await params;
    const result = await prisma.attendance.deleteMany({
      where: { id, tenantId: tenant.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Asistencia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
