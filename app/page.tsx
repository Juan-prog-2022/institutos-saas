import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center">
      <h1 className="text-4xl font-bold text-zinc-900">
        🏫 Sistema para Institutos
      </h1>
      <p className="max-w-md text-zinc-600">
        SaaS multitenant: cada instituto es una organización con sus propios
        estudiantes, cursos y usuarios.
      </p>
      <div className="flex gap-4">
        <Button>
          <Link href="/sign-in">Iniciar sesión</Link>
        </Button>
        <Button variant="outline">
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
