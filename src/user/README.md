# User Module

User management module for Chat CRM system with comprehensive user operations, password change functionality, and Clean Architecture implementation.

## Features

- ✅ User profile management (CRUD operations)
- ✅ Secure password change with email confirmation
- ✅ Rate limiting for password change (3 attempts per day)
- ✅ Role-based access control (Admin only)
- ✅ Comprehensive error handling with Strategy Pattern
- ✅ Clean Architecture with dependency inversion
- ✅ JWT token-based authentication integration
- ✅ Email notifications for password changes
- ✅ Comprehensive logging and monitoring
- ✅ Cascade deletion for user removal
- ✅ Project management integration

## Architecture Overview

The module follows **Clean Architecture** principles with **Dependency Inversion** and **Strategy Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  UserController (REST API Endpoints)                        │
│  ├── GET /users (admin)                                     │
│  ├── GET /users/:id (admin)                                 │
│  ├── PATCH /users/:id (admin)                               │
│  ├── DELETE /users/:id (admin)                              │
│  ├── GET /users/me                                          │
│  ├── PATCH /users/me                                        │
│  ├── POST /users/me/change-password                         │
│  └── POST /users/confirm-password-change                    │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  UserService (Business Logic)                               │
│  PasswordChangeEmailService (Email Notifications)           │
│  UserErrorHandler (Error Handling)                          │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Layer                     │
├─────────────────────────────────────────────────────────────┤
│  UserExceptionFilter (HTTP Responses)                       │
│  Error Strategies (Specific Handling)                       │
│  ├── DefaultUserErrorStrategy                               │
│  ├── UserNotFoundErrorStrategy                              │
│  ├── UserAlreadyExistsErrorStrategy                         │
│  ├── InvalidUserDataErrorStrategy                           │
│  └── UserOperationFailedErrorStrategy                       │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  UserRepositoryPort (Interface)                             │
│  UserRepository (Prisma ORM)                                │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (via Prisma)                           │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Architecture

The module implements a **hybrid approach** combining NestJS Exception Filters with Strategy Pattern:

### Exception Filters (HTTP Layer)
- **Automatic HTTP status mapping** based on error codes
- **Consistent error response format** across all endpoints
- **Built-in NestJS integration**

### Strategy Pattern (Business Logic)
- **Logging and monitoring** for each error type
- **Security event detection** for potential threats
- **Metrics collection** for operational insights
- **Extensible error handling** with specific strategies

### Error Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Service       │───▶│ ErrorHandler     │───▶│ Error Strategy  │
│   (throws)      │    │   (business      │    │   (specific     │
│                  │    │    logic)        │    │    handling)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Exception       │
                       │ Filter (HTTP)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   HTTP Client   │
                       └─────────────────┘
```

## API Documentation

### Get All Users (Admin Only)
```http
GET /users?page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@chat-crm.com",
    "role": "Admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get User by ID (Admin Only)
```http
GET /users/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": 1,
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@chat-crm.com",
  "role": "Admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update User by Admin
```http
PATCH /users/1
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "Smith",
  "email": "admin.smith@chat-crm.com",
  "role": "Admin"
}
```

### Delete User (Admin Only)
```http
DELETE /users/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Cascade Deletion:**
- All projects created by the user
- All user-related tokens and sessions
- User profile data and settings
- Any other related data in the database

### Get Own Profile
```http
GET /users/me
Authorization: Bearer <jwt-token>
```

### Update Own Profile
```http
PATCH /users/me
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User"
}
```

### Initiate Password Change
```http
POST /users/me/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password change initiated. Check your email for confirmation."
}
```

### Confirm Password Change
```http
POST /users/confirm-password-change
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Password changed successfully."
}
```

## Admin Fields

### Core Fields
- `id` - Unique identifier
- `firstName` - Admin's first name
- `lastName` - Admin's last name
- `email` - Email address (unique)
- `role` - Admin role (always "Admin")
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Special Fields
- `pendingEmail` - Email for change (pending confirmation)
- `refreshToken` - JWT refresh token
- `passwordChangeToken` - Password change confirmation token
- `emailChangeToken` - Email change confirmation token
- `emailChangeTokenExpiresAt` - Email change token expiration

## Password Change Process

