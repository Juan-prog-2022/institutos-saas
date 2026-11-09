import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { orgId } = await auth();
    const user = await currentUser();
    const superAdmin = isSuperAdmin(user?.emailAddresses[0]?.emailAddress ?? "");

    if (!orgId &&  !superAdmin) return NextResponse.json([]);

    let tenantId: string | undefined;
    if(!superAdmin) {
      const tenant = await prisma.tenant.findUnique({
        where: {clerkOrgId: orgId!},
        select: {id: true}
      });
      if(!tenant) return NextResponse.json([]);
      tenantId = tenant.id;
    }


    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    const date = url.searchParams.get("date");
    const where: {
      tenantId?: string;
      courseId?: string;
      date?: { gte: Date; lt: Date };
    } = {};

    if(tenantId) where.tenantId = tenantId;

    if (courseId) where.courseId = courseId;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "La fecha no es válida" }, { status: 400 });
      }
      const start = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) {
        return NextResponse.json({ error: "La fecha no es válida" }, { status: 400 });
      }
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.date = { gte: start, lt: end };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true } },
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
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("studentId" in body) ||
      typeof body.studentId !== "string" ||
      !body.studentId ||
      !("present" in body) ||
      typeof body.present !== "boolean" ||
      !("date" in body) ||
      typeof body.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ) {
      return NextResponse.json(
        { error: "Alumno, estado y fecha válida son obligatorios" },
        { status: 400 }
      );
    }

    const start = new Date(`${body.date}T12:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== body.date) {
      return NextResponse.json({ error: "La fecha no es válida" }, { status: 400 });
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const courseId =
      "courseId" in body && typeof body.courseId === "string" && body.courseId
        ? body.courseId
        : null;

    const student = await prisma.student.findFirst({
      where: { id: body.studentId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }

    if (courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: student.id, courseId, tenantId: tenant.id },
        select: { courseId: true },
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: "El alumno no está asignado a este curso" },
          { status: 400 }
        );
      }
    }

    const duplicate = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        courseId,
        tenantId: tenant.id,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Ya existe una asistencia para este alumno, curso y fecha" },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        courseId,
        present: body.present,
        date: start,
        tenantId: tenant.id,
      },
    });
    return NextResponse.json(attendance, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
