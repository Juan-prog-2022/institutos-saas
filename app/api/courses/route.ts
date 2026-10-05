import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = await getCurrentTenant();
    const courses = await prisma.course.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getCurrentTenant();
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { name, tenantId: tenant.id },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
