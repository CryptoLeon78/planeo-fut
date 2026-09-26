import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supportMailto } from "@/lib/auth-capabilities";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const resetMailto = supportMailto(
    "PlaneoFUT | Recuperación de contraseña",
    "Hola, necesito restablecer mi contraseña de PlaneoFUT.\n\nEmail de mi cuenta:\nNombre:\nClub/equipo:\n\nNo incluyo ninguna contraseña en este correo.",
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Recupera tu contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">El administrador verificará tu identidad y te entregará una contraseña temporal por un canal de confianza.</p>
        {resetMailto ? (
          <Button asChild className="mt-6 w-full"><a href={resetMailto}>Solicitar recuperación por email</a></Button>
        ) : (
          <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">El email de administración aún no está configurado.</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">No envíes nunca tu contraseña por correo.</p>
        <Link to="/auth" className="mt-5 block text-center text-sm text-primary underline-offset-4 hover:underline">Volver a entrar</Link>
      </Card>
    </div>
  );
}
