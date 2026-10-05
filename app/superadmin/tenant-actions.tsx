"use client";

import { useRouter } from "next/navigation";

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
      <button
        onClick={toggleSuspend}
        className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-100"
      >
        {suspended ? "Activar" : "Suspender"}
      </button>
      <button
        onClick={remove}
        className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
      >
        Eliminar
      </button>
    </div>
  );
}
