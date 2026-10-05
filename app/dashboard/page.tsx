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

interface Course {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { tenantId, tenantSlug, setTenant } = useTenantStore();
  const [tenant, setTenantLocal] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState("");
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
    if (tenant) {
      loadStudents();
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  async function loadCourses() {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: courseName }),
    });
    if (res.ok) {
      setCourseName("");
      loadCourses();
    } else {
      setError((await res.json()).error);
    }
  }

  async function deleteCourse(id: string) {
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    loadCourses();
  }

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
              <h3 className="font-medium">Agregar estudiante</h3>
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

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Cursos ({courses.length})
            </h2>
            <form onSubmit={addCourse} className="mb-4 flex gap-2">
              <input
                className="flex-1 rounded-lg border p-2"
                placeholder="Nombre del curso"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
              <button className="rounded-lg bg-black px-4 py-2 text-white">
                Agregar
              </button>
            </form>
            <ul className="divide-y">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  {c.name}
                  <button
                    onClick={() => deleteCourse(c.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
              {courses.length === 0 && (
                <li className="py-2 text-zinc-400">Sin cursos aún.</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
