import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            AulaBase
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link href="/sign-in">Iniciar sesión</Link></Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" asChild><Link href="/dashboard">Ir al panel</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200 mb-6">
            <Zap size={14} /> SaaS para institutos terciarios y universitarios
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            La plataforma que gestiona todos tus <span className="text-indigo-600">institutos</span> en un solo lugar
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Multitenant real. Cada instituto es una organización aislada con sus alumnos, cursos, calificaciones y usuarios. White-label con color y logo propio.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8" asChild>
              <Link href="/sign-in">Empezar ahora</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" asChild>
              <Link href="/dashboard">Ver demo</Link>
            </Button>
          </div>

          {/* Preview de Institutos - como en tus capturas */}
          <div className="mt-16 grid grid-cols-3 gap-4 text-left">
            {[
              { code: 'IAS', name: 'Artes del Sur', color: 'bg-rose-500', count: '16 alumnos' },
              { code: 'ISM', name: 'San Martín', color: 'bg-blue-600', count: '42 alumnos' },
              { code: 'CTB', name: 'Belgrano', color: 'bg-teal-600', count: '28 alumnos' },
            ].map(i => (
              <div key={i.code} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${i.color} text-white flex items-center justify-center font-bold text-sm`}>{i.code}</div>
                  <div><div className="font-semibold text-sm">{i.name}</div><div className="text-xs text-slate-500">{i.count}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border">
            <Users className="text-indigo-600 mb-3" />
            <h3 className="font-semibold">Alumnos y Matrículas</h3>
            <p className="text-sm text-slate-600 mt-2">Estados: Regular, Libre, Egresado, Baja. Con filtros y búsqueda.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border">
            <BookOpen className="text-indigo-600 mb-3" />
            <h3 className="font-semibold">Cursos y Materias</h3>
            <p className="text-sm text-slate-600 mt-2">Por año y división. Asignación de profesores.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border">
            <BarChart3 className="text-indigo-600 mb-3" />
            <h3 className="font-semibold">Notas y Asistencias</h3>
            <p className="text-sm text-slate-600 mt-2">Semáforo: &lt;4 rojo, 4-6.9 amarillo, ≥7 verde. Promedios automáticos.</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        AulaBase • PWA instalable • Hecho con Next.js + shadcn/ui
      </footer>
    </div>
  )
}