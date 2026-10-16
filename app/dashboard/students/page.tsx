"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

async function responseError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }
  return fallback;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      try {
        const response = await fetch("/api/students", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los alumnos");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("La respuesta de alumnos no tiene el formato esperado");
        }
        setStudents(data as Student[]);
      } catch {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        toast.error("No se pudieron cargar los alumnos");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadStudents();
    return () => controller.abort();
  }, []);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setEditingId(null);
  }

  function startEditing(student: Student) {
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setEmail(student.email ?? "");
    setEditingId(student.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };
    if (!payload.firstName || !payload.lastName) {
      toast.error("Ingresá el nombre y apellido del alumno");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/students/${editingId}` : "/api/students",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(await responseError(response, "No se pudo guardar el alumno"));
      }

      const student = (await response.json()) as Student;
      setStudents((current) =>
        [...current.filter(({ id }) => id !== student.id), student].sort(
          (left, right) =>
            left.lastName.localeCompare(right.lastName, "es") ||
            left.firstName.localeCompare(right.firstName, "es")
        )
      );
      resetForm();
      toast.success(editingId ? "Alumno actualizado" : "Alumno creado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el alumno");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student: Student) {
    if (
      !window.confirm(
        `¿Eliminar a ${student.firstName} ${student.lastName}?`
      )
    ) {
      return;
    }

    setDeletingId(student.id);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          await responseError(response, "No se pudo eliminar el alumno")
        );
      }
      setStudents((current) => current.filter(({ id }) => id !== student.id));
      if (editingId === student.id) resetForm();
      toast.success("Alumno eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el alumno");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 pb-28 sm:px-6 md:pb-10 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Gestión académica
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Alumnos
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Creá, editá y eliminá los alumnos de tu instituto.
        </p>
      </header>

      <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-semibold text-slate-900">
            {editingId ? "Editar alumno" : "Agregar alumno"}
          </CardTitle>
          {editingId && (
            <Button
              aria-label="Cancelar edición"
              onClick={resetForm}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveStudent}>
            <Input
              aria-label="Nombre"
              autoComplete="given-name"
              maxLength={100}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Nombre"
              required
              value={firstName}
            />
            <Input
              aria-label="Apellido"
              autoComplete="family-name"
              maxLength={100}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Apellido"
              required
              value={lastName}
            />
            <Input
              aria-label="Correo electrónico"
              autoComplete="email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Correo electrónico (opcional)"
              type="email"
              value={email}
            />
            <div className="flex gap-2 sm:justify-end">
              <Button disabled={saving} type="submit">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear alumno"}
              </Button>
              {editingId && (
                <Button onClick={resetForm} type="button" variant="outline">
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-busy={loading} aria-labelledby="students-heading">
        <h2
          className="mb-3 text-lg font-semibold text-slate-900"
          id="students-heading"
        >
          Alumnos registrados
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
        ) : loadFailed ? (
          <p className="text-sm text-destructive" role="alert">
            No se pudo obtener la lista de alumnos.
          </p>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
              <Users aria-hidden="true" className="size-5" />
              Todavía no hay alumnos registrados.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <li key={student.id}>
                <Card className="flex-row items-center justify-between rounded-2xl border-0 bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {student.email || "Sin correo electrónico"}
                    </p>
                  </div>
                  <div className="ml-2 flex shrink-0">
                    <Button
                      aria-label={`Editar alumno ${student.firstName} ${student.lastName}`}
                      onClick={() => startEditing(student)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Eliminar alumno ${student.firstName} ${student.lastName}`}
                      disabled={deletingId === student.id}
                      onClick={() => void deleteStudent(student)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
