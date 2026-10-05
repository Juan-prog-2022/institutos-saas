import { redirect } from "next/navigation";
import { checkSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TenantActions from "./tenant-actions";

export default async function SuperAdminPage() {
  if (!(await checkSuperAdmin())) {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true, users: true } } },
  });

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <h1 className="mb-6 text-2xl font-bold">Super Admin — Institutos</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Org ID</th>
              <th className="p-3">Alumnos</th>
              <th className="p-3">Usuarios</th>
              <th className="p-3">Creado</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="p-3">{t.name}</td>
                <td className="p-3">
                  <code>{t.slug}</code>
                </td>
                <td className="p-3 text-zinc-500">{t.clerkOrgId}</td>
                <td className="p-3">{t._count.students}</td>
                <td className="p-3">{t._count.users}</td>
                <td className="p-3">
                  {t.createdAt.toLocaleDateString("es")}
                </td>
                <td className="p-3">
                  {t.suspended ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      Suspendido
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                      Activo
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <TenantActions id={t.id} suspended={t.suspended} />
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-zinc-400">
                  No hay institutos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
