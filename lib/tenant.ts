import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Resuelve el tenant activo a partir de la organización de Clerk.
 * Lanza error si no hay sesión o no hay tenant.
 */
export async function getCurrentTenant() {
  const { userId, orgId } = await auth();

  if (!userId) throw new Error("No autenticado");
  if (!orgId) throw new Error("No hay organización activa");

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!tenant) throw new Error("Tenant no encontrado");
  return tenant;
}
