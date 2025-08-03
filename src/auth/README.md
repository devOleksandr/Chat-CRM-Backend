# Auth Module

Authentication and authorization module for "The Little Black Book" system with JWT tokens, password reset, and user registration capabilities. Supports both admin interface (with authentication) and mobile app (without authentication for certain endpoints).

## Features

- ✅ JWT authentication with access and refresh tokens
- ✅ User registration with validation
- ✅ User login/logout functionality
- ✅ Token refresh mechanism
- ✅ Password reset via email
- ✅ Password strength validation
- ✅ Centralized error handling with Strategy Pattern
- ✅ Email service for notifications
- ✅ Role-based authorization (Admin/Participant)
- ✅ Comprehensive logging and monitoring
- ✅ Support for mobile app without authentication

## User Roles

### Admin
- Full access to all system features
- Can create and manage projects
- Can manage participants
- Requires JWT authentication for all operations

### Participant
- Limited access for mobile app usage
- Can participate in chats without authentication
- Uses external `participantId` for identification
- No password or email required

## Architecture Overview

The module follows **Clean Architecture** principles with **Dependency Inversion** and **Strategy Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  AuthController (REST API Endpoints)                        │
│  ├── POST /auth/login                                       │
│  ├── POST /auth/register                                    │
│  ├── POST /auth/refresh                                     │
│  ├── POST /auth/logout                                      │
│  ├── POST /auth/reset-password/request                      │
│  └── POST /auth/reset-password                              │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  AuthService                                                │
│  ├── User authentication                                    │
│  ├── Token generation & validation                          │
│  ├── Password management                                    │
│  ├── Email notifications                                    │
│  └── Role management (Admin/Participant)                    │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Layer                     │
├─────────────────────────────────────────────────────────────┤
│  AuthExceptionFilter (HTTP Responses)                       │
│  └── Automatic status mapping                               │
│                                                             │
│  AuthErrorHandler (Business Logic)                          │
│  ├── Security monitoring                                     │
│  ├── Metrics collection                                      │
│  └── Logging & alerting                                      │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  AuthRepositoryPort (Interface)                             │
│  └── AuthRepository (Prisma Implementation)                 │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Prisma ORM                                    │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication Endpoints (Admin)

#### User Registration
```bash
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### User Login
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Admin"
  }
}
```

#### Token Refresh
```bash
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### User Logout
```bash
POST /api/auth/logout
Authorization: Bearer <access-token>
```

#### Request Password Reset
```bash
POST /api/auth/reset-password/request
{
  "email": "admin@example.com"
}
```

#### Reset Password
```bash
POST /api/auth/reset-password
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

### Mobile App Support

The system supports mobile app usage without authentication through:

1. **External Participant IDs** - Mobile users are identified by `participantId` string
2. **Project-based Access** - Access is granted based on `projectId` and `participantId` combination
3. **No JWT Required** - Mobile endpoints don't require authentication tokens

## Error Handling Architecture

The module implements a **hybrid error handling approach** combining NestJS Exception Filters with Strategy Pattern:

### Hybrid Error Handling Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AuthService   │───▶│ AuthErrorHandler │───▶│ Error Strategy  │
│   (throws)      │    │   (business      │    │   (specific     │
│                  │    │    logic)        │    │    handling)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ AuthException   │
                       │ Filter (HTTP)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   HTTP Client   │
                       └─────────────────┘
