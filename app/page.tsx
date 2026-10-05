import Link from "next/link";

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
        <Link
          href="/sign-in"
          className="rounded-lg bg-black px-6 py-3 text-white"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border px-6 py-3 text-zinc-800"
        >
          Ir al dashboard
        </Link>
      </div>
    </main>
  );
}
