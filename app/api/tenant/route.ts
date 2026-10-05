import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";

// Crea o sincroniza el tenant a partir de la organización activa de Clerk
export async function POST() {
  const { userId, orgId, orgSlug } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión y tener una organización activa" },
      { status: 400 }
    );
  }

  const user = await currentUser();

  const tenant = await prisma.tenant.upsert({
    where: { clerkOrgId: orgId },
    update: {},
    create: {
      name: orgSlug ?? "Mi instituto",
      slug: orgSlug ?? orgId,
      clerkOrgId: orgId,
    },
  });

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email,
      name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      role: isSuperAdmin(email) ? "SUPERADMIN" : "ADMIN",
      tenantId: tenant.id,
    },
  });

  return NextResponse.json(tenant);
}

export async function GET() {
  const { orgId } = await auth();
  const user = await currentUser();
  const superAdmin = isSuperAdmin(user?.emailAddresses[0]?.emailAddress);
  if (!orgId) return NextResponse.json({ tenant: null, isSuperAdmin: superAdmin });
  const tenant = await prisma.tenant.findUnique({ where: { clerkOrgId: orgId } });
  return NextResponse.json({ tenant, isSuperAdmin: superAdmin });
}
