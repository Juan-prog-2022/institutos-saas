"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

type GradeRow = {
  id: string
  studentName: string
  grade: number | ""
  status: 'Promocionado' | 'Regular' | 'Libre'
}

export default function CalificacionesPage() {
  const [courses, setCourses] = useState<{id:string, name:string}[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [rows, setRows] = useState<GradeRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/courses")
     .then(r => r.json())
     .then(setCourses)
     .catch(() => toast.error("Error al cargar cursos"))
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/grades?courseId=${selectedCourse}`)
     .then(r => r.json())
     .then(data => {
        setRows(data)
        if(data.length === 0) toast.info("Curso sin alumnos")
        else toast.success(`${data.length} alumnos`)
      })
     .catch(() => toast.error("Error al traer notas"))
     .finally(() => setLoading(false))
  }, [selectedCourse])

  return (
    <div className="p-4 space-y-4">
      <Select onValueChange={(v) => setSelectedCourse(v?? '')} value={selectedCourse}>
        <SelectTrigger><SelectValue placeholder="Seleccioná curso" /></SelectTrigger>
        <SelectContent>
          {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading? <p>Cargando...</p> : (
        <>
          {/* MOBILE */}
          <div className="grid gap-3 md:hidden">
            {rows.map(r => (
              <Card key={r.id} className="p-4">{r.studentName} - {r.grade}</Card>
            ))}
          </div>

          {/* PC */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead><tr><th>Alumno</th><th>Nota</th><th>Estado</th></tr></thead>
              <tbody>{rows.map(r => <tr key={r.id}><td>{r.studentName}</td><td>{r.grade}</td><td>{r.status}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}