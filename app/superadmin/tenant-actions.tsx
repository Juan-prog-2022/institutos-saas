"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TenantActions({
  id,
  suspended,
}: {
  id: string;
  suspended: boolean;
}) {
  const router = useRouter();

  async function toggleSuspend() {
    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !suspended }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el estado");
      toast.success(suspended ? "Instituto activado" : "Instituto suspendido");
      router.refresh();
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este instituto y todos sus datos?")) return;

    try {
      const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar el instituto");
      toast.success("Instituto eliminado");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar el instituto");
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={toggleSuspend}>
        {suspended ? "Activar" : "Suspender"}
      </Button>
      <Button variant="destructive" size="sm" onClick={remove}>
        Eliminar
      </Button>
    </div>
  );
}
