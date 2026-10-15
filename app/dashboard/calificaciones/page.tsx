"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Course = {
  id: string;
  name: string;
};

type GradeRow = {
  id: string;
  studentName: string;
  grade: number;
};

export default function CalificacionesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const [gradesFailed, setGradesFailed] = useState(false);

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
    if (!selectedCourse) return;

    const controller = new AbortController();

    async function loadGrades() {
      try {
        const params = new URLSearchParams({ courseId: selectedCourse });
        const response = await fetch(`/api/grades?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar las notas");
        setRows((await response.json()) as GradeRow[]);
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
          Consultá las notas registradas por curso.
        </p>
      </header>

      <Card className="max-w-xl rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
        <CardContent className="space-y-2 p-5">
        <label className="text-sm font-semibold text-slate-700" htmlFor="grade-course">
          Curso
        </label>
        <Select
          onValueChange={(value) => {
            const courseId = value ?? "";
            if (courseId === selectedCourse) return;
            setRows([]);
            setGradesFailed(false);
            setLoadingGrades(courseId !== "");
            setSelectedCourse(courseId);
          }}
          value={selectedCourse}
        >
          <SelectTrigger
            aria-label="Seleccionar curso"
            disabled={loadingCourses || coursesFailed || courses.length === 0}
            id="grade-course"
          >
            <SelectValue
              placeholder={
                loadingCourses ? "Cargando cursos..." : "Seleccioná un curso"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {coursesFailed && (
          <p role="alert" className="text-sm text-destructive">
            No se pudo obtener la lista de cursos.
          </p>
        )}
        {!loadingCourses && !coursesFailed && courses.length === 0 && (
          <p className="text-sm text-slate-500">
            Primero creá un curso para consultar sus notas.
          </p>
        )}
        </CardContent>
      </Card>

      {loadingGrades ? (
        <p aria-live="polite" className="text-sm text-slate-500">
          Cargando notas...
        </p>
      ) : selectedCourse && gradesFailed ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron obtener las notas de este curso.
        </p>
      ) : !selectedCourse ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ClipboardList aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-800">
              Seleccioná un curso
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Elegí un curso arriba para consultar las calificaciones de sus alumnos.
            </p>
          </CardContent>
        </Card>
      ) : selectedCourse && rows.length === 0 ? (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Este curso todavía no tiene notas registradas.
          </CardContent>
        </Card>
      ) : rows.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "nota" : "notas"}
          </p>

          <div className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80" key={row.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium text-slate-800">{row.studentName}</span>
                  <span aria-label={`Nota ${row.grade}`} className="rounded-lg bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700">
                    {row.grade.toLocaleString("es-AR")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold" scope="col">
                    Alumno
                  </th>
                  <th className="px-5 py-4 font-semibold" scope="col">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-slate-100" key={row.id}>
                    <td className="px-5 py-4 font-medium text-slate-800">{row.studentName}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700">
                        {row.grade.toLocaleString("es-AR")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </main>
  );
}
