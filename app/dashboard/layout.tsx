import { MobileNav } from "@/components/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* En PC podés después agregar un sidebar acá si querés */}
      <div className="mx-auto max-w-6xl p-4 pb-24 md:p-8">
        {children}
      </div>
      
      {/* El bottom nav que ya creaste */}
      <MobileNav />
    </div>
  )
}