import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

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