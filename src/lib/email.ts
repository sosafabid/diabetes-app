// ============================================================================
// Envío de correo — usa la API REST de Resend directamente (sin SDK, un
// solo fetch) para mantener el MVP simple.
// ============================================================================
// REQUIERE, en .env / Vercel:
//   RESEND_API_KEY   — tu API key de resend.com (plan gratis: 3,000
//                       correos/mes)
//   RESET_EMAIL_FROM — dirección "from". Mientras no verifiques un dominio
//                       propio en Resend, solo puedes usar
//                       "onboarding@resend.dev" como from, Y SOLO puedes
//                       enviar al correo con el que te registraste en
//                       Resend (limitación de su modo sandbox/gratis sin
//                       dominio verificado). Para enviar a cualquier
//                       usuario real, hay que verificar un dominio propio
//                       en el dashboard de Resend (agregar unos registros
//                       DNS) y usar una dirección de ese dominio aquí.
//   APP_URL          — URL pública de la app (para construir el link del
//                       correo), ej. "https://diabetes-app-content-manager2.vercel.app"
// ============================================================================

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_EMAIL_FROM;

  if (!apiKey || !from) {
    // No lanzamos error hacia el usuario final (el endpoint siempre debe
    // responder genérico, ver forgot-password/route.ts) — pero si esto pasa
    // en producción, hay que revisar las variables de entorno.
    console.error(
      "RESEND_API_KEY o RESET_EMAIL_FROM no están configuradas — no se pudo enviar el correo de recuperación.",
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Restablece tu contraseña",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Restablece tu contraseña</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Este link es válido por 1 hora.</p>
          <p>
            <a href="${resetUrl}" style="background:#2f7d6b;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#64707d;font-size:0.85rem;">
            Si no solicitaste esto, puedes ignorar este correo — tu contraseña no cambiará.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Resend respondió ${res.status}: ${errBody}`);
  }
}