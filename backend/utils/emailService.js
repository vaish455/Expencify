import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  getBaseTemplate(title, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #4338ca; padding: 40px 20px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">${title}</h2>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    ${content}
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.5;">Best regards,</p>
                      <p style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 4px 0 0 0;">The Expencify Team</p>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Outer Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                <tr>
                  <td style="padding: 24px 20px; text-align: center; color: #94a3b8; font-size: 13px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Expencify. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  getButtonHtml(url, text) {
    return `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${url}" 
           style="background-color: #4338ca; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-flex; font-weight: 500; font-size: 14px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
          ${text}
        </a>
      </div>
    `;
  }
  
  getInfoCardHtml(title, items, borderColor = '#4338ca', bgColor = '#f8fafc') {
    const itemsHtml = Object.entries(items)
      .map(([key, value]) => `<p style="margin: 8px 0; color: #475569; font-size: 14px;"><strong style="color: #0f172a; min-width: 120px; display: inline-block; font-weight: 500;">${key}:</strong> ${value}</p>`)
      .join('');
      
    return `
      <div style="background-color: ${bgColor}; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0; border-left: 4px solid ${borderColor};">
        ${title ? `<h3 style="margin-top: 0; margin-bottom: 16px; color: ${borderColor}; font-size: 16px; font-weight: 600;">${title}</h3>` : ''}
        ${itemsHtml}
      </div>
    `;
  }

  async sendWelcomeEmail(user, company) {
    const content = `
      <p style="color: #0f172a; font-size: 16px; margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your account has been successfully created as an <strong style="color: #4338ca;">${user.role}</strong> in <strong style="color: #0f172a;">${company.name}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">You can now start managing your expenses efficiently and effortlessly.</p>
      ${this.getButtonHtml(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`, 'Login to Your Account')}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Welcome to Expencify!',
      html: this.getBaseTemplate('Welcome to Expencify!', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendUserCreatedEmail(user, password, company, createdBy) {
    const content = `
      <p style="color: #0f172a; font-size: 16px; margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;"><strong>${createdBy.name}</strong> has created an account for you in <strong style="color: #0f172a;">${company.name}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your assigned role is: <strong style="color: #4338ca;">${user.role}</strong></p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 28px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; font-weight: 600;">Login Credentials</h3>
        <p style="margin: 12px 0; color: #475569; font-size: 14px;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin: 12px 0; color: #475569; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 6px 12px; border-radius: 6px; color: #0f172a; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px;">${password}</code></p>
      </div>

      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-bottom: 24px; color: #991b1b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <p style="font-size: 14px; margin: 0; line-height: 1.5; font-weight: 500;"><strong>⚠️ Important Security Notice:</strong> Please change your password immediately after your first login to ensure your account remains secure.</p>
      </div>
      
      ${this.getButtonHtml(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`, 'Login Now')}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Your Expencify Account Has Been Created',
      html: this.getBaseTemplate('Your Expencify Account is Ready!', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendLoginNotification(user) {
    const content = `
      <p style="color: #0f172a; font-size: 16px; margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">We detected a new login to your account on <strong>${new Date().toLocaleString()}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">If this was you, no further action is required.</p>
      
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-top: 24px; color: #991b1b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <p style="font-size: 14px; margin: 0; line-height: 1.5;"><strong>Not you?</strong> Please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #991b1b; font-weight: 600; text-decoration: underline;">reset your password</a> or contact your administrator immediately to secure your account.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Security Alert: New Login Detected',
      html: this.getBaseTemplate('New Login Detected', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordChangeNotification(user) {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: #d1fae5; color: #10b981; width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.1);">
          ✓
        </div>
      </div>
      <p style="color: #0f172a; font-size: 16px; margin-top: 0; text-align: center;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">Your password was successfully changed on <strong>${new Date().toLocaleString()}</strong>.</p>
      
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-top: 32px; color: #991b1b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <p style="font-size: 14px; margin: 0; line-height: 1.5;"><strong>Didn't make this change?</strong> Please contact your administrator immediately to secure your account.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Security Alert: Password Changed Successfully',
      html: this.getBaseTemplate('Password Changed', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseSubmittedEmail(user, expense, company) {
    const details = {
      'Amount': `${expense.originalCurrency} ${expense.originalAmount.toFixed(2)}`,
      'Category': expense.category?.name || 'N/A',
      'Date': new Date(expense.date).toLocaleDateString(),
      'Description': expense.description
    };

    const content = `
      <p style="color: #0f172a; font-size: 16px; margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your expense has been submitted successfully and is currently <strong style="color: #f59e0b;">pending approval</strong>.</p>
      
      ${this.getInfoCardHtml('Expense Summary', details, '#f59e0b', '#fef3c7')}

      <p style="color: #475569; font-size: 15px; line-height: 1.6;">You will be notified via email once your expense is reviewed by an approver.</p>
      ${this.getButtonHtml(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-expenses`, 'View Expense Details')}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Expense Submitted Successfully',
      html: this.getBaseTemplate('Expense Submitted', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseApprovedEmail(user, expense, approvedBy) {
    const details = {
      'Amount': `${expense.originalCurrency} ${expense.originalAmount.toFixed(2)}`,
      'Category': expense.category?.name || 'N/A',
      'Approved By': approvedBy.name,
      'Description': expense.description
    };

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: #d1fae5; color: #10b981; width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.1);">
          ✓
        </div>
      </div>
      <p style="color: #0f172a; font-size: 16px; margin-top: 0; text-align: center;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #10b981; font-size: 18px; font-weight: 600; line-height: 1.6; text-align: center;">Great news! Your expense has been approved.</p>
      
      ${this.getInfoCardHtml('Approved Expense Details', details, '#10b981', '#f8fafc')}
      
      ${this.getButtonHtml(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-expenses`, 'View Expense')}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Expense Approved: ' + (expense.category?.name || 'Expense Request'),
      html: this.getBaseTemplate('Expense Approved', content),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendExpenseRejectedEmail(user, expense, rejectedBy, reason) {
    const details = {
      'Amount': `${expense.originalCurrency} ${expense.originalAmount.toFixed(2)}`,
      'Category': expense.category?.name || 'N/A',
      'Reviewed By': rejectedBy.name,
      'Description': expense.description
    };
    
    if (reason) {
      details['Rejection Reason'] = `<strong style="color: #ef4444;">${reason}</strong>`;
    }

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: #fee2e2; color: #ef4444; width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(239,68,68,0.1);">
          ✗
        </div>
      </div>
      <p style="color: #0f172a; font-size: 16px; margin-top: 0; text-align: center;">Hi <strong>${user.name}</strong>,</p>
      <p style="color: #ef4444; font-size: 16px; font-weight: 600; line-height: 1.6; text-align: center;">Your expense request was rejected.</p>
      
      ${this.getInfoCardHtml('Rejected Expense Details', details, '#ef4444', '#f8fafc')}

      <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">Please review the notes and resubmit your expense request if applicable.</p>
      
      ${this.getButtonHtml(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-expenses`, 'Review Expense')}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Expense Rejected: ' + (expense.category?.name || 'Expense Request'),
      html: this.getBaseTemplate('Expense Rejected', content),
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
