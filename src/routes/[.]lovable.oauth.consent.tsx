import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, UserRound, X } from "lucide-react";
import type { OAuthAuthorizationDetails } from "@supabase/auth-js";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id: typeof search.authorization_id === "string" ? search.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization request identifier.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = `${location.pathname}${location.searchStr}`;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ search }) => {
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(search.authorization_id);
    if (error) throw error;
    if ("redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Connection request unavailable</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
      </Alert>
    </main>
  ),
  head: () => ({
    meta: [
      { title: "Authorise an integration — PlaneoFUT" },
      { name: "description", content: "Review and authorise secure access to your PlaneoFUT coaching account." },
      { property: "og:title", content: "Authorise an integration — PlaneoFUT" },
      { property: "og:description", content: "Review secure access to your PlaneoFUT coaching account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ConsentPage() {
  const details = Route.useLoaderData() as OAuthAuthorizationDetails;
  const { authorization_id: authorizationId } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scopes = details.scope.split(/\s+/).filter(Boolean);
  const clientName = details.client.name || "External assistant";

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const result = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (result.error) {
      setError(result.error.message);
      setBusy(null);
      return;
    }
    window.location.assign(result.data.redirect_url);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-4 sm:p-8">
      <Card className="w-full max-w-xl overflow-hidden rounded-lg shadow-lg">
        <CardHeader className="space-y-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">PlaneoFUT secure connection</p>
              <CardTitle className="mt-1 text-xl">Connect {clientName} to PlaneoFUT</CardTitle>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {clientName} will be able to call PlaneoFUT’s enabled coaching tools while acting as your signed-in account.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-3 text-sm">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Signed in as</p>
              <p className="text-muted-foreground">{details.user.email}</p>
            </div>
          </div>
          <Separator />
          <section aria-labelledby="access-heading">
            <h2 id="access-heading" className="text-sm font-semibold">Requested access</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>Read your exercise library, sessions and weekly microcycles.</span></li>
              <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>Create practices, sessions and structured microcycles when you approve the action.</span></li>
              {scopes.includes("email") && <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>Share your email address for account identification.</span></li>}
              {scopes.includes("profile") && <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>Share your basic profile for account identification.</span></li>}
            </ul>
          </section>
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            PlaneoFUT’s account permissions and backend policies still decide which records are accessible. This connection does not bypass them.
          </div>
          {error && <Alert variant="destructive"><AlertTitle>Connection failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          <p className="break-all text-xs text-muted-foreground">Return to: {details.redirect_uri}</p>
        </CardContent>
        <CardFooter className="flex-col-reverse gap-2 border-t bg-background pt-6 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" disabled={busy !== null} onClick={() => decide(false)}>
            <X /> Cancel connection
          </Button>
          <Button className="w-full sm:w-auto" disabled={busy !== null} onClick={() => decide(true)}>
            Approve <ArrowRight />
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}