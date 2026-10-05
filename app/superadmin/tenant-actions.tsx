"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function TenantActions({
  id,
  suspended,
}: {
  id: string;
  suspended: boolean;
}) {
  const router = useRouter();

  async function toggleSuspend() {
    const res = await fetch(`/api/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !suspended }),
    });
    if (res.ok) {
      toast.success(suspended ? "Instituto activado" : "Instituto suspendido");
      router.refresh();
    } else {
      toast.error("No se pudo actualizar el estado");
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este instituto y todos sus datos?")) return;
    const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Instituto eliminado");
      router.refresh();
    } else {
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
