import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  const { orgId } = await auth()
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress?? ""
  const superAdmin = isSuperAdmin(email)

  // 1. Superadmin sin org? Ve todo
  if (superAdmin &&!orgId) {
    const all = await prisma.course.findMany({
      select: { id: true, name: true, createdAt: true },
    })
    return NextResponse.json(all)
  }

  // 2. Instituto normal: busca su tenant
  if (!orgId) return NextResponse.json([])

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId }
  })
  if (!tenant) return NextResponse.json([])

  // 3. FILTRO REAL por tenantId
  const where = superAdmin? {} : { tenantId: tenant.id }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, createdAt: true },
  })
  return NextResponse.json(courses)
}

export async function POST(request: Request) {
  try {
    const tenant = await getCurrentTenant();
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "El nombre del curso es obligatorio" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: { name: body.name.trim(), tenantId: tenant.id },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}