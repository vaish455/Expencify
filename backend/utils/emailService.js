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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #714B67 0%, #017E84 100%); padding: 40px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Expencify!</h2>
          </div>
          <div style="padding: 40px;">
            <p style="color: #333333; font-size: 16px;">Hi ${user.name},</p>
            <p style="color: #8F8F8F; font-size: 14px; line-height: 1.6;">Your account has been successfully created as an <strong style="color: #714B67;">${user.role}</strong> in <strong style="color: #714B67;">${company.name}</strong>.</p>
            <p style="color: #8F8F8F; font-size: 14px; line-height: 1.6;">You can now start managing your expenses efficiently.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background: linear-gradient(135deg, #714B67 0%, #017E84 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Login to Your Account
              </a>
            </div>
            <p style="color: #8F8F8F; font-size: 14px;">Best regards,<br><strong style="color: #714B67;">The Expencify Team</strong></p>
          </div>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #714B67 0%, #017E84 100%); padding: 40px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 28px;">Your Expencify Account is Ready!</h2>
          </div>
          <div style="padding: 40px;">
            <p style="color: #333333; font-size: 16px;">Hi ${user.name},</p>
            <p style="color: #8F8F8F; font-size: 14px; line-height: 1.6;">${createdBy.name} has created an account for you in <strong style="color: #714B67;">${company.name}</strong>.</p>
            <p style="color: #8F8F8F; font-size: 14px;">Your role: <strong style="color: #017E84;">${user.role}</strong></p>
            
            <div style="background-color: #F8F8F8; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #017E84;">
              <h3 style="margin-top: 0; color: #714B67; font-size: 18px;">Login Credentials</h3>
              <p style="margin: 8px 0; color: #333333;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 8px 0; color: #333333;"><strong>Temporary Password:</strong> <code style="background-color: #E5E5E5; padding: 6px 12px; border-radius: 4px; color: #017E84; font-weight: 600;">${password}</code></p>
            </div>

            <p style="color: #ef4444; font-size: 14px; background-color: #FEE2E2; padding: 12px; border-radius: 6px;"><strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background: linear-gradient(135deg, #714B67 0%, #017E84 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Login Now
              </a>
            </div>
            
            <p style="color: #8F8F8F; font-size: 14px;">Best regards,<br><strong style="color: #714B67;">The Expencify Team</strong></p>
          </div>
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
