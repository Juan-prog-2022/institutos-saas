import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

async function getCourseForTenant(courseId: string, tenantId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: { id: true },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id: courseId } = await params;
    const course = await getCourseForTenant(courseId, tenant.id);

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const [enrollments, availableStudents] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId, tenantId: tenant.id },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [
          { student: { lastName: "asc" } },
          { student: { firstName: "asc" } },
        ],
      }),
      prisma.student.findMany({
        where: {
          tenantId: tenant.id,
          enrollments: { none: { courseId, tenantId: tenant.id } },
        },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

    return NextResponse.json({
      enrolled: enrollments.map(({ id, student, createdAt }) => ({
        enrollmentId: id,
        student,
        createdAt,
      })),
      availableStudents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id: courseId } = await params;
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("studentId" in body) ||
      typeof body.studentId !== "string" ||
      !body.studentId
    ) {
      return NextResponse.json(
        { error: "Seleccioná un alumno para asignar" },
        { status: 400 }
      );
    }

    const [course, student] = await Promise.all([
      getCourseForTenant(courseId, tenant.id),
      prisma.student.findFirst({
        where: { id: body.studentId, tenantId: tenant.id },
        select: { id: true },
      }),
    ]);

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    if (!student) {
      return NextResponse.json(
        { error: "Alumno no encontrado en este instituto" },
        { status: 404 }
      );
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_courseId: { studentId: student.id, courseId: course.id },
      },
      update: {},
      create: {
        studentId: student.id,
        courseId: course.id,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const tenant = await getCurrentTenant();
    const { id: courseId } = await params;
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("studentId" in body) ||
      typeof body.studentId !== "string" ||
      !body.studentId
    ) {
      return NextResponse.json(
        { error: "No se indicó el alumno a quitar del curso" },
        { status: 400 }
      );
    }

    const course = await getCourseForTenant(courseId, tenant.id);
    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const result = await prisma.enrollment.deleteMany({
      where: {
        courseId,
        studentId: body.studentId,
        tenantId: tenant.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "El alumno no está asignado a este curso" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
