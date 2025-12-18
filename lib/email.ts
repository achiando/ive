import nodemailer from 'nodemailer';

type SendEmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Email not sent.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App'}" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendRegistrationEmail(email: string, name: string) {
  const subject = 'Registration Received';
  const text = `Hello ${name},\n\nThank you for registering. Your account is pending approval.\n\nBest regards,\nThe Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Our Platform, ${name}!</h2>
      <p>Thank you for registering. Your account is currently pending approval.</p>
      <p>We'll review your registration and notify you once your account is activated.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  const subject = 'Password Reset Request';
  const text = `Hello ${name},\n\nYou requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click the button below to reset your password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p><code>${resetUrl}</code></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendStatusUpdateEmail(email: string, name: string, status: string, message?: string) {
  const statusMap: Record<string, { subject: string; title: string; description: string }> = {
    APPROVED: {
      subject: 'Account Approved',
      title: 'Your Account Has Been Approved!',
      description: 'Your account has been approved. You can now log in and start using our platform.'
    },
    REJECTED: {
      subject: 'Account Status Update',
      title: 'Account Review Completed',
      description: message || 'We regret to inform you that your account registration has not been approved.'
    },
    PENDING: {
      subject: 'Account Status Update',
      title: 'Account Under Review',
      description: 'Your account is currently under review by our team. We will notify you once a decision has been made.'
    }
  };

  const statusInfo = statusMap[status] || {
    subject: 'Account Status Update',
    title: 'Account Status Changed',
    description: `Your account status has been updated to: ${status}`
  };

  const subject = statusInfo.subject;
  const text = `Hello ${name},\n\n${statusInfo.description}\n\nBest regards,\nThe Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${statusInfo.title}</h2>
      <p>Hello ${name},</p>
      <p>${statusInfo.description}</p>
      ${status === 'APPROVED' ? 
        `<p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Log In Now
          </a>
        </p>` : ''
      }
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
