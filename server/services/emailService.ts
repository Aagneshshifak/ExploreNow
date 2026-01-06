import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // Configure with environment variables or fallback to mock
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@explorenow.com';
    } else {
      // Development/testing configuration - uses Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
      this.fromEmail = 'noreply@explorenow.com';
    }
  }

  private getBookingConfirmationTemplate(data: {
    userName: string;
    bookingType: string;
    itemName: string;
    totalPrice: string;
    checkIn?: string;
    checkOut?: string;
    bookingId: string;
  }): EmailTemplate {
    const checkInOut = data.checkIn && data.checkOut 
      ? `<p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString()}</p>
         <p><strong>Check-out:</strong> ${new Date(data.checkOut).toLocaleDateString()}</p>`
      : '';

    return {
      subject: `Booking Confirmation - ${data.itemName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ExploreNow</h1>
            <p style="margin: 10px 0 0 0;">Your Adventure Awaits!</p>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Booking Confirmed! 🎉</h2>
            
            <p>Hi ${data.userName},</p>
            
            <p>Great news! Your ${data.bookingType} booking has been confirmed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">${data.itemName}</h3>
              <p><strong>Booking ID:</strong> #${data.bookingId}</p>
              <p><strong>Total Amount:</strong> $${data.totalPrice}</p>
              ${checkInOut}
            </div>
            
            <p>We're excited to help you create amazing memories! If you have any questions, feel free to contact our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Booking Details
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The ExploreNow Team
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 ExploreNow. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        ExploreNow - Booking Confirmation
        
        Hi ${data.userName},
        
        Your ${data.bookingType} booking has been confirmed!
        
        ${data.itemName}
        Booking ID: #${data.bookingId}
        Total Amount: $${data.totalPrice}
        ${data.checkIn ? `Check-in: ${new Date(data.checkIn).toLocaleDateString()}` : ''}
        ${data.checkOut ? `Check-out: ${new Date(data.checkOut).toLocaleDateString()}` : ''}
        
        View your booking details at: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard
        
        Best regards,
        The ExploreNow Team
      `
    };
  }

  private getPasswordResetTemplate(data: {
    userName: string;
    resetToken: string;
  }): EmailTemplate {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${data.resetToken}`;
    
    return {
      subject: 'Password Reset Request - ExploreNow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ExploreNow</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p>Hi ${data.userName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 12px; word-break: break-all;">
              Or copy and paste this URL: ${resetUrl}
            </p>
          </div>
        </div>
      `,
      text: `
        ExploreNow - Password Reset Request
        
        Hi ${data.userName},
        
        We received a request to reset your password. Visit this link to create a new password:
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
      `
    };
  }

  async sendBookingConfirmation(
    email: string,
    userName: string,
    bookingDetails: {
      type: string;
      itemName: string;
      totalPrice: string;
      checkIn?: string;
      checkOut?: string;
      bookingId: string;
    }
  ): Promise<boolean> {
    try {
      const template = this.getBookingConfirmationTemplate({
        userName,
        bookingType: bookingDetails.type,
        itemName: bookingDetails.itemName,
        totalPrice: bookingDetails.totalPrice,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        bookingId: bookingDetails.bookingId,
      });

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Booking confirmation email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }
  }

  async sendPasswordReset(
    email: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    try {
      const template = this.getPasswordResetTemplate({
        userName,
        resetToken,
      });

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const template = {
        subject: 'Welcome to ExploreNow! 🌟',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Welcome to ExploreNow!</h1>
              <p style="margin: 10px 0 0 0;">Your Journey Begins Here</p>
            </div>
            
            <div style="padding: 30px 20px; background: #f9f9f9;">
              <h2 style="color: #333;">Hi ${userName}! 👋</h2>
              
              <p>Welcome to ExploreNow! We're thrilled to have you join our community of explorers and adventurers.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
                <ul style="color: #666;">
                  <li>🔍 Discover amazing trips and hotels</li>
                  <li>🤖 Get AI-powered travel recommendations</li>
                  <li>💱 Use our real-time currency converter</li>
                  <li>📱 Plan your perfect adventure</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/trips" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Start Exploring
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Happy travels!<br>
                The ExploreNow Team
              </p>
            </div>
          </div>
        `,
        text: `
          Welcome to ExploreNow!
          
          Hi ${userName}!
          
          Welcome to ExploreNow! We're thrilled to have you join our community of explorers and adventurers.
          
          What's Next?
          - Discover amazing trips and hotels
          - Get AI-powered travel recommendations  
          - Use our real-time currency converter
          - Plan your perfect adventure
          
          Start exploring: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/trips
          
          Happy travels!
          The ExploreNow Team
        `
      };

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();