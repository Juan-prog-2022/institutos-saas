"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
    <main className="space-y-6 p-4 pb-28 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Notas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultá las notas registradas por curso.
        </p>
      </header>

      <div className="max-w-md space-y-2">
        <label className="text-sm font-medium" htmlFor="grade-course">
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
          <p className="text-sm text-muted-foreground">
            Primero creá un curso para consultar sus notas.
          </p>
        )}
      </div>

      {loadingGrades ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Cargando notas...
        </p>
      ) : selectedCourse && gradesFailed ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron obtener las notas de este curso.
        </p>
      ) : selectedCourse && rows.length === 0 ? (
        <Card>
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
              <Card key={row.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium">{row.studentName}</span>
                  <span aria-label={`Nota ${row.grade}`}>
                    {row.grade.toLocaleString("es-AR")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Alumno
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t" key={row.id}>
                    <td className="px-4 py-3">{row.studentName}</td>
                    <td className="px-4 py-3">
                      {row.grade.toLocaleString("es-AR")}
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
