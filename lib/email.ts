import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const from = process.env.EMAIL_FROM || "onboarding@resend.dev"

export async function sendWelcomeEmail({
  email,
  name,
  password,
}: {
  email: string
  name: string
  password: string
}) {
  if (!resend) {
    console.log(`[EMAIL SKIPPED] To: ${email}, Password: ${password} — set RESEND_API_KEY`)
    return
  }

  await resend.emails.send({
    from,
    to: email,
    subject: `Welcome to ${process.env.SITE_NAME || "Retoucher Dashboard"}`,
    html: `<p>Hi ${name},</p>
<p>You've been invited to <strong>${process.env.SITE_NAME || "Retoucher Dashboard"}</strong>.</p>
<p>Sign in at <a href="${process.env.NEXTAUTH_URL || "http://localhost:3001"}">${process.env.NEXTAUTH_URL || "http://localhost:3001"}</a></p>
<p><strong>Email:</strong> ${email}<br><strong>Password:</strong> ${password}</p>
<p>Please change your password after logging in.</p>`,
  })
}

export async function sendDeletionNotification({
  hirerEmail,
  hirerName,
  workTitle,
  retoucherName,
}: {
  hirerEmail: string
  hirerName: string
  workTitle: string
  retoucherName: string
}) {
  if (!resend) {
    console.log(`[EMAIL SKIPPED] Deletion notification to ${hirerEmail} — set RESEND_API_KEY`)
    return
  }

  await resend.emails.send({
    from,
    to: hirerEmail,
    subject: `Work entry removed — ${workTitle}`,
    html: `<p>Hi ${hirerName},</p>
<p><strong>${retoucherName}</strong> has removed the following work entry:</p>
<p><strong>${workTitle}</strong></p>
<p>This entry is no longer available in your dashboard.</p>`,
  })
}
