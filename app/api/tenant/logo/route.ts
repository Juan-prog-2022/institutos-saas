import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { orgId, userId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Sin organización activa" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Máximo 5 MB" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.organizations.updateOrganizationLogo(orgId, {
      file,
      uploaderUserId: userId ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo subir el logo" }, { status: 500 });
  }
}
