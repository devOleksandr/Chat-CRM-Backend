import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Service for handling email operations
 * Manages email sending for password reset and other notifications
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter with Gmail SMTP
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
      });

      this.logger.log('✅ Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email - Recipient email address
   * @param resetToken - Password reset token
   * @returns Promise<void>
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      this.logger.log(`Sending password reset email to: ${email}`);

      const resetUrl = `${this.configService.get('FRONTEND_URL')}/forgot-password?token=${resetToken}`;

      const mailOptions = {
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Password Reset Request',
        html: this.generatePasswordResetEmailHtml(resetUrl),
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Password reset email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @returns Promise<void>
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      this.logger.log(`Sending welcome email to: ${email}`);

      const mailOptions = {
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Welcome to The Little Black Book',
        html: this.generateWelcomeEmailHtml(firstName),
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Welcome email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send email verification email
   * @param email - Recipient email address
   * @param verificationToken - Email verification token
   * @returns Promise<void>
   */
  async sendEmailVerificationEmail(email: string, verificationToken: string): Promise<void> {
    try {
      this.logger.log(`Sending email verification to: ${email}`);

      const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Verify Your Email Address',
        html: this.generateEmailVerificationHtml(verificationUrl),
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Email verification sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email verification to ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate HTML content for password reset email
   * @param resetUrl - Password reset URL
   * @returns string - HTML content
   */
  private generatePasswordResetEmailHtml(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password for your account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link is valid for 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a>
        </p>
      </div>
    `;
  }

  /**
   * Generate HTML content for welcome email
   * @param firstName - User's first name
   * @returns string - HTML content
   */
  private generateWelcomeEmailHtml(firstName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to The Little Black Book!</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for joining The Little Black Book! We're excited to have you as part of our community.</p>
        <p>You can now:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Connect with other users</li>
          <li>Start chatting</li>
          <li>Explore our features</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Little Black Book Team</p>
      </div>
    `;
  }

  /**
   * Generate HTML content for email verification
   * @param verificationUrl - Email verification URL
   * @returns string - HTML content
   */
  private generateEmailVerificationHtml(verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #28a745;">${verificationUrl}</a>
        </p>
      </div>
    `;
  }

  /**
   * Test email configuration
   * @returns Promise<boolean> True if email configuration is working
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      this.logger.log('Testing email configuration...');

      await this.transporter.verify();

      this.logger.log('✅ Email configuration is working correctly');
      return true;
    } catch (error) {
      this.logger.error('❌ Email configuration test failed:', error);
      return false;
    }
  }
} 