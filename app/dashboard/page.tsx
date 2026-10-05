"use client";

import { useEffect, useState } from "react";
import { OrganizationSwitcher, UserButton, useOrganization } from "@clerk/nextjs";
import { useTenantStore } from "@/store/useTenantStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-toastify";

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

interface Grade {
  id: string;
  value: number;
  student: { firstName: string; lastName: string };
  course: { name: string } | null;
}

interface Attendance {
  id: string;
  present: boolean;
  date: string;
  student: { firstName: string; lastName: string };
  course: { name: string } | null;
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { setTenant } = useTenantStore();
  const [tenant, setTenantLocal] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [gradeStudent, setGradeStudent] = useState("");
  const [gradeCourse, setGradeCourse] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [attStudent, setAttStudent] = useState("");
  const [attCourse, setAttCourse] = useState("");
  const [attPresent, setAttPresent] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

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
      loadGrades();
      loadAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  async function loadStudents() {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
    else toast.error((await res.json()).error ?? "Error al cargar estudiantes");
  }

  async function loadCourses() {
    const res = await fetch("/api/courses");
    if (res.ok) setCourses(await res.json());
  }

  async function loadGrades() {
    const res = await fetch("/api/grades");
    if (res.ok) setGrades(await res.json());
  }

  async function loadAttendances() {
    const res = await fetch("/api/attendances");
    if (res.ok) setAttendances(await res.json());
  }

  async function createTenant() {
    const res = await fetch("/api/tenant", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setTenantLocal(data);
      setTenant(data.id, data.slug);
      toast.success("Instituto creado correctamente");
    } else {
      toast.error(data.error ?? "Error al crear el instituto");
    }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.warn("Nombre y apellido son obligatorios");
      return;
    }
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
      toast.success("Estudiante agregado");
    } else {
      toast.error((await res.json()).error ?? "Error al agregar estudiante");
    }
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim()) {
      toast.warn("El nombre del curso es obligatorio");
      return;
    }
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: courseName }),
    });
    if (res.ok) {
      setCourseName("");
      loadCourses();
      toast.success("Curso agregado");
    } else {
      toast.error((await res.json()).error ?? "Error al agregar curso");
    }
  }

  async function deleteCourse(id: string) {
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadCourses();
      toast.success("Curso eliminado");
    } else {
      toast.error("No se pudo eliminar el curso");
    }
  }

  async function addGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!gradeStudent) {
      toast.warn("Selecciona un alumno");
      return;
    }
    const value = Number(gradeValue);
    if (gradeValue === "" || Number.isNaN(value)) {
      toast.warn("Ingresa una nota válida");
      return;
    }
    if (value < 0 || value > 10) {
      toast.warn("La nota debe estar entre 0 y 10");
      return;
    }
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: gradeStudent,
        courseId: gradeCourse || null,
        value,
      }),
    });
    if (res.ok) {
      setGradeValue("");
      loadGrades();
      toast.success("Nota guardada");
    } else {
      toast.error((await res.json()).error ?? "Error al guardar la nota");
    }
  }

  async function addAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!attStudent) {
      toast.warn("Selecciona un alumno");
      return;
    }
    const res = await fetch("/api/attendances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: attStudent,
        courseId: attCourse || null,
        present: attPresent,
      }),
    });
    if (res.ok) {
      loadAttendances();
      toast.success("Asistencia registrada");
    } else {
      toast.error((await res.json()).error ?? "Error al registrar asistencia");
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <header className="mb-8 flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <h1 className="text-xl font-semibold">🏫 Panel del instituto</h1>
        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <a
              href="/superadmin"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              ⚙️ Superadmin
            </a>
          )}
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </header>

      {!tenant ? (
        <Card>
          <CardContent className="p-6">
            <p className="mb-4">
              No hay instituto registrado para tu organización actual. Créalo
              para empezar.
            </p>
            <Button onClick={createTenant}>Crear instituto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Instituto: {tenant.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Bienvenido al panel de gestión de {tenant.name}.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={addStudent} className="flex flex-col gap-3">
                <h3 className="font-medium">Agregar estudiante</h3>
                <Input
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <Input
                  placeholder="Email (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit">Agregar estudiante</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estudiantes ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.email ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Sin estudiantes aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cursos ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCourse} className="mb-4 flex gap-2">
                <Input
                  placeholder="Nombre del curso"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                />
                <Button type="submit">Agregar</Button>
              </form>
              <Table>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteCourse(c.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {courses.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground">
                        Sin cursos aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas ({grades.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addGrade} className="mb-4 flex flex-col gap-2">
                <select
                  className={selectClass}
                  value={gradeStudent}
                  onChange={(e) => setGradeStudent(e.target.value)}
                >
                  <option value="">Selecciona alumno</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={gradeCourse}
                  onChange={(e) => setGradeCourse(e.target.value)}
                >
                  <option value="">Curso (opcional)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Nota (ej. 9.5)"
                  type="number"
                  step="0.1"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                />
                <Button type="submit">Guardar nota</Button>
              </form>
              <Table>
                <TableBody>
                  {grades.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.value}</TableCell>
                      <TableCell>
                        {g.student.firstName} {g.student.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {g.course?.name ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin notas aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asistencias ({attendances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addAttendance} className="mb-4 flex flex-col gap-2">
                <select
                  className={selectClass}
                  value={attStudent}
                  onChange={(e) => setAttStudent(e.target.value)}
                >
                  <option value="">Selecciona alumno</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={attCourse}
                  onChange={(e) => setAttCourse(e.target.value)}
                >
                  <option value="">Curso (opcional)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={attPresent}
                    onChange={(e) => setAttPresent(e.target.checked)}
                  />
                  Presente
                </label>
                <Button type="submit">Registrar asistencia</Button>
              </form>
              <Table>
                <TableBody>
                  {attendances.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.present ? "✅" : "❌"}</TableCell>
                      <TableCell>
                        {a.student.firstName} {a.student.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.date).toLocaleDateString("es")}
                        {a.course ? ` · ${a.course.name}` : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  {attendances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin registros aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
