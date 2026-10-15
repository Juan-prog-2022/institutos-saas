import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <MobileNav />
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">AulaBase</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="truncate text-slate-500">Administración</span>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
            Panel del instituto
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}