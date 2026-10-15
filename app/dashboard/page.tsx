"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Course = {
  id: string;
  name: string;
  createdAt: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

type Grade = {
  id: string;
  studentName: string;
  grade: number;
  createdAt: string;
};

type Attendance = {
  id: string;
  date: string;
  present: boolean;
};

async function fetchList<T>(url: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar los datos de ${url}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`La respuesta de ${url} no tiene el formato esperado`);
  }

  return data as T[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function gradeTone(grade: number) {
  if (grade >= 7) return "bg-emerald-50 text-emerald-700";
  if (grade >= 4) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      const results = await Promise.allSettled([
        fetchList<Course>("/api/courses", controller.signal),
        fetchList<Student>("/api/students", controller.signal),
        fetchList<Grade>("/api/grades", controller.signal),
        fetchList<Attendance>("/api/attendances", controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const [courseResult, studentResult, gradeResult, attendanceResult] =
        results;
      const errors: string[] = [];

      if (courseResult.status === "fulfilled") {
        setCourses(courseResult.value);
      } else {
        errors.push("cursos");
      }
      if (studentResult.status === "fulfilled") {
        setStudents(studentResult.value);
      } else {
        errors.push("alumnos");
      }
      if (gradeResult.status === "fulfilled") {
        setGrades(gradeResult.value);
      } else {
        errors.push("notas");
      }
      if (attendanceResult.status === "fulfilled") {
        setAttendances(attendanceResult.value);
      } else {
        errors.push("asistencias");
      }

      setFailedSources(errors);
      if (errors.length > 0) {
        toast.error("No se pudo cargar parte del resumen");
      }
      setLoading(false);
    }

    void loadDashboard();
    return () => controller.abort();
  }, [reload]);

  const failed = (source: string) => failedSources.includes(source);
  const average =
    grades.length > 0
      ? grades.reduce((sum, item) => sum + item.grade, 0) / grades.length
      : null;
  const today = new Date();
  const todayAttendances = attendances.filter(
    ({ date }) => new Date(date).toDateString() === today.toDateString()
  );
  const attendanceRate =
    todayAttendances.length > 0
      ? Math.round(
          (todayAttendances.filter(({ present }) => present).length /
            todayAttendances.length) *
            100
        )
      : null;
  const attendanceWeek = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);
    const dayAttendances = attendances.filter(
      ({ date: value }) =>
        new Date(value).toDateString() === date.toDateString()
    );
    const rate =
      dayAttendances.length > 0
        ? Math.round(
            (dayAttendances.filter(({ present }) => present).length /
              dayAttendances.length) *
              100
          )
        : 0;

    return {
      label: new Intl.DateTimeFormat("es-AR", { weekday: "short" })
        .format(date)
        .replace(".", ""),
      rate,
      hasData: dayAttendances.length > 0,
    };
  });
  const recentGrades = grades.slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 pb-28 sm:px-6 md:pb-10 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 px-6 py-7 text-white shadow-lg shadow-indigo-900/10 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-28 size-72 rounded-full border-[36px] border-white/5"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 right-40 size-48 rounded-full bg-violet-400/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
              Panel administrativo
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Gestión académica, en un solo lugar
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100">
              Revisá la actividad de tu instituto y accedé rápidamente a tus
              cursos y calificaciones.
            </p>
          </div>
          <Button
            asChild
            className="w-full shrink-0 bg-white text-indigo-700 hover:bg-indigo-50 sm:w-auto"
          >
            <Link href="/dashboard/courses">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Crear curso
            </Link>
          </Button>
        </div>
      </section>

      {failedSources.length > 0 && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <span>
            No se pudieron cargar: {failedSources.join(", ")}. El resto del
            resumen sigue disponible.
          </span>
          <Button
            className="shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            onClick={() => setReload((value) => value + 1)}
            size="sm"
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      )}

      <section
        aria-label="Indicadores del instituto"
        aria-live="polite"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          description="Alumnos registrados"
          icon={Users}
          iconClass="bg-sky-50 text-sky-700"
          label="Alumnos"
          loading={loading}
          value={failed("alumnos") ? "—" : students.length.toLocaleString("es-AR")}
        />
        <StatCard
          description="Cursos disponibles"
          icon={BookOpen}
          iconClass="bg-violet-50 text-violet-700"
          label="Cursos"
          loading={loading}
          value={failed("cursos") ? "—" : courses.length.toLocaleString("es-AR")}
        />
        <StatCard
          description="Promedio de calificaciones"
          icon={Activity}
          iconClass="bg-emerald-50 text-emerald-700"
          label="Promedio general"
          loading={loading}
          value={
            failed("notas")
              ? "—"
              : average === null
                ? "—"
                : average.toLocaleString("es-AR", {
                    maximumFractionDigits: 1,
                  })
          }
        />
        <StatCard
          description={
            attendanceRate === null
              ? "Todavía no hay registros de hoy"
              : `${todayAttendances.length} registros de hoy`
          }
          icon={CheckCircle2}
          iconClass="bg-amber-50 text-amber-700"
          label="Asistencia de hoy"
          loading={loading}
          value={
            failed("asistencias")
              ? "—"
              : attendanceRate === null
                ? "—"
                : `${attendanceRate}%`
          }
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Asistencia semanal
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Porcentaje de presentes en los últimos siete días
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays aria-hidden="true" className="size-[18px]" />
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-6 sm:px-6">
            {loading ? (
              <div
                aria-label="Cargando asistencias"
                className="h-36 animate-pulse rounded-xl bg-slate-100"
              />
            ) : failed("asistencias") ? (
              <p className="py-12 text-center text-sm text-slate-500">
                No se pudo cargar el resumen de asistencias.
              </p>
            ) : !attendanceWeek.some(({ hasData }) => hasData) ? (
              <EmptyPanel
                description="Cuando haya asistencias registradas durante los últimos siete días, vas a poder ver acá la evolución semanal."
                icon={CalendarDays}
                title="Sin registros esta semana"
              />
            ) : (
              <>
                <div className="flex h-36 items-end justify-between gap-2 sm:gap-4">
                  {attendanceWeek.map(({ label, rate, hasData }, index) => (
                    <div
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      key={`${label}-${index}`}
                    >
                      <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                        {hasData ? `${rate}%` : ""}
                      </span>
                      <div className="flex h-24 w-full items-end rounded-lg bg-slate-50 p-1">
                        <div
                          aria-label={
                            hasData
                              ? `${label}: ${rate}% de asistencia`
                              : `${label}: sin registros`
                          }
                          className={`w-full rounded-md transition-all ${
                            hasData ? "bg-indigo-500" : "bg-slate-200"
                          }`}
                          role="img"
                          style={{ height: `${hasData ? Math.max(rate, 5) : 5}%` }}
                        />
                      </div>
                      <span className="text-[10px] capitalize text-slate-400 sm:text-xs">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  Asistencia registrada
                  <span className="ml-auto">
                    {attendances.length}{" "}
                    {attendances.length === 1 ? "registro" : "registros"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Accesos rápidos
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Lo que necesitás, a mano
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <QuickLink
              description="Organizá las materias y comisiones"
              href="/dashboard/courses"
              icon={BookOpen}
              title="Administrar cursos"
            />
            <QuickLink
              description="Consultá las calificaciones por curso"
              href="/dashboard/calificaciones"
              icon={ClipboardList}
              title="Ver calificaciones"
            />
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-600">
                Estado de tus datos
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {loading
                  ? "Actualizando el resumen del instituto…"
                  : failedSources.length > 0
                    ? "Algunos indicadores necesitan actualizarse."
                    : "El resumen está actualizado con los registros disponibles."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Cursos del instituto
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {failed("cursos")
                  ? "No se pudo obtener la lista."
                  : `${courses.length} ${
                      courses.length === 1 ? "curso registrado" : "cursos registrados"
                    }`}
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              href="/dashboard/courses"
            >
              Ver todos
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                    key={index}
                  />
                ))}
              </div>
            ) : failed("cursos") ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No se pudo cargar la lista de cursos.
              </p>
            ) : courses.length === 0 ? (
              <EmptyPanel
                action={{ href: "/dashboard/courses", label: "Crear primer curso" }}
                description="Creá tu primer curso para empezar a organizar la actividad académica."
                icon={BookOpen}
                title="Todavía no hay cursos"
              />
            ) : (
              <ul className="space-y-2">
                {courses.slice(0, 4).map((course) => (
                  <li
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50"
                    key={course.id}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen aria-hidden="true" className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {course.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        Creado el {formatDate(course.createdAt)}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-300"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Notas recientes
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Últimas calificaciones registradas
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              href="/dashboard/calificaciones"
            >
              Ver notas
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                    key={index}
                  />
                ))}
              </div>
            ) : failed("notas") ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No se pudieron cargar las calificaciones.
              </p>
            ) : recentGrades.length === 0 ? (
              <EmptyPanel
                description="Las calificaciones cargadas van a aparecer en esta sección."
                icon={ClipboardList}
                title="Sin calificaciones recientes"
              />
            ) : (
              <ul className="space-y-2">
                {recentGrades.map((item) => (
                  <li
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    key={item.id}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {item.studentName
                        .split(/\s+/)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toLocaleUpperCase("es-AR")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {item.studentName}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-sm font-bold ${gradeTone(
                        item.grade
                      )}`}
                    >
                      {item.grade.toLocaleString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading &&
        !failed("alumnos") &&
        !failed("cursos") &&
        students.length === 0 &&
        courses.length === 0 && (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-semibold text-slate-800">
                Empezá a configurar tu instituto
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cuando agregues cursos y alumnos, vas a ver sus indicadores acá.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
              <Link href="/dashboard/courses">
                Crear primer curso
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        )}
    </main>
  );
}

function StatCard({
  description,
  icon: Icon,
  iconClass,
  label,
  loading,
  value,
}: {
  description: string;
  icon: typeof Users;
  iconClass: string;
  label: string;
  loading: boolean;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <span
            className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}
          >
            <Icon aria-hidden="true" className="size-[19px]" />
          </span>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          {loading ? (
            <span
              aria-label="Cargando"
              className="inline-block h-9 w-20 animate-pulse rounded-lg bg-slate-100 align-middle"
            />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof BookOpen;
  title: string;
}) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50"
      href={href}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {description}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
      />
    </Link>
  );
}

function EmptyPanel({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: { href: string; label: string };
  description: string;
  icon: typeof CalendarDays;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-7 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action && (
        <Button
          asChild
          className="mt-4 text-indigo-700 hover:bg-indigo-50"
          size="sm"
          variant="ghost"
        >
          <Link href={action.href}>
            {action.label}
            <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
