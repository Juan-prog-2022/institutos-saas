"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGradeStyle, getEstadoStyle, INSTITUTE_THEMES } from "@/lib/institute-theme";
import { useTenantStore } from "@/store/useTenantStore";
import { toast } from "react-toastify";

type GradeRow = {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  p1: number | null;
  p2: number | null;
  average: number;
  status: 'Promocionado' | 'Regular' | 'Libre';
}

export default function CalificacionesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [search, setSearch] = useState("");
  const { theme } = useTenantStore();
  const activeTheme = theme || INSTITUTE_THEMES.IAS;

  // ... tu useEffect igual pero con average y status en inglés

  const filtered = useMemo(()=> rows.filter(r=> r.studentName.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  return (
    <div className="p-6">
      {/* FIXED SELECT */}
      <Select value={selectedCourse} onValueChange={(v) => setSelectedCourse(v ?? "")}>
        <SelectTrigger className="w-56 bg-white"><SelectValue placeholder="Select course" /></SelectTrigger>
        <SelectContent>
          {courses.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {/* rest of table */}
    </div>
  )
}