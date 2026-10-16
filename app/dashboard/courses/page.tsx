"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BookOpen, Trash2, UserPlus, UserRoundMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Course = {
  id: string;
  name: string;
  createdAt: string;
};

type CourseStudent = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type EnrollmentList = {
  enrolled: { enrollmentId: string; student: CourseStudent }[];
  availableStudents: CourseStudent[];
};

async function getErrorMessage(response: Response, fallback: string) {
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentList>>({});
  const [loadingRosterId, setLoadingRosterId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<
    Record<string, string>
  >({});
  const [enrollmentAction, setEnrollmentAction] = useState<string | null>(null);

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

  async function loadEnrollments(courseId: string) {
    setLoadingRosterId(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/students`);
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "No se pudo cargar la lista de alumnos")
        );
      }
      const data = (await response.json()) as EnrollmentList;
      setEnrollments((current) => ({ ...current, [courseId]: data }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la lista de alumnos"
      );
    } finally {
      setLoadingRosterId(null);
    }
  }

  async function toggleRoster(courseId: string) {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);
    if (!enrollments[courseId]) await loadEnrollments(courseId);
  }

  async function updateEnrollment(
    courseId: string,
    studentId: string,
    method: "POST" | "DELETE"
  ) {
    setEnrollmentAction(`${courseId}:${studentId}`);
    try {
      const response = await fetch(`/api/courses/${courseId}/students`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            method === "POST"
              ? "No se pudo asignar el alumno"
              : "No se pudo quitar el alumno"
          )
        );
      }
      await loadEnrollments(courseId);
      setSelectedStudentIds((current) => ({ ...current, [courseId]: "" }));
      toast.success(
        method === "POST" ? "Alumno asignado al curso" : "Alumno quitado del curso"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : method === "POST"
            ? "No se pudo asignar el alumno"
            : "No se pudo quitar el alumno"
      );
    } finally {
      setEnrollmentAction(null);
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
                <Card className="rounded-2xl border-0 bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{course.name}</span>
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
                  </div>
                  <Button
                    aria-expanded={expandedCourseId === course.id}
                    className="mt-2 w-full justify-start"
                    onClick={() => void toggleRoster(course.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Users aria-hidden="true" className="mr-2 size-4" />
                    {expandedCourseId === course.id
                      ? "Ocultar alumnos"
                      : "Administrar alumnos"}
                  </Button>
                  {expandedCourseId === course.id && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {loadingRosterId === course.id ? (
                        <p className="text-sm text-slate-500">
                          Cargando alumnos...
                        </p>
                      ) : enrollments[course.id] ? (
                        <>
                          <p className="mb-3 text-sm font-medium text-slate-700">
                            {enrollments[course.id].enrolled.length}{" "}
                            {enrollments[course.id].enrolled.length === 1
                              ? "alumno asignado"
                              : "alumnos asignados"}
                          </p>
                          {enrollments[course.id].availableStudents.length > 0 ? (
                            <div className="flex gap-2">
                              <select
                                aria-label={`Alumno para asignar a ${course.name}`}
                                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onChange={(event) =>
                                  setSelectedStudentIds((current) => ({
                                    ...current,
                                    [course.id]: event.target.value,
                                  }))
                                }
                                value={selectedStudentIds[course.id] ?? ""}
                              >
                                <option value="">Seleccioná un alumno</option>
                                {enrollments[course.id].availableStudents.map(
                                  (student) => (
                                    <option key={student.id} value={student.id}>
                                      {student.lastName}, {student.firstName}
                                    </option>
                                  )
                                )}
                              </select>
                              <Button
                                aria-label={`Asignar alumno a ${course.name}`}
                                disabled={
                                  !selectedStudentIds[course.id] ||
                                  enrollmentAction !== null
                                }
                                onClick={() => {
                                  const studentId = selectedStudentIds[course.id];
                                  if (studentId) {
                                    void updateEnrollment(
                                      course.id,
                                      studentId,
                                      "POST"
                                    );
                                  }
                                }}
                                size="icon"
                                type="button"
                              >
                                <UserPlus aria-hidden="true" className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              {enrollments[course.id].enrolled.length === 0
                                ? "No hay alumnos registrados para asignar."
                                : "Todos los alumnos están asignados a este curso."}
                            </p>
                          )}
                          {enrollments[course.id].enrolled.length > 0 && (
                            <ul className="mt-3 divide-y divide-slate-100">
                              {enrollments[course.id].enrolled.map(
                                ({ enrollmentId, student }) => (
                                  <li
                                    className="flex items-center justify-between gap-2 py-2"
                                    key={enrollmentId}
                                  >
                                    <span className="min-w-0 truncate text-sm text-slate-700">
                                      {student.lastName}, {student.firstName}
                                    </span>
                                    <Button
                                      aria-label={`Quitar a ${student.firstName} ${student.lastName} de ${course.name}`}
                                      disabled={enrollmentAction !== null}
                                      onClick={() =>
                                        void updateEnrollment(
                                          course.id,
                                          student.id,
                                          "DELETE"
                                        )
                                      }
                                      size="icon"
                                      type="button"
                                      variant="ghost"
                                    >
                                      <UserRoundMinus
                                        aria-hidden="true"
                                        className="size-4"
                                      />
                                    </Button>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={() => void loadEnrollments(course.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Reintentar
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
