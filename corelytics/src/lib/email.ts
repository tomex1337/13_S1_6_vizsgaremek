import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`
  
  await resend.emails.send({
    from: 'Corelytics <noreply@mail.corelytics.tomex.xyz>',
    to: email,
    subject: 'Jelszó visszaállítási kérelem - Corelytics',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4F46E5;">Jelszó visszaállítási kérelem</h2>
        <p>Jelszó visszaállítást kért Corelytics fiókjához. Kattintson az alábbi linkre a jelszó visszaállításához:</p>
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Jelszó visszaállítása</a>
        <p>Ez a link 24 órán belül lejár.</p>
        <p>Ha nem Ön kérte ezt, kérjük hagyja figyelmen kívül ezt az emailt és a jelszava változatlan marad.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">© Corelytics - Az Ön edzéskövető társa</p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'Corelytics <noreply@mail.corelytics.tomex.xyz>',
    to: email,
    subject: 'Üdvözöljük a Corelytics-ban!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4F46E5;">Üdvözöljük a Corelytics-ban, ${name}!</h2>
        <p>Köszönjük, hogy csatlakozott edzéskövető közösségünkhöz.</p>
        <p>Kezdje el nyomon követni étkezéseit és edzéseit, hogy elérje fitness céljait!</p>
        <a href="${process.env.NEXTAUTH_URL}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Kezdjük el</a>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">© Corelytics - Az Ön edzéskövető társa</p>
      </div>
    `,
  })
}
