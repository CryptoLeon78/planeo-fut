type RuntimeAuthConfig = {
  googleOAuthEnabled?: boolean;
  emailConfirmationRequired?: boolean;
  supportEmail?: string;
};

function runtimeConfig(): RuntimeAuthConfig {
  if (typeof globalThis === "undefined" || !("__PLANEOfut_CONFIG__" in globalThis)) {
    return {};
  }

  return (globalThis as typeof globalThis & { __PLANEOfut_CONFIG__?: RuntimeAuthConfig })
    .__PLANEOfut_CONFIG__ ?? {};
}

function environmentBoolean(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function isGoogleOAuthEnabled(): boolean {
  return runtimeConfig().googleOAuthEnabled
    ?? environmentBoolean(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED)
    ?? false;
}

export function requiresEmailConfirmation(): boolean {
  return runtimeConfig().emailConfirmationRequired
    ?? environmentBoolean(import.meta.env.VITE_EMAIL_CONFIRMATION_REQUIRED)
    ?? false;
}

export function getSupportEmail(): string | null {
  const email = runtimeConfig().supportEmail ?? import.meta.env.VITE_SUPPORT_EMAIL ?? "";
  const normalized = email.trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(normalized) ? normalized : null;
}

export function supportMailto(subject: string, body: string): string | null {
  const email = getSupportEmail();
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function authErrorMessage(error: unknown): string {
  const candidate = error as { message?: unknown; code?: unknown } | null;
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Se ha alcanzado el límite de envíos de correo. Espera antes de solicitar otro email.";
  }
  if (normalized.includes("invalid_client") || normalized.includes("oauth client was not found")) {
    return "El acceso con Google aún no está configurado para este portable.";
  }
  return message || "Error de autenticación";
}
