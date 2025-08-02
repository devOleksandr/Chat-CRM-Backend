import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto/auth.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { TokensDto } from './dto/tokens.dto';
import { Role } from '#db';

/**
 * Authentication controller for handling user authentication and authorization
 * Provides REST API endpoints for login, logout, token refresh, and password reset
 */
@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticate user and generate access tokens
   * @param loginDto - User login credentials
   * @returns Promise<LoginResponseDto> Authentication response with tokens and user info
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password, returns access and refresh tokens',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      validLogin: {
        summary: 'Valid login credentials',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User authenticated successfully',
    type: LoginResponseDto,
    examples: {
      success: {
        summary: 'Successful login response',
        value: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'Member',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials - email or password is incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['email must be an email', 'password should not be empty'] },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh access token using valid refresh token
   * @param refreshTokenDto - Refresh token data
   * @returns Promise<Tokens> New access and refresh tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access and refresh tokens using a valid refresh token',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token data',
    examples: {
      validRefresh: {
        summary: 'Valid refresh token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: TokensDto,
    examples: {
      success: {
        summary: 'Successful token refresh',
        value: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired refresh token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data - validation failed',
  })
  async refresh(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  /**
   * Logout user by clearing refresh token
   * @param req - Request object containing authenticated user
   * @returns Promise<void>
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user by clearing their refresh token from the database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated - JWT token is missing or invalid',
  })
  async logout(@Req() req: Request & { user?: any }): Promise<{ message: string }> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    await this.authService.logout(req.user.sub);
    return { message: 'Logged out successfully' };
  }

  /**
   * Request password reset email
   * @param resetPasswordRequestDto - Password reset request data
   * @returns Promise<{ message: string }> Success message
   */
  @Post('reset-password/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user with reset link (always returns success for security)',
  })
  @ApiBody({
    type: ResetPasswordRequestDto,
    description: 'Password reset request data',
    examples: {
      validRequest: {
        summary: 'Valid password reset request',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'If the email exists, a password reset link has been sent' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  async requestReset(@Body(ValidationPipe) resetPasswordRequestDto: ResetPasswordRequestDto): Promise<{ message: string }> {
    try {
      await this.authService.sendResetPasswordEmail(resetPasswordRequestDto);
      return { message: 'If the email exists, a password reset link has been sent' };
    } catch (error) {
      // For security reasons, always return success even if email doesn't exist
      return { message: 'If the email exists, a password reset link has been sent' };
    }
  }

  /**
   * Reset password using valid reset token
   * @param resetPasswordDto - Password reset data with token and new password
   * @returns Promise<{ message: string }> Success message
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using valid reset token from email',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Password reset data',
    examples: {
      validReset: {
        summary: 'Valid password reset',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          newPassword: 'NewSecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successful' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or weak password',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid or expired reset token' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successful' };
  }

  /**
   * Register new user
   * @param registerData - User registration data
   * @returns Promise<LoginResponseDto> Registration response with tokens and user info
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: 'Register new user with email, password, and profile information',
  })
  @ApiBody({
    description: 'User registration data (Admin role creation is not allowed for security)',
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 6, example: 'SecurePassword123!' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
      },
    },
    examples: {
      validRegistration: {
        summary: 'Valid registration data (creates Member role)',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or email already exists',
  })
  async register(@Body(ValidationPipe) registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<LoginResponseDto> {
    return this.authService.register(registerData);
  }
}
