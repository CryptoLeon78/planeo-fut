import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Accede a PlaneoFUT — Gestión de Entrenamientos" },
      { name: "description", content: "Inicia sesión o crea tu cuenta gratuita en PlaneoFUT para planificar ejercicios, sesiones y microciclos de fútbol." },
      { property: "og:title", content: "Accede a PlaneoFUT" },
      { property: "og:description", content: "Inicia sesión o crea tu cuenta gratuita para empezar a planificar tu temporada." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://planeo-fut.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://planeo-fut.lovable.app/auth" }],
  }),
});

const emailSchema = z.string().trim().email("Email inválido").max(255);
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(128);

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" />;

  async function handleEmail(mode: "signin" | "signup", form: HTMLFormElement) {
    const fd = new FormData(form);
    const emailRaw = String(fd.get("email") ?? "");
    const passwordRaw = String(fd.get("password") ?? "");
    const fullName = String(fd.get("fullName") ?? "").trim();

    const email = emailSchema.safeParse(emailRaw);
    const password = passwordSchema.safeParse(passwordRaw);
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
        if (error) throw error;
        toast.success("Bienvenido");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.data,
          password: password.data,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName || email.data.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu email si te lo pide o entra directamente.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Error de autenticación");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar sesión con Google");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-pitch-gradient p-10 lg:flex">
        <div className="flex items-center gap-2 text-primary-foreground">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/20 backdrop-blur">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight">PlaneoFUT</span>
        </div>
        <div className="text-primary-foreground">
          <h2 className="text-3xl font-bold leading-tight">Planifica como un profesional.</h2>
          <p className="mt-3 max-w-md text-primary-foreground/85">
            Ejercicios, sesiones, microciclos y temporadas completas en una sola herramienta diseñada para entrenadores serios.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Accede a tu cuenta</h1>
            <p className="text-sm text-muted-foreground">Diseña tu próxima sesión en minutos</p>
          </div>

          <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.5H12z"/></svg>
            Continuar con Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o con email <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => { e.preventDefault(); handleEmail("signin", e.currentTarget); }} className="space-y-3">
                <div className="space-y-1.5"><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" autoComplete="email" required /></div>
                <div className="space-y-1.5"><Label htmlFor="si-pass">Contraseña</Label><Input id="si-pass" name="password" type="password" autoComplete="current-password" required /></div>
                <Button disabled={busy} type="submit" className="w-full">Entrar</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => { e.preventDefault(); handleEmail("signup", e.currentTarget); }} className="space-y-3">
                <div className="space-y-1.5"><Label htmlFor="su-name">Nombre</Label><Input id="su-name" name="fullName" type="text" /></div>
                <div className="space-y-1.5"><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" autoComplete="email" required /></div>
                <div className="space-y-1.5"><Label htmlFor="su-pass">Contraseña</Label><Input id="su-pass" name="password" type="password" autoComplete="new-password" required /></div>
                <Button disabled={busy} type="submit" className="w-full">Crear cuenta</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
