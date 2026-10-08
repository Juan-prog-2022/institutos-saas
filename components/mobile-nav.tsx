"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, ClipboardList, User } from "lucide-react"

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/cursos", label: "Cursos", icon: BookOpen },
  { href: "/dashboard/calificaciones", label: "Notas", icon: ClipboardList },
  { href: "/dashboard/perfil", label: "Perfil", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-12px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 ${active ? "text-blue-600" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}