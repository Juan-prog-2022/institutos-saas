"use client";

import { useEffect, useState } from "react";

export function SiteFooter() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const updateYear = () => setYear(new Date().getFullYear());
    updateYear();
    const interval = window.setInterval(updateYear, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <footer className="border-t py-8 text-center text-sm text-slate-500">
      powered by BlueSystems - todos los derechos reservados {year ?? ""}
    </footer>
  );
}
