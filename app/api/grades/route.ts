import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const { orgId } = await auth()
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress?? ""
  const superAdmin = isSuperAdmin(email)

  // 1. Superadmin sin org? Ve todo
  if (superAdmin &&!orgId) {
    const all = await prisma.grade.findMany()
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

  const grades = await prisma.grade.findMany({
    where
  })
  return NextResponse.json(grades)
}