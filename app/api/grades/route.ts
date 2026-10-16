import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getCurrentTenant } from "@/lib/tenant";

export async function GET(request: Request) {
  const { orgId } = await auth()
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress?? ""
  const superAdmin = isSuperAdmin(email)
  const courseId = new URL(request.url).searchParams.get("courseId")

  const where: { courseId?: string; tenantId?: string } = {};
  if (courseId) where.courseId = courseId;

  if (!orgId && !superAdmin) return NextResponse.json([]);

  if (!superAdmin) {
    if (!orgId) return NextResponse.json([]);
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });
    if (!tenant) return NextResponse.json([]);
    where.tenantId = tenant.id;
  }

  const grades = await prisma.grade.findMany({
    where,
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    grades.map(({ student, value, ...grade }) => ({
      ...grade,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: value,
    }))
  );
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

    const grade = await prisma.grade.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        tenantId: tenant.id,
        value: body.value,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      {
        ...grade,
        studentName: `${grade.student.firstName} ${grade.student.lastName}`,
        grade: grade.value,
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}