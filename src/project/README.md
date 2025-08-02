# Project Module

Project management module for Chat CRM system with comprehensive project operations, unique ID validation, and Clean Architecture implementation.

## Features

- ✅ Project creation and management (CRUD operations)
- ✅ Unique project ID validation and availability checking
- ✅ Role-based access control (Admin only)
- ✅ Comprehensive error handling with Strategy Pattern
- ✅ Clean Architecture with dependency inversion
- ✅ JWT token-based authentication integration
- ✅ User ownership and access control
- ✅ Comprehensive logging and monitoring
- ✅ Cascade deletion for project removal

## Architecture Overview

The module follows **Clean Architecture** principles with **Dependency Inversion** and **Strategy Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ProjectController (REST API Endpoints)                     │
│  ├── POST /projects                                         │
│  ├── GET /projects                                          │
│  ├── GET /projects/:id                                      │
│  ├── GET /projects/unique/:uniqueId                         │
│  ├── PUT /projects/:id                                      │
│  ├── DELETE /projects/:id                                   │
│  └── GET /projects/check-availability/:uniqueId             │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ProjectService (Business Logic)                            │
│  ProjectErrorHandler (Error Handling)                       │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ProjectExceptionFilter (HTTP Responses)                    │
│  Error Strategies (Specific Handling)                       │
│  ├── ProjectNotFoundStrategy                               │
│  ├── ProjectAlreadyExistsStrategy                          │
│  ├── InsufficientPermissionsStrategy                       │
│  └── GeneralProjectErrorStrategy                           │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ProjectRepositoryPort (Interface)                          │
│  ProjectRepository (Prisma ORM)                             │
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

### Create Project (Admin Only)
```http
POST /projects
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "My New Project",
  "uniqueId": "PROJ-001"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "My New Project",
  "uniqueId": "PROJ-001",
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@chat-crm.com",
    "role": "Admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Projects (Admin Only)
```http
GET /projects?page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "My New Project",
      "uniqueId": "PROJ-001",
      "createdBy": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@chat-crm.com",
        "role": "Admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Project by ID (Admin Only)
```http
GET /projects/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": 1,
  "name": "My New Project",
  "uniqueId": "PROJ-001",
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@chat-crm.com",
    "role": "Admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Project by Unique ID (Admin Only)
```http
GET /projects/unique/PROJ-001
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": 1,
  "name": "My New Project",
  "uniqueId": "PROJ-001",
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@chat-crm.com",
    "role": "Admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Project (Admin Only)
```http
PUT /projects/1
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "uniqueId": "PROJ-002"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "uniqueId": "PROJ-002",
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@chat-crm.com",
    "role": "Admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete Project (Admin Only)
```http
DELETE /projects/1
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

### Check Unique ID Availability
```http
GET /projects/check-availability/PROJ-001
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "available": false,
  "uniqueId": "PROJ-001"
}
```

## Project Fields

### Core Fields
- `id` - Unique identifier
- `name` - Project name
- `uniqueId` - Unique project ID assigned by admin
- `createdBy` - User who created the project
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Special Fields
- `userId` - Foreign key to the user who created the project

## Usage Examples

### Basic Project Management
```typescript
// Create new project
const project = await projectService.createProject({
  name: 'My New Project',
  uniqueId: 'PROJ-001'
}, userId);

// Get project by ID
const project = await projectService.getProjectById(1, userId);

// Get project by unique ID
const project = await projectService.getProjectByUniqueId('PROJ-001', userId);

// Update project
const updatedProject = await projectService.updateProject(1, {
  name: 'Updated Project Name',
  uniqueId: 'PROJ-002'
}, userId);

// Get all projects with pagination
const projects = await projectService.getUserProjects({ page: 1, limit: 10 }, userId);

// Delete project
await projectService.deleteProject(1, userId);

// Check unique ID availability
const availability = await projectService.checkUniqueIdAvailability('PROJ-001');
```

### Project Creation Flow
```typescript
// 1. Check if unique ID is available
const availability = await projectService.checkUniqueIdAvailability('PROJ-001');

if (!availability.available) {
  throw new Error('Unique ID already exists');
}

// 2. Create project
const project = await projectService.createProject({
  name: 'My New Project',
  uniqueId: 'PROJ-001'
}, userId);
```

### Admin Operations
```typescript
// Get all projects (admin only)
const projects = await projectService.getUserProjects({ page: 1, limit: 10 }, adminId);

// Update any project (admin only)
const updatedProject = await projectService.updateProject(1, {
  name: 'Updated Project Name',
  uniqueId: 'PROJ-002'
}, adminId);

// Delete any project (admin only)
await projectService.deleteProject(1, adminId);
```

## Error Types

### ProjectNotFoundError
- Thrown when project not found
- HTTP Status: `404 Not Found`

### ProjectAlreadyExistsError
- Thrown when project with unique ID already exists
- HTTP Status: `409 Conflict`

### ProjectAccessDeniedError
- Thrown when user doesn't have permission to access project
- HTTP Status: `403 Forbidden`

### InvalidProjectDataError
- Thrown when project data validation fails
- HTTP Status: `400 Bad Request`

### ProjectOperationFailedError
- Thrown when project operation fails
- HTTP Status: `500 Internal Server Error`

## Validation

### Project Name Validation
- Field is required
- Must be a string
- Minimum length validation
- Maximum length validation

### Unique ID Validation
- Field is required
- Must be a string
- Must be unique across all projects
- Format validation (alphanumeric with hyphens allowed)
- Minimum and maximum length validation

### User Ownership Validation
- Only project creator can modify their projects
- Admins can access all projects
- Proper access control enforcement

## Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
```

### Pagination Settings
- **Default page size**: 10 projects per page
- **Maximum page size**: 100 projects per page
- **Default page**: 1

## Testing

### Unit Tests
```typescript
describe('ProjectService', () => {
  it('should create project successfully', async () => {
    // Test implementation
  });

  it('should validate unique ID availability', async () => {
    // Test implementation
  });

  it('should enforce user ownership', async () => {
    // Test implementation
  });

  it('should delete project with proper cleanup', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('ProjectController', () => {
  it('should create project via API', async () => {
    // Test implementation
  });

  it('should return project by ID', async () => {
    // Test implementation
  });

  it('should update project successfully', async () => {
    // Test implementation
  });

  it('should delete project successfully', async () => {
    // Test implementation
  });
});
```

## Security Features

- **Role-based access control** for admin operations
- **User ownership validation** for project modifications
- **JWT token validation** for all operations
- **Unique ID validation** to prevent conflicts
- **Input sanitization** and validation
- **Audit logging** for project operations

## Monitoring and Observability

- **Structured logging** with context information
- **Error metrics collection** for operational insights
- **Security event monitoring** for threat detection
- **Performance monitoring** for project operations
- **Access control monitoring** for compliance
- **Creation and modification audit trails**

## Dependencies

- **@nestjs/common**: NestJS core classes
- **@nestjs/swagger**: API documentation
- **@nestjs/jwt**: JWT token handling
- **@nestjs/config**: Configuration management
- **prisma**: ORM for database operations
- **class-validator**: DTO validation 