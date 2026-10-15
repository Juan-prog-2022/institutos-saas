"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Course = {
  id: string;
  name: string;
  createdAt: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los cursos");
        setCourses((await response.json()) as Course[]);
      } catch {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        toast.error("No se pudieron cargar los cursos");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCourses();
    return () => controller.abort();
  }, []);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const courseName = name.trim();
    if (!courseName) {
      toast.error("Ingresá el nombre del curso");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: courseName }),
      });
      if (!response.ok) throw new Error("No se pudo crear el curso");

      const course = (await response.json()) as Course;
      setCourses((current) =>
        [...current, course].sort((left, right) =>
          left.name.localeCompare(right.name, "es")
        )
      );
      setName("");
      toast.success("Curso creado");
    } catch {
      toast.error("No se pudo crear el curso");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`¿Eliminar el curso "${course.name}"?`)) return;

    setDeletingId(course.id);
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("No se pudo eliminar el curso");

      setCourses((current) => current.filter(({ id }) => id !== course.id));
      toast.success("Curso eliminado");
    } catch {
      toast.error("No se pudo eliminar el curso");
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
          Cursos
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Administrá los cursos de tu instituto.
        </p>
      </header>

      <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
        <CardHeader>
          <CardTitle className="font-semibold text-slate-900">
            Agregar curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={createCourse}
          >
            <Input
              aria-label="Nombre del curso"
              autoComplete="off"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej.: Matemática 1° año"
              required
              value={name}
            />
            <Button disabled={saving} type="submit">
              {saving ? "Guardando..." : "Crear curso"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section aria-busy={loading} aria-labelledby="courses-heading">
        <h2 className="mb-3 text-lg font-semibold text-slate-900" id="courses-heading">
          Cursos existentes
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando cursos...</p>
        ) : loadFailed ? (
          <p role="alert" className="text-sm text-destructive">
            No se pudo obtener la lista de cursos.
          </p>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
              <BookOpen aria-hidden="true" className="size-5" />
              Todavía no hay cursos creados.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <li key={course.id}>
                <Card className="flex-row items-center justify-between rounded-2xl border-0 bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <span className="font-medium">{course.name}</span>
                  <Button
                    aria-label={`Eliminar curso ${course.name}`}
                    disabled={deletingId === course.id}
                    onClick={() => void deleteCourse(course)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
