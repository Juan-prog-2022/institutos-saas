"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      setLoading(false);
      toast.error("No se pudo cerrar la sesión. Intentá nuevamente.");
    }
  }

  return (
    <Button
      className="shrink-0"
      disabled={loading}
      onClick={() => void logout()}
      size="sm"
      type="button"
      variant="ghost"
    >
      <LogOut aria-hidden="true" className="mr-2 size-4" />
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}