```

### Exception Filters (HTTP Responses)
- **Automatic HTTP status mapping** based on error codes
- **Consistent error response format**
- **Built-in NestJS integration**
- **No manual HTTP response handling needed**

### Strategy Pattern (Business Logic)
- **Logging and monitoring**
- **Security event detection**
- **Metrics collection**
- **Extensible error handling**

### Error Response Format
```json
{
  "statusCode": 401,
  "message": "Invalid credentials for email: user@example.com",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-15T10:30:15.123Z",
  "path": "/auth/login"
}
```

### Benefits of Hybrid Approach

#### Exception Filters (HTTP Layer)
✅ **Automatic HTTP status mapping** - No manual status code management
✅ **Consistent error responses** - Standardized format across all endpoints
✅ **Built-in NestJS integration** - Leverages framework capabilities
✅ **Clean separation of concerns** - HTTP logic separated from business logic
✅ **Easy testing** - Mock HTTP responses without business logic interference

#### Strategy Pattern (Business Logic)
✅ **Security monitoring** - Detect and respond to suspicious activities
✅ **Metrics collection** - Track error rates and performance
✅ **Extensible logging** - Custom log formats and destinations
✅ **Business intelligence** - Analyze user behavior patterns
✅ **Alerting system** - Proactive notification of issues

#### Combined Benefits
✅ **Best of both worlds** - NestJS simplicity + custom business logic
✅ **Maintainable code** - Clear separation between HTTP and business concerns
✅ **Scalable architecture** - Easy to add new error types and handling
✅ **Production ready** - Comprehensive monitoring and security features

### Exception Filter Implementation
```typescript
@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost) {
    const status = this.getHttpStatus(exception);
    
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Error Handler Implementation
```typescript
@Injectable()
export class AuthErrorHandler {
  async handleError(error: AuthError, context: ErrorContext): Promise<void> {
    // Execute strategy-specific business logic
    await strategy.handle(error, context);
    
    // Security monitoring
    await this.handleSecurityMonitoring(error, context);
    
    // Metrics collection
    await this.handleMetrics(error, context);
  }
}
```

## Folder Structure

```
src/auth/
├── 📄 index.ts                    # Public exports
├── 📄 auth.module.ts              # Module configuration with DI
├── 📄 auth.service.ts             # Business logic
├── 📄 auth.controller.ts          # REST API endpoints
├── 📄 README.md                   # Module documentation
├── 📁 ports/                      # Abstract interfaces (DIP)
│   └── auth-repository.port.ts    # Repository contract
├── 📁 repositories/               # Concrete implementations
│   └── auth.repository.ts         # Prisma implementation
├── 📁 dto/                        # Data Transfer Objects
│   ├── auth.dto.ts                # Request DTOs
│   ├── login-response.dto.ts      # Response DTOs
│   └── tokens.dto.ts              # Token DTOs
├── 📁 errors/                     # Custom error classes
│   └── auth.errors.ts             # Error definitions
├── 📁 handlers/                   # Event handlers
│   └── auth-error.handler.ts      # Business logic error handler
├── 📁 filters/                    # Exception filters
│   └── auth-exception.filter.ts   # HTTP response handler
├── 📁 strategies/                 # Strategy Pattern
│   ├── jwt.strategy.ts            # Passport JWT strategy
│   └── auth-error.strategies.ts   # Error handling strategies
├── 📁 services/                   # Auxiliary services
│   └── email.service.ts           # Email service
├── 📁 utils/                      # Utilities
│   └── password-validation.util.ts # Password validation
├── 📁 guards/                     # Authorization guards
│   ├── jwt-auth.guard.ts          # JWT authentication guard
│   └── roles.guard.ts             # Role-based guard
├── 📁 decorators/                 # Custom decorators
│   └── roles.decorator.ts         # Role decorator
└── 📁 interfaces/                 # TypeScript interfaces
    └── tokens.interface.ts        # Token interfaces
```

## API Endpoints

### Authentication

#### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Member"
  }
}
```

#### User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Note:** All registered users are automatically assigned the "Member" role for security reasons. Admin roles cannot be created through the public API.

#### Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### User Logout
```http
POST /auth/logout
Authorization: Bearer <access-token>
```

### Password Reset

#### Request Password Reset
```http
POST /auth/reset-password/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword123!"
}
```

## Data Models

### User Model (Prisma Schema)
```prisma
model User {
  id                        Int       @id @default(autoincrement())
  email                     String    @unique
  password                  String
  firstName                 String
  lastName                  String
  role                      Role      @default(Member)
  refreshToken              String?   @map("refresh_token")
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")
  pendingEmail              String?   @map("pending_email")
  emailChangeToken          String?   @map("email_change_token")
  emailChangeTokenExpiresAt DateTime? @map("email_change_token_expires_at")
  instagram                 String?   @map("instagram")
  linkedIn                  String?   @map("linked_in")
  powensAuthToken           String?
  bankConnections           BankConnection[]

  @@map("users")
}

enum Role {
  Admin
  Member
}
```

### DTOs

#### LoginDto
```typescript
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

#### LoginResponseDto
```typescript
export class LoginUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'Member', enum: Role })
  role: Role;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;
}
```

**Registration Data Structure:**
```typescript
interface RegisterData {
  email: string;           // Required
  password: string;        // Required, min 6 chars with complexity
  firstName: string;       // Required
  lastName: string;        // Required
  // role is automatically set to 'Member' for security
}
```

## Error Types and Codes

### Authentication Errors
| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `USER_NOT_FOUND` | User not found | 404 |
| `INVALID_REFRESH_TOKEN` | Invalid or expired refresh token | 401 |
| `UNAUTHENTICATED` | User not authenticated | 401 |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | 403 |

### Password Errors
| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `

## Password Security

### Password Validation Rules

The system enforces strict password requirements for security:

#### Minimum Requirements
- **Length**: Minimum 6 characters
- **Uppercase**: At least one uppercase letter (A-Z)
- **Lowercase**: At least one lowercase letter (a-z)
- **Numbers**: At least one digit (0-9)
- **Special Characters**: At least one special character (!@#$%^&*(),.?":{}|<>)

#### Security Checks
- **Common Passwords**: Rejected if found in common weak passwords list
- **Pattern Detection**: Rejected obvious patterns (e.g., "123456", "qwerty")
- **Compromised Check**: Basic check against known compromised patterns

#### Password Strength Levels
- **Weak** (score 0-2): Fails validation
- **Medium** (score 3-4): Passes but could be stronger
- **Strong** (score 5): Excellent password

### Example Password Validation
```typescript
// ✅ Valid passwords
"SecurePass123!"    // Strong: uppercase, lowercase, numbers, special
"MyPassword@2024"   // Strong: meets all requirements

// ❌ Invalid passwords
"password"          // Weak: no uppercase, numbers, special chars
"123456"           // Weak: common password, no letters
"qwerty"           // Weak: common password, no complexity
"admin"            // Weak: common password, no complexity
```

## Security Features

### Role Security

#### Admin Role Protection
- **Public API**: Admin roles cannot be created through the public registration endpoint
- **Automatic Assignment**: All registered users are automatically assigned the "Member" role
- **Manual Promotion**: Admin roles can only be assigned through internal administrative processes
- **Security Logging**: All role changes are logged for audit purposes

#### Role-Based Access Control
- **JWT Tokens**: Include user role for authorization
- **Guards**: Automatic role checking on protected endpoints
- **Decorators**: Easy role-based endpoint protection

### JWT Token Configuration
