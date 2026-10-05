import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
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

  // Nombre real de la organización (no el slug)
  let orgName = orgSlug ?? "Mi instituto";
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: orgId });
    if (org?.name) orgName = org.name;
  } catch {
    // Si falla, usamos el slug como respaldo
  }

  const tenant = await prisma.tenant.upsert({
    where: { clerkOrgId: orgId },
    update: { name: orgName, slug: orgSlug ?? orgId },
    create: {
      name: orgName,
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
  const { orgId, orgSlug } = await auth();
  const user = await currentUser();
  const superAdmin = isSuperAdmin(user?.emailAddresses[0]?.emailAddress);
  if (!orgId) return NextResponse.json({ tenant: null, isSuperAdmin: superAdmin });
  let tenant = await prisma.tenant.findUnique({ where: { clerkOrgId: orgId } });

  // Sincroniza el nombre real de la organización si cambió
  if (tenant) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      if (org?.name && org.name !== tenant.name) {
        tenant = await prisma.tenant.update({
          where: { id: tenant.id },
          data: { name: org.name, slug: orgSlug ?? tenant.slug },
        });
      }
    } catch {
      // ignorar
    }
  }
  return NextResponse.json({ tenant, isSuperAdmin: superAdmin });
}
