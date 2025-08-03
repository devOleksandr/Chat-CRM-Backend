# User Module

User management module for Chat CRM system with comprehensive user operations, password change functionality, and Clean Architecture implementation. Supports both admin users (with authentication) and participants (for mobile app usage).

## Features

- ✅ User profile management (CRUD operations)
- ✅ Secure password change with email confirmation
- ✅ Rate limiting for password change (3 attempts per day)
- ✅ Role-based access control (Admin only for management)
- ✅ Support for Admin and Participant roles
- ✅ Comprehensive error handling with Strategy Pattern
- ✅ Clean Architecture with dependency inversion
- ✅ JWT token-based authentication integration
- ✅ Email notifications for password changes
- ✅ Comprehensive logging and monitoring
- ✅ Cascade deletion for user removal
- ✅ Project management integration
- ✅ External participant ID support for mobile app

## User Roles

### Admin
- Full access to user management features
- Can perform CRUD operations on all users
- Requires JWT authentication for all operations
- Can manage projects and participants

### Participant
- Limited access for mobile app usage
- Uses external `participantId` for identification
- No password or email required
- Can participate in chats without authentication
- Managed through ProjectParticipantService

## Architecture Overview

The module follows **Clean Architecture** principles with **Dependency Inversion** and **Strategy Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  UserController (REST API Endpoints)                        │
│  ├── GET /users (admin only)                                │
│  ├── GET /users/:id (admin only)                            │
│  ├── PATCH /users/:id (admin only)                          │
│  ├── DELETE /users/:id (admin only)                         │
│  └── POST /users/confirm-password-change                    │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  UserService (Business Logic)                               │
│  ├── Admin user management                                  │
│  ├── Password change functionality                          │
│  └── Role-based operations                                  │
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

## API Endpoints

### Admin User Management (Requires JWT Authentication)

#### Get All Users (Paginated)
```bash
GET /api/users?limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Get User by ID
```bash
GET /api/users/{id}
Authorization: Bearer <jwt-token>
```

#### Update User by Admin
```bash
PATCH /api/users/{id}
Authorization: Bearer <jwt-token>
{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name",
  "email": "updated@example.com"
}
```

#### Delete User
```bash
DELETE /api/users/{id}
Authorization: Bearer <jwt-token>
```

### Password Change (Public Endpoint)

#### Confirm Password Change
```bash
POST /api/users/confirm-password-change
{
  "token": "password-change-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
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
                       │ UserException   │
                       │ Filter (HTTP)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   HTTP Client   │
                       └─────────────────┘
```

## Integration with Other Modules

### Chat Module
- Users can participate in chats based on their role
- Admin users can manage all chats and participants
- Participant users can only access their assigned chats

### Project Module
- Admin users can create and manage projects
- Participants are associated with specific projects
- Project-based access control for mobile app users

### Auth Module
- JWT authentication for admin operations
- Role-based authorization (Admin/Participant)
- Password management and reset functionality 