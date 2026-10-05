"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TenantActions({
  id,
  suspended,
}: {
  id: string;
  suspended: boolean;
}) {
  const router = useRouter();

  async function toggleSuspend() {
    await fetch(`/api/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !suspended }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar este instituto y todos sus datos?")) return;
    await fetch(`/api/tenants/${id}`, { method: "DELETE" });
    router.refresh();
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
