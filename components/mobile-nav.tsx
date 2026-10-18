"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Home,
  Users,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/courses", label: "Cursos", icon: BookOpen },
  { href: "/dashboard/students", label: "Alumnos", icon: Users },
  { href: "/dashboard/calificaciones", label: "Notas", icon: ClipboardList },
  { href: "/dashboard/attendances", label: "Asistencia", icon: CalendarCheck },
];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <Link
          className="flex h-20 items-center gap-3 border-b border-slate-100 px-6"
          href="/dashboard"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              AulaBase
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Gestión académica
            </span>
          </span>
        </Link>

        <div className="px-4 pt-8">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menú principal
          </p>
          <nav aria-label="Navegación principal" className="mt-3 space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  href={href}
                >
                  <Icon
                    aria-hidden="true"
                    className={`size-[18px] ${
                      active
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="ml-auto size-1.5 rounded-full bg-indigo-600"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <p className="text-sm font-semibold text-slate-800">
              Tu instituto, organizado
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Gestioná cursos y consultá el rendimiento académico desde un solo lugar.
            </p>
          </div>
          <p className="px-3 pb-1 pt-5 text-[11px] text-slate-400">
            AulaBase · Panel administrativo
          </p>
        </div>
      </aside>

      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4.25rem+env(safe-area-inset-bottom))] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur md:hidden"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 ${
                active ? "text-indigo-700" : "text-slate-400"
              }`}
              href={href}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
