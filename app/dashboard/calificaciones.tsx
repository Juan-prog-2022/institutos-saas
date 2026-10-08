"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGradeStyle, getEstadoStyle, INSTITUTE_THEMES } from "@/lib/institute-theme";
import { useTenantStore } from "@/store/useTenantStore";
import { toast } from "react-toastify";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type GradeRow = {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  p1: number | null;
  p2: number | null;
  average: number;
  status: 'Promocionado' | 'Regular' | 'Libre' | string;
}

export default function CalificacionesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [search, setSearch] = useState("");
  const { theme } = useTenantStore();
  const activeTheme = theme || INSTITUTE_THEMES.IAS;

  // tu useEffect para traer cursos y notas - dejalo igual como lo tenias

  const filtered = useMemo(() => rows.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  return (
    <div className="p-4 sm:p-6 pb-28">
      {/* SELECT CURSO */}
      <div className="mb-6 w-full sm:w-64">
        <Select value={selectedCourse} onValueChange={(v) => setSelectedCourse(v ?? "")}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4 flex-col sm:flex-row">
        <Input 
          placeholder="Buscar alumno..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white flex-1"
        />
        <Drawer>
          <DrawerTrigger>
            <Button className="w-full sm:w-auto">+ Cargar Nota</Button>
          </DrawerTrigger>
          <DrawerContent className="p-4 pb-10">
            <DrawerHeader className="p-0 mb-4">
              <DrawerTitle>Nueva calificación</DrawerTitle>
            </DrawerHeader>
            <p className="text-sm text-muted-foreground">Acá va tu form de notas</p>
            <Button className="w-full mt-4">Guardar</Button>
          </DrawerContent>
        </Drawer>
      </div>

      {/* MOBILE - CARDS */}
      <div className="grid gap-3 md:hidden">
        {filtered.map((row) => (
          <Card key={row.id} className="p-3">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold">{row.studentName}</p>
              <Badge className={getEstadoStyle(row.status)}>{row.status}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-muted-foreground">P1</p>
                <p className={`font-bold ${getGradeStyle(row.p1 ?? 0)}`}>{row.p1 ?? "-"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-muted-foreground">P2</p>
                <p className={`font-bold ${getGradeStyle(row.p2 ?? 0)}`}>{row.p2 ?? "-"}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-muted-foreground">Prom</p>
                <p className="font-bold text-blue-700">{row.average}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* PC - TABLA */}
      <div className="hidden md:block">
        <Card>
          <CardHeader><CardTitle>{filtered.length} alumnos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-3 text-left">Alumno</th><th className="p-3 text-center">P1</th><th className="p-3 text-center">P2</th><th className="p-3 text-center">Prom</th><th className="p-3 text-center">Estado</th></tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} className="border-b">
                      <td className="p-3 font-medium">{row.studentName}</td>
                      <td className={`p-3 text-center ${getGradeStyle(row.p1 ?? 0)}`}>{row.p1 ?? "-"}</td>
                      <td className={`p-3 text-center ${getGradeStyle(row.p2 ?? 0)}`}>{row.p2 ?? "-"}</td>
                      <td className="p-3 text-center font-bold">{row.average}</td>
                      <td className="p-3 text-center"><Badge className={getEstadoStyle(row.status)}>{row.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}