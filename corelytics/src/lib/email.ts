import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`
  
  await resend.emails.send({
    from: 'Corelytics <noreply@corelytics.app>',
    to: email,
    subject: 'Password Reset Request - Corelytics',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>You requested a password reset for your Corelytics account. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Reset Password</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn&apos;t request this, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">© Corelytics - Your Fitness Tracking Companion</p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'Corelytics <noreply@corelytics.app>',
    to: email,
    subject: 'Welcome to Corelytics!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4F46E5;">Welcome to Corelytics, ${name}!</h2>
        <p>Thank you for joining our fitness tracking community.</p>
        <p>Start tracking your meals and workouts to reach your fitness goals!</p>
        <a href="${process.env.NEXTAUTH_URL}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Get Started</a>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">© Corelytics - Your Fitness Tracking Companion</p>
      </div>
    `,
  })
}
