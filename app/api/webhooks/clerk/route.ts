import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";

// Tipos mínimos de los eventos de Clerk
interface ClerkUser {
  id: string;
  email_addresses?: { email_address: string }[];
  first_name?: string | null;
  last_name?: string | null;
  organization_memberships?: { organization: { id: string; name: string; slug: string } }[];
}

interface ClerkOrg {
  id: string;
  name: string;
  slug: string;
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Falta CLERK_WEBHOOK_SIGNING_SECRET" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: ClerkUser & ClerkOrg };
  try {
    event = new Webhook(secret).verify(payload, headers) as unknown as typeof event;
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "organization.created": {
        const org = event.data;
        await prisma.tenant.upsert({
          where: { clerkOrgId: org.id },
          update: { name: org.name, slug: org.slug },
          create: { name: org.name, slug: org.slug, clerkOrgId: org.id },
        });
        break;
      }

      case "user.created":
      case "user.updated": {
        const u = event.data;
        const email = u.email_addresses?.[0]?.email_address ?? "";
        const firstOrg = u.organization_memberships?.[0]?.organization;

        if (firstOrg) {
          const tenant = await prisma.tenant.upsert({
            where: { clerkOrgId: firstOrg.id },
            update: {},
            create: { name: firstOrg.name, slug: firstOrg.slug, clerkOrgId: firstOrg.id },
          });
          await prisma.user.upsert({
            where: { clerkId: u.id },
            update: { email, name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() },
            create: {
              clerkId: u.id,
              email,
              name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
              role: isSuperAdmin(email) ? "SUPERADMIN" : "ADMIN",
              tenantId: tenant.id,
            },
          });
        }
        break;
      }

      case "user.deleted": {
        await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
        break;
      }

      case "organization.deleted": {
        const tenant = await prisma.tenant.findUnique({ where: { clerkOrgId: event.data.id } });
        if (tenant) {
          await prisma.student.deleteMany({ where: { tenantId: tenant.id } });
          await prisma.course.deleteMany({ where: { tenantId: tenant.id } });
          await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
          await prisma.tenant.delete({ where: { id: tenant.id } });
        }
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Error procesando evento" }, { status: 500 });
  }
}
