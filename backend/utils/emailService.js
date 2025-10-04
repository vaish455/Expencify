import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendWelcomeEmail(user, company) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to Expencify!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #714B67;">Welcome to Expencify!</h2>
          <p>Hi ${user.name},</p>
          <p>Your account has been successfully created as an <strong>${user.role}</strong> in <strong>${company.name}</strong>.</p>
          <p>You can now start managing your expenses efficiently.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
               style="background-color: #714B67; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendUserCreatedEmail(user, password, company, createdBy) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your Expencify Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #714B67;">Your Expencify Account is Ready!</h2>
          <p>Hi ${user.name},</p>
          <p>${createdBy.name} has created an account for you in <strong>${company.name}</strong>.</p>
          <p>Your role: <strong>${user.role}</strong></p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
          </div>

          <p style="color: #ef4444;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
               style="background-color: #714B67; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login Now
            </a>
          </div>
          
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendLoginNotification(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'New Login Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #714B67;">New Login Detected</h2>
          <p>Hi ${user.name},</p>
          <p>We detected a new login to your account at ${new Date().toLocaleString()}.</p>
          <p>If this wasn't you, please contact your administrator immediately.</p>
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordChangeNotification(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #714B67;">Password Changed</h2>
          <p>Hi ${user.name},</p>
          <p>Your password has been changed successfully at ${new Date().toLocaleString()}.</p>
          <p>If you didn't make this change, please contact your administrator immediately.</p>
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseSubmittedEmail(user, expense, company) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Expense Submitted Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #714B67;">Expense Submitted</h2>
          <p>Hi ${user.name},</p>
          <p>Your expense has been submitted successfully and is pending approval.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${expense.originalAmount} ${expense.originalCurrency}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${expense.category?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${expense.description}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
          </div>

          <p>You will be notified once your expense is reviewed.</p>
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseApprovedEmail(user, expense, approvedBy) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Expense Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Expense Approved ✓</h2>
          <p>Hi ${user.name},</p>
          <p>Great news! Your expense has been approved by ${approvedBy.name}.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${expense.originalAmount} ${expense.originalCurrency}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${expense.category?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${expense.description}</p>
          </div>

          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseRejectedEmail(user, expense, rejectedBy, reason) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Expense Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Expense Rejected</h2>
          <p>Hi ${user.name},</p>
          <p>Your expense has been rejected by ${rejectedBy.name}.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${expense.originalAmount} ${expense.originalCurrency}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${expense.category?.name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${expense.description}</p>
            ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>

          <p>Please review and resubmit if necessary.</p>
          <p>Best regards,<br>The Expencify Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}

export default new EmailService();
