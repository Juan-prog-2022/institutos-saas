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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-white md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className={`flex flex-1 flex-col items-center justify-center gap-1 ${active? "text-blue-600" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}