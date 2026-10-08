import { redirect } from "next/navigation";
import { checkSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TenantActions from "./tenant-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SuperAdminPage() {
  if (!(await checkSuperAdmin())) {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true, users: true } } },
  });

  return (
    <main className="min-h-screen bg-zinc-50 p-4 sm:p-8">
      <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Super Admin — Institutos</h1>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Org ID</TableHead>
              <TableHead>Alumnos</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <code>{t.slug}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.clerkOrgId}</TableCell>
                <TableCell>{t._count.students}</TableCell>
                <TableCell>{t._count.users}</TableCell>
                <TableCell>
                  {t.createdAt.toLocaleDateString("es")}
                </TableCell>
                <TableCell>
                  {t.suspended ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      Suspendido
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                      Activo
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <TenantActions id={t.id} suspended={t.suspended} />
                </TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay institutos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
