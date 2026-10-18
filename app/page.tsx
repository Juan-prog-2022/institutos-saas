import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, BarChart3, Zap } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 sm:text-xl">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            AulaBase
          </div>
          <div className="flex shrink-0 gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild><Link href="/sign-in">Iniciar sesión</Link></Button>
            <Button size="sm" className="hidden bg-indigo-600 hover:bg-indigo-700 sm:inline-flex" asChild><Link href="/dashboard">Ir al panel</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200 mb-6">
            <Zap size={14} /> SaaS para institutos terciarios y universitarios
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            La plataforma que gestiona todos tus <span className="text-indigo-600">institutos</span> en un solo lugar
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Multitenant real. Cada instituto es una organización aislada con sus alumnos, cursos, calificaciones y usuarios. White-label con color y logo propio.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button size="lg" className="h-12 w-full bg-indigo-600 px-6 hover:bg-indigo-700 sm:w-auto sm:px-8" asChild>
              <Link href="/sign-in">Empezar ahora</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-full px-6 sm:w-auto sm:px-8" asChild>
              <Link href="/dashboard">Ver demo</Link>
            </Button>
          </div>

          {/* Preview de Institutos - como en tus capturas */}
          <div className="mt-12 grid grid-cols-1 gap-3 text-left sm:mt-16 sm:grid-cols-3 sm:gap-4">
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
        <div className="mt-16 grid gap-4 sm:mt-24 md:grid-cols-3 md:gap-6">
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

      <SiteFooter />
    </div>
  )
}