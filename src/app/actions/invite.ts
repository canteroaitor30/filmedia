"use server";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

export async function sendInvite(email: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) return { error: "No autorizado" };

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("invitation_codes")
    .select("id, code")
    .is("used_by", null)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  if (!code) return { error: "No quedan códigos disponibles" };

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { error } = await resend.emails.send({
    from: "Filmedia <onboarding@resend.dev>",
    to: email,
    subject: "Te invito a Filmedia 🎬",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0A0A0A;font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #222;overflow:hidden;">
              <tr>
                <td style="padding:40px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;">Filmedia</p>
                  <p style="margin:0 0 32px;font-size:13px;color:#666;">Tu registro personal de cine y anime</p>

                  <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.6;">
                    Te han invitado a unirte a <strong style="color:#fff;">Filmedia</strong> —
                    lleva el control de todo lo que ves, puntúa, escribe reseñas y comparte con amigos.
                  </p>

                  <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;">Tu código de invitación</p>
                  <p style="margin:0 0 32px;font-size:28px;font-weight:700;letter-spacing:6px;color:#D4AF37;background:#1a1a0a;border:1px solid #333;border-radius:10px;padding:16px 24px;display:inline-block;">
                    ${code.code}
                  </p>

                  <a href="https://filmedia.us/auth/signup?code=${code.code}"
                    style="display:inline-block;background:#D4AF37;color:#0A0A0A;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                    Crear mi cuenta →
                  </a>

                  <p style="margin:32px 0 0;font-size:12px;color:#444;">
                    O ve a filmedia.us/auth/signup e introduce el código manualmente.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) return { error: error.message };
  return { success: true };
}
