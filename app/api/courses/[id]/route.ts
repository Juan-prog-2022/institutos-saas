import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";
import { getCurrentTenant } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const { orgId } = await auth();
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? "";
    const isAdminWithoutOrganization = isSuperAdmin(email) && !orgId;

    let result;
    if (isAdminWithoutOrganization) {
      result = await prisma.course.deleteMany({ where: { id } });
    } else {
      const tenant = await getCurrentTenant();
      result = await prisma.course.deleteMany({
        where: { id, tenantId: tenant.id },
      });
    }

    if (result.count === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
