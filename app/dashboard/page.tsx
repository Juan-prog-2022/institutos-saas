"use client";

import { useEffect, useState } from "react";
import { OrganizationSwitcher, UserButton, useOrganization } from "@clerk/nextjs";
import { useTenantStore } from "@/store/useTenantStore";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { tenantId, tenantSlug, setTenant } = useTenantStore();
  const [tenant, setTenantLocal] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el tenant activo y cargarlo en Zustand
  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        setIsSuperAdmin(Boolean(data.isSuperAdmin));
        if (data.tenant) {
          setTenantLocal(data.tenant);
          setTenant(data.tenant.id, data.tenant.slug);
        }
      });
  }, [organization, setTenant]);

  useEffect(() => {
    if (tenant) loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  async function loadStudents() {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
    else setError((await res.json()).error);
  }

  async function createTenant() {
    const res = await fetch("/api/tenant", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setTenantLocal(data);
      setTenant(data.id, data.slug);
    } else {
      setError(data.error);
    }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email }),
    });
    if (res.ok) {
      setFirstName("");
      setLastName("");
      setEmail("");
      loadStudents();
    } else {
      setError((await res.json()).error);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <header className="mb-8 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">🏫 Panel del instituto</h1>
        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <a href="/superadmin" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white">
              ⚙️ Superadmin
            </a>
          )}
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {!tenant ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-4">
            No hay instituto registrado para tu organización actual. Créalo para
            empezar.
          </p>
          <button
            onClick={createTenant}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Crear instituto
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold">Instituto: {tenant.name}</h2>
            <p className="mb-4 text-sm text-zinc-500">
              tenantId (Zustand): <code>{tenantId}</code> · slug:{" "}
              <code>{tenantSlug}</code>
            </p>
            <form onSubmit={addStudent} className="flex flex-col gap-3">
              <input
                className="rounded-lg border p-2"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="rounded-lg border p-2"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                className="rounded-lg border p-2"
                placeholder="Email (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="rounded-lg bg-black px-4 py-2 text-white">
                Agregar estudiante
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Estudiantes ({students.length})
            </h2>
            <ul className="divide-y">
              {students.map((s) => (
                <li key={s.id} className="py-2">
                  {s.firstName} {s.lastName}
                  {s.email && (
                    <span className="ml-2 text-sm text-zinc-400">{s.email}</span>
                  )}
                </li>
              ))}
              {students.length === 0 && (
                <li className="py-2 text-zinc-400">Sin estudiantes aún.</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
