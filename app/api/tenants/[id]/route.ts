import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkSuperAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.student.deleteMany({ where: { tenantId: id } });
  await prisma.course.deleteMany({ where: { tenantId: id } });
  await prisma.user.deleteMany({ where: { tenantId: id } });
  await prisma.tenant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const { suspended } = await request.json();
  const tenant = await prisma.tenant.update({
    where: { id },
    data: { suspended: Boolean(suspended) },
  });
  return NextResponse.json(tenant);
}
