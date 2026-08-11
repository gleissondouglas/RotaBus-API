/**
 * Email Provider — Envio de emails transacionais via Resend.
 *
 * Em produção, envia o email real usando a API do Resend.
 * Em desenvolvimento (sem RESEND_API_KEY), apenas loga no console.
 *
 * Configuração necessária no .env:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM_EMAIL=noreply@seudominio.com  (opcional, padrão: onboarding@resend.dev)
 */

const env = require("../../../config/env");

let resendClient = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  if (!env.resendApiKey) {
    return null;
  }

  // Importação lazy para não quebrar em dev sem a dependência
  const { Resend } = require("resend");
  resendClient = new Resend(env.resendApiKey);
  return resendClient;
}

function buildResetEmailHtml({ name, resetLink }) {
  const firstName = name ? name.split(" ")[0] : "Usuário";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F6F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:white;border-radius:16px;padding:40px 32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <div style="width:64px;height:64px;background:#EBF5FF;border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <span style="font-size:32px;">🔑</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#011030;">Recuperação de Senha</h1>
        </td></tr>
        <tr><td style="font-size:16px;color:#333;line-height:24px;padding-bottom:24px;">
          Olá, <strong>${firstName}</strong>!<br><br>
          Recebemos uma solicitação para redefinir a senha da sua conta no <strong>RotaBus</strong>.
          Clique no botão abaixo para criar uma nova senha:
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${resetLink}" 
             style="display:inline-block;background:#3B82F6;color:white;font-size:16px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;">
            Redefinir minha senha
          </a>
        </td></tr>
        <tr><td style="font-size:13px;color:#999;line-height:20px;border-top:1px solid #F0F0F0;padding-top:20px;">
          Este link expira em <strong>10 minutos</strong>.<br>
          Se você não solicitou essa alteração, ignore este email — sua senha permanecerá a mesma.
        </td></tr>
      </table>
      <p style="font-size:12px;color:#BBB;margin-top:16px;">RotaBus — Mobilidade acessível para todos.</p>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  const client = getResendClient();

  // Sem API key configurada → simula no console (desenvolvimento)
  if (!client) {
    console.log("======================================");
    console.log("SIMULAÇÃO DE EMAIL DE RECUPERAÇÃO");
    console.log("Para:", to);
    console.log("Nome:", name);
    console.log("Link de recuperação:", resetLink);
    console.log("======================================");

    return { success: true };
  }

  // Produção → envia email real via Resend
  const fromEmail = env.resendFromEmail || "RotaBus <onboarding@resend.dev>";

  const { error } = await client.emails.send({
    from: fromEmail,
    to,
    subject: "RotaBus — Redefinição de senha",
    html: buildResetEmailHtml({ name, resetLink }),
  });

  if (error) {
    console.error("[EmailProvider] Falha ao enviar email via Resend:", error);
    throw new Error("Não foi possível enviar o email de recuperação.");
  }

  return { success: true };
}

module.exports = {
  sendPasswordResetEmail,
};