### Step 1: Initiate Password Change
1. User provides current password and new password
2. System validates current password
3. System validates new password using auth module logic
4. Rate limiting check (3 attempts per day)
5. Generate JWT confirmation token (1 hour expiration)
6. Send confirmation email with token

### Step 2: Confirm Password Change
1. User clicks email link or provides token
2. System verifies token validity and expiration
3. Update password in database
4. Invalidate all refresh tokens
5. Send success confirmation email
6. Clear rate limiting for user

### Security Features
- **Rate limiting**: 3 password change attempts per day
- **Password validation**: Uses same logic as user registration
- **Token expiration**: 1 hour for confirmation tokens
- **Session invalidation**: All refresh tokens invalidated after password change
- **Email confirmation**: Required for password change completion

## Usage Examples

### Basic User Management
```typescript
// Get user by ID
const user = await userService.findUserById(1);

// Update user profile
const updatedUser = await userService.updateOwnProfile(userId, {
  firstName: 'Admin',
  lastName: 'User'
});

// Get all users with pagination
const users = await userService.getAllUsers({ page: 1, limit: 10 });

// Delete user with cascade deletion
await userService.deleteUser(userId);
```

### Password Change Flow
```typescript
// 1. Initiate password change
await userService.initiatePasswordChange(userId, {
  currentPassword: 'oldPassword123',
  newPassword: 'newSecurePassword123!'
});

// 2. User receives email with confirmation link
// 3. User clicks link or provides token
await userService.confirmPasswordChange({
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

### Admin Operations
```typescript
// Update user by admin
const updatedUser = await userService.updateUserByAdmin(userId, {
  firstName: 'Admin',
  lastName: 'Smith',
  email: 'admin.smith@chat-crm.com',
  role: 'Admin'
});

// Delete user by admin
await userService.deleteUser(userId);
```

## Error Types

### UserNotFoundError
- Thrown when user not found
- HTTP Status: `404 Not Found`

### UserAlreadyExistsError
- Thrown when user with email already exists
- HTTP Status: `409 Conflict`

### InvalidUserDataError
- Thrown when user data validation fails
- HTTP Status: `400 Bad Request`

### UserOperationFailedError
- Thrown when user operation fails
- HTTP Status: `500 Internal Server Error`

### InvalidCurrentPasswordError
- Thrown when current password is incorrect
- HTTP Status: `400 Bad Request`

### PasswordChangeTokenExpiredError
- Thrown when password change token has expired
- HTTP Status: `400 Bad Request`

### PasswordChangeTokenInvalidError
- Thrown when password change token is invalid
- HTTP Status: `400 Bad Request`

### PasswordChangeRateLimitExceededError
- Thrown when password change rate limit exceeded
- HTTP Status: `429 Too Many Requests`

## Validation

### Password Validation
- Uses same validation logic as auth module
- Minimum length, complexity requirements
- Compromised password detection

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Frontend URL for email links
FRONTEND_URL=https://your-frontend-domain.com
```

### Rate Limiting Settings
- **Password change attempts**: 3 per day
- **Token expiration**: 1 hour for password change tokens

## Testing

### Unit Tests
```typescript
describe('UserService', () => {
  it('should find user by ID successfully', async () => {
    // Test implementation
  });

  it('should validate password change rate limiting', () => {
    // Test implementation
  });

  it('should delete user with cascade deletion', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('UserController', () => {
  it('should return user profile', async () => {
    // Test implementation
  });

  it('should delete user successfully', async () => {
    // Test implementation
  });
});
```

## Security Features

- **Role-based access control** for admin operations
- **Password validation** using auth module logic
- **Rate limiting** for password change attempts
- **JWT token validation** for all operations
- **Email confirmation** for password changes
- **Session invalidation** after password change
- **Cascade deletion** for complete user removal
- **Audit logging** for user deletion operations

## Monitoring and Observability

- **Structured logging** with context information
- **Error metrics collection** for operational insights
- **Security event monitoring** for threat detection
- **Performance monitoring** for user operations
- **Rate limiting monitoring** for abuse prevention
- **Deletion audit trails** for compliance

## Dependencies

- **@nestjs/common**: NestJS core classes
- **@nestjs/swagger**: API documentation
- **@nestjs/jwt**: JWT token handling
- **@nestjs/config**: Configuration management
- **prisma**: ORM for database operations
- **bcrypt**: Password hashing
- **class-validator**: DTO validation 