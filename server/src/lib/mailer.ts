import { isProd } from '../config';

// Placeholder: plug in Resend/SendGrid/Nodemailer here using env-based credentials.
// In development the link is printed to the console. The token is never logged in production.
export async function sendResetEmail(to: string, link: string) {
  if (!isProd) {
    console.log(`[dev] Password reset link for ${to}: ${link}`);
    return;
  }
  console.warn('Email provider not configured; reset email was not sent.');
}
