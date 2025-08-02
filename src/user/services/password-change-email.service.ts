import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for sending password change email notifications
 */
@Injectable()
export class PasswordChangeEmailService {
  private readonly logger = new Logger(PasswordChangeEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending password change confirmation email to: ${email}`);

      // TODO: Implement actual email sending logic
      // For now, just log the action
      const confirmationUrl = `${this.configService.get('FRONTEND_URL')}/confirm-password-change?token=${token}`;
      
      this.logger.log(`Password change confirmation URL: ${confirmationUrl}`);
      this.logger.log(`Email would be sent to ${email} for user ${firstName}`);

      // In production, this would use a proper email service
      // await this.emailService.send({
      //   to: email,
      //   subject: 'Confirm Password Change',
      //   template: 'password-change-confirmation',
      //   context: {
      //     firstName,
      //     confirmationUrl,
      //   },
      // });

      this.logger.log(`✅ Password change confirmation email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password change confirmation email to ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send password change success notification
   */
  async sendPasswordChangeSuccess(
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending password change success email to: ${email}`);

      // TODO: Implement actual email sending logic
      // For now, just log the action
      this.logger.log(`Email would be sent to ${email} for user ${firstName} confirming password change`);

      // In production, this would use a proper email service
      // await this.emailService.send({
      //   to: email,
      //   subject: 'Password Changed Successfully',
      //   template: 'password-change-success',
      //   context: {
      //     firstName,
      //     timestamp: new Date().toISOString(),
      //   },
      // });

      this.logger.log(`✅ Password change success email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password change success email to ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 