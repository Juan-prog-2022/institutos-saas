"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Course = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

type GradeRow = {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
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

export default function CalificacionesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const [studentsFailed, setStudentsFailed] = useState(false);
  const [gradesFailed, setGradesFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFormOptions() {
      const [courseResult, studentResult] = await Promise.allSettled([
        fetch("/api/courses", { signal: controller.signal }),
        fetch("/api/students", { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      let courseFailed = false;
      let studentFailed = false;
      if (courseResult.status === "fulfilled" && courseResult.value.ok) {
        try {
          const data: unknown = await courseResult.value.json();
          if (Array.isArray(data)) setCourses(data as Course[]);
          else courseFailed = true;
        } catch {
          courseFailed = true;
        }
      } else {
        courseFailed = true;
      }
      if (studentResult.status === "fulfilled" && studentResult.value.ok) {
        try {
          const data: unknown = await studentResult.value.json();
          if (Array.isArray(data)) setStudents(data as Student[]);
          else studentFailed = true;
        } catch {
          studentFailed = true;
        }
      } else {
        studentFailed = true;
      }
      if (courseFailed || studentFailed) {
        setCoursesFailed(courseFailed);
        setStudentsFailed(studentFailed);
        toast.error("No se pudieron cargar los cursos o los alumnos");
      }
      setLoadingCourses(false);
    }

    void loadFormOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;

    const controller = new AbortController();

    async function loadGrades() {
      try {
        const params = new URLSearchParams({ courseId: selectedCourse });
        const response = await fetch(`/api/grades?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar las notas");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("La respuesta de notas no tiene el formato esperado");
        }
        setRows(data as GradeRow[]);
      } catch {
        if (controller.signal.aborted) return;
        setGradesFailed(true);
        toast.error("No se pudieron cargar las notas");
      } finally {
        if (!controller.signal.aborted) setLoadingGrades(false);
      }
    }

    void loadGrades();
    return () => controller.abort();
  }, [selectedCourse]);

  function resetForm() {
    setEditingId(null);
    setSelectedStudent("");
    setGradeValue("");
  }

  function startEditing(row: GradeRow) {
    setEditingId(row.id);
    setSelectedStudent(row.studentId);
    setGradeValue(String(row.grade));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(gradeValue);
    if (!selectedStudent || !Number.isFinite(value) || value < 1 || value > 10) {
      toast.error("Seleccioná un alumno e ingresá una nota entre 1 y 10");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/grades/${editingId}` : "/api/grades",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudent,
            courseId: selectedCourse,
            value,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(await responseError(response, "No se pudo guardar la nota"));
      }

      const row = (await response.json()) as GradeRow;
      setRows((current) =>
        [row, ...current.filter(({ id }) => id !== row.id)]
      );
      resetForm();
      toast.success(editingId ? "Nota actualizada" : "Nota creada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la nota");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGrade(row: GradeRow) {
    if (!window.confirm(`¿Eliminar la nota de ${row.studentName}?`)) return;

    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/grades/${row.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await responseError(response, "No se pudo eliminar la nota"));
      }
      setRows((current) => current.filter(({ id }) => id !== row.id));
      if (editingId === row.id) resetForm();
      toast.success("Nota eliminada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la nota");
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
          Notas
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Administrá las calificaciones de cada curso.
        </p>
      </header>

      <Card className="max-w-3xl rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="grade-course">
              Curso
            </label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loadingCourses || coursesFailed || courses.length === 0}
              id="grade-course"
              onChange={(event) => {
                resetForm();
                setRows([]);
                setGradesFailed(false);
                setLoadingGrades(event.target.value !== "");
                setSelectedCourse(event.target.value);
              }}
              value={selectedCourse}
            >
              <option value="">
                {loadingCourses ? "Cargando cursos..." : "Seleccioná un curso"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {coursesFailed && (
              <p className="text-sm text-destructive" role="alert">
                No se pudo obtener la lista de cursos.
              </p>
            )}
            {!loadingCourses && !coursesFailed && courses.length === 0 && (
              <p className="text-sm text-slate-500">
                Primero creá un curso para cargar notas.
              </p>
            )}
          </div>

          {selectedCourse && (
            <form className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]" onSubmit={saveGrade}>
              <select
                aria-label="Alumno"
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={studentsFailed || students.length === 0}
                onChange={(event) => setSelectedStudent(event.target.value)}
                required
                value={selectedStudent}
              >
                <option value="">
                  {studentsFailed ? "No se pudieron cargar alumnos" : "Seleccioná un alumno"}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.lastName}, {student.firstName}
                  </option>
                ))}
              </select>
              <Input
                aria-label="Nota"
                max="10"
                min="1"
                onChange={(event) => setGradeValue(event.target.value)}
                placeholder="Nota (1 a 10)"
                required
                step="0.1"
                type="number"
                value={gradeValue}
              />
              <div className="flex gap-2">
                <Button
                  disabled={saving || studentsFailed || students.length === 0}
                  type="submit"
                >
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Guardar"
                      : "Agregar nota"}
                </Button>
                {editingId && (
                  <Button onClick={resetForm} type="button" variant="outline">
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </div>
              {studentsFailed && (
                <p className="text-sm text-destructive sm:col-span-3" role="alert">
                  No se pudo obtener la lista de alumnos.
                </p>
              )}
              {!studentsFailed && students.length === 0 && !loadingCourses && (
                <p className="text-sm text-slate-500 sm:col-span-3">
                  Primero registrá alumnos para poder asignarles notas.
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {loadingGrades ? (
        <p aria-live="polite" className="text-sm text-slate-500">
          Cargando notas...
        </p>
      ) : selectedCourse && gradesFailed ? (
        <p className="text-sm text-destructive" role="alert">
          No se pudieron obtener las notas de este curso.
        </p>
      ) : !selectedCourse ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ClipboardList aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-800">Seleccioná un curso</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Elegí un curso para consultar y administrar las notas de sus alumnos.
            </p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Este curso todavía no tiene notas registradas.
          </CardContent>
        </Card>
      ) : (
        <section aria-labelledby="grades-heading">
          <h2 className="mb-3 text-lg font-semibold text-slate-900" id="grades-heading">
            {rows.length} {rows.length === 1 ? "nota registrada" : "notas registradas"}
          </h2>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {row.studentName}
                      </p>
                      <span className="mt-1 inline-flex rounded-lg bg-indigo-50 px-3 py-1 font-bold text-indigo-700">
                        {row.grade.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        aria-label={`Editar nota de ${row.studentName}`}
                        onClick={() => startEditing(row)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        aria-label={`Eliminar nota de ${row.studentName}`}
                        disabled={deletingId === row.id}
                        onClick={() => void deleteGrade(row)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
