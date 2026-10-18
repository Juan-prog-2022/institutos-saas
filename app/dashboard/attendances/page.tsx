"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarCheck, Pencil, Plus, Trash2, X } from "lucide-react";
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

type Attendance = {
  id: string;
  studentId: string;
  student: Student;
  courseId: string | null;
  course: { id: string; name: string } | null;
  present: boolean;
  date: string;
};

type CourseStudentsResponse = {
  enrolled: { student: Student }[];
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

function localDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatAttendanceDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function AttendancesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => localDateValue());
  const [present, setPresent] = useState("true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const [recordsFailed, setRecordsFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los cursos");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("La respuesta de cursos no tiene el formato esperado");
        }
        setCourses(data as Course[]);
      } catch {
        if (controller.signal.aborted) return;
        setCoursesFailed(true);
        toast.error("No se pudieron cargar los cursos");
      } finally {
        if (!controller.signal.aborted) setLoadingCourses(false);
      }
    }

    void loadCourses();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCourse || !selectedDate) return;

    const controller = new AbortController();

    async function loadCourseAttendance() {
      setLoadingRecords(true);
      setRecordsFailed(false);
      const params = new URLSearchParams({
        courseId: selectedCourse,
        date: selectedDate,
      });
      const [rosterResult, attendanceResult] = await Promise.allSettled([
        fetch(`/api/courses/${selectedCourse}/students`, {
          signal: controller.signal,
        }),
        fetch(`/api/attendances?${params}`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      let failed = false;
      if (rosterResult.status === "fulfilled" && rosterResult.value.ok) {
        try {
          const data: unknown = await rosterResult.value.json();
          if (
            typeof data === "object" &&
            data !== null &&
            "enrolled" in data &&
            Array.isArray(data.enrolled)
          ) {
            setStudents(
              (data as CourseStudentsResponse).enrolled.map(
                ({ student }) => student
              )
            );
          } else {
            failed = true;
          }
        } catch {
          failed = true;
        }
      } else {
        failed = true;
      }
      if (attendanceResult.status === "fulfilled" && attendanceResult.value.ok) {
        try {
          const data: unknown = await attendanceResult.value.json();
          if (Array.isArray(data)) setAttendances(data as Attendance[]);
          else failed = true;
        } catch {
          failed = true;
        }
      } else {
        failed = true;
      }
      setRecordsFailed(failed);
      if (failed) toast.error("No se pudieron cargar las asistencias del curso");
      setLoadingRecords(false);
    }

    void loadCourseAttendance();
    return () => controller.abort();
  }, [selectedCourse, selectedDate]);

  function resetForm() {
    setEditingId(null);
    setSelectedStudent("");
    setPresent("true");
  }

  function startEditing(record: Attendance) {
    setEditingId(record.id);
    setSelectedStudent(record.studentId);
    setSelectedDate(localDateValue(new Date(record.date)));
    setPresent(String(record.present));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse || !selectedStudent || !selectedDate) {
      toast.error("Seleccioná un curso, alumno y fecha");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/attendances/${editingId}` : "/api/attendances",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudent,
            courseId: selectedCourse,
            date: selectedDate,
            present: present === "true",
          }),
        }
      );
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "No se pudo guardar la asistencia")
        );
      }

      resetForm();
      const params = new URLSearchParams({
        courseId: selectedCourse,
        date: selectedDate,
      });
      const reload = await fetch(`/api/attendances?${params}`);
      if (!reload.ok) throw new Error("La asistencia se guardó, pero no se pudo actualizar la lista");
      const data: unknown = await reload.json();
      if (!Array.isArray(data)) {
        throw new Error("La asistencia se guardó, pero la respuesta no es válida");
      }
      setAttendances(data as Attendance[]);
      toast.success(editingId ? "Asistencia actualizada" : "Asistencia registrada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la asistencia"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAttendance(record: Attendance) {
    if (
      !window.confirm(
        `¿Eliminar la asistencia de ${record.student.firstName} ${record.student.lastName}?`
      )
    ) {
      return;
    }

    setDeletingId(record.id);
    try {
      const response = await fetch(`/api/attendances/${record.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "No se pudo eliminar la asistencia")
        );
      }
      setAttendances((current) =>
        current.filter(({ id }) => id !== record.id)
      );
      if (editingId === record.id) resetForm();
      toast.success("Asistencia eliminada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la asistencia"
      );
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
          Asistencias
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Registrá, corregí y consultá la asistencia de alumnos por curso y fecha.
        </p>
      </header>

      <Card className="max-w-4xl rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="attendance-course">
                Curso
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loadingCourses || coursesFailed || courses.length === 0}
                id="attendance-course"
                onChange={(event) => {
                  resetForm();
                  setStudents([]);
                  setAttendances([]);
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
                  No se pudieron cargar los cursos.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="attendance-date">
                Fecha
              </label>
              <Input
                id="attendance-date"
                onChange={(event) => {
                  resetForm();
                  setAttendances([]);
                  setSelectedDate(event.target.value);
                }}
                disabled={!selectedDate}
                required
                type="date"
                value={selectedDate}
              />
            </div>
          </div>

          {selectedCourse && (
            <form
              className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_10rem_auto]"
              onSubmit={saveAttendance}
            >
              <select
                aria-label="Alumno"
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loadingRecords || students.length === 0}
                onChange={(event) => setSelectedStudent(event.target.value)}
                required
                value={selectedStudent}
              >
                <option value="">Seleccioná un alumno</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.lastName}, {student.firstName}
                  </option>
                ))}
              </select>
              <select
                aria-label="Estado de asistencia"
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setPresent(event.target.value)}
                value={present}
              >
                <option value="true">Presente</option>
                <option value="false">Ausente</option>
              </select>
              <div className="flex gap-2">
                <Button
                  disabled={saving || loadingRecords || students.length === 0}
                  type="submit"
                >
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
                      : "Registrar"}
                </Button>
                {editingId && (
                  <Button onClick={resetForm} type="button" variant="outline">
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </div>
              {!loadingRecords && students.length === 0 && (
                <p className="text-sm text-slate-500 sm:col-span-3">
                  Este curso no tiene alumnos asignados. Asignalos desde la sección
                  de cursos para registrar asistencias.
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {!selectedCourse ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <CalendarCheck aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-800">Seleccioná un curso</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Elegí un curso y una fecha para administrar sus asistencias.
            </p>
          </CardContent>
        </Card>
      ) : loadingRecords ? (
        <p aria-live="polite" className="text-sm text-slate-500">
          Cargando asistencias...
        </p>
      ) : recordsFailed ? (
        <p className="text-sm text-destructive" role="alert">
          No se pudieron obtener las asistencias de este curso.
        </p>
      ) : attendances.length === 0 ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No hay asistencias registradas para {formatAttendanceDate(`${selectedDate}T00:00:00.000Z`)}.
          </CardContent>
        </Card>
      ) : (
        <section aria-labelledby="attendance-heading">
          <h2 className="mb-3 text-lg font-semibold text-slate-900" id="attendance-heading">
            {attendances.length}{" "}
            {attendances.length === 1 ? "registro" : "registros"} ·{" "}
            {formatAttendanceDate(`${selectedDate}T00:00:00.000Z`)}
          </h2>
          <ul className="space-y-3">
            {attendances.map((record) => (
              <li key={record.id}>
                <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {record.student.firstName} {record.student.lastName}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${
                          record.present
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {record.present ? "Presente" : "Ausente"}
                      </span>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        aria-label={`Editar asistencia de ${record.student.firstName} ${record.student.lastName}`}
                        onClick={() => startEditing(record)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        aria-label={`Eliminar asistencia de ${record.student.firstName} ${record.student.lastName}`}
                        disabled={deletingId === record.id}
                        onClick={() => void deleteAttendance(record)}
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
